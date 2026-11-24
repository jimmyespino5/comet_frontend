import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useTournamentStore } from '../store/useTournamentStore';
import { useIsAdmin } from '../hooks/useIsAdmin';
import type {
  CalendarData,
  CalendarGame,
  CalendarRound,
  RegistrationOption,
  TournamentOption,
} from '../types/calendar';
import { Button, Modal, PageHeader, Select } from '../components/ui';
import { RoundSection, roundTitle } from '../components/calendar/RoundSection';
import { RoundForm } from '../components/calendar/RoundForm';
import type { RoundPayload } from '../components/calendar/RoundForm';
import { GameForm } from '../components/calendar/GameForm';
import type { GamePayload } from '../components/calendar/GameForm';
import { ResultForm } from '../components/calendar/ResultForm';
import type { ResultPayload } from '../components/calendar/ResultForm';
import { GenerateForm } from '../components/calendar/GenerateForm';
import type { GeneratePayload } from '../components/calendar/GenerateForm';
import { GroupsManager } from '../components/calendar/GroupsManager';

export const CalendarManagement: React.FC = () => {
  const isAdmin = useIsAdmin();
  const { activeTournament } = useTournamentStore();

  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [tournamentId, setTournamentId] = useState<number | null>(null);
  const [calendar, setCalendar] = useState<CalendarData | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [groupFilter, setGroupFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [onlyMine, setOnlyMine] = useState(false);

  // Modales (solo admin)
  const [roundModal, setRoundModal] = useState<{ round: CalendarRound | null } | null>(null);
  const [gameModal, setGameModal] = useState<{ round: CalendarRound; game: CalendarGame | null } | null>(null);
  const [resultGame, setResultGame] = useState<CalendarGame | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(false);

  // ---------- Carga de datos ----------
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        // Admin: todos los torneos. Delegado: solo aquellos donde está inscrito.
        const response = await api.get('/api/tournaments');
        const list: TournamentOption[] = Array.isArray(response.data) ? response.data : response.data.data || [];
        setTournaments(list);

        const preferred =
          list.find((t) => t.id === activeTournament?.id) ?? list.find((t) => t.status === 'in_progress') ?? list[0];
        setTournamentId(preferred?.id ?? null);
        if (!preferred) setIsLoading(false);
      } catch (err) {
        console.error('Error al cargar torneos', err);
        setIsLoading(false);
      }
    };
    loadTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCalendar = useCallback(
    async (id: number) => {
      try {
        const response = await api.get(`/api/tournaments/${id}/calendar`);
        setCalendar(response.data);

        if (isAdmin) {
          // Para programar partidos y asignar grupos necesitamos todos los equipos inscritos
          const regs = await api.get('/api/tournament-registrations', { params: { tournament_id: id } });
          setRegistrations(regs.data);
        }
      } catch (err: any) {
        setCalendar(null);
        alert(err.response?.data?.message || 'No se pudo cargar el calendario.');
      } finally {
        setIsLoading(false);
      }
    },
    [isAdmin]
  );

  useEffect(() => {
    if (tournamentId === null) return;
    setIsLoading(true);
    setGroupFilter('all');
    setTeamFilter('all');
    setOnlyMine(false);
    loadCalendar(tournamentId);
  }, [tournamentId, loadCalendar]);

  const refresh = async () => {
    if (tournamentId !== null) await loadCalendar(tournamentId);
  };

  // Ejecuta una acción del admin, recarga el calendario y avisa si algo falla
  const run = async (action: () => Promise<unknown>, fallbackError: string): Promise<boolean> => {
    try {
      await action();
      await refresh();
      return true;
    } catch (err: any) {
      alert(err.response?.data?.message || fallbackError);
      return false;
    }
  };

  // ---------- Filtros ----------
  const mineIds = useMemo(() => new Set(calendar?.my_registration_ids ?? []), [calendar]);

  const teamOptions = useMemo(() => {
    const teams = new Map<number, string>();
    calendar?.rounds.forEach((round) =>
      round.games.forEach((game) => {
        teams.set(game.home_registration_id, game.home_registration.team.name);
        teams.set(game.away_registration_id, game.away_registration.team.name);
      })
    );
    return [...teams.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [calendar]);

  const filtersActive = groupFilter !== 'all' || teamFilter !== 'all' || onlyMine;

  const matchesFilters = (game: CalendarGame) => {
    if (groupFilter !== 'all' && String(game.group_id) !== groupFilter) return false;
    if (teamFilter !== 'all' && ![game.home_registration_id, game.away_registration_id].includes(Number(teamFilter))) {
      return false;
    }
    if (onlyMine && !mineIds.has(game.home_registration_id) && !mineIds.has(game.away_registration_id)) return false;
    return true;
  };

  // ---------- Acciones del admin ----------
  const togglePublish = (round: CalendarRound) =>
    run(
      () => api.post(`/api/rounds/${round.id}/${round.published_at ? 'unpublish' : 'publish'}`),
      'No se pudo cambiar la publicación de la jornada.'
    );

  const deleteRound = async (round: CalendarRound) => {
    if (!window.confirm(`¿Eliminar "${roundTitle(round)}" con todos sus partidos?`)) return;
    await run(() => api.delete(`/api/rounds/${round.id}`), 'No se pudo eliminar la jornada.');
  };

  const deleteGame = async (game: CalendarGame) => {
    const label = `${game.home_registration.team.name} vs ${game.away_registration.team.name}`;
    if (!window.confirm(`¿Eliminar el partido ${label}?`)) return;
    await run(() => api.delete(`/api/games/${game.id}`), 'No se pudo eliminar el partido.');
  };

  const publishAll = async () => {
    const pending = (calendar?.rounds ?? []).filter((r) => !r.published_at && r.games.length > 0);
    if (pending.length === 0) return;
    if (!window.confirm(`¿Publicar ${pending.length} jornada(s) en borrador? Los delegados las verán de inmediato.`)) return;

    await run(async () => {
      for (const round of pending) await api.post(`/api/rounds/${round.id}/publish`);
    }, 'No se pudieron publicar todas las jornadas.');
  };

  const saveRound = async (payload: RoundPayload): Promise<boolean> => {
    const editing = roundModal?.round;
    const ok = await run(
      () =>
        editing
          ? api.patch(`/api/rounds/${editing.id}`, payload)
          : api.post(`/api/tournaments/${tournamentId}/rounds`, payload),
      'No se pudo guardar la jornada.'
    );
    if (ok) setRoundModal(null);
    return ok;
  };

  const saveGame = async (payload: GamePayload): Promise<boolean> => {
    if (!gameModal) return false;
    const { round, game } = gameModal;
    const ok = await run(
      () => (game ? api.patch(`/api/games/${game.id}`, payload) : api.post(`/api/rounds/${round.id}/games`, payload)),
      'No se pudo guardar el partido.'
    );
    if (ok) setGameModal(null);
    return ok;
  };

  const saveResult = async (payload: ResultPayload): Promise<boolean> => {
    if (!resultGame) return false;
    const ok = await run(() => api.patch(`/api/games/${resultGame.id}/result`, payload), 'No se pudo guardar el resultado.');
    if (ok) setResultGame(null);
    return ok;
  };

  const generateCalendar = async (payload: GeneratePayload): Promise<boolean> => {
    let message = '';
    const ok = await run(async () => {
      const response = await api.post(`/api/tournaments/${tournamentId}/calendar/generate`, payload);
      message = response.data.message;
    }, 'No se pudo generar el calendario.');
    if (ok) {
      setGenerateOpen(false);
      alert(message);
    }
    return ok;
  };

  // ---------- Render ----------
  const rounds = calendar?.rounds ?? [];
  const groups = calendar?.groups ?? [];
  const hasDrafts = rounds.some((r) => !r.published_at);
  const publishableDrafts = rounds.some((r) => !r.published_at && r.games.length > 0);

  const adminActions = isAdmin && tournamentId !== null && (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={() => setGroupsOpen(true)}>
        👥 Grupos
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setGenerateOpen(true)}>
        ⚡ Generar calendario
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setRoundModal({ round: null })}>
        ➕ Nueva jornada
      </Button>
      {publishableDrafts && (
        <Button size="sm" onClick={publishAll}>
          Publicar todas
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAdmin ? 'Jornadas y Calendario' : 'Calendario de partidos'}
        description={
          isAdmin
            ? 'Prepara las jornadas completas y libéralas cuando quieras: los delegados solo ven las publicadas.'
            : 'Fechas, canchas y resultados del torneo en el que estás inscrito.'
        }
        action={adminActions || undefined}
      />

      {!isLoading && tournaments.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-2">
          <div className="text-4xl" aria-hidden="true">📅</div>
          <h3 className="text-lg font-bold text-white">
            {isAdmin ? 'Aún no hay torneos' : 'Aún no estás inscrito en ningún torneo'}
          </h3>
          <p className="text-xs text-slate-400">
            {isAdmin
              ? 'Crea un torneo para empezar a armar su calendario.'
              : 'Cuando inscribas un equipo en un torneo, su calendario aparecerá aquí.'}
          </p>
        </div>
      )}

      {tournaments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <Select
            label="Torneo"
            value={tournamentId ?? ''}
            onChange={(e) => setTournamentId(Number(e.target.value))}
          >
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.edition ? ` (${t.edition})` : ''}
              </option>
            ))}
          </Select>

          {groups.length > 0 && (
            <Select label="Grupo" value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
              <option value="all">Todos los grupos</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          )}

          {teamOptions.length > 0 && (
            <Select label="Equipo" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
              <option value="all">Todos los equipos</option>
              {teamOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
          )}

          {mineIds.size > 0 && (
            <label className="flex items-end pb-2.5 gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyMine}
                onChange={(e) => setOnlyMine(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500"
              />
              Solo mis partidos
            </label>
          )}
        </div>
      )}

      {isAdmin && hasDrafts && rounds.length > 0 && (
        <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
          Las jornadas en borrador solo las ves tú. Publícalas para que los delegados puedan verlas.
        </p>
      )}

      {isLoading && tournaments.length > 0 && (
        <div className="text-center text-slate-400 py-16 text-sm" role="status">
          Cargando calendario...
        </div>
      )}

      {!isLoading && calendar && rounds.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <div className="text-4xl" aria-hidden="true">🗓️</div>
          <h3 className="text-lg font-bold text-white">
            {isAdmin ? 'Este torneo todavía no tiene jornadas' : 'Aún no hay jornadas publicadas'}
          </h3>
          <p className="text-xs text-slate-400">
            {isAdmin
              ? 'Genera el calendario completo automáticamente o crea las jornadas una por una.'
              : 'El organizador publicará las jornadas a medida que estén listas.'}
          </p>
          {isAdmin && (
            <div className="flex justify-center gap-3 pt-2">
              <Button onClick={() => setGenerateOpen(true)}>⚡ Generar calendario</Button>
              <Button variant="secondary" onClick={() => setRoundModal({ round: null })}>
                ➕ Nueva jornada
              </Button>
            </div>
          )}
        </div>
      )}

      {!isLoading &&
        rounds.map((round) => {
          const games = round.games.filter(matchesFilters);
          if (filtersActive && games.length === 0) return null;

          return (
            <RoundSection
              key={round.id}
              round={round}
              games={games}
              mineIds={mineIds}
              canManage={isAdmin}
              onTogglePublish={togglePublish}
              onEditRound={(r) => setRoundModal({ round: r })}
              onDeleteRound={deleteRound}
              onAddGame={(r) => setGameModal({ round: r, game: null })}
              onEditGame={(r, g) => setGameModal({ round: r, game: g })}
              onResult={setResultGame}
              onDeleteGame={deleteGame}
            />
          );
        })}

      {/* ---------- Modales del admin ---------- */}
      <Modal
        open={!!roundModal}
        onClose={() => setRoundModal(null)}
        title={roundModal?.round ? 'Editar jornada' : 'Nueva jornada'}
        description="Las jornadas nuevas nacen como borrador."
      >
        {roundModal && <RoundForm round={roundModal.round} onSubmit={saveRound} onCancel={() => setRoundModal(null)} />}
      </Modal>

      <Modal
        open={!!gameModal}
        onClose={() => setGameModal(null)}
        title={gameModal?.game ? 'Editar partido' : 'Nuevo partido'}
        description={gameModal ? roundTitle(gameModal.round) : undefined}
        size="lg"
      >
        {gameModal && (
          <GameForm
            registrations={registrations}
            groups={groups}
            game={gameModal.game}
            onSubmit={saveGame}
            onCancel={() => setGameModal(null)}
          />
        )}
      </Modal>

      <Modal
        open={!!resultGame}
        onClose={() => setResultGame(null)}
        title="Resultado del partido"
        description={
          resultGame
            ? `${resultGame.home_registration.team.name} vs ${resultGame.away_registration.team.name}`
            : undefined
        }
      >
        {resultGame && <ResultForm game={resultGame} onSubmit={saveResult} onCancel={() => setResultGame(null)} />}
      </Modal>

      <Modal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        title="Generar calendario"
        description="Crea todas las jornadas y partidos de una vez."
        size="lg"
      >
        {generateOpen && (
          <GenerateForm hasGroups={groups.length > 0} onSubmit={generateCalendar} onCancel={() => setGenerateOpen(false)} />
        )}
      </Modal>

      <Modal
        open={groupsOpen}
        onClose={() => setGroupsOpen(false)}
        title="Grupos del torneo"
        description="Un torneo puede no tener grupos o tener varios. Los grupos se usan al generar el calendario y la tabla."
        size="lg"
      >
        {groupsOpen && tournamentId !== null && (
          <GroupsManager tournamentId={tournamentId} groups={groups} registrations={registrations} onChanged={refresh} />
        )}
      </Modal>
    </div>
  );
};
