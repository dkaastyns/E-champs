# TanStack Query Custom Hooks Pattern

> **Rule File:** `/Users/gapi/Code/College/PSBD/e-champs/.agents/rules/custom-hooks.md`
> **Framework:** TanStack Query v5 (React Query)
> **Applies To:** All data fetching hooks in `/lib/hooks/`

---

## 1. File Organization

Hooks are organized into three files:

| File | Purpose | Example Hooks |
|------|---------|---------------|
| `queries.ts` | Read operations (GET requests) | `useTournaments`, `useTeams`, `useMatches` |
| `mutations.ts` | Write operations (POST/PUT/DELETE) | `useCreateTournament`, `useUpdateTournament`, `useDeleteTournament` |
| `index.ts` | Barrel exports | Re-exports all hooks from both files |

**File Structure:**
```
/lib/hooks/
├── queries.ts      # useQuery hooks
├── mutations.ts    # useMutation hooks
└── index.ts        # Barrel exports
```

**Export Pattern:**
```typescript
// /lib/hooks/index.ts
export * from './queries';
export * from './mutations';
```

---

## 2. Query Hooks Pattern (useQuery)

### 2.1 Basic Structure

```typescript
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { fetchTournaments, Tournament } from '@/lib/api';

export function useTournaments(
  options?: Omit<UseQueryOptions<Tournament[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.tournaments.list(),
    queryFn: fetchTournaments,
    ...options,
  });
}
```

### 2.2 With Parameters

```typescript
export function useMatches(
  tournamentId: string,
  options?: Omit<UseQueryOptions<Match[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.matches.list(tournamentId),
    queryFn: () => fetchMatches(tournamentId),
    enabled: !!tournamentId,  // Conditional fetching
    ...options,
  });
}
```

### 2.3 Query Hook Template

```typescript
export function use<EntityName>(
  [optionalParams: type],
  options?: Omit<UseQueryOptions<ReturnType, Error, ReturnType, QueryKey>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.[domain].[method]([params]),
    queryFn: () => fetchFunction([params]),
    enabled: [conditional],  // Optional: conditional fetching
    ...options,
  });
}
```

### 2.4 Key Principles

1. **Options Pattern**: Always accept `options` parameter with `Omit<UseQueryOptions, 'queryKey' | 'queryFn'>`
2. **Query Keys**: Import and use from `@/lib/query-keys`
3. **Conditional Fetching**: Use `enabled: !!param` when query depends on a value
4. **Arrow Functions**: Wrap `queryFn` in arrow function when passing parameters
5. **Error Type**: Use `Error` as the error type

---

## 3. Mutation Hooks Pattern (useMutation)

### 3.1 Basic Structure

```typescript
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { createTournament, CreateTournamentInput, Tournament } from '@/lib/api';

export function useCreateTournament(
  options?: Omit<UseMutationOptions<Tournament, Error, CreateTournamentInput>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: createTournament,
    ...options,
  });
}
```

### 3.2 With Object Parameters

```typescript
export function useUpdateTournament(
  options?: Omit<UseMutationOptions<Tournament, Error, { id: number; input: UpdateTournamentInput }>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: ({ id, input }) => updateTournament(id, input),
    ...options,
  });
}
```

### 3.3 Mutation Hook Template

```typescript
export function use<Action><Entity>(
  options?: Omit<UseMutationOptions<ReturnType, Error, Variables>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: [destructureVariables] ? ([callback]) : apiFunction,
    ...options,
  });
}
```

### 3.4 Key Principles

1. **Options Pattern**: Always accept `options` parameter with `Omit<UseMutationOptions, 'mutationFn'>`
2. **Destructuring**: When API takes multiple params, destructure in mutationFn
3. **Naming Convention**: `use[Action][Entity]` (e.g., `useCreateTournament`, `useDeleteTeam`)
4. **Cache Invalidation**: Handle in API functions, not hooks (see API pattern)

---

## 4. Query Key Factory Pattern

### 4.1 Structure

Query keys are defined in `/lib/query-keys.ts` using the factory pattern:

```typescript
export const queryKeys = {
  tournaments: {
    all: ['tournaments'] as const,
    list: () => [...queryKeys.tournaments.all, 'list'] as const,
    detail: (id: string | number) => [...queryKeys.tournaments.all, 'detail', id.toString()] as const,
  },
  teams: {
    all: ['teams'] as const,
    list: () => [...queryKeys.teams.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.teams.all, 'detail', id] as const,
    members: (teamId: number) => [...queryKeys.teams.all, 'members', teamId] as const,
  },
  matches: {
    all: ['matches'] as const,
    list: (tournamentId: string) => [...queryKeys.matches.all, 'list', { tournamentId }] as const,
  },
};
```

