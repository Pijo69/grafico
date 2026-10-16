// Groups raw pdf.js text items into reading-order lines and exposes a way to
// map a character range inside a line back to a pixel rectangle, so regex
// and diff matches on plain strings can be drawn on the rendered canvas.

export function buildTextModel(items) {
  const sorted = items
    .filter((it) => it.str.trim().length > 0)
    .slice()
    .sort((a, b) => (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2 || a.x0 - b.x0);

  const lines = [];
  for (const it of sorted) {
    const cy = (it.y0 + it.y1) / 2;
    const tol = Math.max(4, (it.y1 - it.y0) * 0.6);
    let line = lines.find((l) => Math.abs(l.cy - cy) < tol);
    if (!line) {
      line = { cy, items: [] };
      lines.push(line);
    }
    line.items.push(it);
  }

  for (const line of lines) {
    line.items.sort((a, b) => a.x0 - b.x0);
    let str = '';
    const ranges = [];
    let prevX1 = null;
    for (const it of line.items) {
      if (prevX1 !== null) {
        const gap = it.x0 - prevX1;
        const avgH = it.y1 - it.y0 || 8;
        if (gap > avgH * 0.3 && !/\s$/.test(str) && !/^\s/.test(it.str)) {
          str += ' ';
        }
      }
      const start = str.length;
      str += it.str;
      ranges.push({ item: it, start, end: str.length });
      prevX1 = it.x1;
    }
    line.str = str;
    line.ranges = ranges;
  }

  lines.sort((a, b) => a.cy - b.cy);
  return lines;
}

export function rectForRange(line, start, end) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of line.ranges) {
    const s = Math.max(start, r.start);
    const e = Math.min(end, r.end);
    if (s >= e) continue;
    const it = r.item;
    const total = r.end - r.start || 1;
    const fracStart = (s - r.start) / total;
    const fracEnd = (e - r.start) / total;
    const x0 = it.x0 + (it.x1 - it.x0) * fracStart;
    const x1 = it.x0 + (it.x1 - it.x0) * fracEnd;
    minX = Math.min(minX, x0);
    maxX = Math.max(maxX, x1);
    minY = Math.min(minY, it.y0);
    maxY = Math.max(maxY, it.y1);
  }
  if (minX === Infinity) return null;
  return { x0: minX, y0: minY, x1: maxX, y1: maxY };
}

export function unionRects(rects) {
  return rects.reduce(
    (acc, r) =>
      !acc
        ? { ...r }
        : {
            x0: Math.min(acc.x0, r.x0),
            y0: Math.min(acc.y0, r.y0),
            x1: Math.max(acc.x1, r.x1),
            y1: Math.max(acc.y1, r.y1),
          },
    null
  );
}

export function rectsOverlap(a, b) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}
