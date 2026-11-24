import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '../ui';

export interface GeneratePayload {
  start_date: string;
  match_time: string;
  slot_minutes: number;
  days_between_rounds: number;
  double_round: boolean;
  venue: string | null;
}

interface GenerateFormProps {
  hasGroups: boolean;
  onSubmit: (payload: GeneratePayload) => Promise<boolean>;
  onCancel: () => void;
}

interface GenerateValues {
  start_date: string;
  match_time: string;
  slot_minutes: string;
  days_between_rounds: string;
  double_round: boolean;
  venue: string;
}

export const GenerateForm: React.FC<GenerateFormProps> = ({ hasGroups, onSubmit, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GenerateValues>({
    defaultValues: {
      start_date: '',
      match_time: '19:00',
      slot_minutes: '60',
      days_between_rounds: '7',
      double_round: false,
      venue: '',
    },
  });

  const submit = async (values: GenerateValues) => {
    await onSubmit({
      start_date: values.start_date,
      match_time: values.match_time,
      slot_minutes: Number(values.slot_minutes),
      days_between_rounds: Number(values.days_between_rounds),
      double_round: values.double_round,
      venue: values.venue.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <p className="text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-xl p-3">
        {hasGroups
          ? 'Se crean los cruces todos contra todos dentro de cada grupo. Los equipos sin grupo se enfrentan entre sí.'
          : 'Se crean los cruces todos contra todos entre los equipos inscritos.'}{' '}
        Las jornadas nacen como borrador: puedes ajustar fechas y partidos, y publicarlas cuando quieras.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Primera jornada"
          type="date"
          error={errors.start_date?.message}
          {...register('start_date', { required: 'La fecha de inicio es obligatoria' })}
        />
        <Input
          label="Hora del primer partido"
          type="time"
          error={errors.match_time?.message}
          {...register('match_time', { required: 'La hora es obligatoria' })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Minutos entre partidos"
          type="number"
          min={15}
          hint="Los partidos de un mismo día salen escalonados"
          error={errors.slot_minutes?.message}
          {...register('slot_minutes', {
            required: 'Obligatorio',
            min: { value: 15, message: 'Mínimo 15' },
            max: { value: 240, message: 'Máximo 240' },
          })}
        />
        <Input
          label="Días entre jornadas"
          type="number"
          min={1}
          error={errors.days_between_rounds?.message}
          {...register('days_between_rounds', {
            required: 'Obligatorio',
            min: { value: 1, message: 'Mínimo 1' },
            max: { value: 60, message: 'Máximo 60' },
          })}
        />
      </div>

      <Input label="Cancha (opcional)" placeholder="Ej. Cancha 1" {...register('venue')} />

      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          {...register('double_round')}
          className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500"
        />
        Ida y vuelta (cada cruce se juega dos veces)
      </label>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Generar calendario
        </Button>
      </div>
    </form>
  );
};