### 4.2 Usage in Hooks

```typescript
import { queryKeys } from '@/lib/query-keys';

// In queries.ts
queryKey: queryKeys.tournaments.list(),
queryKey: queryKeys.tournaments.detail(id),
queryKey: queryKeys.matches.list(tournamentId),
```

### 4.3 Key Principles

1. **Base Key**: Define `all` as the base array
2. **Spread Pattern**: Use `[...queryKeys.domain.all, 'method']` for consistency
3. **as const**: Always use `as const` for type inference
4. **Parameters**: Pass params as additional array elements or object
5. **Type Safety**: Convert numbers to strings for detail keys if needed

---

## 5. Type Safety with Generics

### 5.1 Query Types

```typescript
import { UseQueryOptions } from '@tanstack/react-query';

// Generic pattern
UseQueryOptions<
  Tournament[],      // TData: What the query returns
  Error,             // TError: Error type
  Tournament[],      // TQueryFnData: Transform output type (optional)
  ReturnType<typeof queryKeys.tournaments.list>  // TQueryKey: Query key type
>

// Omit pattern (most common)
Omit<UseQueryOptions<Tournament[], Error>, 'queryKey' | 'queryFn'>
```

### 5.2 Mutation Types

```typescript
import { UseMutationOptions } from '@tanstack/react-query';

// Generic pattern
UseMutationOptions<
  Tournament,                    // TData: Success return type
  Error,                         // TError: Error type
  CreateTournamentInput,         // TVariables: Input variables
  unknown                        // TContext: Context type (rarely used)
>

// Omit pattern
Omit<UseMutationOptions<Tournament, Error, CreateTournamentInput>, 'mutationFn'>
```

### 5.3 Import Types from API

Always import types from the API module:

```typescript
import {
  fetchTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
  Tournament,
  CreateTournamentInput,
  UpdateTournamentInput,
} from '@/lib/api';
```

---

## 6. Options Pattern for Flexibility

### 6.1 Why Options Pattern?

Allows consumers to override defaults while maintaining type safety:

```typescript
// Consumer can pass any query option except queryKey/queryFn
const { data, isLoading } = useTournaments({
  staleTime: 5000,
  refetchOnWindowFocus: false,
  onSuccess: (data) => console.log('Loaded:', data),
});
```

### 6.2 Implementation Rules

1. **Queries**: `options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>`
2. **Mutations**: `options?: Omit<UseMutationOptions<T, Error, V>, 'mutationFn'>`
3. **Spread**: Always spread `...options` AFTER required properties
4. **Override**: Required props before spread allows consumer override

---

## 7. Complete Code Examples

### 7.1 useTournaments Query Hook

```typescript
// /lib/hooks/queries.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { fetchTournaments, Tournament } from '@/lib/api';

export function useTournaments(
  options?: Omit<UseQueryOptions<Tournament[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.tournaments.list(),
    queryFn: fetchTournaments,
    ...options,
  });
}
```

### 7.2 useCreateTournament Mutation Hook

```typescript
// /lib/hooks/mutations.ts
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { createTournament, CreateTournamentInput, Tournament } from '@/lib/api';

export function useCreateTournament(
  options?: Omit<UseMutationOptions<Tournament, Error, CreateTournamentInput>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: createTournament,
    ...options,
  });
}
```

### 7.3 useUpdateTournament Mutation Hook

```typescript
// /lib/hooks/mutations.ts
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { updateTournament, UpdateTournamentInput, Tournament } from '@/lib/api';

export function useUpdateTournament(
  options?: Omit<UseMutationOptions<Tournament, Error, { id: number; input: UpdateTournamentInput }>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: ({ id, input }) => updateTournament(id, input),
    ...options,
  });
}
```

### 7.4 useDeleteTournament Mutation Hook

```typescript
// /lib/hooks/mutations.ts
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { deleteTournament } from '@/lib/api';

export function useDeleteTournament(
  options?: Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: deleteTournament,
    ...options,
  });
}
```

### 7.5 Query Keys Usage

