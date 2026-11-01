import { api } from './api';

export const categoriaMangaComicService = {
  listar: () => api.get('/categorias-manga-comic'),
  obtener: (id) => api.get(`/categorias-manga-comic/${id}`),
  crear: (data) => api.post('/categorias-manga-comic', data),
  actualizar: (id, data) =>
    api.put(`/categorias-manga-comic/${id}`, data),
  eliminar: (id) => api.delete(`/categorias-manga-comic/${id}`),
};