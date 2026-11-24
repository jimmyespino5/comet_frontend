import { create } from 'zustand';
import type { User } from '../types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  activeTournamentId: number | null; // <-- Nuevo
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('futsal_user') || 'null'),
  token: localStorage.getItem('futsal_token'),
  isAuthenticated: !!localStorage.getItem('futsal_token'),
  activeTournamentId: Number(localStorage.getItem('active_tournament_id')) || null,

  setAuth: (user, token) => {
    localStorage.setItem('futsal_token', token);
    localStorage.setItem('futsal_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  setActiveTournament: (id: number) => {
    localStorage.setItem('active_tournament_id', String(id));
    set({ activeTournamentId: id });
  },

  logout: () => {
    localStorage.removeItem('futsal_token');
    localStorage.removeItem('futsal_user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));