import { api } from './api';

export const activityService = {
  list: ({ search, tipo_id, estado, order } = {}) =>
    api.get('/activities', { search, tipo_id, estado, order }),
  get: (id) => api.get(`/activities/${id}`),
  create: (data) => api.post('/activities', data),
  update: (id, data) => api.put(`/activities/${id}`, data),
  cancel: (id) => api.patch(`/activities/${id}/cancel`),
  postpone: (id, fechaHoraPostergada) =>
    api.patch(`/activities/${id}/postpone`, { fecha_hora_postergada: fechaHoraPostergada }),
  remove: (id) => api.delete(`/activities/${id}`),

  listSchedule: ({ search, tipo_id } = {}) => api.get('/activities/schedule', { search, tipo_id }),
  getPublic: (id) => api.get(`/activities/schedule/${id}`)
};

export const activityTypeService = {
  list: () => api.get('/activity-types'),
  create: (nombre) => api.post('/activity-types', { nombre })
};
