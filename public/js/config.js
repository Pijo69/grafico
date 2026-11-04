// Configuración general de la familia, etiquetas y prioridades.

export const PEOPLE = [
  { id: 'carles', name: 'Carles', role: 'papa', color: '#FF8A1F', emoji: '🧔' },
  { id: 'adriana', name: 'Adriana', role: 'mama', color: '#E6197E', emoji: '👩' },
  { id: 'gabri', name: 'Gabri', role: 'hijo', color: '#1FB35B', emoji: '👦' },
  { id: 'franci', name: 'Franci', role: 'hija', color: '#8B4DFF', emoji: '👧' },
];

export const PERSON = Object.fromEntries(PEOPLE.map((p) => [p.id, p]));

// Etiquetas de actividad en dos grupos y en este orden (el texto se traduce en i18n.js con la clave tag.<id>)
export const TAG_GROUPS = [
  { id: 'habitual', tags: ['trabajo', 'colegio', 'extraescolar', 'deberes', 'futbol', 'piano', 'solfeo', 'ingles', 'gimnasia'] },
  { id: 'extra', tags: ['examen', 'compras', 'tarea', 'medico', 'burocracia', 'taller_arte', 'viaje_trabajo'] },
  { id: 'cojonuda', tags: ['festivo', 'vacaciones'] },
];

// Festivo y Vacaciones anulan las etiquetas habituales de esa persona ese día
export const OVERRIDE_TAGS = ['festivo', 'vacaciones'];
export const HABITUAL_TAGS = TAG_GROUPS[0].tags;

// Etiquetas antiguas: ya no se ofrecen, pero se siguen mostrando si alguna actividad las tiene
const LEGACY_TAGS = ['evento', 'musica'];

export const TAGS = [...TAG_GROUPS.flatMap((g) => g.tags), ...LEGACY_TAGS].map((id) => ({ id }));
export const DEFAULT_TAG = 'trabajo';

export const TAG = Object.fromEntries(TAGS.map((t) => [t.id, t]));

// Prioridades: la intensidad define cuánto color de la persona se mezcla en la tarjeta.
export const PRIORITIES = [
  { id: 'super_importante', intensity: 100, rank: 4 },
  { id: 'muy_importante', intensity: 86, rank: 3 },
  { id: 'urgente', intensity: 70, rank: 2 },
  { id: 'normal', intensity: 42, rank: 1 },
  { id: 'relajado', intensity: 18, rank: 0 },
];

export const PRIORITY = Object.fromEntries(PRIORITIES.map((p) => [p.id, p]));

// Repetición: extra = puntual
export const REPEATS = ['none', 'daily', 'weekdays', 'weekly'];

export const ALERT_OPTIONS = [0, 5, 10, 15, 30, 60, 120, 1440, 2880, 4320, 7200];

// Ventana de datos: 2 meses antes y 2 después (se amplía si navegas más lejos)
export const WINDOW_DAYS = 62;

export const DEFAULT_START_HOUR = 8;
export const DEFAULT_END_HOUR = 21;
export const PX_PER_MIN = 1.1;
