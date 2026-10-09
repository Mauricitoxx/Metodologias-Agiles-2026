import { api } from './api';
import { getSessionToken } from './auth';

const withAuth = (method, path, body) => {
  const token = getSessionToken();

  if (!token) {
    throw new Error('Tenés que iniciar sesión para realizar esta acción.');
  }

  return fetch(`${(import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  }).then(async (response) => {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        typeof error.detail === 'string'
          ? error.detail
          : 'No se pudo completar la operación.'
      );
    }

    return response.status === 204 ? null : response.json();
  });
};

export const mangaComicService = {
  list: () => api.get('/mangas-comics/'),
  get: (id) => api.get(`/mangas-comics/${id}`),
  create: (data) => withAuth('POST', '/mangas-comics/', data),
  update: (id, data) => withAuth('PUT', `/mangas-comics/${id}`, data),
  deactivate: (id) => withAuth('PATCH', `/mangas-comics/${id}/baja`),
};
