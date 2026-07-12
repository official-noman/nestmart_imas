import axios from 'axios';
import Cookies from 'js-cookie';

// NEXT_PUBLIC_API_URL is inlined at build time -- fail loudly if it's
// missing rather than silently falling back to a localhost URL that would
// break every API call (including login) in production.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not set. Copy .env.local.example to .env.local ' +
    '(for local dev) or set it in your deployment environment before building.'
  );
}

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add the JWT access token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear cookies and redirect to login
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/** Safely pull the DRF error payload out of a caught axios error, without
 * resorting to `catch (err: any)` at every call site. DRF error bodies have
 * no fixed shape (arbitrary field -> message/array-of-messages), so the
 * return type is deliberately loose here, at the one boundary where
 * untyped server JSON enters the app, rather than `any`-casting at every
 * call site that reads a field off it. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getApiErrorData(err: unknown): any {
  if (axios.isAxiosError(err)) {
    return err.response?.data;
  }
  return undefined;
}

export default api;
