// Configuración general de la familia, etiquetas y prioridades.

export const PEOPLE = [
  { id: 'carles', name: 'Carles', role: 'papa', color: '#FF8A1F', emoji: '🧔' },
  { id: 'adriana', name: 'Adriana', role: 'mama', color: '#E6197E', emoji: '👩' },
  { id: 'gabri', name: 'Gabri', role: 'hijo', color: '#1FB35B', emoji: '👦' },
  { id: 'franci', name: 'Franci', role: 'hija', color: '#8B4DFF', emoji: '👧' },
];

export const PERSON = Object.fromEntries(PEOPLE.map((p) => [p.id, p]));

// Etiquetas de actividad (el texto se traduce en i18n.js con la clave tag.<id>)
export const TAGS = [
  { id: 'evento', icon: '🎉' },
  { id: 'examen', icon: '📝' },
  { id: 'deberes', icon: '📚' },
  { id: 'compras', icon: '🛒' },
  { id: 'tarea', icon: '✅' },
  { id: 'trabajo', icon: '💼' },
  { id: 'colegio', icon: '🏫' },
  { id: 'extraescolar', icon: '🧩' },
  { id: 'medico', icon: '🩺' },
  { id: 'burocracia', icon: '📄' },
  { id: 'futbol', icon: '⚽' },
  { id: 'musica', icon: '🎵' },
  { id: 'ingles', icon: '🔤' },
  { id: 'gimnasia', icon: '🤸' },
  { id: 'taller_arte', icon: '🎨' },
  { id: 'viaje_trabajo', icon: '✈️' },
];

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

export const ALERT_OPTIONS = [0, 5, 10, 15, 30, 60, 120, 1440];

// Ventana de datos: 2 meses antes y 2 después (se amplía si navegas más lejos)
export const WINDOW_DAYS = 62;

export const DEFAULT_START_HOUR = 8;
export const DEFAULT_END_HOUR = 21;
export const PX_PER_MIN = 1.1;
