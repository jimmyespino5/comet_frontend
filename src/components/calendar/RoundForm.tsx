import React from 'react';
import { useForm } from 'react-hook-form';
import type { CalendarRound } from '../../types/calendar';
import { Button, Input } from '../ui';

export interface RoundPayload {
  round_number?: number;
  name: string | null;
}

interface RoundFormProps {
  round?: CalendarRound | null;
  onSubmit: (payload: RoundPayload) => Promise<boolean>;
  onCancel: () => void;
}

interface RoundValues {
  round_number: string;
  name: string;
}

export const RoundForm: React.FC<RoundFormProps> = ({ round, onSubmit, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RoundValues>({
    defaultValues: { round_number: round ? String(round.round_number) : '', name: round?.name ?? '' },
  });

  const submit = async (values: RoundValues) => {
    const payload: RoundPayload = { name: values.name.trim() || null };
    if (values.round_number) payload.round_number = Number(values.round_number);
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <Input
        label="Número de jornada"
        type="number"
        min={1}
        inputMode="numeric"
        placeholder="Automático"
        hint={round ? undefined : 'Déjalo vacío para usar el siguiente número'}
        error={errors.round_number?.message}
        {...register('round_number', { min: { value: 1, message: 'Debe ser 1 o mayor' } })}
      />
      <Input
        label="Nombre (opcional)"
        placeholder="Ej. Jornada 1, Cuartos de final"
        error={errors.name?.message}
        {...register('name')}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {round ? 'Guardar cambios' : 'Crear jornada'}
        </Button>
      </div>
    </form>
  );
};
