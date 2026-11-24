import { create } from 'zustand';

interface Tournament {
  id: number;
  name: string;
  edition: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
}

interface TournamentState {
  activeTournament: Tournament | null;
  setActiveTournament: (tournament: Tournament | null) => void;
}

export const useTournamentStore = create<TournamentState>((set) => ({
  activeTournament: null,
  setActiveTournament: (tournament) => set({ activeTournament: tournament }),
}));