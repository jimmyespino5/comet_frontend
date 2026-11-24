import { api } from './api';

/**
 * Convierte una ruta guardada por Laravel en el disco "public" (por ejemplo "players/abc.jpg")
 * en una URL absoluta hacia el backend. Requiere haber ejecutado `php artisan storage:link`.
 */
export const storageUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path; // ya es una URL completa
  const base = (api.defaults.baseURL ?? '').replace(/\/+$/, '');
  return `${base}/storage/${path.replace(/^\/+/, '')}`;
};
