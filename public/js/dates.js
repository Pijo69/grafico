// Utilidades de fechas con claves 'YYYY-MM-DD' en hora local.

export const pad = (n) => String(n).padStart(2, '0');

export function toKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey() {
  return toKey(new Date());
}

export function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function diffDays(a, b) {
  // b - a en días
  return Math.round((fromKey(b) - fromKey(a)) / 86400000);
}

export function dow(key) {
  return fromKey(key).getDay(); // 0 domingo … 6 sábado
}

export function timeToMin(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minToTime(min) {
  const m = Math.max(0, Math.min(24 * 60, Math.round(min)));
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function fmtTime(t) {
  // '08:05' -> '8:05'
  if (!t) return '';
  const [h, m] = t.split(':');
  return `${Number(h)}:${m}`;
}

export function nowMin() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
