import React from 'react';
import { useForm } from 'react-hook-form';
import type { CalendarGame, GameStatus } from '../../types/calendar';
import { GAME_STATUS_OPTIONS } from '../../constants/matchStatus';
import { Button, Input, Select } from '../ui';

export interface ResultPayload {
  status: GameStatus;
  home_score: number | null;
  away_score: number | null;
}

interface ResultFormProps {
  game: CalendarGame;
  onSubmit: (payload: ResultPayload) => Promise<boolean>;
  onCancel: () => void;
}

interface ResultValues {
  status: GameStatus;
  home_score: string;
  away_score: string;
}

export const ResultForm: React.FC<ResultFormProps> = ({ game, onSubmit, onCancel }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResultValues>({
    defaultValues: {
      status: game.status,
      home_score: String(game.home_score ?? 0),
      away_score: String(game.away_score ?? 0),
    },
  });

  const status = watch('status');
  const needsScore = status === 'in_progress' || status === 'completed';

  const scoreRules = {
    validate: (value: string) => !needsScore || value !== '' || 'Indica el marcador',
    min: { value: 0, message: 'No puede ser negativo' },
    max: { value: 99, message: 'Máximo 99' },
  };

  const submit = async (values: ResultValues) => {
    await onSubmit({
      status: values.status,
      home_score: needsScore ? Number(values.home_score) : null,
      away_score: needsScore ? Number(values.away_score) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <Select label="Estado del partido" {...register('status')}>
        {GAME_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      {needsScore && (
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={game.home_registration.team.name}
            type="number"
            inputMode="numeric"
            min={0}
            error={errors.home_score?.message}
            {...register('home_score', scoreRules)}
          />
          <Input
            label={game.away_registration.team.name}
            type="number"
            inputMode="numeric"
            min={0}
            error={errors.away_score?.message}
            {...register('away_score', scoreRules)}
          />
        </div>
      )}

      <p className="text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-xl p-3">
        {status === 'completed'
          ? 'Al marcar el partido como finalizado, su resultado contará en la tabla de posiciones.'
          : status === 'scheduled' || status === 'postponed'
            ? 'El marcador se reinicia a 0-0 y el partido no cuenta en la tabla.'
            : 'Solo los partidos finalizados cuentan en la tabla de posiciones.'}
      </p>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Guardar resultado
        </Button>
      </div>
    </form>
  );
};
