/**
 * Cloud Function: envía los avisos push de las actividades marcadas con "Aviso en el móvil".
 * Se ejecuta cada 5 minutos y manda la notificación a los dispositivos que siguen a esa persona,
 * aunque la app esté cerrada. (Requiere el plan Blaze de Firebase para funciones programadas.)
 */
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const TZ = 'Europe/Madrid';
const EVERY_MIN = 5;

const NAMES = { carles: 'Carles', adriana: 'Adriana', gabri: 'Gabri', franci: 'Franci' };
const ICONS = {
  evento: '🎉', tarea: '✅', trabajo: '💼', colegio: '🏫', extraescolar: '🧩', medico: '🩺', burocracia: '📄',
  futbol: '⚽', musica: '🎵', ingles: '🔤', gimnasia: '🤸', taller_arte: '🎨', viaje_trabajo: '✈️',
};
const TITLE = { es: 'Aviso · {name}', it: 'Avviso · {name}', va: 'Avís · {name}' };
const IN_MIN = { es: 'en {n} min', it: 'tra {n} min', va: 'en {n} min' };
const NOW = { es: 'ahora', it: 'adesso', va: 'ara' };

/* ── fechas en la zona horaria de la familia ── */
function localParts(ms) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { key: `${p.year}-${p.month}-${p.day}`, y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute };
}
function tzOffset(ms) {
  const p = localParts(ms);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi) - Math.floor(ms / 60000) * 60000;
}
function zonedToUtc(key, time) {
  const [y, m, d] = key.split('-').map(Number);
  const [h, mi] = (time || '08:00').split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  let utc = guess - tzOffset(guess);
  utc = guess - tzOffset(utc); // corrige el cambio de hora
  return utc;
}
function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}
function dow(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/* ── repetición (misma lógica que la app) ── */
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

exports.sendActivityAlerts = onSchedule(
  { schedule: `every ${EVERY_MIN} minutes`, timeZone: TZ, region: 'europe-west1' },
  async () => {
    const now = Date.now();
    const windowStart = now - (EVERY_MIN + 1) * 60000;
    const today = localParts(now).key;

    const snap = await db.collection('activities').where('alert.enabled', '==', true).get();
    const due = [];
    for (const doc of snap.docs) {
      const a = doc.data();
      if ((a.lastDate || '9999') < addDays(today, -1)) continue;
      // Un aviso puede ser hasta 1 día antes, así que se miran hoy, mañana y pasado
      for (const day of [addDays(today, -1), today, addDays(today, 1), addDays(today, 2)]) {
        if (!isStartDay(a, day)) continue;
        const start = zonedToUtc(day, a.allDay ? '08:00' : a.startTime);
        const fire = start - (a.alert.minutesBefore || 0) * 60000;
        if (fire > windowStart && fire <= now) due.push({ id: doc.id, a, day, start });
      }
    }
    if (!due.length) return;

    for (const { id, a, day, start } of due) {
      const sentRef = db.collection('sentAlerts').doc(`${id}_${day}`);
      try {
        await sentRef.create({ at: admin.firestore.FieldValue.serverTimestamp(), person: a.person });
      } catch {
        continue; // ya enviado
      }
      const devices = await db.collection('devices').where('persons', 'array-contains', a.person).get();
      if (devices.empty) continue;

      const byLang = {};
      devices.docs.forEach((d) => (byLang[d.data().lang || 'es'] ||= []).push(d.id));
      const mins = Math.max(0, Math.round((start - now) / 60000));
      const what = a.title || a.tag;
      const time = a.allDay ? '' : ` · ${a.startTime}`;

      for (const [lang, tokens] of Object.entries(byLang)) {
        const when = mins <= 1 ? NOW[lang] || NOW.es : (IN_MIN[lang] || IN_MIN.es).replace('{n}', mins);
        const res = await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title: (TITLE[lang] || TITLE.es).replace('{name}', NAMES[a.person] || a.person),
            body: `${ICONS[a.tag] || '🔔'} ${what}${time} (${when})`,
          },
          webpush: {
            notification: { icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: `${id}_${day}`, requireInteraction: a.priority === 'muy_importante' },
            fcmOptions: { link: '/' },
          },
          data: { activityId: id, day },
        });
        // Limpia tokens caducados
        res.responses.forEach((r, i) => {
          const code = r.error && r.error.code;
          if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
            db.collection('devices').doc(tokens[i]).delete().catch(() => {});
          }
        });
        logger.info(`Aviso ${id} ${day} → ${res.successCount}/${tokens.length} (${lang})`);
      }
    }
  }
);
