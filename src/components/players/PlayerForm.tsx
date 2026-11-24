import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, FileInput, Input, Select } from '../ui';
import { POSITIONS, DEFAULT_POSITION } from '../../constants/positions';

interface PlayerFormValues {
  first_name: string;
  last_name: string;
  dni: string;
  birth_date: string;
  position: string;
  jersey_number: string;
  photo: FileList;
}

interface PlayerFormProps {
  submitLabel: string;
  /**
   * Recibe el FormData del jugador (sin tournament_id: lo agrega quien lo usa).
   * Debe devolver true si se guardó; en ese caso el formulario se limpia.
   */
  onSubmit: (data: FormData) => Promise<boolean>;
}

/** Formulario único para inscribir jugadores; lo usan Equipos e Inscripción. */
export const PlayerForm: React.FC<PlayerFormProps> = ({ submitLabel, onSubmit }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlayerFormValues>({
    defaultValues: {
      first_name: '',
      last_name: '',
      dni: '',
      birth_date: '',
      position: DEFAULT_POSITION,
      jersey_number: '',
    },
  });

  const submit = async (values: PlayerFormValues) => {
    const formData = new FormData();
    formData.append('first_name', values.first_name.trim());
    formData.append('last_name', values.last_name.trim());
    formData.append('dni', values.dni.trim());
    formData.append('position', values.position);
    // Mismo nombre de campo que la columna del pivot de inscripción (ver Player en types/auth.ts)
    formData.append('jersey_number', values.jersey_number);
    if (values.birth_date) formData.append('birth_date', values.birth_date);

    const photo = values.photo?.[0];
    if (photo) formData.append('photo', photo);

    const saved = await onSubmit(formData);
    if (saved) reset();
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre"
          placeholder="Ej. Carlos"
          error={errors.first_name?.message}
          {...register('first_name', { required: 'El nombre es obligatorio' })}
        />
        <Input
          label="Apellido"
          placeholder="Ej. Pérez"
          error={errors.last_name?.message}
          {...register('last_name', { required: 'El apellido es obligatorio' })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Documento / Cédula"
          placeholder="V-12345678"
          error={errors.dni?.message}
          {...register('dni', { required: 'El documento es obligatorio' })}
        />
        <Input label="Fecha de nacimiento" type="date" {...register('birth_date')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="Posición" {...register('position')}>
          {POSITIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
        <Input
          label="Dorsal (#)"
          type="number"
          inputMode="numeric"
          placeholder="10"
          error={errors.jersey_number?.message}
          {...register('jersey_number', {
            required: 'El dorsal es obligatorio',
            min: { value: 1, message: 'El dorsal debe estar entre 1 y 99' },
            max: { value: 99, message: 'El dorsal debe estar entre 1 y 99' },
          })}
        />
      </div>

      <FileInput label="Fotografía del jugador" accept="image/*" {...register('photo')} />

      <Button type="submit" loading={isSubmitting} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
};
