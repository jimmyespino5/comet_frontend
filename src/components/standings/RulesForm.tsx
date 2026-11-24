import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Tiebreaker } from '../../types/standings';
import { ALL_TIEBREAKERS, TIEBREAKERS } from '../../constants/tiebreakers';
import { Button, Input } from '../ui';

export interface RulesPayload {
  advance_per_group: number;
  wildcard_count: number;
  tiebreakers: Tiebreaker[];
}

interface RulesFormProps {
  initial: RulesPayload;
  hasGroups: boolean;
  onSubmit: (payload: RulesPayload) => Promise<boolean>;
  onCancel: () => void;
}

interface RulesValues {
  advance: string;
  wildcards: string;
}

const iconButton =
  'w-8 h-8 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400';

export const RulesForm: React.FC<RulesFormProps> = ({ initial, hasGroups, onSubmit, onCancel }) => {
  const [selected, setSelected] = useState<Tiebreaker[]>(initial.tiebreakers);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RulesValues>({
    defaultValues: { advance: String(initial.advance_per_group), wildcards: String(initial.wildcard_count) },
  });

  const advance = Number(watch('advance')) || 0;
  const available = ALL_TIEBREAKERS.filter((key) => !selected.includes(key));

  const move = (index: number, delta: number) =>
    setSelected((list) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const submit = async (values: RulesValues) => {
    await onSubmit({
      advance_per_group: Number(values.advance),
      wildcard_count: Number(values.wildcards),
      tiebreakers: selected,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={hasGroups ? 'Clasifican por grupo' : 'Equipos que clasifican'}
          type="number"
          min={1}
          inputMode="numeric"
          error={errors.advance?.message}
          {...register('advance', {
            required: 'Indica cuántos clasifican',
            min: { value: 1, message: 'Mínimo 1' },
            max: { value: 16, message: 'Máximo 16' },
          })}
        />
        {hasGroups && (
          <Input
            label={`Mejores ${advance > 0 ? advance + 1 : ''}.º que también clasifican`}
            type="number"
            min={0}
            inputMode="numeric"
            hint="0 = ninguno. Se comparan los equipos de esa posición de todos los grupos."
            error={errors.wildcards?.message}
            {...register('wildcards', {
              required: 'Indica un número (0 si no aplica)',
              min: { value: 0, message: 'Mínimo 0' },
              max: { value: 16, message: 'Máximo 16' },
            })}
          />
        )}
      </div>

      <div>
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Orden de desempate</h4>
        <p className="text-xs text-slate-400 mb-3">
          Si dos o más equipos tienen los mismos puntos, se aplica cada criterio en este orden hasta separarlos.
        </p>

        <ol className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 bg-slate-950">
          <li className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span className="w-5 text-slate-500 tabular-nums">1.</span>
            <span className="flex-1 text-white">Puntos</span>
            <span className="text-xs text-slate-500">siempre primero</span>
          </li>

          {selected.map((key, index) => (
            <li key={key} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="w-5 text-slate-500 tabular-nums">{index + 2}.</span>
              <span className="flex-1 min-w-0">
                <span className="block text-white">{TIEBREAKERS[key].label}</span>
                <span className="block text-xs text-slate-400">{TIEBREAKERS[key].help}</span>
              </span>
              <button
                type="button"
                className={iconButton}
                disabled={index === 0}
                onClick={() => move(index, -1)}
                aria-label={`Subir ${TIEBREAKERS[key].label}`}
              >
                ▲
              </button>
              <button
                type="button"
                className={iconButton}
                disabled={index === selected.length - 1}
                onClick={() => move(index, 1)}
                aria-label={`Bajar ${TIEBREAKERS[key].label}`}
              >
                ▼
              </button>
              <button
                type="button"
                className={`${iconButton} hover:text-red-400`}
                onClick={() => setSelected((list) => list.filter((k) => k !== key))}
                aria-label={`Quitar ${TIEBREAKERS[key].label}`}
              >
                ✕
              </button>
            </li>
          ))}

          <li className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span className="w-5 text-slate-500">·</span>
            <span className="flex-1 text-slate-400">Si aún hay empate: tú defines el orden manualmente</span>
          </li>
        </ol>

        {available.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs text-slate-400">Agregar criterio:</span>
            {available.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelected((list) => [...list, key])}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                + {TIEBREAKERS[key].label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Guardar reglas
        </Button>
      </div>
    </form>
  );
};
