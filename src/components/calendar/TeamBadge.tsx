import React, { useState } from 'react';
import type { CalendarTeam } from '../../types/calendar';
import { storageUrl } from '../../services/storage';

/** Escudo (o inicial con los colores del equipo) y nombre, centrados. */
export const TeamBadge: React.FC<{ team: CalendarTeam }> = ({ team }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const src = team.logo_url || storageUrl(team.logo_path);

  return (
    <div className="flex flex-col items-center gap-2 text-center min-w-0">
      {src && !imageFailed ? (
        <img
          src={src}
          alt=""
          onError={() => setImageFailed(true)}
          className="w-12 h-12 rounded-full object-cover border border-slate-700 bg-slate-950"
        />
      ) : (
        <div
          aria-hidden="true"
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white border border-slate-700"
          style={{ backgroundColor: team.primary_color || '#334155' }}
        >
          {team.name.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-sm font-semibold text-white leading-tight line-clamp-2 break-words">{team.name}</span>
    </div>
  );
};
