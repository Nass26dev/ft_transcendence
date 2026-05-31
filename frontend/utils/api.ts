import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Tente de rafraîchir le token (utilisateur connecté, access expiré).
        await axios.post('/api/refresh-token', {}, { withCredentials: true });
        return api(originalRequest);
      } catch {
        // Refresh impossible : on laisse l'appelant gérer le 401.
        // Pas de redirection forcée -> un visiteur anonyme peut consulter
        // les cotes/matchs publics sans être éjecté vers /login.
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;