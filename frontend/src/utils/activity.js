export const ACTIVITY_STATUSES = [
  { value: 'activa', label: 'Activa', plural: 'Activas' },
  { value: 'postergada', label: 'Postergada', plural: 'Postergadas' },
  { value: 'cancelada', label: 'Cancelada', plural: 'Canceladas' },
  { value: 'inactiva', label: 'Inactiva', plural: 'Inactivas' }
];

export const ACTIVITY_FREQUENCIES = [
  { value: 'unica', label: 'Única' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' }
];

const labelOf = (options, value) => options.find((option) => option.value === value)?.label || value;

export const frequencyLabel = (value) => labelOf(ACTIVITY_FREQUENCIES, value);

// The backend sends naive local datetimes ("2026-10-15T19:30:00"), which Date parses as local time
const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});
const timeFormatter = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export const formatDate = (value) => (value ? dateFormatter.format(new Date(value)) : '');
export const formatTime = (value) => (value ? `${timeFormatter.format(new Date(value))} hs` : '');

export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
};

// Date the activity actually takes place: the postponed one if it exists
export const effectiveDate = (activity) => activity.fecha_hora_postergada || activity.fecha_hora;
