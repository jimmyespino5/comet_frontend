import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, FileInput, Input, Select } from '../ui';
import { POSITIONS } from '../../constants/positions';

interface PlayerEditFormProps {
  player: any;
  isAdmin: boolean;
  /** Recibe el FormData (con _method=PUT) y devuelve true si se guardó */
  onSubmit: (data: FormData) => Promise<boolean>;
  onCancel: () => void;
}

interface PlayerEditValues {
  first_name: string;
  last_name: string;
  dni: string;
  birth_date: string;
  position: string;
  photo: FileList;
}

const toDateInput = (value?: string | null) => (value ? String(value).slice(0, 10) : '');
const LOCKED_HINT = 'Ya registrado: solo un administrador puede modificarlo';

/**
 * Edición de un jugador.
 *  - Admin: edita todos los campos.
 *  - Delegado: solo puede completar los datos vacíos; lo que ya tiene valor queda bloqueado
 *    (el backend aplica la misma regla, esto es solo para que la pantalla lo deje claro).
 */
export const PlayerEditForm: React.FC<PlayerEditFormProps> = ({ player, isAdmin, onSubmit, onCancel }) => {
  const isLocked = (value: unknown) => !isAdmin && !!value;
  const locked = {
    first_name: isLocked(player.first_name),
    last_name: isLocked(player.last_name),
    dni: isLocked(player.dni),
    birth_date: isLocked(player.birth_date),
    position: isLocked(player.position),
    photo: isLocked(player.photo_path),
  };
  const hasEditableFields = Object.values(locked).some((isFieldLocked) => !isFieldLocked);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlayerEditValues>({
    defaultValues: {
      first_name: player.first_name ?? '',
      last_name: player.last_name ?? '',
      dni: player.dni ?? '',
      birth_date: toDateInput(player.birth_date),
      position: player.position ?? '',
    },
  });

  const submit = async (values: PlayerEditValues) => {
    const formData = new FormData();
    formData.append('_method', 'PUT'); // Laravel necesita el spoofing para recibir multipart en un PUT

    // Solo se envían los campos editables: lo bloqueado nunca viaja al backend
    if (!locked.first_name) formData.append('first_name', values.first_name.trim());
    if (!locked.last_name) formData.append('last_name', values.last_name.trim());
    if (!locked.dni) formData.append('dni', values.dni.trim());
    if (!locked.birth_date && values.birth_date) formData.append('birth_date', values.birth_date);
    if (!locked.position && values.position) formData.append('position', values.position);

    const photo = values.photo?.[0];
    if (!locked.photo && photo) formData.append('photo', photo);

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {!isAdmin && (
        <p className="text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-xl p-3">
          {hasEditableFields
            ? 'Puedes completar los datos que faltan. Los datos ya registrados solo los puede modificar un administrador.'
            : 'Este jugador ya tiene todos sus datos registrados. Si algo es incorrecto, solicita el cambio a un administrador.'}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nombre"
          disabled={locked.first_name}
          hint={locked.first_name ? LOCKED_HINT : undefined}
          error={errors.first_name?.message}
          {...register('first_name', { required: !locked.first_name && 'El nombre es obligatorio' })}
        />
        <Input
          label="Apellido"
          disabled={locked.last_name}
          hint={locked.last_name ? LOCKED_HINT : undefined}
          error={errors.last_name?.message}
          {...register('last_name', { required: !locked.last_name && 'El apellido es obligatorio' })}
        />
      </div>

      <Input
        label="Documento / Cédula"
        disabled={locked.dni}
        hint={locked.dni ? LOCKED_HINT : undefined}
        error={errors.dni?.message}
        {...register('dni', { required: !locked.dni && 'El documento es obligatorio' })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Fecha de nacimiento"
          type="date"
          disabled={locked.birth_date}
          hint={locked.birth_date ? LOCKED_HINT : undefined}
          {...register('birth_date')}
        />
        <div>
          <Select label="Posición" disabled={locked.position} {...register('position')}>
            <option value="">Sin definir</option>
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          {locked.position && <span className="text-slate-400 text-xs mt-1 block">{LOCKED_HINT}</span>}
        </div>
      </div>

      <FileInput
        label="Fotografía del jugador"
        accept="image/*"
        disabled={locked.photo}
        hint={locked.photo ? LOCKED_HINT : undefined}
        {...register('photo')}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="secondary" onClick={onCancel}>
          {hasEditableFields ? 'Cancelar' : 'Cerrar'}
        </Button>
        {hasEditableFields && (
          <Button type="submit" loading={isSubmitting}>
            Guardar cambios
          </Button>
        )}
      </div>
    </form>
  );
};
