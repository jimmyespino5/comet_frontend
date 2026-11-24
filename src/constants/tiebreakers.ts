import type { Tiebreaker } from '../types/standings';

export const TIEBREAKERS: Record<Tiebreaker, { label: string; help: string }> = {
  head_to_head: {
    label: 'Enfrentamiento directo',
    help: 'Puntos obtenidos en los partidos entre los equipos empatados',
  },
  goal_difference: { label: 'Diferencia de goles (average)', help: 'Goles a favor menos goles en contra' },
  goals_for: { label: 'Goles a favor', help: 'Gana quien anotó más goles' },
  goals_against: { label: 'Goles en contra', help: 'Gana quien recibió menos goles' },
  wins: { label: 'Partidos ganados', help: 'Gana quien tiene más victorias' },
  fair_play: {
    label: 'Juego limpio',
    help: 'Menos puntos de tarjetas (amarilla 1, doble amarilla 3, roja 4)',
  },
};

export const ALL_TIEBREAKERS = Object.keys(TIEBREAKERS) as Tiebreaker[];
