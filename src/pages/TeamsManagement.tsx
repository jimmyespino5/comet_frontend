import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTournamentStore } from '../store/useTournamentStore';
import { Modal } from '../components/ui';
import { PlayerForm } from '../components/players/PlayerForm';
import { addPlayer } from '../services/players';
import { TeamForm } from '../components/teams/TeamForm';
import { PlayerEditForm } from '../components/players/PlayerEditForm';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { positionLabel } from '../constants/positions';
import { storageUrl } from '../services/storage';

interface Player {
  id: number;
  first_name: string;
  jersey_number?: number;
  number?: number; // nombre antiguo, se mantiene por compatibilidad al leer
  position: string;
  document: string;
}

interface Team {
  id: number;
  name: string;
  logo_path?: string;      // 👈 Añade esta línea
  logo_url?: string; // 👈 Agrega esta línea
  category: string;
  group_name: string;
  players_count?: number;
  players?: Player[];
  delegate?: {             // 👈 Añade esta relación
    name: string;
    last_name: string;
    dni: string;
  };
}

export const TeamsManagement: React.FC = () => {
  //const [name, setName] = useState('');
  const { activeTournament } = useTournamentStore();
  const isAdmin = useIsAdmin();

  const [teams, setTeams] = useState<Team[]>([]);
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any | null>(null);
  //const [newCategory, setNewCategory] = useState('Libre');
  //const [newGroup, setNewGroup] = useState('Grupo A');


  useEffect(() => {
    fetchTeams();
  }, []);



  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/api/teams');
      setTeams(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (err: any) {
      setError('No se pudo conectar con el servidor para cargar los equipos.');
    } finally {
      setIsLoading(false);
    }
  };

  // El equipo que se está editando (null = modo creación). Sus datos precargan el formulario.
  const editingTeam = teams.find((t) => t.id === editingTeamId) ?? null;

  const openCreateModal = () => {
    setEditingTeamId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (team: any) => {
    setEditingTeamId(team.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTeamId(null);
  };

  // Recibe el FormData armado por TeamForm; devuelve true si se guardó
  const handleSaveTeam = async (formData: FormData): Promise<boolean> => {
    try {
      if (editingTeamId) {
        // MODO EDICIÓN: Laravel necesita _method PUT cuando se envía multipart
        formData.append('_method', 'PUT');
        const response = await api.post(`/api/teams/${editingTeamId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setTeams(teams.map((t) => (t.id === editingTeamId ? response.data.team || response.data : t)));
        alert('¡Equipo actualizado con éxito!');
      } else {
        // MODO CREACIÓN
        const response = await api.post('/api/teams', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setTeams([...teams, response.data.team || response.data]);
        alert('¡Equipo registrado con éxito!');
      }
      closeModal();
      return true;
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al procesar el equipo');
      return false;
    }
  };

  // Admin: edita cualquier dato. Delegado: solo completa los que faltan (el backend lo exige).
  const handleUpdatePlayer = async (formData: FormData): Promise<boolean> => {
    if (!editingPlayer || !selectedTeam) return false;

    try {
      const response = await api.post(`/api/players/${editingPlayer.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = response.data.player;

      // Conservamos el dorsal de la plantilla: la respuesta del jugador no lo incluye
      const players = (selectedTeam.players || []).map((p: any) => (p.id === updated.id ? { ...p, ...updated } : p));
      const updatedTeam = { ...selectedTeam, players };

      setSelectedTeam(updatedTeam);
      setTeams(teams.map((t) => (t.id === updatedTeam.id ? updatedTeam : t)));
      setEditingPlayer(null);
      return true;
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar el jugador');
      return false;
    }
  };

  const handleAddPlayer = async (formData: FormData): Promise<boolean> => {
    if (!activeTournament) {
      alert('Por favor selecciona o activa un torneo antes de registrar jugadores.');
      return false;
    }
    if (!selectedTeam) return false;

    try {
      formData.append('tournament_id', String(activeTournament.id));
      const newPlayer = await addPlayer(selectedTeam.id, formData);

      const updatedTeam = { ...selectedTeam, players: [...(selectedTeam.players || []), newPlayer] };
      setSelectedTeam(updatedTeam);
      setTeams(teams.map((t) => (t.id === updatedTeam.id ? updatedTeam : t)));
      return true;
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar el jugador');
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-slate-400">
        <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-sm">Cargando directorio de equipos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Cabecera del Módulo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white">Equipos y Plantillas Deportivas</h2>
          <p className="text-sm text-slate-400">Gestiona los clubes participantes y la nómina oficial de jugadores.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
        >
          <span>➕</span> Registrar Nuevo Equipo
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex justify-between items-center shrink-0">
          <span>{error}</span>
          <button onClick={fetchTeams} className="text-xs underline font-semibold hover:text-red-300">
            Reintentar
          </button>
        </div>
      )}

      {/* Contenido Dinámico */}
      {selectedTeam ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          {/* Detalle de plantilla (igual que antes) */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold mb-1 block"
              >
                ← Volver a la lista de equipos
              </button>
              <h3 className="text-2xl font-extrabold text-white">{selectedTeam.name}</h3>
              <p className="text-xs text-slate-400">Categoría: {selectedTeam.category} | {selectedTeam.group_name}</p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 font-bold text-xs rounded-lg border border-emerald-500/30">
              {selectedTeam.players?.length || 0} Jugadores Inscritos
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-slate-100 max-w-xl mx-auto">
              <h3 className="text-lg font-bold mb-4 text-white">Inscribir Jugador al Equipo</h3>

              <PlayerForm submitLabel="Agregar a la Nómina" onSubmit={handleAddPlayer} />
            </div>

            <div className="lg:col-span-2 bg-slate-950/40 border border-slate-800 p-5 rounded-xl">
              <h4 className="text-sm font-bold text-white mb-4">Nómina Oficial Registrada</h4>
              {/* {console.log(selectedTeam)} */}
              {selectedTeam.players && selectedTeam.players.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-slate-400 uppercase bg-slate-900 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Foto</th>
                        <th className="p-3">Dorsal</th>
                        <th className="p-3">Jugador</th>
                        <th className="p-3">Cédula (DNI)</th>
                        <th className="p-3">Posición</th>
                        <th className="p-3">Nacimiento</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {selectedTeam.players.map((player: any) => (
                        <tr key={player.id} className="hover:bg-slate-900/50">
                          {/* Fotografía del jugador */}
                          <td className="p-3">
                            {player.photo_path ? (
                              <img
                                src={storageUrl(player.photo_path)}
                                alt="Foto"
                                className="w-8 h-8 rounded-full object-cover border border-slate-700"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">
                                👤
                              </div>
                            )}
                          </td>

                          {/* Dorsal */}
                          <td className="p-3 font-bold text-emerald-400">
                            #{player.jersey_number || player.number || '0'}
                          </td>

                          {/* Nombre completo uniendo first_name y last_name */}
                          <td className="p-3 font-semibold text-white">
                            {player.first_name} {player.last_name}
                          </td>

                          {/* DNI / Cédula corregido */}
                          <td className="p-3 text-slate-400">
                            {player.dni}
                          </td>

                          {/* Posición */}
                          <td className="p-3 text-slate-300">
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                              {positionLabel(player.position)}
                            </span>
                          </td>

                          {/* Fecha de nacimiento */}
                          <td className="p-3 text-slate-400">
                            {player.birth_date ? String(player.birth_date).slice(0, 10) : 'N/A'}
                          </td>

                          {/* Acción: el admin edita; el delegado completa lo que falte */}
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setEditingPlayer(player)}
                              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                            >
                              {isAdmin
                                ? '✏️ Editar'
                                : !player.birth_date || !player.position || !player.photo_path
                                  ? '✏️ Completar datos'
                                  : '🔒 Ver datos'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  A este equipo aún no se le han registrado jugadores en la plantilla.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        teams.length === 0 ? (
          /* Contenedor perfectamente centrado en el medio del área de contenido */
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 max-w-lg w-full mx-auto shadow-xl">
              <div className="text-5xl">🛡️</div>
              <h3 className="text-lg font-bold text-white">No hay equipos registrados todavía</h3>
              <p className="text-sm text-slate-400">
                Comienza registrando el primer club participante para habilitar la creación de plantillas y el calendario del torneo.
              </p>
              <div>
                <button
                  onClick={openCreateModal}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition inline-flex items-center gap-2 mt-2"
                >
                  <span>➕</span> Registrar Primer Equipo
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {teams.map((team) => (
              <div
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/50 transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                      {team.group_name || 'Grupo Único'}
                    </span>
                    <span className="text-xs text-slate-500 group-hover:text-emerald-400 transition">
                      Ver plantilla →
                    </span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-2xl border border-slate-800 mb-4">

                  {/* Logo del equipo */}
                  <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0 shadow-inner relative">
                    {(team.logo_url || storageUrl(team.logo_path)) ? (
                      <img
                        src={(team.logo_url || storageUrl(team.logo_path))}
                        alt={team.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          // Si falla, ocultamos la imagen y mostramos la inicial por debajo
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}

                    {/* Elemento de respaldo con la inicial (oculto por defecto si hay imagen, se muestra si falla) */}
                    <div
                      className="w-full h-full bg-slate-800 items-center justify-center text-slate-200 font-bold text-sm absolute inset-0"
                      style={{ display: (team.logo_url || storageUrl(team.logo_path)) ? 'none' : 'flex' }}
                    >
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Nombre y datos del equipo */}
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-sm">{team.name}</h3>
                    <p className="text-xs text-slate-400">
                      Delegado: {team.delegate?.name} {team.delegate?.last_name} (DNI: {team.delegate?.dni})
                    </p>
                  </div>
                </div>
                  {/* <h3 className="text-lg font-bold text-white mb-1">{team.name}</h3>
                  <p className="text-xs text-slate-400 mb-4">Categoría: {team.category}</p> */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // evita abrir la plantilla al editar
                      handleOpenEditModal(team);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                  >
                    ✏️ Editar
                  </button>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400">
                  <span>Jugadores en plantilla:</span>
                  <span className="font-bold text-white">{team.players?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal para Crear Equipo */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingTeamId ? 'Editar Equipo' : 'Registrar Nuevo Equipo'}
        description={
          editingTeamId
            ? 'Actualiza los datos del club. El escudo es opcional: déjalo vacío para conservar el actual.'
            : 'Ingresa los datos del club participante en el torneo de futsal.'
        }
      >
        <TeamForm isAdmin={isAdmin} team={editingTeam} onSubmit={handleSaveTeam} onCancel={closeModal} />
      </Modal>

      {/* Modal de edición de jugador */}
      <Modal
        open={!!editingPlayer}
        onClose={() => setEditingPlayer(null)}
        title={isAdmin ? 'Editar jugador' : 'Datos del jugador'}
        description={editingPlayer ? `${editingPlayer.first_name} ${editingPlayer.last_name}` : undefined}
      >
        {editingPlayer && (
          <PlayerEditForm
            player={editingPlayer}
            isAdmin={isAdmin}
            onSubmit={handleUpdatePlayer}
            onCancel={() => setEditingPlayer(null)}
          />
        )}
      </Modal>
    </div>
  );
};