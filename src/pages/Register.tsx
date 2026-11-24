import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { Button, Input } from '../components/ui';

interface RegisterValues {
  name: string;
  last_name: string;
  dni: string;
  phone: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface RegisterProps {
  onBackToLogin: () => void;
}

/** Registro público: siempre crea una cuenta de delegado (el rol lo fija el backend). */
export const Register: React.FC<RegisterProps> = ({ onBackToLogin }) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    defaultValues: { name: '', last_name: '', dni: '', phone: '', email: '', password: '', password_confirmation: '' },
  });

  const onSubmit = async (data: RegisterValues) => {
    setApiError(null);

    try {
      const response = await api.post('/api/register', data);
      const { access_token, user } = response.data;
      // Al quedar autenticado, App.tsx pasa solo al Dashboard
      setAuth(user, access_token);
    } catch (err: any) {
      const status = err.response?.status;

      if (status === 422 && err.response.data.errors) {
        // Errores de validación de Laravel: cada uno se muestra en su campo
        const serverErrors: Record<string, string[]> = err.response.data.errors;
        Object.entries(serverErrors).forEach(([field, messages]) => {
          setError(field as keyof RegisterValues, { message: messages[0] });
        });
      } else if (status === 429) {
        setApiError('Demasiados intentos. Espera un minuto y vuelve a intentarlo.');
      } else if (err.response) {
        setApiError(err.response.data?.message || 'No se pudo crear la cuenta.');
      } else {
        setApiError('No se pudo conectar con el servidor.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8 sm:p-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Crear cuenta de delegado</h1>
          <p className="text-slate-400 text-sm">
            Con tu cuenta podrás registrar tus equipos, inscribirlos en el torneo y cargar a tus jugadores.
          </p>
        </div>

        {apiError && (
          <div role="alert" className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              autoComplete="given-name"
              error={errors.name?.message}
              {...register('name', { required: 'El nombre es obligatorio' })}
            />
            <Input
              label="Apellido"
              autoComplete="family-name"
              error={errors.last_name?.message}
              {...register('last_name', { required: 'El apellido es obligatorio' })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Cédula"
              inputMode="numeric"
              placeholder="Solo números"
              error={errors.dni?.message}
              {...register('dni', {
                required: 'La cédula es obligatoria',
                pattern: { value: /^\d+$/, message: 'La cédula solo puede tener números' },
              })}
            />
            <Input
              label="Teléfono (opcional)"
              type="tel"
              autoComplete="tel"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email', {
              required: 'El correo es obligatorio',
              pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Formato de correo inválido' },
            })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contraseña"
              type="password"
              autoComplete="new-password"
              hint="Mínimo 8 caracteres"
              error={errors.password?.message}
              {...register('password', {
                required: 'La contraseña es obligatoria',
                minLength: { value: 8, message: 'Mínimo 8 caracteres' },
              })}
            />
            <Input
              label="Repite la contraseña"
              type="password"
              autoComplete="new-password"
              error={errors.password_confirmation?.message}
              {...register('password_confirmation', {
                required: 'Confirma tu contraseña',
                validate: (value) => value === getValues('password') || 'Las contraseñas no coinciden',
              })}
            />
          </div>

          <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <button
            type="button"
            onClick={onBackToLogin}
            className="font-semibold text-emerald-400 hover:text-emerald-300 transition rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            Iniciar sesión
          </button>
        </p>
      </div>
    </div>
  );
};
