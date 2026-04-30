# API Layer Pattern

> **AI Agent Instruction**: Follow these patterns when creating, modifying, or reviewing API modules.

## Overview

This project uses a centralized API layer in `/lib/api/` that wraps all HTTP requests with:
- Type-safe interfaces
- Consistent error handling
- Automatic cache invalidation for mutations
- Clean exports through barrel file

---

## 1. File Structure & Naming Conventions

```
lib/api/
├── index.ts           # Barrel export - exports everything from all files
├── tournaments.ts     # Domain-specific API file
├── teams.ts
├── users.ts
├── matches.ts
├── brackets.ts
```

### Rules

| Rule | Convention |
|------|------------|
| **File naming** | Plural domain name, camelCase (e.g., `tournaments.ts`, `teamMembers.ts`) |
| **File location** | Always in `/lib/api/` directory |
| **Export in index.ts** | Must add `export * from './new-file';` to `/lib/api/index.ts` |
| **Function naming** | `fetch<Entity>s` for GET, `create<Entity>` for POST, `update<Entity>` for PUT, `delete<Entity>` for DELETE |
| **Interface naming** | `<Entity>` for response type, `Create<Entity>Input` for POST body, `Update<Entity>Input` for PUT body |

---

## 2. Interface Definitions

Define TypeScript interfaces at the top of each API file for all inputs and outputs.

```typescript
// Entity interface (returned by GET)
export interface Tournament {
  id: number;
  name: string;
  slug: string;
  status: 'open' | 'closed' | 'ongoing' | 'completed';
  createdAt: string;
  // ... other fields
}

// Input for POST request
export interface CreateTournamentInput {
  name: string;
  slug: string;
  status: 'open'; // Can be more restrictive for creation
}

// Input for PUT request - often extends create input
export interface UpdateTournamentInput extends CreateTournamentInput {
  status: 'open' | 'closed' | 'ongoing' | 'completed';
}

// Specialized input for custom operations
export interface RecordMatchResultInput {
  displayId: string;
  winnerId: number;
}
```

### Guidelines

- Export all interfaces (they may be used in hooks)
- Use strict types for enums: `'open' | 'closed'` instead of `string`
- Include `createdAt`/`updatedAt` for entity interfaces
- Extend base inputs when update fields are a superset

---

## 3. Error Handling Pattern

**Standard pattern for ALL API functions:**

```typescript
if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error || 'Descriptive error message');
}
```

### Rules

1. **Always check `response.ok`** - This checks for HTTP 200-299 status codes
2. **Parse error from JSON** - Backend returns `{ error: "message" }`
3. **Throw new Error** - Use the message from response, or a fallback
4. **Must be done BEFORE parsing response** - Error check comes before `response.json()` for success

### Example

```typescript
export async function fetchTournaments(): Promise<Tournament[]> {
  const response = await fetch('/api/tournaments');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch tournaments');
  }
  
  return response.json();
}
```

---

## 4. Cache Invalidation After Mutations

**Always invalidate affected queries after successful mutations (POST, PUT, DELETE).**

### Pattern

```typescript
import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';

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
  
  // Invalidate affected queries
  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });
  
  return data;
}
```

### Query Key Structure

Query keys are defined in `/lib/query-keys.ts`:

```typescript
export const queryKeys = {
  tournaments: {
    all: ['tournaments'] as const,
    list: () => [...queryKeys.tournaments.all, 'list'] as const,
    detail: (id: string | number) => [...queryKeys.tournaments.all, 'detail', id.toString()] as const,
  },
  // ... other domains
};
```

### Invalidation Guidelines

| Operation | What to Invalidate |
|-----------|------------------|
| **CREATE (POST)** | List query only |
| **UPDATE (PUT)** | Both list AND detail for that specific ID |
| **DELETE (DELETE)** | List query |
| **Custom operations** | Any related lists or details |

### Examples

```typescript
// POST - only invalidate list
queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });

// PUT - invalidate both list and specific detail
queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });
queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(id) });

// DELETE - invalidate list (and optionally detail if it exists)
queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });

// Bulk operations - invalidate all related query keys
queryClient.invalidateQueries({ queryKey: ['brackets'] });
queryClient.invalidateQueries({ queryKey: ['matches'] });
```

