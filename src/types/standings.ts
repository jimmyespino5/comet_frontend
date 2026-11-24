export type Tiebreaker = 'head_to_head' | 'goal_difference' | 'goals_for' | 'goals_against' | 'wins' | 'fair_play';

/**
 * qualified     = clasifica directo por su posición en el grupo
 * wildcard      = clasifica como mejor de la siguiente posición (p. ej. mejor 3.º)
 * wildcard_out  = compite por ese cupo pero hoy quedaría fuera
 */
export type Qualification = 'qualified' | 'wildcard' | 'wildcard_out' | null;

export interface StandingRow {
  position: number;
  registration_id: number;
  team: {
    id: number | null;
    name: string;
    logo_url?: string | null;
    logo_path?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
  };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  fair_play: number;
  /** Las reglas del torneo no logran separarlo de otro equipo */
  tied: boolean;
  tie_group: number | null;
  /** Su posición se definió con el orden manual del admin */
  manual: boolean;
  qualification: Qualification;
  /** Solo en la tabla de mejores terceros */
  group_name?: string;
  group_position?: number;
}

export interface StandingsTableData {
  group: { id: number; name: string } | null;
  /** Todos los partidos del grupo están finalizados y publicados */
  is_final: boolean;
  rows: StandingRow[];
}

export interface StandingsData {
  tournament: {
    id: number;
    name: string;
    edition: string | null;
    status: string;
    advance_per_group: number;
    wildcard_count: number;
    tiebreakers: Tiebreaker[];
  };
  tables: StandingsTableData[];
  wildcards: { position: number; count: number; is_final: boolean; rows: StandingRow[] } | null;
  my_registration_ids: number[];
  can_manage: boolean;
}
