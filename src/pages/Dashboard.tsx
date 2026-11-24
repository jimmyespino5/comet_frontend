import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { TeamsManagement } from './TeamsManagement';
import { TournamentsManagement } from './TournamentsManagement';
import { TeamTournamentManager } from './TeamTournamentManager';
import { CalendarManagement } from './CalendarManagement';
import { StandingsManagement } from './StandingsManagement';
import { api } from '../services/api';
import { useTournamentStore } from '../store/useTournamentStore';

type Tab = 'overview' | 'teams' | 'matches' | 'standings' | 'finances' | 'tournaments' | 'registration';

// Fuente única de la navegación: la usan el sidebar de escritorio, el menú móvil y el título del topbar
const NAV_ITEMS: { id: Tab; label: string; title: string; icon: string }[] = [
  { id: 'overview', label: 'Resumen General', title: 'Panel de Control', icon: '📊' },
  { id: 'tournaments', label: 'Gestión de Torneos', title: 'Gestión de Torneos', icon: '🏆' },
  { id: 'registration', label: 'Inscripción y Plantilla', title: 'Inscripción y Plantilla', icon: '📝' },
  { id: 'teams', label: 'Equipos y Jugadores', title: 'Equipos y Plantillas', icon: '🛡️' },
  { id: 'matches', label: 'Jornadas y Calendario', title: 'Jornadas y Partidos', icon: '📅' },
  { id: 'standings', label: 'Tablas y Goleadores', title: 'Posiciones y Goleadores', icon: '🏆' },
  { id: 'finances', label: 'Deudas, Multas y Pagos', title: 'Control Financiero', icon: '💳' },
];

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { activeTournament, setActiveTournament } = useTournamentStore();
  
  useEffect(() => {
    const fetchActiveTournament = async () => {
      try {
        const response = await api.get('/api/tournaments');
        const tournaments = Array.isArray(response.data) ? response.data : response.data.data || [];
        
        // Buscamos el que esté en progreso (in_progress)
        const current = tournaments.find((t: any) => t.status === 'in_progress');
        setActiveTournament(current || null);
      } catch (err) {
        console.error('Error al sincronizar el torneo activo', err);
      }
    };

    fetchActiveTournament();
  }, [setActiveTournament]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  // KPIs Financieros y Deportivos combinados
  const stats = [
    { title: 'Equipos Activos', value: '16', sub: 'Categoría Libre', icon: '🛡️', color: 'text-emerald-400 bg-emerald-500/10' },
    { title: 'Jornada Actual', value: 'Jornada 5', sub: 'De 15 totales', icon: '📅', color: 'text-blue-400 bg-blue-500/10' },
    { title: 'Goles Anotados', value: '142', sub: 'Prom. 5.07 p/p', icon: '⚽', color: 'text-purple-400 bg-purple-500/10' },
    { title: 'Saldo Pendiente (Deudas)', value: '$340', sub: 'Inscripciones y multas', icon: '⚠️', color: 'text-amber-400 bg-amber-500/10' },
  ];

  const upcomingMatches = [
    { id: 1, home: 'Deportivo 5 de Julio', away: 'Real Esppor', time: '18:00 - Cancha Principal', jornada: 'Jornada 5' },
    { id: 2, home: 'Academia Futsal', away: 'Leones de Caracas', time: '19:30 - Cancha Principal', jornada: 'Jornada 5' },
  ];

  // Alertas rápidas de disciplina y finanzas
  const pendingDebtsAlerts = [
    { team: 'Real Esppor', concept: 'Deuda pendiente de Inscripción', amount: '$120', status: 'Crítico' },
    { team: 'Leones de Caracas', concept: 'Multa por tarjetas acumuladas (J4)', amount: '$40', status: 'Pendiente' },
    { team: 'Futsal Club Altamira', concept: 'Pago parcial arbitraje J3', amount: '$30', status: 'Pendiente' },
  ];

  //const activeTournament = tournaments.find(t => t.status === 'in_progress');
  //const { user } = useAuthStore();
  const isAdmin = useIsAdmin();
  
  // Para el delegado, "Gestión de Torneos" es "Mi Torneo": solo ve donde está inscrito
  const labelOf = (item: (typeof NAV_ITEMS)[number]) => (!isAdmin && item.id === 'tournaments' ? 'Mi Torneo' : item.label);
  const titleOf = (item: (typeof NAV_ITEMS)[number]) => (!isAdmin && item.id === 'tournaments' ? 'Mi Torneo' : item.title);
  const currentItem = NAV_ITEMS.find((item) => item.id === activeTab);

  const goTo = (tab: Tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  // Contenido del sidebar: se reutiliza en escritorio y en el drawer móvil
  const renderSidebar = () => (
    <>
      <div>
        {/* Logo / Título */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            ⚽
          </div>
          <span className="font-bold text-white tracking-wide">Futsal Manager</span>
        </div>
        <div className="px-6 pt-4">
          <span className="text-xs text-slate-400">
            {isAdmin ? '🛡️ Vista de Administrador (Todos los equipos)' : '👤 Vista de Delegado (Tus equipos)'}
          </span>
        </div>

        {/* Menú de Opciones */}
        <nav className="p-4 space-y-1.5" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => goTo(item.id)}
              aria-current={activeTab === item.id ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                activeTab === item.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {labelOf(item)}
            </button>
          ))}
        </nav>
      </div>

      {/* Zona inferior del sidebar */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <span aria-hidden="true">🚪</span> Cerrar Sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">

      {/* Sidebar de escritorio */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col justify-between">
        {renderSidebar()}
      </aside>

      {/* Menú móvil (drawer) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menú de navegación">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 max-w-[85vw] bg-slate-900 border-r border-slate-800 flex flex-col justify-between overflow-y-auto">
            {renderSidebar()}
          </aside>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-16 bg-slate-900/50 backdrop-blur border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-20">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={isMenuOpen}
              className="md:hidden p-2 -ml-2 rounded-lg text-slate-300 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </button>

            <h1 className="text-lg font-bold text-white hidden md:block">
              {currentItem ? titleOf(currentItem) : ''}
            </h1>

            {/* Torneo activo */}
            <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 px-3 sm:px-4 py-2 rounded-xl min-w-0">
              <span className="w-2.5 h-2.5 shrink-0 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none"></span>
              <div className="text-xs min-w-0">
                <span className="text-slate-400 font-medium hidden sm:inline">Torneo Activo: </span>
                <span className="text-white font-bold truncate inline-block max-w-[9rem] sm:max-w-none align-bottom">
                  {activeTournament ? `${activeTournament.name} (${activeTournament.edition})` : 'Ninguno seleccionado'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white">{user?.name || 'Administrador'}</p>
              <p className="text-xs text-slate-400">{user?.email || 'admin@futsal.com'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-600 font-bold text-white flex items-center justify-center border-2 border-emerald-400/30">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
          </div>
        </header>

        {/* Área Dinámica de Contenido */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto flex flex-col">
          
          {/* Vista: Resumen General */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
            <>
              {/* Tarjetas de Estadísticas Principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((stat, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {stat.title}
                      </span>
                      <div className={`p-2.5 rounded-xl ${stat.color} font-bold text-base`}>
                        {stat.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-extrabold text-white mb-1">{stat.value}</h3>
                      <p className="text-xs text-slate-400 font-medium">{stat.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid Central: Partidos y Alertas Financieras/Disciplinarias */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Próximos Partidos (2 Columnas) */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-white">Próximos Encuentros (Jornada Actual)</h2>
                    <button 
                      onClick={() => setActiveTab('matches')} 
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      Ver calendario completo →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {upcomingMatches.map((match) => (
                      <div key={match.id} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 mb-1.5 uppercase">
                            {match.jornada}
                          </span>
                          <div className="flex items-center gap-2 text-white font-semibold text-sm">
                            <span>{match.home}</span>
                            <span className="text-slate-500 font-normal">vs</span>
                            <span>{match.away}</span>
                          </div>
                        </div>
                        <div className="text-xs text-slate-400 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 text-center">
                          ⏰ {match.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumen de Deudas y Multas Activas (1 Columna) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-white">Alertas de Deudas</h2>
                      <button 
                        onClick={() => setActiveTab('finances')} 
                        className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                      >
                        Gestionar →
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">Equipos con saldos pendientes por inscripción, arbitraje o multas por tarjetas.</p>

                    <div className="space-y-3">
                      {pendingDebtsAlerts.map((debt, index) => (
                        <div key={index} className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-white">{debt.team}</span>
                            <span className="text-xs font-extrabold text-amber-400">{debt.amount}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">{debt.concept}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                    <span className="text-[11px] text-slate-500">Módulo Financiero y Disciplinario Activo</span>
                  </div>
                </div>

              </div>
            </>
            </div>
          )}

          {activeTab === 'tournaments' && <TournamentsManagement />}
          {activeTab === 'teams' && <TeamsManagement />}
          {activeTab === 'registration' && <TeamTournamentManager />}
          {activeTab === 'matches' && <CalendarManagement />}
          {activeTab === 'standings' && <StandingsManagement />}

          {/* Placeholder solo para los módulos que aún no existen */}
          {['finances'].includes(activeTab) && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
              <div className="text-4xl mb-3">
                {activeTab === 'teams' && '🛡️'}
                {activeTab === 'matches' && '📅'}
                {activeTab === 'standings' && '🏆'}
                {activeTab === 'finances' && '💳'}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                {activeTab === 'teams' && 'Módulo de Equipos y Plantillas de Jugadores'}
                {activeTab === 'matches' && 'Módulo de Jornadas, Calendario y Resultados'}
                {activeTab === 'standings' && 'Módulo de Tabla de Posiciones y Goleadores'}
                {activeTab === 'finances' && 'Módulo de Tesorería, Inscripciones, Multas y Tarjetas'}
              </h3>
              <p className="text-sm text-slate-400 mb-5">
                Esta sección estará conectada directamente a las tablas de tu base de datos en Laravel para el control exhaustivo del torneo.
              </p>
              <button
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-sm rounded-xl hover:bg-emerald-400 transition"
              >
                Volver al Resumen General
              </button>
            </div>
          )}

        </main>
      </div>

    </div>
  );
};