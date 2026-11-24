export type GameStatus = 'scheduled' | 'in_progress' | 'completed' | 'suspended' | 'postponed';

export interface CalendarTeam {
  id: number;
  name: string;
  logo_url?: string | null;
  logo_path?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
}

export interface CalendarRegistration {
  id: number;
  team_id: number;
  group_id: number | null;
  team: CalendarTeam;
}

export interface CalendarGroup {
  id: number;
  name: string;
}

export interface CalendarGame {
  id: number;
  round_id: number;
  home_registration_id: number;
  away_registration_id: number;
  /** Hora local de la cancha, sin zona horaria: "2026-11-25T19:00:00" */
  scheduled_at: string;
  venue: string | null;
  home_score: number;
  away_score: number;
  status: GameStatus;
  group_id: number | null;
  group?: CalendarGroup | null;
  home_registration: CalendarRegistration;
  away_registration: CalendarRegistration;
}

export interface CalendarRound {
  id: number;
  tournament_id: number;
  round_number: number;
  name: string | null;
  /** null = borrador (solo lo ve el admin) */
  published_at: string | null;
  games: CalendarGame[];
}

export interface CalendarData {
  tournament: { id: number; name: string; edition: string | null; status: string };
  groups: CalendarGroup[];
  rounds: CalendarRound[];
  /** Inscripciones de los equipos del usuario en este torneo (para resaltar sus partidos) */
  my_registration_ids: number[];
  can_manage: boolean;
}

/** Inscripción tal como la devuelve /api/tournament-registrations (solo lo que usamos) */
export interface RegistrationOption {
  id: number;
  team_id: number;
  group_id: number | null;
  team: { id: number; name: string };
}

export interface TournamentOption {
  id: number;
  name: string;
  edition?: string | null;
  status: string;
}
