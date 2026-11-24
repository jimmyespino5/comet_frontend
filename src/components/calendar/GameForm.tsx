import React from 'react';
import { useForm } from 'react-hook-form';
import type { CalendarGame, CalendarGroup, RegistrationOption } from '../../types/calendar';
import { toApiDateTime, toDateTimeLocal } from '../../utils/matchDate';
import { Button, Input, Select } from '../ui';

export interface GamePayload {
  home_registration_id: number;
  away_registration_id: number;
  scheduled_at: string;
  venue: string | null;
  group_id: number | null;
}

interface GameFormProps {
  registrations: RegistrationOption[];
  groups: CalendarGroup[];
  game?: CalendarGame | null;
  onSubmit: (payload: GamePayload) => Promise<boolean>;
  onCancel: () => void;
}

interface GameValues {
  home_registration_id: string;
  away_registration_id: string;
  scheduled_at: string;
  venue: string;
  group_id: string;
}

export const GameForm: React.FC<GameFormProps> = ({ registrations, groups, game, onSubmit, onCancel }) => {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<GameValues>({
    defaultValues: {
      home_registration_id: game ? String(game.home_registration_id) : '',
      away_registration_id: game ? String(game.away_registration_id) : '',
      scheduled_at: toDateTimeLocal(game?.scheduled_at),
      venue: game?.venue ?? '',
      group_id: game?.group_id ? String(game.group_id) : '',
    },
  });

  const sorted = [...registrations].sort((a, b) => a.team.name.localeCompare(b.team.name));
  const optionLabel = (r: RegistrationOption) => {
    const groupName = groups.find((g) => g.id === r.group_id)?.name;
    return groupName ? `${r.team.name} (${groupName})` : r.team.name;
  };

  const submit = async (values: GameValues) => {
    await onSubmit({
      home_registration_id: Number(values.home_registration_id),
      away_registration_id: Number(values.away_registration_id),
      scheduled_at: toApiDateTime(values.scheduled_at),
      venue: values.venue.trim() || null,
      group_id: values.group_id ? Number(values.group_id) : null,
    });
  };

  const teamOptions = (
    <>
      <option value="">Selecciona un equipo</option>
      {sorted.map((r) => (
        <option key={r.id} value={r.id}>
          {optionLabel(r)}
        </option>
      ))}
    </>
  );

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Local"
          error={errors.home_registration_id?.message}
          {...register('home_registration_id', { required: 'Elige el equipo local' })}
        >
          {teamOptions}
        </Select>
        <Select
          label="Visitante"
          error={errors.away_registration_id?.message}
          {...register('away_registration_id', {
            required: 'Elige el equipo visitante',
            validate: (value) => value !== getValues('home_registration_id') || 'Un equipo no puede jugar contra sí mismo',
          })}
        >
          {teamOptions}
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Fecha y hora"
          type="datetime-local"
          error={errors.scheduled_at?.message}
          {...register('scheduled_at', { required: 'La fecha y la hora son obligatorias' })}
        />
        <Input label="Cancha (opcional)" placeholder="Ej. Cancha 1" {...register('venue')} />
      </div>

      {groups.length > 0 && (
        <Select label="Grupo" {...register('group_id')}>
          <option value="">Automático (según los equipos)</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {game ? 'Guardar cambios' : 'Programar partido'}
        </Button>
      </div>
    </form>
  );
};