---

## 5. Export Pattern from index.ts

The `/lib/api/index.ts` barrel file must export everything from each API module.

```typescript
// Export all API functions
export * from './teams';
export * from './tournaments';
export * from './users';
export * from './matches';
export * from './brackets';
// Add new exports here alphabetically
```

### When Adding a New API File

1. Create file in `/lib/api/[domain].ts`
2. Add `export * from './[domain]';` to `/lib/api/index.ts`
3. Maintain alphabetical order for consistency

---

## 6. Complete Code Examples

### GET Request Pattern (fetchTournaments)

```typescript
export async function fetchTournaments(): Promise<Tournament[]> {
  const response = await fetch('/api/tournaments');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch tournaments');
  }
  
  return response.json();
}
```

**With query parameters:**

```typescript
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
```

### POST Request Pattern (createTournament)

```typescript
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
  
  // Invalidate tournaments list
  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });
  
  return data;
}
```

### PUT Request Pattern (updateTournament)

```typescript
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
  
  // Invalidate tournaments list AND detail
  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });
  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(id) });
  
  return data;
}
```

### DELETE Request Pattern (deleteTournament)

```typescript
export async function deleteTournament(id: number): Promise<void> {
  const response = await fetch(`/api/tournaments/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete tournament');
  }
  
  // Invalidate tournaments list
  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });
}
```

---

## 7. Full Template for New API File

```typescript
// [Domain] API Functions
import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';

// Entity interface (return type)
export interface [Domain] {
  id: number;
  // ... fields
  createdAt: string;
}

// Create input (POST body)
export interface Create[Domain]Input {
  // ... required fields for creation
}

// Update input (PUT body) - extends create or defines separately
export interface Update[Domain]Input extends Create[Domain]Input {
  // ... additional fields for updates
}

// GET all
export async function fetch[Domain]s(): Promise<[Domain][]> {
  const response = await fetch('/api/[domain]s');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch [domain]s');
  }
  
  return response.json();
}

// GET by ID
export async function fetch[Domain](id: number): Promise<[Domain]> {
  const response = await fetch(`/api/[domain]s/${id}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch [domain]');
  }
  
  return response.json();
}

// POST (create)
export async function create[Domain](input: Create[Domain]Input): Promise<[Domain]> {
  const response = await fetch('/api/[domain]s', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create [domain]');
  }
  
  const data = await response.json();
  
  queryClient.invalidateQueries({ queryKey: queryKeys.[domain]s.list() });
  
  return data;
}

// PUT (update)
export async function update[Domain](id: number, input: Update[Domain]Input): Promise<[Domain]> {
  const response = await fetch(`/api/[domain]s/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update [domain]');
  }
  
  const data = await response.json();
  
  queryClient.invalidateQueries({ queryKey: queryKeys.[domain]s.list() });
  queryClient.invalidateQueries({ queryKey: queryKeys.[domain]s.detail(id) });
  
  return data;
}

// DELETE
export async function delete[Domain](id: number): Promise<void> {
  const response = await fetch(`/api/[domain]s/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete [domain]');
  }
  
  queryClient.invalidateQueries({ queryKey: queryKeys.[domain]s.list() });
}
```

---

## 8. Checklist for New API Module

Before completing an API module, verify:

- [ ] File created at `/lib/api/[domain].ts`
- [ ] Interfaces defined and exported (Entity, CreateInput, UpdateInput if applicable)
- [ ] All API functions use consistent error handling (`if (!response.ok) { ... throw new Error(...) }`)
- [ ] All mutation functions (POST/PUT/DELETE) include cache invalidation
- [ ] Added `export * from './[domain]';` to `/lib/api/index.ts` (alphabetically sorted)
- [ ] Query keys added to `/lib/query-keys.ts` if new domain
- [ ] Functions tested and working

---

## Related Files

- `/lib/api/index.ts` - Barrel exports
- `/lib/query-keys.ts` - Query key definitions
- `/lib/query-client.ts` - React Query client configuration
