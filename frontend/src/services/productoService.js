import { api, ApiError } from './api';
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
    const { detail } = await response.json().catch(() => ({}));

    // 422: errores por campo, para marcarlos en el formulario
    if (Array.isArray(detail)) {
      const fieldErrors = {};
      detail.forEach(({ loc = [], msg = '' }) => {
        const field = loc[loc.length - 1];
        if (field && !fieldErrors[field]) fieldErrors[field] = msg.replace(/^Value error, /, '');
      });
      throw new ApiError('Revisá los campos marcados.', { status: response.status, fieldErrors });
    }

    throw new ApiError(
      typeof detail === 'string' ? detail : 'No se pudo completar la operación.',
      { status: response.status }
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
