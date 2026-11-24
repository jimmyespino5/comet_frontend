import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Select } from '../ui';

export type TournamentStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

export interface TournamentFormValues {
  name: string;
  edition: string;
  start_date: string;
  end_date: string;
  entry_fee: string;
  referee_fee_per_match: string;
  status: TournamentStatus;
}

interface TournamentFormProps {
  /** Debe devolver true si se creó el torneo */
  onSubmit: (values: TournamentFormValues) => Promise<boolean>;
  onCancel: () => void;
}

export const TournamentForm: React.FC<TournamentFormProps> = ({ onSubmit, onCancel }) => {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<TournamentFormValues>({
    defaultValues: {
      name: 'Torneo de Futsal',
      edition: 'Clausura 2026',
      start_date: '',
      end_date: '',
      entry_fee: '',
      referee_fee_per_match: '',
      status: 'draft',
    },
  });

  return (
    <form onSubmit={handleSubmit(async (values) => { await onSubmit(values); })} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Nombre" error={errors.name?.message} {...register('name', { required: 'El nombre es obligatorio' })} />
        <Input
          label="Edición"
          placeholder="Ej. Clausura 2026"
          error={errors.edition?.message}
          {...register('edition', { required: 'La edición es obligatoria' })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Fecha de inicio"
          type="date"
          error={errors.start_date?.message}
          {...register('start_date', { required: 'La fecha de inicio es obligatoria' })}
        />
        <Input
          label="Fecha de fin"
          type="date"
          error={errors.end_date?.message}
          {...register('end_date', {
            required: 'La fecha de fin es obligatoria',
            validate: (end) => {
              const start = getValues('start_date');
              return !start || end >= start || 'La fecha de fin no puede ser anterior a la de inicio';
            },
          })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Monto inscripción ($)"
          type="number"
          step="0.01"
          inputMode="decimal"
          placeholder="100.00"
          error={errors.entry_fee?.message}
          {...register('entry_fee', {
            required: 'El monto de inscripción es obligatorio',
            min: { value: 0, message: 'El monto no puede ser negativo' },
          })}
        />
        <Input
          label="Arbitraje por partido ($)"
          type="number"
          step="0.01"
          inputMode="decimal"
          placeholder="20.00"
          error={errors.referee_fee_per_match?.message}
          {...register('referee_fee_per_match', {
            required: 'El monto de arbitraje es obligatorio',
            min: { value: 0, message: 'El monto no puede ser negativo' },
          })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Estado inicial" {...register('status')}>
          <option value="draft">Borrador</option>
          <option value="in_progress">En proceso</option>
          <option value="completed">Finalizado</option>
          <option value="cancelled">Cancelado</option>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Guardar torneo
        </Button>
      </div>
    </form>
  );
};
