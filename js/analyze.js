// "Detectar fallos": regex-based proofing checks (spacing, punctuation,
// repeated words) plus a best-effort spelling pass against the vendored
// Spanish dictionary. Returns issues with both pixel and percentage boxes.

import { buildTextModel, rectForRange } from './textModel.js';
import { getSpanishTypo } from './dictionary.js';

const MAX_SPELLING_FLAGS = 8;

function toIssue(message, rect, canvasWidth, canvasHeight) {
  if (!rect) return null;
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

export async function analyzeDocument(items, canvasWidth, canvasHeight) {
  const lines = buildTextModel(items);
  const issues = [];
  const push = (message, rect) => {
    const issue = toIssue(message, rect, canvasWidth, canvasHeight);
    if (issue) issues.push(issue);
  };

  for (const line of lines) {
    const str = line.str;

    for (const m of str.matchAll(/ {2,}/g)) {
      push('Espacio excesivo entre palabras.', rectForRange(line, m.index, m.index + m[0].length));
    }
    for (const m of str.matchAll(/([.,;:!?¡¿])\1+/g)) {
      push(`Puntuación repetida ("${m[0]}").`, rectForRange(line, m.index, m.index + m[0].length));
    }
    for (const m of str.matchAll(/\s+([,.;:!?])/g)) {
      push('Espacio antes de un signo de puntuación.', rectForRange(line, m.index, m.index + m[0].length));
    }
    for (const m of str.matchAll(/\b(\p{L}{2,})\s+\1\b/giu)) {
      push(`Palabra repetida: "${m[1]}".`, rectForRange(line, m.index, m.index + m[0].length));
    }
    const opens = (str.match(/\(/g) || []).length;
    const closes = (str.match(/\)/g) || []).length;
    if (opens !== closes) {
      push('Paréntesis sin cerrar o sobrante en la línea.', rectForRange(line, 0, str.length));
    }
  }

  const typo = await getSpanishTypo();
  if (typo) {
    let flagged = 0;
    for (const line of lines) {
      if (flagged >= MAX_SPELLING_FLAGS) break;
      const re = /\p{L}+/gu;
      let m;
      while ((m = re.exec(line.str))) {
        if (flagged >= MAX_SPELLING_FLAGS) break;
        const word = m[0];
        if (word.length < 4 || word === word.toUpperCase()) continue;
        if (!typo.check(word) && !typo.check(word.toLowerCase())) {
          push(`Posible error ortográfico: "${word}".`, rectForRange(line, m.index, m.index + word.length));
          flagged++;
        }
      }
    }
  }

  issues.sort((a, b) => a.rectPx.y0 - b.rectPx.y0 || a.rectPx.x0 - b.rectPx.x0);
  return issues;
}
