// "Comparativa archivos": word-level text diff between the two PDFs plus a
// coarse pixel-grid visual diff, both mapped onto ARTE FINAL 02's canvas
// (the result is always shown over the second file, per spec).

import { buildTextModel, rectForRange, unionRects, rectsOverlap } from './textModel.js';

function tokenize(lines) {
  const tokens = [];
  for (const line of lines) {
    const re = /\S+/g;
    let m;
    while ((m = re.exec(line.str))) {
      tokens.push({ word: m[0], rect: rectForRange(line, m.index, m.index + m[0].length) });
    }
  }
  return tokens;
}

function diffOps(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i].word === b[j].word ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i].word === b[j].word) { ops.push({ type: 'same' }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { i++; }
    else { ops.push({ type: 'changed', bIndex: j }); j++; }
  }
  while (j < m) { ops.push({ type: 'changed', bIndex: j }); j++; }
  return ops;
}

export function diffTextTokens(itemsA, itemsB, canvasWidth, canvasHeight) {
  const linesA = buildTextModel(itemsA);
  const linesB = buildTextModel(itemsB);
  const tokensA = tokenize(linesA);
  const tokensB = tokenize(linesB);
  const ops = diffOps(tokensA, tokensB);

  const issues = [];
  let run = [];
  const flush = () => {
    if (!run.length) return;
    const rects = run.map((bi) => tokensB[bi].rect).filter(Boolean);
    if (rects.length) {
      const rect = unionRects(rects);
      const phrase = run.map((bi) => tokensB[bi].word).join(' ');
      issues.push({
        message: `Texto distinto en el arte final 02: "${phrase}".`,
        rectPx: rect,
        rectPct: {
          xPct: (rect.x0 / canvasWidth) * 100,
          yPct: (rect.y0 / canvasHeight) * 100,
          wPct: ((rect.x1 - rect.x0) / canvasWidth) * 100,
          hPct: ((rect.y1 - rect.y0) / canvasHeight) * 100,
        },
      });
    }
    run = [];
  };

  for (const op of ops) {
    if (op.type === 'changed') run.push(op.bIndex);
    else flush();
  }
  flush();
  return issues;
}

export function visualDiffBoxes(canvasA, canvasB, excludeRectsPx, canvasWidth, canvasHeight) {
  const cols = 36;
  const rows = Math.max(1, Math.round((cols * canvasHeight) / canvasWidth));

  const sample = (canvas) => {
    const c = document.createElement('canvas');
    c.width = cols;
    c.height = rows;
    const ctx = c.getContext('2d');
    ctx.drawImage(canvas, 0, 0, cols, rows);
    return ctx.getImageData(0, 0, cols, rows).data;
  };

  const dataA = sample(canvasA);
  const dataB = sample(canvasB);
  const flagged = new Array(cols * rows).fill(false);
  for (let idx = 0; idx < cols * rows; idx++) {
    const o = idx * 4;
    const delta = Math.abs(dataA[o] - dataB[o]) + Math.abs(dataA[o + 1] - dataB[o + 1]) + Math.abs(dataA[o + 2] - dataB[o + 2]);
    if (delta > 90) flagged[idx] = true;
  }

  const cellW = canvasWidth / cols;
  const cellH = canvasHeight / rows;
  const visited = new Array(cols * rows).fill(false);
  const boxes = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (!flagged[idx] || visited[idx]) continue;
      const stack = [idx];
      visited[idx] = true;
      let minC = c, maxC = c, minR = r, maxR = r;
      while (stack.length) {
        const cur = stack.pop();
        const cr = Math.floor(cur / cols);
        const cc = cur % cols;
        minC = Math.min(minC, cc); maxC = Math.max(maxC, cc);
        minR = Math.min(minR, cr); maxR = Math.max(maxR, cr);
        const neighbours = [cur - 1, cur + 1, cur - cols, cur + cols];
        for (const n of neighbours) {
          if (n < 0 || n >= cols * rows || visited[n] || !flagged[n]) continue;
          if (Math.abs((n % cols) - cc) > 1) continue;
          visited[n] = true;
          stack.push(n);
        }
      }
      if ((maxC - minC + 1) * (maxR - minR + 1) < 2) continue;
      const rect = { x0: minC * cellW, y0: minR * cellH, x1: (maxC + 1) * cellW, y1: (maxR + 1) * cellH };
      if (excludeRectsPx.some((er) => rectsOverlap(rect, er))) continue;
      boxes.push({
        message: 'Diferencia visual detectada (diseño, color o elemento gráfico).',
        rectPx: rect,
        rectPct: {
          xPct: (rect.x0 / canvasWidth) * 100,
          yPct: (rect.y0 / canvasHeight) * 100,
          wPct: ((rect.x1 - rect.x0) / canvasWidth) * 100,
          hPct: ((rect.y1 - rect.y0) / canvasHeight) * 100,
        },
      });
    }
  }
  return boxes;
}
