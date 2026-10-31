import { effectiveDate, toInputValue } from './activity.js';

export const schedulePath = '/eventos';

const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('es').trim();

// El backend ya ordena por fecha efectiva y oculta inactivas y terminadas (RN-01).
export function filterSchedule(activities, { search = '', tipoId = '' } = {}) {
  return activities.filter((activity) => normalize(activity.nombre).includes(normalize(search))
    && (!tipoId || String(activity.tipo.id) === String(tipoId)));
}

export function scheduleTypes(activities) {
  return [...new Map(activities.map((activity) => [activity.tipo.id, activity.tipo])).values()]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

const dayFormatter = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

// Las fechas llegan como hora local sin zona ("2026-11-07T19:30:00"): el día son sus 10 primeros caracteres.
const dayKey = (value) => value.slice(0, 10);

export function dayLabel(key, now = new Date()) {
  const today = toInputValue(now).slice(0, 10);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (key === today) return 'Hoy';
  if (key === toInputValue(tomorrow).slice(0, 10)) return 'Mañana';
  const label = dayFormatter.format(new Date(`${key}T00:00:00`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Agrupa conservando el orden recibido. Una actividad en curso desde ayer queda en su día de inicio.
export function groupScheduleByDay(activities, now = new Date()) {
  const groups = new Map();
  for (const activity of activities) {
    const key = dayKey(effectiveDate(activity));
    if (!groups.has(key)) groups.set(key, { key, label: dayLabel(key, now), activities: [] });
    groups.get(key).activities.push(activity);
  }
  return [...groups.values()];
}

export function isInProgress(activity, now = new Date()) {
  if (activity.estado === 'cancelada') return false;
  const start = new Date(effectiveDate(activity));
  return start <= now && now < new Date(start.getTime() + activity.duracion * 60000);
}

// Las inscripciones cierran cuando el evento empieza; el backend aplica las mismas reglas.
export function signUpStatus(activity, now = new Date()) {
  if (activity.estado === 'cancelada') return { open: false, label: 'Cancelado' };
  if (new Date(effectiveDate(activity)) <= now) return { open: false, label: 'Ya comenzó' };
  if (activity.cupos_disponibles <= 0) return { open: false, label: 'Sin cupos' };
  return { open: true, label: 'Inscribirme' };
}

export function spotsLabel({ cupo, cupos_disponibles: left }) {
  if (left <= 0) return 'No quedan lugares';
  if (left === 1) return `¡Queda 1 lugar de ${cupo}!`;
  return `Quedan ${left} de ${cupo} lugares`;
}

// Pocos lugares: a partir de un 25 % restante (o 3 o menos) la barra pasa a modo alerta.
export function spotsLevel({ cupo, cupos_disponibles: left }) {
  if (left <= 0) return 'agotado';
  if (left <= 3 || left / cupo <= 0.25) return 'pocos';
  return 'libres';
}

export function getScheduleReturnTo(candidate) {
  if (typeof candidate !== 'string') return schedulePath;
  try {
    const url = new URL(candidate, 'https://schedule.local');
    return url.origin === 'https://schedule.local' && (url.pathname === schedulePath || url.pathname.startsWith(`${schedulePath}/`))
      ? `${url.pathname}${url.search}` : schedulePath;
  } catch {
    return schedulePath;
  }
}
