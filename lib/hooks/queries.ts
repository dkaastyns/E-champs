import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { fetchTeams, fetchTournaments, fetchMatches, fetchTeamMembers, Team, Tournament, Match, TeamMember } from '@/lib/api';

export function useTeams(tournamentId?: string, options?: Omit<UseQueryOptions<Team[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.teams.list(),
    queryFn: () => fetchTeams(tournamentId),
    ...options,
  });
}

export function useTeamMembers(teamId: number, options?: Omit<UseQueryOptions<TeamMember[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.teams.members(teamId),
    queryFn: () => fetchTeamMembers(teamId),
    enabled: !!teamId,
    ...options,
  });
}

export function useTournaments(options?: Omit<UseQueryOptions<Tournament[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.tournaments.list(),
    queryFn: fetchTournaments,
    ...options,
  });
}

export function useMatches(tournamentId: string, options?: Omit<UseQueryOptions<Match[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.matches.list(tournamentId),
    queryFn: () => fetchMatches(tournamentId),
    enabled: !!tournamentId,
    ...options,
  });
}