import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const ACCESS_KEY = 'revoo_admin_token';
const REFRESH_KEY = 'revoo_admin_refresh_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const clearSessionAndGoToLogin = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

/**
 * Gets a fresh access token. Only one refresh runs at a time: in this tab via a shared promise,
 * and across tabs via the Web Locks API. Several requests failing together (e.g. the page
 * refetching everything when the window regains focus after picking a photo) therefore cause a
 * single refresh, instead of racing each other and ending the session.
 */
let refreshInFlight: Promise<string> | null = null;

const refreshAccessToken = (expiredToken: string | null): Promise<string> => {
  if (refreshInFlight) return refreshInFlight;

  const doRefresh = async (): Promise<string> => {
    // Another tab may have refreshed while we waited for the lock: use its token
    const current = localStorage.getItem(ACCESS_KEY);
    if (current && current !== expiredToken) return current;

    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) throw new Error('No refresh token');
    const res = await axios.post(`${API_BASE_URL}/auth/admin/refresh-token`, { refreshToken });
    const { accessToken, refreshToken: nextRefreshToken } = res.data.data;
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, nextRefreshToken);
    return accessToken as string;
  };

  const locks = (navigator as any).locks;
  refreshInFlight = (locks?.request ? locks.request('genie-admin-auth-refresh', doRefresh) : doRefresh()).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight as Promise<string>;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/admin/login') ||
      originalRequest?.url?.includes('/auth/admin/refresh-token') ||
      originalRequest?.url?.includes('/auth/admin/logout') ||
      originalRequest?.url?.includes('/auth/customer/');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      const sentToken = String(originalRequest.headers?.Authorization || '').replace(/^Bearer\s+/i, '') || null;
      try {
        const newToken = await refreshAccessToken(sentToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr: any) {
        // Only a definite "session is over" answer logs out; a network blip keeps the session
        const status = refreshErr?.response?.status;
        if (status === 401 || status === 403 || refreshErr?.message === 'No refresh token') {
          clearSessionAndGoToLogin();
        }
      }
    }
    return Promise.reject(error);
  }
);
