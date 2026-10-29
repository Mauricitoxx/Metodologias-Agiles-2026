const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const SESSION_KEY = 'frikioteca_session_token';

export const getSessionToken = () => sessionStorage.getItem(SESSION_KEY);
export const clearSessionToken = () => sessionStorage.removeItem(SESSION_KEY);

async function request(path, { token, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}/auth${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  } catch {
    throw new Error('No pudimos conectar con el servidor. Intentá nuevamente.');
  }
  if (!response.ok) {
    const error = new Error(response.status === 401 || response.status === 403
      ? 'Correo o contraseña incorrectos, o sesión vencida.'
      : 'No pudimos completar la solicitud. Intentá nuevamente.');
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

export const auth = {
  async login(email, password) {
    const result = await request('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    sessionStorage.setItem(SESSION_KEY, result.access_token);
    return result;
  },
  me: (token) => request('/me', { token }),
  logout: (token) => request('/logout', { method: 'POST', token }),
};
