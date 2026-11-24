import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type {Player} from '../types/auth'
import { PlayerForm } from '../components/players/PlayerForm';
import { addPlayer } from '../services/players';
import { positionLabel } from '../constants/positions';

export const TeamTournamentManager: React.FC = () => {
  const [activeTournaments, setActiveTournaments] = useState<any[]>([]);
  const [myTeams, setMyTeams] = useState<any[]>([]);
  
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  
  // Estado inteligente para saber si ya está inscrito
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados del formulario de jugadores

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Cada vez que cambie el torneo o el equipo seleccionado, verificamos si ya están inscritos
  useEffect(() => {
    if (selectedTournamentId && selectedTeam) {
      checkIfTeamIsRegistered();
      fetchTeamRoster(selectedTeam.id, +selectedTournamentId);
    } else {
    setTeamPlayers([]);
  }
  }, [selectedTournamentId, selectedTeam]);

  const fetchInitialData = async () => {
    try {
      const tournamentsRes = await api.get('/api/tournaments/open');
      const tournaments = Array.isArray(tournamentsRes.data) ? tournamentsRes.data : tournamentsRes.data.data || [];
      setActiveTournaments(tournaments);
      if (tournaments.length > 0) {
        setSelectedTournamentId(tournaments[0].id);
      }

      const teamsRes = await api.get('/api/teams');
      const teams = Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data.data || [];
      setMyTeams(teams);
      if (teams.length > 0) {
        setSelectedTeam(teams[0]);
      }
    } catch (err: any) {
      console.error('Error al cargar datos iniciales:', err);
    }
  };

  const fetchTeamRoster = async (teamId: number, tournamentId: number) => {
    try {
      const response = await api.get(`/api/teams/${teamId}/roster?tournament_id=${tournamentId}`);
      // Aseguramos que guarde el arreglo de jugadores que viene del backend
      setTeamPlayers(response.data.players || []);
    } catch (err) {
      console.error('Error al cargar la plantilla:', err);
      setTeamPlayers([]);
    }
  };

  const checkIfTeamIsRegistered = async () => {
    try {
      const response = await api.get(`/api/tournament-registrations?tournament_id=${selectedTournamentId}&team_id=${selectedTeam.id}`);
      const registrations = Array.isArray(response.data) ? response.data : response.data.data || [];
      
      // El backend devuelve las inscripciones del torneo: buscamos la de este equipo
      setIsRegistered(registrations.some((r: any) => r.team_id === selectedTeam.id));
    } catch (err) {
      console.error('Error al verificar el estado de inscripción:', err);
      setIsRegistered(false);
    }
  };

  const handleRegisterTeamToTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournamentId || !selectedTeam) return;

    setLoading(true);
    try {
      const response = await api.post('/api/tournament-registrations', {
        tournament_id: Number(selectedTournamentId),
        team_id: Number(selectedTeam.id),
      });

      alert(response.data.message || 'Equipo inscrito exitosamente en el torneo.');
      setIsRegistered(true);
    } catch (err: any) {
      if (err.response?.status === 422) {
        // Si el backend responde que ya está inscrito, actualizamos el estado de inmediato
        setIsRegistered(true);
      } else {
        alert(err.response?.data?.message || 'Error al inscribir el equipo en el torneo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (formData: FormData): Promise<boolean> => {
    if (!selectedTeam || !selectedTournamentId) return false;

    try {
      formData.append('tournament_id', selectedTournamentId);
      await addPlayer(selectedTeam.id, formData);

      // Recargamos la plantilla del torneo para que el jugador nuevo aparezca en la lista
      await fetchTeamRoster(selectedTeam.id, Number(selectedTournamentId));

      alert('Jugador agregado a la nómina con éxito.');
      return true;
    } catch (err: any) {
      console.error('Error detallado del backend:', err.response?.data);
      alert(err.response?.data?.message || 'Error al registrar el jugador.');
      return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-xl">
      
      {/* SECCIÓN DE SELECCIÓN GENERAL (Torneo y Equipo) */}
      <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
        <h3 className="text-sm font-bold text-white">⚙️ Selección de Torneo y Club</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Torneo Vigente</label>
            <select 
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {activeTournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.edition || 'Activo'})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Club / Equipo</label>
            <select 
              value={selectedTeam?.id || ''}
              onChange={(e) => {
                const found = myTeams.find(t => t.id === Number(e.target.value));
                setSelectedTeam(found);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {myTeams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECCIÓN CONDICIONAL: Si NO está inscrito, muestra el botón para confirmar inscripción */}
      {!isRegistered ? (
        <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-xl text-center space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Inscripción Pendiente</h4>
            <p className="text-xs text-slate-400">Este equipo aún no se encuentra inscrito en el torneo seleccionado.</p>
          </div>
          <button 
            onClick={handleRegisterTeamToTournament}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow-lg text-sm"
          >
            {loading ? 'Inscribiendo...' : 'Confirmar Inscripción al Torneo'}
          </button>
        </div>
      ) : (
        /* SECCIÓN SI YA ESTÁ INSCRITO: Alerta y Gestión de Jugadores */
        <div className="space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">✅</span>
              <div>
                <h4 className="text-sm font-bold text-emerald-400">Equipo Ya Inscrito</h4>
                <p className="text-xs text-slate-300">Este equipo ya forma parte del torneo activo. Gestiona su plantilla abajo.</p>
              </div>
            </div>
          </div>

          {/* Formulario de Registro de Jugadores */}
          <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-sm font-semibold text-slate-300">Inscribir Jugador al Equipo</h4>
            <PlayerForm submitLabel="Agregar a la Nómina del Torneo" onSubmit={handleAddPlayer} />
          </div>

          {/* Lista de Jugadores Inscritos */}
          {/* <div>
            <h5 className="text-xs font-semibold uppercase text-slate-400 mb-2">Jugadores Inscritos ({selectedTeam?.players?.length || 0})</h5>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedTeam?.players?.map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                  <span>{p.first_name} {p.last_name} (#{p.jersey_number || p.pivot?.jersey_number})</span>
                  <span className="text-slate-400 uppercase">{p.position || p.pivot?.position}</span>
                </div>
              ))}
            </div>
          </div> */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {teamPlayers.length > 0 ? (
              teamPlayers.map((player) => (
                <div key={player.id} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-white">
                  <div>
                    <p className="font-bold">{player.first_name} {player.last_name}</p>
                    <p className="text-slate-400">CI: {player.dni}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                      #{player.pivot?.jersey_number || player.jersey_number || 'S/N'}
                    </span>
                    <p className="text-slate-400 uppercase mt-1">{positionLabel(player.pivot?.position || player.position)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">A este equipo aún no se le han registrado jugadores en la plantilla.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};