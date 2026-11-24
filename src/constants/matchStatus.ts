import type { GameStatus } from '../types/calendar';

type Tone = 'emerald' | 'amber' | 'blue' | 'red' | 'slate';

export const GAME_STATUS: Record<GameStatus, { label: string; tone: Tone }> = {
  scheduled: { label: 'Programado', tone: 'slate' },
  in_progress: { label: 'En juego', tone: 'emerald' },
  completed: { label: 'Finalizado', tone: 'blue' },
  suspended: { label: 'Suspendido', tone: 'red' },
  postponed: { label: 'Aplazado', tone: 'amber' },
};

export const GAME_STATUS_OPTIONS = Object.entries(GAME_STATUS).map(([value, { label }]) => ({
  value: value as GameStatus,
  label,
}));
