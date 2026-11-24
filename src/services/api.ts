import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/', // Reemplaza con la URL de tu backend Laravel
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor: Agrega automáticamente el token de autenticación a cada petición si existe
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor opcional: Maneja errores globales como el 401 (No autorizado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // El login devuelve 401 con credenciales malas: ese error lo muestra el formulario,
    // no debe disparar logout ni recargar la página.
    const isLoginRequest = error.config?.url?.includes('/api/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      useAuthStore.getState().logout();
      window.location.href = '/'; // Redirige al login si el token expira o es inválido
    }
    return Promise.reject(error);
  }
);