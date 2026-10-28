import { api } from './api';

export const juegoService = {
  listar: (params) => api.get('/juegos', params),
  obtener: (id, params) => api.get(`/juegos/${id}`, params),
  crear: (data) => api.post('/juegos', data),
  actualizar: (id, data) => api.put(`/juegos/${id}`, data),
  eliminar: (id, bajaLogica = true) =>
    api.delete(`/juegos/${id}?baja_logica=${bajaLogica}`),
  listarReglas: (juegoId) => api.get(`/juegos/${juegoId}/reglas`),
  crearRegla: (juegoId, data) => api.post(`/juegos/${juegoId}/reglas`, data),
};
