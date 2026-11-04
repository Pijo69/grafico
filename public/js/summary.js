// Resumen en texto (y voz) de un día para una o varias personas.
import { PERSON } from './config.js';
import { fmtTime, minToTime } from './dates.js';
import { t, listJoin, getLang } from './i18n.js';
import { occurrencesOn } from './recurrence.js';

const nameOf = (o) => o.a.title || t(`tag.${o.a.tag}`);

/** Agrupa las clases consecutivas del colegio en un único bloque. */
function compact(occs) {
  const out = [];
  for (const o of occs) {
    const prev = out[out.length - 1];
    if (o.a.tag === 'colegio' && !o.allDay && !o.multiDay && prev && prev.school && o.startMin - prev.endMin <= 20) {
      prev.endMin = Math.max(prev.endMin, o.endMin);
      continue;
    }
    out.push({ ...o, school: o.a.tag === 'colegio' && !o.allDay && !o.multiDay });
  }
  return out;
}

export function personSummary(activities, day, personId) {
  const name = PERSON[personId].name;
  const occs = occurrencesOn(activities, day, [personId]);
  if (!occs.length) return t('sum.none', { name });
  const parts = [occs.length === 1 ? t('sum.count1', { name }) : t('sum.count', { name, n: occs.length })];
  const items = compact(occs).map((o) => {
    const from = fmtTime(minToTime(o.startMin));
    const to = fmtTime(minToTime(o.endMin));
    if (o.allDay || o.multiDay) return t('sum.itemAllDay', { title: nameOf(o) });
    if (o.school) return t('sum.school', { from, to });
    return t('sum.item', { title: nameOf(o), from, to });
  });
  const list = listJoin(items);
  parts.push(list.charAt(0).toUpperCase() + list.slice(1) + '.');
  const supers = occs.filter((o) => o.a.priority === 'super_importante').map(nameOf);
  const stars = occs.filter((o) => o.a.priority === 'muy_importante').map(nameOf);
  const hammers = occs.filter((o) => o.a.priority === 'urgente').map(nameOf);
  if (supers.length) parts.push(t('sum.super', { list: listJoin([...new Set(supers)]) }));
  if (stars.length) parts.push(t('sum.star', { list: listJoin([...new Set(stars)]) }));
  if (hammers.length) parts.push(t('sum.hammer', { list: listJoin([...new Set(hammers)]) }));
  if (!supers.length && !stars.length && !hammers.length) parts.push(t('sum.calm'));
  return parts.join(' ');
}

let speaking = null;

export function speak(text, onEnd) {
  stopSpeaking();
  if (!('speechSynthesis' in window)) return false;
  const u = new SpeechSynthesisUtterance(text);
  const prefs = getLang().voice;
  const voices = speechSynthesis.getVoices();
  for (const p of prefs) {
    const v = voices.find((x) => x.lang && x.lang.toLowerCase().startsWith(p.toLowerCase()));
    if (v) {
      u.voice = v;
      u.lang = v.lang;
      break;
    }
  }
  if (!u.lang) u.lang = prefs[0];
  u.rate = 1;
  u.onend = u.onerror = () => {
    speaking = null;
    onEnd && onEnd();
  };
  speaking = u;
  speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  speaking = null;
}
