import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useTournamentStore } from '../store/useTournamentStore';
import type { TournamentOption } from '../types/calendar';

/**
 * Lista los torneos que el usuario puede ver (todos si es admin; solo donde está inscrito si es delegado)
 * y elige uno por defecto: el torneo activo, el que está en proceso o el primero.
 */
export const useTournamentPicker = () => {
  const { activeTournament } = useTournamentStore();
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [tournamentId, setTournamentId] = useState<number | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/api/tournaments');
        const list: TournamentOption[] = Array.isArray(response.data) ? response.data : response.data.data || [];
        setTournaments(list);

        const preferred =
          list.find((t) => t.id === activeTournament?.id) ?? list.find((t) => t.status === 'in_progress') ?? list[0];
        setTournamentId(preferred?.id ?? null);
      } catch (err) {
        console.error('Error al cargar torneos', err);
      } finally {
        setIsLoadingList(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { tournaments, tournamentId, setTournamentId, isLoadingList };
};
