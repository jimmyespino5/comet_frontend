import React, { useState } from 'react';
import { api } from '../../services/api';
import type { CalendarGroup, RegistrationOption } from '../../types/calendar';
import { Button, Input } from '../ui';

interface GroupsManagerProps {
  tournamentId: number;
  groups: CalendarGroup[];
  registrations: RegistrationOption[];
  /** Recarga calendario e inscripciones tras cada cambio */
  onChanged: () => Promise<void>;
}

/**
 * Grupos del torneo: crear, eliminar y asignar equipos.
 * Un torneo puede no tener grupos (todos contra todos) o tener varios.
 */
export const GroupsManager: React.FC<GroupsManagerProps> = ({ tournamentId, groups, registrations, onChanged }) => {
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<unknown>, fallbackError: string) => {
    setBusy(true);
    try {
      await action();
      await onChanged();
    } catch (err: any) {
      alert(err.response?.data?.message || fallbackError);
    } finally {
      setBusy(false);
    }
  };

  const addGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    await run(() => api.post(`/api/tournaments/${tournamentId}/groups`, { name }), 'No se pudo crear el grupo.');
    setNewName('');
  };

  const deleteGroup = async (group: CalendarGroup) => {
    if (!window.confirm(`¿Eliminar "${group.name}"? Sus equipos quedarán sin grupo.`)) return;
    await run(() => api.delete(`/api/groups/${group.id}`), 'No se pudo eliminar el grupo.');
  };

  const assign = (registration: RegistrationOption, value: string) =>
    run(
      () => api.patch(`/api/tournament-registrations/${registration.id}/group`, { group_id: value ? Number(value) : null }),
      'No se pudo asignar el grupo.'
    );

  const sorted = [...registrations].sort((a, b) => a.team.name.localeCompare(b.team.name));

  return (
    <div className="space-y-6">
      <form onSubmit={addGroup} className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            label="Nuevo grupo"
            placeholder="Ej. Grupo A"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <Button type="submit" loading={busy} disabled={!newName.trim()}>
          Agregar
        </Button>
      </form>

      {groups.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Grupos del torneo">
          {groups.map((group) => (
            <li
              key={group.id}
              className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-1 py-1 text-sm text-white"
            >
              {group.name}
              <button
                type="button"
                onClick={() => deleteGroup(group)}
                disabled={busy}
                aria-label={`Eliminar ${group.name}`}
                className="w-6 h-6 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Grupo de cada equipo</h4>
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-400">Aún no hay equipos inscritos en este torneo.</p>
        ) : (
          <ul className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
            {sorted.map((registration) => (
              <li key={registration.id} className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-950">
                <span className="text-sm text-white truncate">{registration.team.name}</span>
                <select
                  value={registration.group_id ?? ''}
                  disabled={busy || groups.length === 0}
                  onChange={(e) => assign(registration, e.target.value)}
                  aria-label={`Grupo de ${registration.team.name}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus:border-emerald-500"
                >
                  <option value="">Sin grupo</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
        {groups.length === 0 && sorted.length > 0 && (
          <p className="text-xs text-slate-400 mt-3">Crea al menos un grupo para poder asignar equipos.</p>
        )}
      </div>
    </div>
  );
};
