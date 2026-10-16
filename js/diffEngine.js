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
      tokens.push({
        word: m[0],
        rect: rectForRange(line, m.index, m.index + m[0].length),
        line,
        start: m.index,
        end: m.index + m[0].length,
      });
    }
  }
  return tokens;
}

// Longest-common-subsequence alignment between the two word sequences.
// Emits 'same' (with both indices, so adjacent matches can be checked for
// whitespace differences), 'changed' (a word in B with no counterpart in A
// at this point) and 'deleted' (a word in A that B drops entirely).
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
    if (a[i].word === b[j].word) { ops.push({ type: 'same', aIndex: i, bIndex: j }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ type: 'deleted', aIndex: i }); i++; }
    else { ops.push({ type: 'changed', bIndex: j }); j++; }
  }
  while (i < n) { ops.push({ type: 'deleted', aIndex: i }); i++; }
  while (j < m) { ops.push({ type: 'changed', bIndex: j }); j++; }
  return ops;
}

// Two edits separated by a single untouched word read as noise (an
// artifact of the alignment, not two separate findings) far more often
// than as two genuinely distinct changes, so fold that single word back
// into the surrounding run instead of reporting it on its own.
function mergeAdjacentRuns(ops) {
  // Bridge a lone 'same' sitting between two changed/deleted stretches, so
  // "producto" -> "en produkto" doesn't read as two separate findings with
  // an untouched "en" awkwardly wedged between them.
  const bridged = [];
  for (let k = 0; k < ops.length; k++) {
    const op = ops[k];
    if (
      op.type === 'same' &&
      k > 0 &&
      k < ops.length - 1 &&
      ops[k - 1].type !== 'same' &&
      ops[k + 1].type !== 'same'
    ) {
      continue;
    }
    bridged.push(op);
  }
  return bridged;
}

function toRectIssue(message, rect, canvasWidth, canvasHeight) {
  if (!rect) return { message };
  return {
    message,
    rectPx: rect,
    rectPct: {
      xPct: (rect.x0 / canvasWidth) * 100,
      yPct: (rect.y0 / canvasHeight) * 100,
      wPct: ((rect.x1 - rect.x0) / canvasWidth) * 100,
      hPct: ((rect.y1 - rect.y0) / canvasHeight) * 100,
    },
  };
}

export function diffTextTokens(itemsA, itemsB, canvasWidth, canvasHeight) {
  const linesA = buildTextModel(itemsA);
  const linesB = buildTextModel(itemsB);
  const tokensA = tokenize(linesA);
  const tokensB = tokenize(linesB);
  const ops = mergeAdjacentRuns(diffOps(tokensA, tokensB));

  // A plain substitution (word X in A replaced by word Y in B) shows up as
  // one 'deleted' op and one 'changed' op with no 'same' between them, so
  // a single contiguous span of non-same ops is one edit, whichever mix of
  // deletions and changes it contains, and gets exactly one message.
  const issues = [];
  let deletedRun = [];
  let changedRun = [];

  const flushSpan = () => {
    if (!deletedRun.length && !changedRun.length) return;
    const oldPhrase = deletedRun.map((ai) => tokensA[ai].word).join(' ');
    const newPhrase = changedRun.map((bi) => tokensB[bi].word).join(' ');
    const rects = changedRun.map((bi) => tokensB[bi].rect).filter(Boolean);
    const rect = rects.length ? unionRects(rects) : null;

    let message;
    if (deletedRun.length && changedRun.length) {
      message = `Texto distinto en el arte final 02: "${oldPhrase}" → "${newPhrase}".`;
    } else if (changedRun.length) {
      message = `Texto añadido en el arte final 02 (no está en el arte final 01): "${newPhrase}".`;
    } else {
      message = `Texto del arte final 01 que no aparece en el arte final 02: "${oldPhrase}".`;
    }
    issues.push(rect ? toRectIssue(message, rect, canvasWidth, canvasHeight) : { message });
    deletedRun = [];
    changedRun = [];
  };

  for (const op of ops) {
    if (op.type === 'changed') changedRun.push(op.bIndex);
    else if (op.type === 'deleted') deletedRun.push(op.aIndex);
    else flushSpan();
  }
  flushSpan();

  // Whitespace-only differences: two words that matched exactly, sitting
  // right next to each other in both documents with nothing changed
  // between them, but with a noticeably different pixel gap. Measured
  // geometrically (not from the reconstructed line string) because a
  // whitespace-only pdf.js text item is dropped when lines are built, so
  // the string itself can silently lose real spacing information.
  const sameOps = ops.filter((op) => op.type === 'same');
  for (let k = 0; k < sameOps.length - 1; k++) {
    const cur = sameOps[k];
    const next = sameOps[k + 1];
    if (next.aIndex !== cur.aIndex + 1 || next.bIndex !== cur.bIndex + 1) continue;
    const tA = tokensA[cur.aIndex];
    const tNextA = tokensA[next.aIndex];
    const tB = tokensB[cur.bIndex];
    const tNextB = tokensB[next.bIndex];
    if (tA.line !== tNextA.line || tB.line !== tNextB.line) continue;
    if (!tA.rect || !tNextA.rect || !tB.rect || !tNextB.rect) continue;

    const gapPxA = tNextA.rect.x0 - tA.rect.x1;
    const gapPxB = tNextB.rect.x0 - tB.rect.x1;
    const fontHeight = Math.max(1, tB.rect.y1 - tB.rect.y0);
    const diff = gapPxB - gapPxA;
    if (Math.abs(diff) < fontHeight * 0.25) continue; // sub-pixel kerning noise

    const rect = unionRects([tB.rect, tNextB.rect].filter(Boolean));
    const verdict = diff > 0 ? 'de más' : 'de menos';
    issues.push(
      toRectIssue(
        `Espaciado distinto entre "${tB.word}" y "${tNextB.word}" (el arte final 02 tiene espacio ${verdict}).`,
        rect,
        canvasWidth,
        canvasHeight
      )
    );
  }

  return issues;
}

export function visualDiffBoxes(canvasA, canvasB, excludeRectsPx, canvasWidth, canvasHeight) {
  const cols = 64;
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
    if (delta > 60) flagged[idx] = true;
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
      boxes.push(toRectIssue('Diferencia visual detectada (diseño, color o elemento gráfico).', rect, canvasWidth, canvasHeight));
    }
  }
  return boxes;
}
