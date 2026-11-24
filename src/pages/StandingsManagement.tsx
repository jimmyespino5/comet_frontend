import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useTournamentPicker } from '../hooks/useTournamentPicker';
import type { StandingRow, StandingsData } from '../types/standings';
import { TIEBREAKERS } from '../constants/tiebreakers';
import { Button, Modal, PageHeader, Select } from '../components/ui';
import { StandingsTable } from '../components/standings/StandingsTable';
import { RulesForm } from '../components/standings/RulesForm';
import type { RulesPayload } from '../components/standings/RulesForm';
import { TieBreakForm } from '../components/standings/TieBreakForm';

type TieScope = 'group' | 'wildcard';

interface TieItem {
  key: string;
  label: string;
  scope: TieScope;
  rows: StandingRow[];
}

export const StandingsManagement: React.FC = () => {
  const isAdmin = useIsAdmin();
  const { tournaments, tournamentId, setTournamentId, isLoadingList } = useTournamentPicker();

  const [data, setData] = useState<StandingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [tieModal, setTieModal] = useState<TieItem | null>(null);

  const loadStandings = useCallback(async (id: number) => {
    try {
      const response = await api.get(`/api/tournaments/${id}/standings`);
      setData(response.data);
    } catch (err: any) {
      setData(null);
      alert(err.response?.data?.message || 'No se pudo cargar la tabla de posiciones.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tournamentId === null) {
      if (!isLoadingList) setIsLoading(false);
      return;
    }
    setIsLoading(true);
    loadStandings(tournamentId);
  }, [tournamentId, isLoadingList, loadStandings]);

  const refresh = async () => {
    if (tournamentId !== null) await loadStandings(tournamentId);
  };

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

  // ---------- Datos derivados ----------
  const mineIds = useMemo(() => new Set(data?.my_registration_ids ?? []), [data]);

  // Empates que las reglas no resuelven (agrupados por tie_group)
  const ties = useMemo<TieItem[]>(() => {
    const found: TieItem[] = [];

    const collect = (rows: StandingRow[], scope: TieScope, prefix: string) => {
      const byTie = new Map<number, StandingRow[]>();
      rows.forEach((row) => {
        if (row.tie_group !== null) byTie.set(row.tie_group, [...(byTie.get(row.tie_group) ?? []), row]);
      });
      byTie.forEach((tieRows, id) =>
        found.push({
          key: `${scope}-${id}`,
          scope,
          rows: tieRows,
          label: `${prefix}: ${tieRows.map((r) => r.team.name).join(', ')}`,
        })
      );
    };

    data?.tables.forEach((table) => collect(table.rows, 'group', table.group?.name ?? 'Tabla'));
    if (data?.wildcards) collect(data.wildcards.rows, 'wildcard', `Mejores ${data.wildcards.position}.º`);

    return found;
  }, [data]);

  // ---------- Acciones del admin ----------
  const saveRules = async (payload: RulesPayload): Promise<boolean> => {
    const ok = await run(() => api.patch(`/api/tournaments/${tournamentId}/rules`, payload), 'No se pudieron guardar las reglas.');
    if (ok) setRulesOpen(false);
    return ok;
  };

  const saveTieOrder = async (registrationIds: number[], clear: boolean): Promise<boolean> => {
    if (!tieModal) return false;
    const ok = await run(
      () =>
        api.put(`/api/tournaments/${tournamentId}/tiebreak-order`, {
          registration_ids: registrationIds,
          scope: tieModal.scope,
          clear,
        }),
      'No se pudo guardar el orden.'
    );
    if (ok) setTieModal(null);
    return ok;
  };

  const clearManual = async (rows: StandingRow[], scope: TieScope) => {
    if (!window.confirm('¿Quitar el orden manual de estos equipos? Volverán a ordenarse solo con las reglas del torneo.')) return;
    await run(
      () =>
        api.put(`/api/tournaments/${tournamentId}/tiebreak-order`, {
          registration_ids: rows.map((r) => r.registration_id),
          scope,
          clear: true,
        }),
      'No se pudo quitar el orden manual.'
    );
  };

  // ---------- Render ----------
  const tournament = data?.tournament;
  const tables = data?.tables ?? [];
  const hasGroups = tables.some((t) => t.group !== null) || tables.length > 1;
  const showFairPlay = !!tournament?.tiebreakers.includes('fair_play');
  const noResultsYet = tables.every((t) => t.rows.every((r) => r.played === 0));
  const provisional = tables.some((t) => !t.is_final);

  const rulesSummary = tournament
    ? [
        hasGroups ? `Clasifican ${tournament.advance_per_group} por grupo` : `Clasifican los ${tournament.advance_per_group} primeros`,
        tournament.wildcard_count > 0 && data?.wildcards
          ? ` más los ${tournament.wildcard_count} mejores ${tournament.advance_per_group + 1}.º`
          : '',
        `. Desempate: Puntos`,
        ...tournament.tiebreakers.map((key) => ` → ${TIEBREAKERS[key].label}`),
        '.',
      ].join('')
    : '';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tablas de posiciones"
        description={
          isAdmin
            ? 'Se calculan solas con los partidos finalizados y publicados, según las reglas de cada torneo.'
            : 'Posiciones y clasificación del torneo en el que estás inscrito.'
        }
        action={
          isAdmin && tournament ? (
            <Button variant="secondary" size="sm" onClick={() => setRulesOpen(true)}>
              ⚙️ Reglas del torneo
            </Button>
          ) : undefined
        }
      />

      {!isLoadingList && tournaments.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-2">
          <div className="text-4xl" aria-hidden="true">🏆</div>
          <h3 className="text-lg font-bold text-white">
            {isAdmin ? 'Aún no hay torneos' : 'Aún no estás inscrito en ningún torneo'}
          </h3>
          <p className="text-xs text-slate-400">Cuando haya un torneo con partidos jugados, su tabla aparecerá aquí.</p>
        </div>
      )}

      {tournaments.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl sm:max-w-sm">
          <Select label="Torneo" value={tournamentId ?? ''} onChange={(e) => setTournamentId(Number(e.target.value))}>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.edition ? ` (${t.edition})` : ''}
              </option>
            ))}
          </Select>
        </div>
      )}

      {isLoading && tournaments.length > 0 && (
        <div className="text-center text-slate-400 py-16 text-sm" role="status">
          Calculando posiciones...
        </div>
      )}

      {!isLoading && data && (
        <>
          <p className="text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-xl p-3">{rulesSummary}</p>

          {(noResultsYet || provisional) && (
            <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              {noResultsYet
                ? 'Todavía no hay resultados publicados: la tabla se irá llenando a medida que se finalicen los partidos.'
                : 'Posiciones provisionales: aún hay partidos por jugar o resultados sin publicar.'}
            </p>
          )}

          {isAdmin && ties.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
              <p className="text-sm text-red-300 font-semibold">
                ⚠️ {ties.length === 1 ? 'Hay un empate' : `Hay ${ties.length} empates`} que las reglas no resuelven. Defínelos
                manualmente:
              </p>
              <div className="flex flex-wrap gap-2">
                {ties.map((tie) => (
                  <Button key={tie.key} size="sm" variant="secondary" onClick={() => setTieModal(tie)}>
                    {tie.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {!isAdmin && ties.length > 0 && (
            <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              ⚠️ Hay equipos empatados que el organizador aún debe definir.
            </p>
          )}

          {tables.length === 0 && (
            <p className="text-sm text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
              Aún no hay equipos inscritos en este torneo.
            </p>
          )}

          <div className="space-y-6">
            {tables.map((table) => {
              const manualRows = table.rows.filter((r) => r.manual);

              return (
                <StandingsTable
                  key={table.group?.id ?? 'general'}
                  title={table.group?.name ?? (tables.length > 1 ? 'Sin grupo' : 'Tabla general')}
                  subtitle={table.is_final ? 'Fase finalizada' : 'Posiciones provisionales'}
                  rows={table.rows}
                  mineIds={mineIds}
                  showFairPlay={showFairPlay}
                  actions={
                    isAdmin && manualRows.length > 0 ? (
                      <Button size="sm" variant="ghost" onClick={() => clearManual(manualRows, 'group')}>
                        ✋ Quitar orden manual
                      </Button>
                    ) : undefined
                  }
                />
              );
            })}

            {data.wildcards && (
              <StandingsTable
                title={`Mejores ${data.wildcards.position}.º`}
                subtitle={`Clasifican los ${data.wildcards.count} mejores. ${
                  data.wildcards.is_final ? 'Fase finalizada' : 'Posiciones provisionales'
                }`}
                rows={data.wildcards.rows}
                mineIds={mineIds}
                showFairPlay={showFairPlay}
                showGroupColumn
                actions={
                  isAdmin && data.wildcards.rows.some((r) => r.manual) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        clearManual(
                          data.wildcards!.rows.filter((r) => r.manual),
                          'wildcard'
                        )
                      }
                    >
                      ✋ Quitar orden manual
                    </Button>
                  ) : undefined
                }
              />
            )}
          </div>

          {/* Leyenda */}
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400" aria-label="Leyenda">
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" aria-hidden="true" /> Clasifica
            </li>
            {data.wildcards && (
              <>
                <li className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-blue-500" aria-hidden="true" /> Clasifica como mejor{' '}
                  {data.wildcards.position}.º
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-amber-500/70" aria-hidden="true" /> {data.wildcards.position}.º que hoy
                  quedaría fuera
                </li>
              </>
            )}
            <li className="flex items-center gap-2">
              <span aria-hidden="true">⚠️</span> Empate sin resolver
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true">✋</span> Orden definido manualmente
            </li>
          </ul>
        </>
      )}

      {/* ---------- Modales del admin ---------- */}
      <Modal
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        title="Reglas del torneo"
        description="Cada torneo puede tener sus propias reglas de clasificación y desempate."
        size="lg"
      >
        {rulesOpen && tournament && (
          <RulesForm
            initial={{
              advance_per_group: tournament.advance_per_group,
              wildcard_count: tournament.wildcard_count,
              tiebreakers: tournament.tiebreakers,
            }}
            hasGroups={hasGroups}
            onSubmit={saveRules}
            onCancel={() => setRulesOpen(false)}
          />
        )}
      </Modal>

      <Modal
        open={!!tieModal}
        onClose={() => setTieModal(null)}
        title="Definir empate"
        description={tieModal?.label}
      >
        {tieModal && <TieBreakForm rows={tieModal.rows} onSubmit={saveTieOrder} onCancel={() => setTieModal(null)} />}
      </Modal>
    </div>
  );
};
