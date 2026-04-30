# Cache Invalidation and Query Key Patterns

> **Quick Reference for AI Agents working with TanStack Query caching**

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Query Key Factory Pattern](#query-key-factory-pattern)
3. [Naming Conventions](#naming-conventions)
4. [List vs Detail Query Keys](#list-vs-detail-query-keys)
5. [Parameterized Query Keys](#parameterized-query-keys)
6. [Invalidation Patterns](#invalidation-patterns)
7. [Query Key Composition](#query-key-composition)
8. [Common Patterns and Examples](#common-patterns-and-examples)
9. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## Architecture Overview

This codebase uses a **manual cache invalidation** pattern in the API layer:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Hooks   │────▶│   API Functions │────▶│  Query Client   │
│   (useQuery)    │     │  (with invalidation)│    │  (invalidate)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   HTTP API      │
                        └─────────────────┘
```

**Key Principles:**
- Query keys are centralized in `/lib/query-keys.ts`
- Cache invalidation happens in API functions after mutations
- Use `as const` assertions for type safety
- Invalidation is explicit and manual

---

## Query Key Factory Pattern

### File Location
All query keys are defined in: `/lib/query-keys.ts`

### Factory Structure

```typescript
export const queryKeys = {
  [entity]: {
    all: ['entityName'] as const,
    list: () => [...queryKeys.entity.all, 'list'] as const,
    detail: (id: string | number) => [...queryKeys.entity.all, 'detail', id.toString()] as const,
    // Additional specialized keys...
  }
};
```

### Existing Query Keys

```typescript
// /lib/query-keys.ts
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
```

---

## Naming Conventions

### Query Key Segments

| Segment | Purpose | Example |
|---------|---------|---------|
| `all` | Base array for the entity | `['teams']` |
| `list` | All items of that entity | `['teams', 'list']` |
| `detail` | Single item by ID | `['teams', 'detail', '123']` |
| Specific | Entity-specific data | `['teams', 'members', 456]` |

### Type Safety
Always use `as const` assertion:

```typescript
// ✅ Good - Type-safe and immutable
all: ['teams'] as const,

// ❌ Bad - Mutable and loses type information
all: ['teams'],
```

### ID Handling

```typescript
// String IDs - convert to string for consistency
detail: (id: string | number) => [...queryKeys.entity.all, 'detail', id.toString()] as const,

// Number IDs - use as-is when always numeric
detail: (id: number) => [...queryKeys.entity.all, 'detail', id] as const,
```

---

## List vs Detail Query Keys

### List Keys
For fetching collections of items:

```typescript
// Returns: ['teams', 'list']
queryKeys.teams.list()

// Parameterized list (for filtering)
// Returns: ['matches', 'list', { tournamentId: 'abc123' }]
queryKeys.matches.list('abc123')
```

### Detail Keys
For fetching single items:

```typescript
// Returns: ['teams', 'detail', 123]
queryKeys.teams.detail(123)

// Returns: ['tournaments', 'detail', '456']
queryKeys.tournaments.detail('456')
```

### Key Differences

| Aspect | List | Detail |
|--------|------|--------|
| Data Shape | Array `T[]` | Single object `T` |
| Invalidation | After create/update/delete | After update/delete |
| Parameter | Optional filters | Required ID |
| Usage | Tables, lists | View pages, forms |

---

## Parameterized Query Keys

### Simple Parameters (Primitive)

```typescript
// Just append to array
detail: (id: number) => [...queryKeys.entity.all, 'detail', id] as const,
```

### Object Parameters (Complex)

```typescript
// Use object for multiple filter parameters
list: (filters: { tournamentId: string; status?: string }) =>
  [...queryKeys.matches.all, 'list', filters] as const,

// Results in: ['matches', 'list', { tournamentId: 'abc', status: 'pending' }]
```

### Existing Examples

```typescript
// Matches with tournament filter
queryKeys.matches.list(tournamentId)
// Output: ['matches', 'list', { tournamentId: 'tournament-slug' }]

// Team members with teamId
queryKeys.teams.members(teamId)
// Output: ['teams', 'members', 123]
```

### Adding New Parameterized Key

```typescript
// When adding new entity with filters:
export const queryKeys = {
  games: {
    all: ['games'] as const,
    list: () => [...queryKeys.games.all, 'list'] as const,
    // Parameterized by category
    byCategory: (categoryId: string) =>
      [...queryKeys.games.all, 'category', categoryId] as const,
    // Parameterized by date range
    byDateRange: (start: string, end: string) =>
      [...queryKeys.games.all, 'range', { start, end }] as const,
    detail: (id: string) =>
      [...queryKeys.games.all, 'detail', id] as const,
  },
};
```

---

## Invalidation Patterns

### Pattern 1: Create Operation
Invalidate the **list** to show the new item:

```typescript
// /lib/api/teams.ts
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
  
  // ✅ Invalidate the list cache
  queryClient.invalidateQueries({ queryKey: queryKeys.teams.list() });
  
  return data;
}
```

### Pattern 2: Update Operation
Invalidate **both list and detail**:

```typescript
// /lib/api/tournaments.ts
export async function updateTournament(
  id: number,
  input: UpdateTournamentInput
): Promise<Tournament> {
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
  
  // ✅ Invalidate both list and specific detail
  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });
  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(id) });
  
  return data;
}
```

### Pattern 3: Delete Operation
Invalidate the **list**:

```typescript
// /lib/api/tournaments.ts
export async function deleteTournament(id: number): Promise<void> {
  const response = await fetch(`/api/tournaments/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete tournament');
  }
  
  // ✅ Invalidate the list (detail will naturally become stale)
  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });
}
```

### Pattern 4: Bulk Invalidation
Invalidate multiple related entities:

```typescript
// /lib/api/brackets.ts
export async function generateBracket(input: GenerateBracketInput): Promise<GenerateBracketResponse> {
  const response = await fetch('/api/brackets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate bracket');
  }
  
  const data = await response.json();
  
  // ✅ Invalidate multiple related caches
  queryClient.invalidateQueries({ queryKey: ['brackets'] }); // All bracket queries
  queryClient.invalidateQueries({ queryKey: ['matches'] });   // All match queries
  
  return data;
}
```

### Pattern 5: When ID Unknown
Use partial key matching:

```typescript
// /lib/api/matches.ts
export async function recordMatchResult(input: RecordMatchResultInput): Promise<RecordMatchResultResponse> {
  const response = await fetch('/api/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to record match result');
  }
  
  const data = await response.json();
  
  // ✅ When category ID is unknown, invalidate all match queries
  // This invalidates any query starting with ['matches']
  queryClient.invalidateQueries({ queryKey: ['matches'] });
  
  return data;
}
```

---

## Query Key Composition

### Hierarchical Structure

```typescript
// Parent-child relationships
queryKeys.teams.all              // ['teams']
queryKeys.teams.list()           // ['teams', 'list']
queryKeys.teams.detail(123)      // ['teams', 'detail', 123]
queryKeys.teams.members(123)     // ['teams', 'members', 123]

// Invalidating a parent invalidates children
queryClient.invalidateQueries({ queryKey: ['teams'] })
// This invalidates: ['teams'], ['teams', 'list'], ['teams', 'detail', *], etc.
```

### Composition Rules

```typescript
// ✅ Spread parent key for consistency
list: () => [...queryKeys.entity.all, 'list'] as const,

// ✅ Add ID for detail
detail: (id: number) => [...queryKeys.entity.all, 'detail', id] as const,

// ✅ Use object for complex params
list: (filter: string) => [...queryKeys.entity.all, 'list', { filter }] as const,

// ❌ Don't construct keys manually
list: () => ['entity', 'list'] as const, // Breaks hierarchy!
```

---

## Common Patterns and Examples

### Using Query Keys in Components

```typescript
// /lib/hooks/queries.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { fetchTeams, Team } from '@/lib/api';

// List query hook
export function useTeams(
  tournamentId?: string,
  options?: Omit<UseQueryOptions<Team[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.teams.list(),
    queryFn: () => fetchTeams(tournamentId),
    ...options,
  });
}

// Detail query hook
export function useTournamentDetail(
  id: string,
  options?: Omit<UseQueryOptions<Tournament, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.tournaments.detail(id),
    queryFn: () => fetchTournamentDetail(id),
    enabled: !!id, // Only fetch if ID exists
    ...options,
  });
}

// Members query hook with enabled flag
export function useTeamMembers(
  teamId: number,
  options?: Omit<UseQueryOptions<TeamMember[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.teams.members(teamId),
    queryFn: () => fetchTeamMembers(teamId),
    enabled: !!teamId, // Prevent fetching if no teamId
    ...options,
  });
}
```

### Using Mutation Hooks

```typescript
// /lib/hooks/mutations.ts
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { createTeam, CreateTeamInput, Team } from '@/lib/api';

// Create mutation hook
export function useCreateTeam(
  options?: Omit<UseMutationOptions<Team, Error, CreateTeamInput>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: createTeam, // API function handles invalidation
    ...options,
  });
}

// Update mutation hook
export function useUpdateTournament(
  options?: Omit<UseMutationOptions<
    Tournament,
    Error,
    { id: number; input: UpdateTournamentInput }
  >, 'mutationFn'>
) {
  return useMutation({
    mutationFn: ({ id, input }) => updateTournament(id, input),
    ...options,
  });
}
```

### Complete Workflow Example

```typescript
// Component using queries and mutations
function TournamentPage({ tournamentId }: { tournamentId: string }) {
  // Query with detail key
  const { data: tournament } = useQuery({
    queryKey: queryKeys.tournaments.detail(tournamentId),
    queryFn: () => fetchTournamentDetail(tournamentId),
    enabled: !!tournamentId,
  });
  
  // Mutation (invalidation happens in API function)
  const updateMutation = useMutation({
    mutationFn: (data: UpdateTournamentInput) => 
      updateTournament(tournamentId, data),
  });
  
  const handleUpdate = async (data: UpdateTournamentInput) => {
    await updateMutation.mutateAsync(data);
    // List and detail caches are already invalidated by API function
  };
  
  return (
    // ...
  );
}
```

---

## Anti-Patterns to Avoid

### ❌ Don't Invalidate in Components

```typescript
// ❌ Bad - Component invalidates cache
function CreateTeamForm() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      // Don't do this here - do it in API function
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.list() });
    },
  });
}

// ✅ Good - Invalidation in API function
// /lib/api/teams.ts
export async function createTeam(input: CreateTeamInput) {
  // ... API call
  queryClient.invalidateQueries({ queryKey: queryKeys.teams.list() });
  return data;
}
```

### ❌ Don't Use Magic Strings

```typescript
// ❌ Bad - Magic strings
queryClient.invalidateQueries({ queryKey: ['teams'] });

// ✅ Good - Use queryKeys factory
queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
```

### ❌ Don't Forget Type Safety

```typescript
// ❌ Bad - No type safety
all: ['teams'],

// ✅ Good - Type safety with as const
all: ['teams'] as const,
```

### ❌ Don't Skip List Invalidation on Delete

```typescript
// ❌ Bad - Only invalidate detail
queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(id) });

// ✅ Good - Invalidate list so item disappears from lists
queryClient.invalidateQueries({ queryKey: queryKeys.teams.list() });
```

### ❌ Don't Create Inconsistent Keys

```typescript
// ❌ Bad - Inconsistent ID types
detail: (id: number) => ['teams', 'detail', id],
// Sometimes called with: detail('123')
// Results in: ['teams', 'detail', '123']
// But detail expects number!

// ✅ Good - Normalize ID type
detail: (id: string | number) => [...queryKeys.teams.all, 'detail', id.toString()] as const,
```

---

## Quick Reference Card

### When to Invalidate What

| Operation | Invalidate List | Invalidate Detail | Notes |
|-----------|-----------------|-------------------|-------|
| **CREATE** | ✅ Yes | ❌ No | New item appears in list |
| **UPDATE** | ✅ Yes | ✅ Yes | Item changes in list and detail views |
| **DELETE** | ✅ Yes | ❌ No | Item removed from list, detail will 404 |
| **BULK** | ✅ Yes* | Depends | Invalidate all affected entities |

*Invalidate list(s) where item would appear

### Query Key Patterns

```typescript
// Entity structure
{
  all: ['entity'] as const,
  list: () => [...queryKeys.entity.all, 'list'] as const,
  detail: (id) => [...queryKeys.entity.all, 'detail', id] as const,
  related: (id) => [...queryKeys.entity.all, 'related', id] as const,
}

// Parameterized list
{
  list: (param) => [...queryKeys.entity.all, 'list', { param }] as const,
}
```

### Invalidation Syntax

```typescript
// Exact key
queryClient.invalidateQueries({ queryKey: queryKeys.entity.list() });

// Partial match (invalidates all starting with this prefix)
queryClient.invalidateQueries({ queryKey: ['entity'] });

// Multiple keys
queryClient.invalidateQueries({ queryKey: queryKeys.entity.list() });
queryClient.invalidateQueries({ queryKey: queryKeys.entity.detail(id) });
```

---

## Checklist for New Features

When adding new entities:

- [ ] Add query keys to `/lib/query-keys.ts`
  - [ ] `all` base key
  - [ ] `list` factory function
  - [ ] `detail` factory function with ID parameter
  - [ ] Any additional specialized keys
- [ ] Create fetch functions in `/lib/api/[entity].ts`
- [ ] Add invalidation in mutation functions:
  - [ ] Create: invalidate `list`
  - [ ] Update: invalidate `list` and `detail(id)`
  - [ ] Delete: invalidate `list`
- [ ] Create query hooks in `/lib/hooks/queries.ts`
- [ ] Create mutation hooks in `/lib/hooks/mutations.ts`
- [ ] Use `queryKeys` factory, never magic strings
- [ ] Add `as const` assertions to all keys
- [ ] Test that caches invalidate correctly

---

## Related Files

- `/lib/query-keys.ts` - Query key factory definitions
- `/lib/query-client.ts` - Query client configuration
- `/lib/api/*.ts` - API functions with invalidation
- `/lib/hooks/queries.ts` - Query hooks
- `/lib/hooks/mutations.ts` - Mutation hooks

---

**Last Updated:** Based on codebase patterns as of the current version.
