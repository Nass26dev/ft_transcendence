import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Nom de l'événement émis quand la session est morte (refresh impossible). */
export const AUTH_EXPIRED_EVENT = 'kop:auth-expired';

// Refresh partagé : si plusieurs requêtes tombent en 401 en même temps, on ne
// déclenche qu'UN seul appel /api/refresh-token (au lieu d'une rafale).
let refreshPromise: Promise<void> | null = null;

function refreshToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/auth/token/refresh/', {}, {
        baseURL: process.env.NEXT_PUBLIC_API_URL,
        withCredentials: true,
      })
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await refreshToken();
        return api(originalRequest);
      } catch {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
