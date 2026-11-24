import React from 'react';
import type { CalendarGame } from '../../types/calendar';
import { GAME_STATUS } from '../../constants/matchStatus';
import { formatMatchDay, formatMatchTime } from '../../utils/matchDate';
import { Badge, Button } from '../ui';
import { TeamBadge } from './TeamBadge';

interface GameCardProps {
  game: CalendarGame;
  /** Alguno de los equipos del usuario juega este partido */
  isMine: boolean;
  canManage: boolean;
  onResult: (game: CalendarGame) => void;
  onEdit: (game: CalendarGame) => void;
  onDelete: (game: CalendarGame) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, isMine, canManage, onResult, onEdit, onDelete }) => {
  const status = GAME_STATUS[game.status];
  const showScore = game.status === 'completed' || game.status === 'in_progress';

  return (
    <article
      className={`rounded-2xl border p-4 flex flex-col gap-4 ${
        isMine ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800 bg-slate-900'
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <Badge tone={status.tone}>{status.label}</Badge>
        {game.group && <Badge>{game.group.name}</Badge>}
        {isMine && <Badge tone="emerald">Tu equipo</Badge>}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamBadge team={game.home_registration.team} />

        {showScore ? (
          <div className="text-2xl font-extrabold text-white tabular-nums whitespace-nowrap" aria-label="Marcador">
            {game.home_score} <span className="text-slate-500">-</span> {game.away_score}
          </div>
        ) : (
          <div className="text-sm font-bold text-slate-500">VS</div>
        )}

        <TeamBadge team={game.away_registration.team} />
      </div>

      <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1 justify-center">
        <span>
          <span aria-hidden="true">📅</span> {formatMatchDay(game.scheduled_at)} · {formatMatchTime(game.scheduled_at)}
        </span>
        {game.venue && (
          <span>
            <span aria-hidden="true">📍</span> {game.venue}
          </span>
        )}
      </div>

      {canManage && (
        <div className="flex flex-wrap gap-2 justify-center pt-3 border-t border-slate-800">
          <Button size="sm" variant="secondary" onClick={() => onResult(game)}>
            Resultado
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(game)}>
            Editar
          </Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(game)}>
            Eliminar
          </Button>
        </div>
      )}
    </article>
  );
};