```typescript
// /lib/query-keys.ts
export const queryKeys = {
  tournaments: {
    all: ['tournaments'] as const,
    list: () => [...queryKeys.tournaments.all, 'list'] as const,
    detail: (id: string | number) => [...queryKeys.tournaments.all, 'detail', id.toString()] as const,
  },
};

// In queries.ts
import { queryKeys } from '@/lib/query-keys';

// Usage:
queryKey: queryKeys.tournaments.list()           // ['tournaments', 'list']
queryKey: queryKeys.tournaments.detail(123)      // ['tournaments', 'detail', '123']
```

---

## 8. Usage in Components

### 8.1 Query Hook Usage

```typescript
import { useTournaments } from '@/lib/hooks';

function TournamentList() {
  const { data: tournaments, isLoading, error } = useTournaments({
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <ul>
      {tournaments?.map(t => (
        <li key={t.id}>{t.name}</li>
      ))}
    </ul>
  );
}
```

### 8.2 Mutation Hook Usage

```typescript
import { useCreateTournament } from '@/lib/hooks';

function CreateTournamentForm() {
  const createTournament = useCreateTournament({
    onSuccess: (data) => {
      console.log('Created:', data);
      // Router push, toast notification, etc.
    },
    onError: (error) => {
      console.error('Failed:', error.message);
    },
  });

  const handleSubmit = (input: CreateTournamentInput) => {
    createTournament.mutate(input);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={createTournament.isPending}>
        {createTournament.isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

### 8.3 Update Mutation Usage

```typescript
import { useUpdateTournament } from '@/lib/hooks';

function EditTournament({ tournament }: { tournament: Tournament }) {
  const updateTournament = useUpdateTournament();

  const handleUpdate = (input: UpdateTournamentInput) => {
    updateTournament.mutate({ id: tournament.id, input });
  };

  return <TournamentForm onSubmit={handleUpdate} />;
}
```

---

## 9. Cache Invalidation Pattern

Cache invalidation happens in API functions, not hooks. This ensures consistency:

```typescript
// /lib/api/tournaments.ts
import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';

export async function createTournament(input: CreateTournamentInput): Promise<Tournament> {
  const response = await fetch('/api/tournaments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to create tournament');
  }

  const data = await response.json();

  // Invalidate queries after successful mutation
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
    throw new Error('Failed to update tournament');
  }

  const data = await response.json();

  // Invalidate both list and detail
  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });
  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(id) });

  return data;
}
```

---

## 10. Checklist for Creating New Hooks

When creating a new custom hook, verify:

### Query Hooks
- [ ] Import from `@tanstack/react-query` and `@/lib/query-keys`
- [ ] Import types from `@/lib/api`
- [ ] Use `Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>` for options
- [ ] Use `queryKeys.[domain].[method]()` for queryKey
- [ ] Add `enabled: !!param` for conditional queries
- [ ] Spread `...options` after required properties
- [ ] Export from `/lib/hooks/index.ts`

### Mutation Hooks
- [ ] Import from `@tanstack/react-query` and `@/lib/api`
- [ ] Use `Omit<UseMutationOptions<T, Error, V>, 'mutationFn'>` for options
- [ ] Destructure variables in mutationFn when API takes multiple params
- [ ] Use `use[Action][Entity]` naming convention
- [ ] Spread `...options` after required properties
- [ ] Handle cache invalidation in API function, not hook
- [ ] Export from `/lib/hooks/index.ts`

### Query Keys
- [ ] Add to `/lib/query-keys.ts`
- [ ] Define `all: ['domain'] as const` as base
- [ ] Use spread pattern `[...queryKeys.domain.all, 'method']`
- [ ] Use `as const` for type inference
- [ ] Convert numbers to strings for detail keys if needed

---

## 11. Common Pitfalls to Avoid

1. **Don't invalidate queries in hooks** - Do it in API functions
2. **Don't forget `as const`** - Always type query keys properly
3. **Don't use `any` types** - Use proper generics for type safety
4. **Don't forget `enabled`** - Use for conditional queries
5. **Don't mutate queryKey in options** - It's excluded from options type
6. **Don't forget to export** - Add to `/lib/hooks/index.ts`

---

## Related Files

- `/lib/hooks/queries.ts` - Query hooks implementation
- `/lib/hooks/mutations.ts` - Mutation hooks implementation
- `/lib/hooks/index.ts` - Hook exports
- `/lib/query-keys.ts` - Query key factory
- `/lib/api/` - API functions
- `/lib/query-client.ts` - Query client configuration
