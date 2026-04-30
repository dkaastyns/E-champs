import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';

export interface Tournament {
  id: number;
  name: string;
  slug: string;
  description: string;
  maxTeams: number;
  teamSize: number;
  registrationFee: number;
  tournamentStartDate: string;
  tournamentEndDate: string;
  status: 'open' | 'closed' | 'ongoing' | 'completed';
  createdAt: string;
  team_count?: number;
}

export interface CreateTournamentInput {
  name: string;
  slug: string;
  description: string;
  maxTeams: number;
  teamSize: number;
  registrationFee: number;
  tournamentStartDate: string | null;
  tournamentEndDate: string | null;
}

export interface UpdateTournamentInput extends CreateTournamentInput {
  status: 'open' | 'closed' | 'ongoing' | 'completed';
}

export async function fetchTournaments(): Promise<Tournament[]> {
  const response = await fetch('/api/tournaments');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch tournaments');
  }
  
  return response.json();
}

export async function createTournament(input: CreateTournamentInput): Promise<Tournament> {
  const response = await fetch('/api/tournaments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create tournament');
  }
  
  const data = await response.json();

  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });

  return data;
}

export async function updateTournament(id: number, input: UpdateTournamentInput): Promise<Tournament> {
  const response = await fetch(`/api/tournaments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update tournament');
  }
  
  const data = await response.json();

  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });
  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(id) });

  return data;
}

export async function deleteTournament(id: number): Promise<void> {
  const response = await fetch(`/api/tournaments/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete tournament');
  }

  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });
}