import React from 'react';
import type { CalendarGame, CalendarRound } from '../../types/calendar';
import { formatMatchDay } from '../../utils/matchDate';
import { Badge, Button } from '../ui';
import { GameCard } from './GameCard';

export const roundTitle = (round: CalendarRound): string => round.name || `Jornada ${round.round_number}`;

interface RoundSectionProps {
  round: CalendarRound;
  /** Partidos a mostrar (ya filtrados) */
  games: CalendarGame[];
  mineIds: Set<number>;
  canManage: boolean;
  onTogglePublish: (round: CalendarRound) => void;
  onEditRound: (round: CalendarRound) => void;
  onDeleteRound: (round: CalendarRound) => void;
  onAddGame: (round: CalendarRound) => void;
  onEditGame: (round: CalendarRound, game: CalendarGame) => void;
  onResult: (game: CalendarGame) => void;
  onDeleteGame: (game: CalendarGame) => void;
}

const dateRange = (games: CalendarGame[]): string | null => {
  if (games.length === 0) return null;
  const times = games.map((g) => g.scheduled_at).sort();
  const first = formatMatchDay(times[0]);
  const last = formatMatchDay(times[times.length - 1]);
  return first === last ? first : `${first} – ${last}`;
};

export const RoundSection: React.FC<RoundSectionProps> = ({
  round,
  games,
  mineIds,
  canManage,
  onTogglePublish,
  onEditRound,
  onDeleteRound,
  onAddGame,
  onEditGame,
  onResult,
  onDeleteGame,
}) => {
  const range = dateRange(round.games);

  return (
    <section className="space-y-4" aria-label={roundTitle(round)}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-lg font-bold text-white">{roundTitle(round)}</h3>
          {range && <span className="text-xs text-slate-400">{range}</span>}
          {canManage &&
            (round.published_at ? (
              <Badge tone="emerald">Publicada</Badge>
            ) : (
              <Badge tone="amber">Borrador · solo la ves tú</Badge>
            ))}
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={round.published_at ? 'secondary' : 'primary'} onClick={() => onTogglePublish(round)}>
              {round.published_at ? 'Ocultar' : 'Publicar'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onAddGame(round)}>
              ➕ Partido
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onEditRound(round)}>
              Editar
            </Button>
            <Button size="sm" variant="danger" onClick={() => onDeleteRound(round)}>
              Eliminar
            </Button>
          </div>
        )}
      </div>

      {games.length === 0 ? (
        <p className="text-sm text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
          {round.games.length === 0 ? 'Esta jornada aún no tiene partidos.' : 'Ningún partido coincide con los filtros.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isMine={mineIds.has(game.home_registration_id) || mineIds.has(game.away_registration_id)}
              canManage={canManage}
              onResult={onResult}
              onEdit={(g) => onEditGame(round, g)}
              onDelete={onDeleteGame}
            />
          ))}
        </div>
      )}
    </section>
  );
};
