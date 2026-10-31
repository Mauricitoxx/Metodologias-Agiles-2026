// Inscripciones sin cuenta: el token que devuelve el backend es el único comprobante para cancelar.
// Se guarda en este navegador como { [idActividad]: { token, fecha_hora } }.
const STORAGE_KEY = 'frikioteca:inscripciones';

const browserStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null; // sin `window` (tests) o con el almacenamiento bloqueado
  }
};

function read(storage) {
  try {
    return JSON.parse(storage?.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function write(storage, signUps) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(signUps));
  } catch {
    // Sin almacenamiento el cliente todavía tiene el enlace de cancelación
  }
}

// `fecha_hora` identifica la fecha: cuando una recurrente pasa a la siguiente, la inscripción vieja ya no cuenta.
export function findSignUp(activity, storage = browserStorage()) {
  const saved = read(storage)[activity.id];
  return saved && saved.fecha_hora === activity.fecha_hora ? saved.token : null;
}

export function saveSignUp(activity, token, storage = browserStorage()) {
  write(storage, { ...read(storage), [activity.id]: { token, fecha_hora: activity.fecha_hora } });
}

export function forgetSignUp(activityId, storage = browserStorage()) {
  const { [activityId]: _removed, ...rest } = read(storage);
  write(storage, rest);
}

export const signUpPath = (token) => `/eventos/inscripcion/${encodeURIComponent(token)}`;
