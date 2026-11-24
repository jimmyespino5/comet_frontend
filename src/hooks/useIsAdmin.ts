import { useAuthStore } from '../store/useAuthStore';

/**
 * true si el usuario autenticado es administrador.
 * /api/login devuelve los roles de Spatie en `user.roles`; `user.role` queda como respaldo.
 */
export const useIsAdmin = (): boolean =>
  useAuthStore((state) => !!(state.user?.roles?.some((r) => r.name === 'admin') || state.user?.role?.includes('admin')));
