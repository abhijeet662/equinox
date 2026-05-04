import axios from 'axios';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request: attach access token ────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('equinox_access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response: refresh token on 401 ──────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Only attempt token refresh if the user WAS authenticated (had an access
    // token). Unauthenticated requests like /auth/login and /auth/register can
    // legitimately return 401 — intercepting those causes a redirect loop that
    // aborts the loginOrCreate fallback registration flow.
    const wasAuthenticated = !!localStorage.getItem('equinox_access');

    if (error.response?.status === 401 && !original._retry && wasAuthenticated) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('equinox_refresh');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;
        localStorage.setItem('equinox_access', accessToken);
        localStorage.setItem('equinox_refresh', newRefresh);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('equinox_access');
        localStorage.removeItem('equinox_refresh');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
