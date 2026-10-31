import { api } from './api';

export const categoriaService = {
  listar: () => api.get('/categorias-juego'),
  obtener: (id) => api.get(`/categorias-juego/${id}`),
  crear: (data) => api.post('/categorias-juego', data),
  actualizar: (id, data) => api.put(`/categorias-juego/${id}`, data),
  eliminar: (id) => api.delete(`/categorias-juego/${id}`),
};
