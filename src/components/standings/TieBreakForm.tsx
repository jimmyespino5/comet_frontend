import React, { useState } from 'react';
import type { StandingRow } from '../../types/standings';
import { Button } from '../ui';

interface TieBreakFormProps {
  rows: StandingRow[];
  /** Recibe los equipos de mejor a peor; con clear=true se quita el orden manual */
  onSubmit: (registrationIds: number[], clear: boolean) => Promise<boolean>;
  onCancel: () => void;
}

const iconButton =
  'w-8 h-8 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400';

/** Define el orden de equipos que las reglas del torneo no logran separar (sorteo u otra decisión del organizador). */
export const TieBreakForm: React.FC<TieBreakFormProps> = ({ rows, onSubmit, onCancel }) => {
  const [order, setOrder] = useState<StandingRow[]>(rows);
  const [busy, setBusy] = useState(false);
  const hasManual = rows.some((row) => row.manual);

  const move = (index: number, delta: number) =>
    setOrder((list) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const submit = async (clear: boolean) => {
    setBusy(true);
    await onSubmit(
      order.map((row) => row.registration_id),
      clear
    );
    setBusy(false);
  };

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-xl p-3">
        Ninguna regla del torneo logra separar a estos equipos. Ordénalos de mejor a peor según lo que decidan
        (por ejemplo, un sorteo).
      </p>

      <ol className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 bg-slate-950">
        {order.map((row, index) => (
          <li key={row.registration_id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span className="w-5 text-slate-500 tabular-nums">{index + 1}.</span>
            <span className="flex-1 text-white truncate">{row.team.name}</span>
            <button
              type="button"
              className={iconButton}
              disabled={index === 0}
              onClick={() => move(index, -1)}
              aria-label={`Subir ${row.team.name}`}
            >
              ▲
            </button>
            <button
              type="button"
              className={iconButton}
              disabled={index === order.length - 1}
              onClick={() => move(index, 1)}
              aria-label={`Bajar ${row.team.name}`}
            >
              ▼
            </button>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        {hasManual && (
          <Button variant="danger" onClick={() => submit(true)} disabled={busy}>
            Quitar orden manual
          </Button>
        )}
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
        <Button loading={busy} onClick={() => submit(false)}>
          Guardar orden
        </Button>
      </div>
    </div>
  );
};
