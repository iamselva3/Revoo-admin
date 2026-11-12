import { apiClient } from '../api/client';

/**
 * Uploaded files are stored as backend paths ("/uploads/brands/apple.png"). The admin portal runs
 * on a different host than the API, so those paths must point at the backend to load.
 * Absolute (http/https) and data: URLs are returned unchanged.
 */
export const resolveImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const backendBase = (apiClient.defaults.baseURL || '').replace(/\/api\/v1\/?$/, '');
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};
