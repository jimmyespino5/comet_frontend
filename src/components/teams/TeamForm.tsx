import React, { useId } from 'react';
import { useForm } from 'react-hook-form';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Button, FileInput, Input } from '../ui';

const DEFAULT_PRIMARY = '#10b981'; // esmeralda
const DEFAULT_SECONDARY = '#0f172a'; // slate-900

/** Datos mínimos del equipo que el formulario necesita para precargarse en modo edición */
export interface TeamFormInitial {
  name?: string;
  primary_color?: string | null;
  secondary_color?: string | null;
  delegate_dni?: string | null;
  delegate?: { name?: string | null; last_name?: string | null; dni?: string | null } | null;
}

interface TeamFormValues {
  name: string;
  delegate_cedula: string;
  primary_color: string;
  secondary_color: string;
  logo: FileList;
}

interface TeamFormProps {
  /** El admin indica el delegado del equipo; un delegado siempre crea equipos a su nombre */
  isAdmin: boolean;
  /** Si viene un equipo, el formulario funciona en modo edición */
  team?: TeamFormInitial | null;
  /** Recibe el FormData listo para enviar. Debe devolver true si se guardó. */
  onSubmit: (data: FormData) => Promise<boolean>;
  onCancel: () => void;
}

const ColorField: React.FC<{ label: string; hex: string; inputProps: UseFormRegisterReturn }> = ({
  label,
  hex,
  inputProps,
}) => {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/30 transition">
        <input id={id} type="color" {...inputProps} className="w-8 h-8 rounded bg-transparent cursor-pointer" />
        <span className="text-xs text-slate-400 uppercase">{hex}</span>
      </div>
    </div>
  );
};

/**
 * Formulario de equipo (crear y editar). El modal lo desmonta al cerrarse,
 * así que cada apertura empieza con valores limpios o con los del equipo a editar.
 */
export const TeamForm: React.FC<TeamFormProps> = ({ isAdmin, team, onSubmit, onCancel }) => {
  const isEditing = !!team;
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormValues>({
    defaultValues: {
      name: team?.name ?? '',
      delegate_cedula: team?.delegate?.dni ?? team?.delegate_dni ?? '',
      primary_color: team?.primary_color || DEFAULT_PRIMARY,
      secondary_color: team?.secondary_color || DEFAULT_SECONDARY,
    },
  });

  const submit = async (values: TeamFormValues) => {
    const formData = new FormData();
    formData.append('name', values.name.trim());
    if (isAdmin) formData.append('delegate_cedula', values.delegate_cedula.trim());
    formData.append('primary_color', values.primary_color);
    formData.append('secondary_color', values.secondary_color);

    const logo = values.logo?.[0];
    if (logo) formData.append('logo_path', logo);

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <Input
        label="Nombre del equipo"
        placeholder="Ej. Deportivo 5 de Julio"
        error={errors.name?.message}
        {...register('name', { required: 'El nombre del equipo es obligatorio' })}
      />

      {isAdmin && (
        <Input
          label="Cédula del delegado"
          placeholder="Ej. 15234567"
          hint="Debe ser un delegado que ya haya creado su cuenta"
          error={errors.delegate_cedula?.message}
          {...register('delegate_cedula', { required: 'La cédula del delegado es obligatoria' })}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <ColorField label="Color primario" hex={watch('primary_color')} inputProps={register('primary_color')} />
        <ColorField label="Color secundario" hex={watch('secondary_color')} inputProps={register('secondary_color')} />
      </div>

      <FileInput
        label="Escudo / logo del equipo"
        accept="image/png, image/jpeg, image/jpg"
        hint={isEditing ? 'Opcional: déjalo vacío para conservar el actual' : 'Opcional'}
        {...register('logo')}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEditing ? 'Guardar cambios' : 'Registrar equipo'}
        </Button>
      </div>
    </form>
  );
};
