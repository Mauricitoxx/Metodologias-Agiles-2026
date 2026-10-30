import { api } from './api';
import { getSessionToken } from './auth';

// Tipos de producto del backend y cómo se muestran en el panel
export const TIPOS_PRODUCTO = {
  comida: 'Comidas',
  bebida: 'Bebidas',
  snack: 'Snacks',
  postre: 'Postres',
  combo: 'Combos',
};

const withAuth = async (method, path, body) => {
  const token = getSessionToken();

  if (!token) {
    throw new Error('Tenés que iniciar sesión para realizar esta acción.');
  }

  const baseUrl = (
    import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
  ).replace(/\/$/, '');

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = Array.isArray(error.detail) ? error.detail[0]?.msg : error.detail;
    throw new Error(
      typeof detail === 'string'
        ? detail.replace(/^Value error, /, '')
        : 'No se pudo completar la operación.'
    );
  }

  return response.status === 204 ? null : response.json();
};

export const productoService = {
  // Carta pública: solo productos activos
  list: () => api.get('/productos'),
  // Panel de administración: activos e inactivos, ordenados por tipo y nombre
  listAllAdmin: () => withAuth('GET', '/productos/admin/todos'),
  create: (data) => withAuth('POST', '/productos', data),
  update: (id, data) => withAuth('PUT', `/productos/${id}`, data),
  deactivate: (id) => withAuth('PATCH', `/productos/${id}/baja`),
  reactivate: (id) => withAuth('PATCH', `/productos/${id}/reactivar`),
};
