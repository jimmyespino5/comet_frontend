import React, { useState } from 'react';
import type { StandingRow } from '../../types/standings';
import { storageUrl } from '../../services/storage';
import { Badge } from '../ui';

interface StandingsTableProps {
  title: string;
  subtitle?: string;
  rows: StandingRow[];
  mineIds: Set<number>;
  showFairPlay: boolean;
  /** Tabla de mejores terceros: muestra de qué grupo viene cada equipo */
  showGroupColumn?: boolean;
  /** Acciones del admin junto al título */
  actions?: React.ReactNode;
}

const ROW_BORDER: Record<string, string> = {
  qualified: 'border-l-emerald-500 bg-emerald-500/5',
  wildcard: 'border-l-blue-500 bg-blue-500/5',
  wildcard_out: 'border-l-amber-500/70 bg-amber-500/5',
};

const TeamInline: React.FC<{ team: StandingRow['team'] }> = ({ team }) => {
  const [failed, setFailed] = useState(false);
  const src = team.logo_url || storageUrl(team.logo_path);

  return (
    <span className="flex items-center gap-2 min-w-0">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          className="w-6 h-6 rounded-full object-cover border border-slate-700 shrink-0"
        />
      ) : (
        <span
          aria-hidden="true"
          className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white border border-slate-700"
          style={{ backgroundColor: team.primary_color || '#334155' }}
        >
          {team.name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="truncate">{team.name}</span>
    </span>
  );
};

const HEADERS: { key: string; label: string; title: string }[] = [
  { key: 'played', label: 'PJ', title: 'Partidos jugados' },
  { key: 'won', label: 'G', title: 'Ganados' },
  { key: 'drawn', label: 'E', title: 'Empatados' },
  { key: 'lost', label: 'P', title: 'Perdidos' },
  { key: 'gf', label: 'GF', title: 'Goles a favor' },
  { key: 'ga', label: 'GC', title: 'Goles en contra' },
  { key: 'gd', label: 'DG', title: 'Diferencia de goles' },
];

export const StandingsTable: React.FC<StandingsTableProps> = ({
  title,
  subtitle,
  rows,
  mineIds,
  showFairPlay,
  showGroupColumn = false,
  actions,
}) => (
  <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden" aria-label={title}>
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
      <div>
        <h3 className="text-base font-bold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions}
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr className="text-xs uppercase tracking-wider text-slate-400 bg-slate-950/50">
            <th scope="col" className="py-3 pl-5 pr-2 text-left w-10">
              #
            </th>
            <th scope="col" className="py-3 px-2 text-left">
              Equipo
            </th>
            {showGroupColumn && (
              <th scope="col" className="py-3 px-2 text-left">
                Grupo
              </th>
            )}
            {HEADERS.map((h) => (
              <th key={h.key} scope="col" title={h.title} className="py-3 px-2 text-center">
                {h.label}
              </th>
            ))}
            {showFairPlay && (
              <th scope="col" title="Puntos de tarjetas (menos es mejor)" className="py-3 px-2 text-center">
                TA
              </th>
            )}
            <th scope="col" title="Puntos" className="py-3 pl-2 pr-5 text-center text-white">
              Pts
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-800">
          {rows.map((row) => {
            const mine = mineIds.has(row.registration_id);

            return (
              <tr key={row.registration_id} className={mine ? 'bg-emerald-500/10' : undefined}>
                <td
                  className={`py-3 pl-5 pr-2 border-l-4 font-bold text-slate-300 tabular-nums ${
                    (row.qualification && ROW_BORDER[row.qualification]) || 'border-l-transparent'
                  }`}
                >
                  {row.position}
                </td>

                <td className="py-3 px-2 text-white font-medium max-w-[14rem]">
                  <span className="flex items-center gap-2 min-w-0">
                    <TeamInline team={row.team} />
                    {mine && (
                      <Badge tone="emerald" className="hidden sm:inline-block shrink-0">
                        Tu equipo
                      </Badge>
                    )}
                    {row.tied && (
                      <span
                        role="img"
                        aria-label="Empate sin resolver"
                        title="Empate sin resolver: las reglas del torneo no logran separar a estos equipos"
                      >
                        ⚠️
                      </span>
                    )}
                    {row.manual && (
                      <span role="img" aria-label="Orden manual" title="Posición definida manualmente por el organizador">
                        ✋
                      </span>
                    )}
                  </span>
                </td>

                {showGroupColumn && <td className="py-3 px-2 text-slate-300">{row.group_name}</td>}

                <td className="py-3 px-2 text-center tabular-nums text-slate-300">{row.played}</td>
                <td className="py-3 px-2 text-center tabular-nums text-slate-300">{row.won}</td>
                <td className="py-3 px-2 text-center tabular-nums text-slate-300">{row.drawn}</td>
                <td className="py-3 px-2 text-center tabular-nums text-slate-300">{row.lost}</td>
                <td className="py-3 px-2 text-center tabular-nums text-slate-300">{row.gf}</td>
                <td className="py-3 px-2 text-center tabular-nums text-slate-300">{row.ga}</td>
                <td className="py-3 px-2 text-center tabular-nums text-slate-300">
                  {row.gd > 0 ? `+${row.gd}` : row.gd}
                </td>
                {showFairPlay && <td className="py-3 px-2 text-center tabular-nums text-slate-300">{row.fair_play}</td>}
                <td className="py-3 pl-2 pr-5 text-center tabular-nums font-extrabold text-white">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </section>
);
