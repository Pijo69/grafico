// Horario de Gabri (1.º ESO B, curso 2026–2027) a partir del Excel adjunto.
// Cada clase se crea como actividad semanal desde el inicio de curso hasta el final.
import { addDays, dow } from './dates.js';

export const COURSE_START = '2026-09-07';
export const COURSE_END = '2027-06-18';

// [hora inicio, hora fin, Lunes, Martes, Miércoles, Jueves, Viernes]
const SCHOOL = [
  ['08:00', '08:55', 'Inglés\nNatalia', 'Valenciano\nM.ª Josep', 'Geografía e Historia\nSara', 'Matemáticas\nBea', 'Biología\nM.ª Jover'],
  ['08:55', '09:50', 'Tecnología y Digitalización', 'Optativa', 'Valenciano\nM.ª Josep', 'Educación Física', 'Geografía e Historia\nSara'],
  ['09:50', '10:45', 'Música\nIsabel · Aula de Música', 'Geografía e Historia\nSara', 'Castellano\nRosario', 'Optativa', 'Inglés\nNatalia'],
  ['10:45', '11:15', 'RECREO', 'RECREO', 'RECREO', 'RECREO', 'RECREO'],
  ['11:15', '12:10', 'Educación Física', 'Inglés', 'Música', 'Biología', 'Matemáticas'],
  ['12:10', '13:05', 'Castellano', 'Biología', 'Matemáticas', 'Atención Educativa\nRosario', 'Valenciano'],
  ['13:05', '14:00', 'Matemáticas', 'Tutoría', 'Tecnología', 'Inglés', 'Castellano'],
  ['14:00', '14:15', 'DESCANSO', 'DESCANSO', 'DESCANSO', 'DESCANSO', 'DESCANSO'],
];

// [día (1=lunes), actividad, etiqueta, inicio, fin, notas]
const EXTRA = [
  [1, 'Fútbol', 'futbol', '17:30', '19:00', ''],
  [2, 'Estudiar', 'deberes', '17:00', '18:30', 'Sin horario especificado'],
  [3, 'Piano', 'piano', '16:00', '18:00', 'A veces termina a las 18:30'],
  [4, 'Inglés', 'ingles', '15:30', '17:00', ''],
  [4, 'Saxo', 'extraescolar', '17:30', '18:15', ''],
  [4, 'Fútbol', 'futbol', '18:30', '20:00', ''],
  [5, 'Banda de música', 'extraescolar', '18:15', '19:15', ''],
];

const DAY_IDS = ['', 'lun', 'mar', 'mie', 'jue', 'vie'];

function firstWeekday(fromKey, weekday) {
  let k = fromKey;
  while (dow(k) !== weekday) k = addDays(k, 1);
  return k;
}

