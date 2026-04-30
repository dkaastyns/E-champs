export const queryKeys = {
  teams: {
    all: ['teams'] as const,
    list: () => [...queryKeys.teams.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.teams.all, 'detail', id] as const,
    members: (teamId: number) => [...queryKeys.teams.all, 'members', teamId] as const,
  },
  tournaments: {
    all: ['tournaments'] as const,
    list: () => [...queryKeys.tournaments.all, 'list'] as const,
    detail: (id: string | number) => [...queryKeys.tournaments.all, 'detail', id.toString()] as const,
  },
  matches: {
    all: ['matches'] as const,
    list: (tournamentId: string) => [...queryKeys.matches.all, 'list', { tournamentId }] as const,
  },
  users: {
    all: ['users'] as const,
    list: () => [...queryKeys.users.all, 'list'] as const,
  },
  brackets: {
    all: ['brackets'] as const,
    generate: () => [...queryKeys.brackets.all, 'generate'] as const,
  },
};
