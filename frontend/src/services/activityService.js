import { api } from './api';

export const activityService = {
  list: ({ search, tipo_id, estado, order } = {}) =>
    api.get('/activities', { search, tipo_id, estado, order }),
  get: (id) => api.get(`/activities/${id}`),
  create: (data) => api.post('/activities', data),
  update: (id, data) => api.put(`/activities/${id}`, data),
  // `alcance` ('fecha' | 'serie') only matters for recurring activities
  cancel: (id, { motivo, alcance } = {}) => api.patch(`/activities/${id}/cancel`, { motivo, alcance }),
  postpone: (id, { fechaHoraPostergada, motivo, alcance }) =>
    api.patch(`/activities/${id}/postpone`, { fecha_hora_postergada: fechaHoraPostergada, motivo, alcance }),
  undoPostpone: (id) => api.patch(`/activities/${id}/undo-postpone`),
  deactivate: (id) => api.patch(`/activities/${id}/deactivate`),
  activate: (id) => api.patch(`/activities/${id}/activate`),
  remove: (id) => api.delete(`/activities/${id}`),

  listSchedule: ({ search, tipo_id } = {}) => api.get('/activities/schedule', { search, tipo_id }),
  getPublic: (id) => api.get(`/activities/schedule/${id}`)
};

export const activityTypeService = {
  list: () => api.get('/activity-types'),
  create: (nombre) => api.post('/activity-types', { nombre }),
  update: (id, nombre) => api.put(`/activity-types/${id}`, { nombre }),
  remove: (id) => api.delete(`/activity-types/${id}`)
};
