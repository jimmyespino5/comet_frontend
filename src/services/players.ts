import { api } from './api';

/** Inscribe un jugador en un equipo. Devuelve el jugador creado. */
export const addPlayer = async (teamId: number, formData: FormData) => {
  const response = await api.post(`/api/teams/${teamId}/players`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.player || response.data;
};