function slug(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function base(weekday, startTime, endTime) {
  const d = firstWeekday(COURSE_START, weekday);
  return {
    person: 'gabri',
    startDate: d,
    endDate: d,
    startTime,
    endTime,
    allDay: false,
    repeat: 'weekly',
    repeatUntil: COURSE_END,
    exceptions: [],
    alert: { enabled: false, minutesBefore: 15 },
    source: 'excel-1eso-b',
  };
}

// Jornada laboral de Carles y Adriana: entre semana de 9:00 a 18:00, IMPORTANTE
export function workSeed() {
  return ['carles', 'adriana'].map((person) => ({
    id: `seed-work-${person}`,
    person,
    title: 'Trabajo',
    tag: 'trabajo',
    priority: 'muy_importante',
    startDate: '2026-09-01',
    endDate: '2026-09-01',
    startTime: '09:00',
    endTime: '18:00',
    allDay: false,
    repeat: 'weekdays',
    repeatUntil: null,
    exceptions: [],
    alert: { enabled: false, minutesBefore: 15 },
    notes: '',
    source: 'seed-work',
  }));
}

export function gabriSeed() {
  const out = [];
  for (const [start, end, ...days] of SCHOOL) {
    days.forEach((cell, i) => {
      const weekday = i + 1;
      const [subject, ...rest] = cell.split('\n');
      const isBreak = subject === 'RECREO' || subject === 'DESCANSO';
      const title = isBreak ? subject.charAt(0) + subject.slice(1).toLowerCase() : subject;
      out.push({
        id: `seed-gabri-${DAY_IDS[weekday]}-${start.replace(':', '')}`,
        ...base(weekday, start, end),
        title,
        tag: 'colegio',
        priority: 'muy_importante', // toda la jornada escolar (8:00–15:00) es IMPORTANTE
        notes: rest.join(' · '),
      });
    });
  }
  for (const [weekday, title, tag, start, end, notes] of EXTRA) {
    out.push({
      id: `seed-gabri-${DAY_IDS[weekday]}-${slug(title)}-${start.replace(':', '')}`,
      ...base(weekday, start, end),
      title,
      tag,
      priority: 'normal',
      notes,
    });
  }
  return out;
}

/* ───────── Franci · 3.º de Primaria (curso 2026–2027, horario de octubre a mayo) ───────── */

export const FRANCI_START = '2026-10-01';
export const FRANCI_END = '2027-05-31';

// [hora inicio, hora fin, Lunes, Martes, Miércoles, Jueves, Viernes]
const FRANCI_SCHOOL = [
  ['09:00', '09:45', 'Tutoría', 'Lectura\n(Apoyo Joan)', 'Matemáticas\n(Apoyo Pilar)', 'Castellano\n(1.º: JM · 2.º y 3.º: Pilar)', 'Conocimiento del Medio\n(Apoyo Marta)'],
  ['09:45', '10:30', 'Matemáticas\n(Apoyo Bea PT)', 'Educación Física', 'Inglés', 'Castellano\n(1.º: JM · 2.º y 3.º: Pilar)', 'Matemáticas\n(Apoyo Pilar)'],
  ['10:30', '11:15', 'Matemáticas\n(Apoyo Bea PT)', 'Educación Física', 'Inglés', 'Música', 'Arte en el patio / Matemáticas\n(Apoyo Pilar)'],
  ['11:15', '11:45', 'RECREO', 'RECREO', 'RECREO', 'RECREO', 'RECREO'],
  ['11:45', '12:30', 'Castellano\n(Apoyo Elena AL)', 'Valenciano\n(1.º y 2.º: Inma · 3.º y 4.º: Joan)', 'Música', 'Educación Física', 'Arte\n(Apoyo Inma)'],
  ['12:30', '13:15', 'Castellano\n(Apoyo Elena AL)', 'Valenciano\n(1.º y 2.º: Inma · 3.º y 4.º: Joan)', 'Huerto / Conocimiento del Medio\n(Apoyo Bea)', 'Valenciano\n(1.º y 2.º: Inma · 3.º y 4.º: Joan)', 'Inglés'],
  ['13:15', '14:00', 'Lectura\n(Apoyos de Pilar y Elena)', 'Religión / Alternativa\n(Primaria)', 'Conocimiento del Medio', 'Valenciano\n(1.º y 2.º: Inma · 3.º y 4.º: Joan)', 'Biblioteca / Valenciano'],
];

// Extraescolares con etiqueta habitual. El Excel solo da la hora de inicio de algunas: se pone 1 h.
// [día (1=lunes), actividad, etiqueta, inicio, fin, notas]
const FRANCI_EXTRA = [
  [1, 'Gimnasia', 'gimnasia', '16:30', '17:30', ''],
  [2, 'Inglés', 'ingles', '16:00', '17:00', 'Hora de fin no indicada (1 h)'],
  [2, 'Solfeo', 'solfeo', '17:15', '18:15', 'Hora de fin no indicada (1 h)'],
  [3, 'Piano', 'piano', '15:30', '16:30', 'Hora de fin no indicada (1 h)'],
  [5, 'Bicicleta', 'extraescolar', '15:30', '16:30', 'Hora de fin no indicada (1 h)'],
];

function franciBase(weekday, startTime, endTime) {
  const d = firstWeekday(FRANCI_START, weekday);
  return {
    person: 'franci',
    startDate: d,
    endDate: d,
    startTime,
    endTime,
    allDay: false,
    repeat: 'weekly',
    repeatUntil: FRANCI_END,
    exceptions: [],
    alert: { enabled: false, minutesBefore: 15 },
    source: 'excel-3prim',
  };
}

export function franciSeed() {
  const out = [];
  for (const [start, end, ...days] of FRANCI_SCHOOL) {
    days.forEach((cell, i) => {
      const weekday = i + 1;
      const [subject, ...rest] = cell.split('\n');
      const title = subject === 'RECREO' ? 'Recreo' : subject;
      out.push({
        id: `seed-franci-${DAY_IDS[weekday]}-${start.replace(':', '')}`,
        ...franciBase(weekday, start, end),
        title,
        tag: 'colegio',
        priority: 'muy_importante', // toda la jornada escolar (9:00–14:00) es IMPORTANTE
        notes: rest.join(' ').replace(/[()]/g, ''),
      });
    });
  }
  for (const [weekday, title, tag, start, end, notes] of FRANCI_EXTRA) {
    out.push({
      id: `seed-franci-${DAY_IDS[weekday]}-${slug(title)}-${start.replace(':', '')}`,
      ...franciBase(weekday, start, end),
      title,
      tag,
      priority: 'normal',
      notes,
    });
  }
  return out;
}
