// Expansión de actividades (puntuales y repetidas) a ocurrencias de un día concreto.
import { addDays, diffDays, dow, timeToMin } from './dates.js';

export function lastDateOf(a) {
  if (!a.repeat || a.repeat === 'none') return a.endDate || a.startDate;
  return a.repeatUntil || '9999-12-31';
}

function isStartDay(a, day) {
  if (day < a.startDate) return false;
  if (a.exceptions && a.exceptions.includes(day)) return false;
  const rep = a.repeat || 'none';
  if (rep === 'none') return day === a.startDate;
  if (a.repeatUntil && day > a.repeatUntil) return false;
  const d = dow(day);
  if (rep === 'daily') return true;
  if (rep === 'weekdays') return d >= 1 && d <= 5;
  if (rep === 'weekly') return d === dow(a.startDate);
  return false;
}

/**
 * Devuelve la ocurrencia de la actividad visible en `day`, o null.
 * { a, occStart (fecha de inicio de esa ocurrencia), allDay, multiDay,
 *   startMin, endMin (minutos dentro de `day`), occEndDate }
 */
export function occurrenceOn(a, day) {
  const span = Math.max(0, diffDays(a.startDate, a.endDate || a.startDate));
  for (let k = 0; k <= span; k++) {
    const s = addDays(day, -k);
    if (!isStartDay(a, s)) continue;
    const occEndDate = addDays(s, span);
    const multiDay = span > 0;
    const allDay = !!a.allDay;
    let startMin = 0;
    let endMin = 24 * 60;
    if (!allDay) {
      if (k === 0) startMin = timeToMin(a.startTime);
      if (day === occEndDate) endMin = timeToMin(a.endTime);
      if (endMin <= startMin) endMin = Math.min(24 * 60, startMin + 15);
    }
    return { a, occStart: s, occEndDate, allDay, multiDay, startMin, endMin };
  }
  return null;
}

export function occurrencesOn(activities, day, personIds) {
  const set = personIds ? new Set(personIds) : null;
  const out = [];
  for (const a of activities) {
    if (set && !set.has(a.person)) continue;
    const o = occurrenceOn(a, day);
    if (o) out.push(o);
  }
  out.sort((x, y) => x.startMin - y.startMin || y.endMin - x.endMin);
  return out;
}

// Reparte ocurrencias solapadas en carriles (para dibujarlas una al lado de otra)
export function layoutLanes(occs) {
  const lanesEnd = [];
  let cluster = [];
  let clusterEnd = -1;
  const flush = () => {
    const n = Math.max(1, ...cluster.map((o) => o._lane + 1));
    cluster.forEach((o) => (o._lanes = n));
    cluster = [];
    lanesEnd.length = 0;
  };
  for (const o of occs) {
    if (o.startMin >= clusterEnd && cluster.length) flush();
    let lane = lanesEnd.findIndex((end) => end <= o.startMin);
    if (lane === -1) {
      lane = lanesEnd.length;
      lanesEnd.push(o.endMin);
    } else lanesEnd[lane] = o.endMin;
    o._lane = lane;
    cluster.push(o);
    clusterEnd = Math.max(clusterEnd, o.endMin);
  }
  if (cluster.length) flush();
  return occs;
}
