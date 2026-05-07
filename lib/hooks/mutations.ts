import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import {
  createTeam,
  withdrawTeam,
  deleteTeam,
  markTeamAsPaid,
  createTournament,
  updateTournament,
  deleteTournament,
  promoteUser,
  banUser,
  recordMatchResult,
  generateBracket,
  CreateTeamInput,
  Team,
  CreateTournamentInput,
  UpdateTournamentInput,
  Tournament,
  RecordMatchResultInput,
  RecordMatchResultResponse,
  GenerateBracketInput,
  GenerateBracketResponse,
} from '@/lib/api';

export function useCreateTeam(options?: Omit<UseMutationOptions<Team, Error, CreateTeamInput>, 'mutationFn'>) {
  return useMutation({
    mutationFn: createTeam,
    ...options,
  });
}

export function useWithdrawTeam(options?: Omit<UseMutationOptions<void, Error, { teamId: number; reason?: string }>, 'mutationFn'>) {
  return useMutation({
    mutationFn: ({ teamId, reason }) => withdrawTeam(teamId, reason),
    ...options,
  });
}

export function useDeleteTeam(options?: Omit<UseMutationOptions<void, Error, { teamId: number; hard?: boolean }>, 'mutationFn'>) {
  return useMutation({
    mutationFn: ({ teamId, hard }) => deleteTeam(teamId, hard),
    ...options,
  });
}

export function useCreateTournament(options?: Omit<UseMutationOptions<Tournament, Error, CreateTournamentInput>, 'mutationFn'>) {
  return useMutation({
    mutationFn: createTournament,
    ...options,
  });
}

export function useUpdateTournament(options?: Omit<UseMutationOptions<Tournament, Error, { id: number; input: UpdateTournamentInput }>, 'mutationFn'>) {
  return useMutation({
    mutationFn: ({ id, input }) => updateTournament(id, input),
    ...options,
  });
}

export function useDeleteTournament(options?: Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>) {
  return useMutation({
    mutationFn: deleteTournament,
    ...options,
  });
}

export function usePromoteUser(options?: Omit<UseMutationOptions<void, Error, { userId: string; role: 'user' | 'admin' }>, 'mutationFn'>) {
  return useMutation({
    mutationFn: ({ userId, role }) => promoteUser(userId, role),
    ...options,
  });
}

export function useBanUser(options?: Omit<UseMutationOptions<void, Error, { userId: string; banned: boolean; banReason?: string }>, 'mutationFn'>) {
  return useMutation({
    mutationFn: ({ userId, banned, banReason }) => banUser(userId, banned, banReason),
    ...options,
  });
}

export function useRecordMatchResult(options?: Omit<UseMutationOptions<RecordMatchResultResponse, Error, RecordMatchResultInput>, 'mutationFn'>) {
  return useMutation({
    mutationFn: recordMatchResult,
    ...options,
  });
}

export function useGenerateBracket(options?: Omit<UseMutationOptions<GenerateBracketResponse, Error, GenerateBracketInput>, 'mutationFn'>) {
  return useMutation({
    mutationFn: generateBracket,
    ...options,
  });
}

export function useMarkTeamAsPaid(options?: Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>) {
  return useMutation({
    mutationFn: markTeamAsPaid,
    ...options,
  });
}