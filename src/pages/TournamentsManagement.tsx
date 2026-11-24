import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTournamentStore } from '../store/useTournamentStore';
import { Modal } from '../components/ui';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { TournamentForm } from '../components/tournaments/TournamentForm';
import type { TournamentFormValues } from '../components/tournaments/TournamentForm';
// Importa tu store de Zustand donde tengas el setActiveTournament
// import { useAuthStore } from '../store/useAuthStore'; 

interface Tournament {
  id: number;
  name: string;
  edition: string;
  start_date: string;
  end_date: string;
  entry_fee: number;
  referee_fee_per_match: number;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
}

export const TournamentsManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado local o desde Zustand para el torneo activo
//   const [activeTournamentId, setActiveTournamentId] = useState<number | null>(
//     Number(localStorage.getItem('active_tournament_id')) || null
//   );

    const { setActiveTournament } = useTournamentStore();
    const isAdmin = useIsAdmin();

  useEffect(() => {
    fetchTournaments();
  }, []);

  // Carga los torneos del servidor y deja el torneo activo (el que está "en proceso") sincronizado
  // en el store, que es lo que lee el topbar y los demás módulos.
  // silent = true evita la pantalla de "Cargando..." cuando se recarga tras guardar un cambio.
  const fetchTournaments = async (silent = false): Promise<Tournament[] | null> => {
    try {
      if (!silent) setIsLoading(true);
      const response = await api.get('/api/tournaments');
      const list: Tournament[] = Array.isArray(response.data) ? response.data : response.data.data || [];
      setTournaments(list);
      setActiveTournament(list.find((t) => t.status === 'in_progress') ?? null);
      return list;
    } catch (err) {
      console.error('Error al cargar torneos', err);
      return null;
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

//   const handleSelectActive = async (id: number) => {
//     try {
//       // Opcional: Si tienes una ruta en Laravel para cambiar el torneo activo en BD
//       // await api.post(`/api/tournaments/${id}/set-active`);

//       // Guardamos localmente
//       localStorage.setItem('active_tournament_id', String(id));
//       setActiveTournamentId(id);
      
//       alert('¡Torneo seleccionado como activo exitosamente!');
//     } catch (err) {
//       alert('Error al seleccionar el torneo activo.');
//     }
//   };

  const handleCreateTournament = async (values: TournamentFormValues): Promise<boolean> => {
    try {
      const response = await api.post('/api/tournaments', {
        name: values.name,
        edition: values.edition,
        start_date: values.start_date,
        end_date: values.end_date,
        entry_fee: Number(values.entry_fee),
        referee_fee_per_match: Number(values.referee_fee_per_match),
        status: values.status,
      });

      // Laravel puede retornar el objeto directo o dentro de una llave 'tournament'
      const createdTournament = response.data.tournament || response.data;

      // Recargamos desde el servidor para que la lista y el torneo activo reflejen lo que realmente
      // quedó guardado (por ejemplo, si el backend completó el torneo que estaba en proceso).
      const list = await fetchTournaments(true);
      if (!list) {
        // Si no se pudo recargar, usamos la respuesta de la creación
        setTournaments([...tournaments, createdTournament]);
        if (createdTournament.status === 'in_progress') setActiveTournament(createdTournament);
      }

      setIsModalOpen(false);
      return true;
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear el torneo');
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12 text-slate-400">
        <p className="text-sm">Cargando ediciones de torneos...</p>
      </div>
    );
  }

  // Función auxiliar para renderizar la etiqueta del estado con colores profesionales
    const renderStatusBadge = (status: 'draft' | 'in_progress' | 'completed' | 'cancelled') => {
    switch (status) {
        case 'in_progress':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">En Proceso (Activo)</span>;
        case 'draft':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">Borrador</span>;
        case 'completed':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">Finalizado</span>;
        case 'cancelled':
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/30">Cancelado</span>;
        default:
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-slate-800 text-slate-300">Desconocido</span>;
    }
    };

    const handleUpdateStatus = async (id: number, newStatus: 'draft' | 'in_progress' | 'completed' | 'cancelled') => {
    // Acciones que cierran el torneo: pedimos confirmación
    if (newStatus === 'completed' || newStatus === 'cancelled') {
        const verb = newStatus === 'completed' ? 'completar' : 'cancelar';
        if (!window.confirm(`¿Seguro que deseas ${verb} este torneo? Esta acción no se puede deshacer fácilmente.`)) {
        return;
        }
    }

    try {
        // Petición PATCH al backend de Laravel
        const response = await api.patch(`/api/tournaments/${id}/status`, {
        status: newStatus
        });

        // Recargamos desde el servidor: la lista y el torneo activo (topbar) quedan con el estado real,
        // incluido el caso de completar o cancelar el torneo que estaba activo.
        await fetchTournaments(true);

        alert(response.data.message || '¡Estado actualizado con éxito!');
    } catch (err: any) {
        alert(err.response?.data?.message || 'Error al actualizar el estado del torneo.');
    }
    };

    // Función auxiliar para formatear fechas de YYYY-MM-DD a DD-MM-YYYY
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Por definir';
        const cleanDate = dateString.split('T')[0]; // Remueve la hora si la trae
        const [year, month, day] = cleanDate.split('-');
        return `${day}-${month}-${year}`;
    };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white">{isAdmin ? 'Gestión de Torneos (Ediciones)' : 'Mi Torneo'}</h2>
          <p className="text-sm text-slate-400">
            {isAdmin
              ? 'Administra los ciclos trimestrales, fechas y costos de inscripción por temporada.'
              : 'Aquí aparecen los torneos en los que tus equipos están inscritos.'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <span>➕</span> Crear Nueva Edición
          </button>
        )}
      </div>

      {tournaments.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-16">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-4 max-w-md w-full shadow-2xl">
            <div className="text-5xl">🏆</div>
            <h3 className="text-lg font-bold text-white">
              {isAdmin ? 'No hay torneos registrados' : 'Aún no estás inscrito en ningún torneo'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAdmin
                ? 'Crea la primera edición para comenzar.'
                : 'Cuando inscribas un equipo en un torneo, aparecerá aquí. Puedes hacerlo desde "Inscripción y Plantilla".'}
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition inline-flex items-center gap-2 mt-2"
              >
                <span>➕</span> Crear Torneo
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tournaments.map((t) => {
            const isActive = t.status === 'in_progress';
            const isCancelled = t.status === 'cancelled';
            const isCompleted = t.status === 'completed';
            
            return (
              <div 
                key={t.id} 
                className={`bg-slate-900 border rounded-2xl p-6 flex flex-col justify-between transition ${
                    isActive ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 
                    isCancelled ? 'border-red-500/30 opacity-75' : 
                    isCompleted ? 'border-blue-500/30 opacity-75' : 
                    'border-slate-800'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    {renderStatusBadge(t.status)}
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {isActive ? 'Torneo Activo' : (t.edition || 'Edición')}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">#{t.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{t.name}</h3>
                  <div className="space-y-1 text-xs text-slate-400">
                    <p>📅 Inicio: {t.start_date ? formatDate(t.start_date) : 'Por definir'}</p>
                    <p>🏁 Fin: {t.end_date ? formatDate(t.end_date) : 'Por definir'}</p>
                    <p>💵 Inscripción: ${t.entry_fee}</p>
                    <p>⚖️ Arbitraje p/juego: ${t.referee_fee_per_match}</p>
                  </div>
                </div>

                {/* <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                  <button
                    onClick={() => handleSelectActive(t.id)}
                    className={`text-xs font-bold transition ${
                      isActive ? 'text-emerald-400 cursor-default' : 'text-slate-400 hover:text-emerald-300'
                    }`}
                  >
                    {isActive ? '✓ Seleccionado como Activo' : 'Seleccionar como Activo →'}
                  </button>
                </div> */}
                
                {/* 2do edicion */}
                {/* <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                    {!isActive ? (
                    <button
                        onClick={() => handleSelectActive(t.id)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition"
                    >
                        Activar Torneo →
                    </button>
                    ) : (
                    <span className="text-xs text-emerald-400 font-bold">
                        ● Torneo Principal en Curso
                    </span>
                    )}
                </div> */}

                {/* 3era edicion: solo el admin gestiona el ciclo de vida del torneo */}
                {isAdmin && (
                <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        {/* Botón principal de activación */}
                        {t.status !== 'in_progress' && t.status !== 'completed' && t.status !== 'cancelled' && (
                        <button
                            onClick={() => handleUpdateStatus(t.id, 'in_progress')}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition mb-4"
                        >
                            Activar Torneo →
                        </button>
                        )}

                        {t.status === 'in_progress' && (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 mb-4">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse "></span>
                            Torneo Principal en Curso
                        </span>
                        )}

                        {/* Opciones adicionales para gestionar el ciclo de vida */}
                        <div className="flex items-center gap-2">
                        {t.status === 'in_progress' && (
                            <button
                            onClick={() => handleUpdateStatus(t.id, 'completed')}
                            className="text-[10px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-lg font-semibold transition"
                            >
                            Completar
                            </button>
                        )}
                        
                        {t.status !== 'cancelled' && t.status !== 'completed' && (
                            <button
                            onClick={() => handleUpdateStatus(t.id, 'cancelled')}
                            className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg font-semibold transition"
                            >
                            Cancelar
                            </button>
                        )}
                        </div>
                    </div>
                    </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Crear Torneo */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nueva Edición de Torneo"
        description="Define los parámetros generales para el campeonato."
        size="lg"
      >
        <TournamentForm onSubmit={handleCreateTournament} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};