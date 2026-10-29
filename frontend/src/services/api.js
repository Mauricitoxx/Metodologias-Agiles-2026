const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = {} } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    // { fieldName: 'message' } for 422 responses, so forms can highlight each field
    this.fieldErrors = fieldErrors;
  }
}

const translateValidationError = ({ type, msg, ctx = {} }) => {
  switch (type) {
    case 'missing':
      return 'Campo obligatorio';
    case 'string_too_short':
      return 'Campo obligatorio';
    case 'string_too_long':
      return `Máximo ${ctx.max_length} caracteres`;
    case 'greater_than':
      return `Debe ser mayor a ${ctx.gt}`;
    case 'greater_than_equal':
      return `Debe ser mayor o igual a ${ctx.ge}`;
    case 'int_parsing':
    case 'int_type':
    case 'int_from_float':
      return 'Debe ser un número entero';
    case 'datetime_parsing':
    case 'datetime_from_date_parsing':
    case 'datetime_type':
      return 'Fecha y hora inválidas';
    case 'enum':
      return 'Opción inválida';
    case 'value_error':
      return msg.replace(/^Value error, /, '');
    default:
      return msg;
  }
};

const parseErrorResponse = async (response) => {
  let detail;
  try {
    detail = (await response.json()).detail;
  } catch {
    detail = null;
  }

  if (Array.isArray(detail)) {
    const fieldErrors = {};
    for (const error of detail) {
      const field = error.loc?.[error.loc.length - 1];
      if (field && !fieldErrors[field]) fieldErrors[field] = translateValidationError(error);
    }
    return new ApiError('Revisá los campos marcados.', { status: response.status, fieldErrors });
  }

  const fallback = response.status === 404 ? 'El recurso no existe.' : 'Ocurrió un error inesperado.';
  return new ApiError(typeof detail === 'string' ? detail : fallback, { status: response.status });
};

const buildUrl = (path, params) => {
  const url = new URL(`${API_URL}${path}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });
  return url;
};

export const request = async (path, { method = 'GET', body, params } = {}) => {
  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor.');
  }

  if (!response.ok) throw await parseErrorResponse(response);
  if (response.status === 204) return null;
  return response.json();
};

export const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' })
};
