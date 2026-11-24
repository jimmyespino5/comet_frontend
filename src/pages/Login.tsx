import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/useAuthStore';
import type { LoginCredentials } from '../types/auth';
import { api } from '../services/api'; // Importamos la instancia configurada
import { Button, Input } from '../components/ui';

interface LoginProps {
  /** Si se pasa, muestra el enlace para crear una cuenta de delegado */
  onShowRegister?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onShowRegister }) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true);
    setApiError(null);

    try {
      // Petición POST al endpoint de autenticación de Laravel
      const response = await api.post('/api/login', data);

      // Laravel Sanctum suele retornar { token: '...', user: { ... } } o { access_token: '...' }
      const { access_token, user } = response.data;

      setAuth(user, access_token);
      
      // Como estás usando Zustand, al actualizar el estado `isAuthenticated` a true,
      // el App.tsx cambiará automáticamente al Dashboard sin necesidad de recargar la página:
      // window.location.href = '/dashboard';
    } catch (err: any) {
      if (err.response) {
        // Errores devueltos por Laravel (Ej: 422 Validaciones o 401 Credenciales inválidas)
        setApiError(
          err.response.data.message || 'Credenciales incorrectas o datos inválidos.'
        );
      } else {
        setApiError('No se pudo conectar con el servidor de Laravel.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl bg-slate-800 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-slate-700">
        
        {/* Panel Izquierdo: Identidad del Torneo */}
        <div className="relative bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-8 flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/20 backdrop-blur border border-emerald-300/30 flex items-center justify-center text-emerald-300 font-bold text-xl">
                ⚽
              </div>
              <span className="text-white font-bold text-lg tracking-wide uppercase">
                Futsal League
              </span>
            </div>
            
            <h1 className="text-3xl font-extrabold text-white leading-tight mb-3">
              Gestión Integral del Torneo
            </h1>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Accede al panel de administración para gestionar plantillas de jugadores, calendarios, estadísticas de partidos y tabla de posiciones.
            </p>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-emerald-500/30 text-xs text-emerald-200/80">
            Sistema de control de estadísticas y nómina deportiva.
          </div>
        </div>

        {/* Panel Derecho: Formulario */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">Iniciar Sesión</h2>
            <p className="text-slate-400 text-sm">
              Ingresa tus credenciales para administrar el torneo.
            </p>
          </div>

          {apiError && (
            <div role="alert" className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <Input
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              placeholder="admin@torneofutsal.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'El correo es obligatorio',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Formato de correo inválido',
                },
              })}
            />

            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              labelAction={
                <a
                  href="#forgot"
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              }
              {...register('password', {
                required: 'La contraseña es obligatoria',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              })}
            />

            {/* Recordar sesión */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                {...register('remember')}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-800"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-slate-300">
                Recordar mi sesión
              </label>
            </div>

            <Button type="submit" size="lg" loading={isLoading} className="w-full">
              {isLoading ? 'Iniciando sesión...' : 'Ingresar al Panel'}
            </Button>
          </form>

          {onShowRegister && (
            <p className="mt-6 text-center text-sm text-slate-400">
              ¿Eres delegado y aún no tienes cuenta?{' '}
              <button
                type="button"
                onClick={onShowRegister}
                className="font-semibold text-emerald-400 hover:text-emerald-300 transition rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                Crear cuenta
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};