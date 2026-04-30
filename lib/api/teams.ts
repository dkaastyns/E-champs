import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';

export interface Team {
  id: number;
  teamName: string;
  captainId: string;
  categoryId: number;
  contactEmail: string;
  contactPhone: string;
  paymentStatus: 'pending' | 'paid' | 'verified' | 'rejected';
  paymentProofUrl: string | null;
  isDeleted: boolean;
  deletedReason: string | null;
  createdAt: string;
  categoryName: string;
  categorySlug: string;
}

export interface TeamMember {
  id: number;
  teamId: number;
  userId: string | null;
  name: string;
  gameId: string;
  role: string;
  isCaptain: boolean;
  joinedAt: string;
}

export interface CreateTeamMemberInput {
  name: string;
  gameId: string;
  role: string;
}

export interface CreateTeamInput {
  teamName: string;
  categoryId: number;
  members: CreateTeamMemberInput[];
  contactEmail: string;
  contactPhone: string;
  paymentProofUrl?: string;
}

export async function fetchTeams(categoryId?: string): Promise<Team[]> {
  const url = categoryId 
    ? `/api/teams?category=${categoryId}` 
    : '/api/teams';
    
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch teams');
  }
  
  return response.json();
}

export async function createTeam(input: CreateTeamInput): Promise<Team> {
  const response = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create team');
  }
  
  const data = await response.json();

  queryClient.invalidateQueries({ queryKey: queryKeys.teams.list() });

  return data;
}

export async function withdrawTeam(teamId: number, reason?: string): Promise<void> {
  const queryParams = reason 
    ? `?id=${teamId}&reason=${encodeURIComponent(reason)}` 
    : `?id=${teamId}`;
    
  const response = await fetch(`/api/teams${queryParams}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to withdraw team');
  }

  queryClient.invalidateQueries({ queryKey: queryKeys.teams.list() });
}

export async function deleteTeam(teamId: number, hard?: boolean): Promise<void> {
  const queryParams = hard 
    ? `?id=${teamId}&hard=true` 
    : `?id=${teamId}`;
    
  const response = await fetch(`/api/teams${queryParams}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete team');
  }

  queryClient.invalidateQueries({ queryKey: queryKeys.teams.list() });
}

export async function fetchTeamMembers(teamId: number): Promise<TeamMember[]> {
  const response = await fetch(`/api/teams/${teamId}/members`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch team members');
  }
  
  return response.json();
}

export async function fetchTeamMemberCount(teamId: number): Promise<number> {
  const response = await fetch(`/api/teams/${teamId}/members?count=true`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch team member count');
  }
  
  const data = await response.json();
  return data.count;
}