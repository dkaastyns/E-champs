# E-Champs Feature Implementation Pattern

> **AI Agent Rule**: This document defines the canonical end-to-end feature implementation pattern for the E-Champs project. All new features MUST follow this architecture.

## Tech Stack Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| Database | PostgreSQL + pg driver | Raw SQL queries via Pool |
| ORM/Auth | Better Auth | Authentication + Authorization |
| State | TanStack Query v5 | Server state management |
| Rendering | Next.js 16 App Router | RSC + Client Components |

## Architecture Pattern: Server-First with Client Hydration

The E-Champs project follows a strict **Server Component → Client Component** data flow pattern that optimizes for:
- **SEO**: Initial data fetched on server
- **Performance**: Immediate content display without loading states
- **UX**: Seamless interactivity after hydration

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Server Comp    │────▶│   Client Comp    │────▶│    UI State     │
│  (page.tsx)     │     │  (*Client.tsx)   │     │   (hooks)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                        │
         ▼                       ▼                        ▼
   ┌──────────┐           ┌──────────┐             ┌──────────┐
   │  pg Pool │           │  TanStack│             │ Mutations│
   │ raw SQL  │           │  Query   │             │ & Forms  │
   └──────────┘           └──────────┘             └──────────┘
         │                       │                        │
         ▼                       ▼                        ▼
   ┌──────────┐           ┌──────────┐             ┌──────────┐
   │  Props   │           │  fetch   │             │  POST/   │
   │  passing │           │  (cache) │             │  PUT/DEL │
   └──────────┘           └──────────┘             └──────────┘
                                                          │
                                                          ▼
                                                   ┌──────────┐
                                                   │   API    │
                                                   │  Routes  │
                                                   │route.ts  │
                                                   └──────────┘
                                                          │
                                                          ▼
                                                   ┌──────────┐
                                                   │Cache     │
                                                   │Invalidate│
                                                   │in API layer│
                                                   └──────────┘
```

---

## The 6-Step Flow

### Step 1: Server Component Fetches Initial Data

**File**: `app/[route]/page.tsx`

Server Components execute on the server and can directly access the database.

**Rules**:
- Import `pool` from `@/lib/db`
- Always use `try/finally` with `client.release()`
- Return the data as props to the Client Component
- No `'use client'` directive

```typescript
import { pool } from "@/lib/db";
import TournamentsClient from "@/components/admin/TournamentsClient";

async function getTournaments() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT t.*, COALESCE(tm.team_count, 0) as team_count
      FROM tournaments t
      LEFT JOIN (
        SELECT "categoryId", COUNT(*) as team_count
        FROM registered_teams
        WHERE "isDeleted" = false
        GROUP BY "categoryId"
      ) tm ON t.id = tm."categoryId"
      ORDER BY t."createdAt" DESC
    `);
    return result.rows;
  } finally {
    client.release();  // ALWAYS release the client
  }
}

export default async function AdminTournamentsPage() {
  const tournaments = await getTournaments();
  return <TournamentsClient tournaments={tournaments} />;
}
```

### Step 2: Client Component Receives Props

**File**: `components/[feature]/FeatureClient.tsx`

Client Components handle interactivity and use TanStack Query.

**Rules**:
- MUST have `'use client'` at the top
- Receive `initialData` via props
- Use the `initialData` as fallback for useQuery
- All state mutations go through custom mutation hooks

```typescript
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useTournaments, useCreateTournament, useUpdateTournament, useDeleteTournament } from '@/lib/hooks';
import { Tournament } from '@/lib/api';

interface TournamentsClientProps {
  tournaments: Tournament[];  // Initial data from Server Component
}

export default function TournamentsClient({ tournaments: initialTournaments }: TournamentsClientProps) {
  // Use initial data as fallback - instant display on load
  const { data: tournaments = initialTournaments } = useTournaments();
  
  const createTournamentMutation = useCreateTournament();
  const updateTournamentMutation = useUpdateTournament();
  const deleteTournamentMutation = useDeleteTournament();

  // Local UI state
  const [editing, setEditing] = useState<Tournament | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Handler functions call mutations with toast promises
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      // ... other fields
      status: formData.get('status') as 'open' | 'closed' | 'ongoing' | 'completed',
    };

    toast.promise(
      updateTournamentMutation.mutateAsync({ id: editing.id, input: payload }),
      {
        loading: 'Updating tournament...',
        success: () => {
          closeEditDialog();
          return 'Tournament updated successfully';
        },
        error: (err: Error) => err.message || 'Failed to update tournament',
      }
    );
  };

  // Render UI using tournaments data...
}
```

### Step 3: Custom Hooks with Query Keys

**Files**: 
- `lib/hooks/queries.ts` - Data fetching hooks
- `lib/hooks/mutations.ts` - Data mutation hooks
- `lib/query-keys.ts` - Centralized query key factory

**Rules**:
- All hooks are thin wrappers around TanStack Query
- Use centralized query keys from `queryKeys` factory
- Pass `initialData` through query options when needed
- Mutations delegate to API layer functions

**Query Keys Pattern** (`lib/query-keys.ts`):
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
  // Add new entities following this pattern
};
```

**Query Hooks** (`lib/hooks/queries.ts`):
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

**Mutation Hooks** (`lib/hooks/mutations.ts`):
```typescript
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { createTournament, updateTournament, deleteTournament, Tournament, CreateTournamentInput, UpdateTournamentInput } from '@/lib/api';

export function useCreateTournament(
  options?: Omit<UseMutationOptions<Tournament, Error, CreateTournamentInput>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: createTournament,
    ...options,
  });
}

export function useUpdateTournament(
  options?: Omit<UseMutationOptions<Tournament, Error, { id: number; input: UpdateTournamentInput }>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: ({ id, input }) => updateTournament(id, input),
    ...options,
  });
}

export function useDeleteTournament(
  options?: Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: deleteTournament,
    ...options,
  });
}
```

### Step 4: API Layer Functions

**File**: `lib/api/[feature].ts`

The API layer handles HTTP requests and cache invalidation.

**Rules**:
- Define TypeScript interfaces for all entities and inputs
- All CRUD operations are async functions
- Throw errors on non-OK responses
- **Cache invalidation happens HERE in mutation success**
- Import `queryClient` from `@/lib/query-client`
- Import `queryKeys` from `@/lib/query-keys`

```typescript
// Tournament API Functions
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
  team_count?: number;  // Computed from JOIN
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

// READ - Simple GET, no cache invalidation
export async function fetchTournaments(): Promise<Tournament[]> {
  const response = await fetch('/api/tournaments');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch tournaments');
  }
  
  return response.json();
}

// CREATE - Invalidate list after success
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
  
  // CRITICAL: Invalidate tournaments list cache
  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });
  
  return data;
}

// UPDATE - Invalidate list AND detail
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
  
  // CRITICAL: Invalidate both list and detail caches
  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });
  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(id) });
  
  return data;
}

// DELETE - Invalidate list after success
export async function deleteTournament(id: number): Promise<void> {
  const response = await fetch(`/api/tournaments/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete tournament');
  }
  
  // CRITICAL: Invalidate tournaments list cache
  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });
}
```

**Export Pattern** (`lib/api/index.ts`):
```typescript
// Export all API functions from central location
export * from './teams';
export * from './tournaments';
export * from './users';
export * from './matches';
export * from './brackets';
```

### Step 5: Route Handler (API Route)

**File**: `app/api/[feature]/route.ts`

Next.js App Router API routes handle HTTP requests.

**Rules**:
- Use Better Auth for authentication: `auth.api.getSession()`
- Always check authorization (role-based)
- Use `pool.connect()` with `try/finally` for DB access
- Return proper HTTP status codes
- Parse params with `await params` (Next.js 15+ async params)

**List/Create Route** (`app/api/tournaments/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { pool } from '@/lib/db';

// GET /api/tournaments - List all tournaments
export async function GET() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT t.*, COALESCE(tm.team_count, 0) as team_count
      FROM tournaments t
      LEFT JOIN (
        SELECT "categoryId", COUNT(*) as team_count
        FROM registered_teams
        WHERE "isDeleted" = false
        GROUP BY "categoryId"
      ) tm ON t.id = tm."categoryId"
      ORDER BY t."tournamentStartDate" ASC
    `);
    return NextResponse.json(result.rows);
  } finally {
    client.release();
  }
}

// POST /api/tournaments - Create new tournament (admin only)
export async function POST(request: NextRequest) {
  // AUTHENTICATION
  const session = await auth.api.getSession({ headers: await headers() });
  
  // AUTHORIZATION
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const { name, slug, description, maxTeams, teamSize, registrationFee, tournamentStartDate, tournamentEndDate } = body;

  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO tournaments (name, slug, description, "maxTeams", "teamSize", "registrationFee", "tournamentStartDate", "tournamentEndDate")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, slug, description, maxTeams, teamSize, registrationFee, tournamentStartDate, tournamentEndDate]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 });
  } finally {
    client.release();
  }
}
```

**Individual Resource Route** (`app/api/tournaments/[id]/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { pool } from '@/lib/db';

// PUT /api/tournaments/[id] - Update tournament
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Next.js 15+: params is async, must await
  const { id } = await params;
  const tournamentId = parseInt(id);
  if (isNaN(tournamentId)) {
    return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
  }

  const body = await request.json();
  const { name, slug, description, maxTeams, teamSize, registrationFee, tournamentStartDate, tournamentEndDate, status } = body;

  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE tournaments 
       SET name = $1, slug = $2, description = $3, "maxTeams" = $4, "teamSize" = $5, 
           "registrationFee" = $6, "tournamentStartDate" = $7, "tournamentEndDate" = $8, status = $9
       WHERE id = $10
       RETURNING *`,
      [name, slug, description, maxTeams, teamSize, registrationFee, tournamentStartDate, tournamentEndDate, status, tournamentId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch {
    return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE /api/tournaments/[id] - Delete tournament
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const tournamentId = parseInt(id);
  if (isNaN(tournamentId)) {
    return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    // Business logic: Check for related records before delete
    const teamsResult = await client.query(
      `SELECT COUNT(*) FROM registered_teams WHERE "categoryId" = $1`,
      [tournamentId]
    );

    const teamCount = parseInt(teamsResult.rows[0].count);
    if (teamCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${teamCount} team(s) registered` },
        { status: 409 }
      );
    }

    await client.query(`DELETE FROM tournaments WHERE id = $1`, [tournamentId]);
    return NextResponse.json({ message: 'Tournament deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 });
  } finally {
    client.release();
  }
}
```

### Step 6: Cache Invalidation Strategy

Cache invalidation is **decentralized** - it happens in the API layer, not the route handler.

**Why?**
- Route handlers are stateless HTTP endpoints
- Multiple clients (web, mobile) may use the same API
- Cache invalidation belongs with the business logic

**Invalidation Rules**:

| Operation | Cache Invalidation |
|-----------|-------------------|
| CREATE | `queryKeys.[entity].list()` |
| UPDATE | `queryKeys.[entity].list()` + `queryKeys.[entity].detail(id)` |
| DELETE | `queryKeys.[entity].list()` + `queryKeys.[entity].detail(id)` |
| BATCH UPDATE | All related list keys |

**Query Client Configuration** (`lib/query-client.ts`):
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,      // Data considered fresh until invalidated
      gcTime: 5 * 60 * 1000,     // Garbage collect after 5 minutes
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 3,
    },
  },
});
```

---

## Complete CRUD Feature Example

Here's how a complete tournaments CRUD feature flows through all layers:

### File Structure
```
app/
├── admin/
│   └── tournaments/
│       └── page.tsx                 # Server Component
├── api/
│   └── tournaments/
│       ├── route.ts                 # List + Create
│       └── [id]/
│           └── route.ts             # Update + Delete
├── components/
│   └── admin/
│       └── TournamentsClient.tsx    # Client Component
├── lib/
│   ├── api/
│   │   ├── tournaments.ts           # API layer functions
│   │   └── index.ts                 # Re-exports
│   ├── hooks/
│   │   ├── queries.ts               # useTournaments()
│   │   ├── mutations.ts             # useCreate/Update/DeleteTournament()
│   │   └── index.ts                 # Re-exports
│   ├── query-keys.ts                # Query key factory
│   └── query-client.ts              # TanStack Query client config
```

### Data Flow

1. **User visits `/admin/tournaments`**
   - Server: `page.tsx` runs, queries database via `pool`
   - Server: Renders `TournamentsClient` with `tournaments={data}`

2. **Page displays immediately**
   - Client: `TournamentsClient` receives `initialTournaments`
   - Client: `useTournaments()` returns `data` (or falls back to `initialTournaments`)
   - Client: Table renders with data

3. **User edits a tournament**
   - Client: Form submission triggers `updateTournamentMutation.mutateAsync()`
   - Client: Toast shows loading state
   - Client: Mutation calls `updateTournament()` from API layer

4. **API layer processes**
   - API: Makes PUT request to `/api/tournaments/${id}`
   - API: On success, invalidates cache:
     ```typescript
     queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });
     queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(id) });
     ```

5. **Route handler executes**
   - API Route: Validates session/role
   - API Route: Updates database
   - API Route: Returns updated record

6. **UI updates**
   - API layer function returns data
   - Mutation completes
   - Toast shows success
   - TanStack Query refetches `tournaments.list()` (cache was invalidated)
   - UI automatically updates with fresh data

---

## AI Agent Checklist

When implementing a new CRUD feature, verify:

### Server Component (page.tsx)
- [ ] Imports `pool` from `@/lib/db`
- [ ] Uses `try/finally` with `client.release()`
- [ ] Passes data as props to Client Component
- [ ] Has NO `'use client'` directive

### Client Component (*Client.tsx)
- [ ] Has `'use client'` at top
- [ ] Accepts `initialData` prop
- [ ] Uses `const { data: items = initialItems } = useQuery()`
- [ ] Imports mutations from `@/lib/hooks`
- [ ] Uses `toast.promise()` for mutations
- [ ] Checks `mutation.isPending` for loading states

### Query Hooks (lib/hooks/*.ts)
- [ ] Defined in `queries.ts` or `mutations.ts`
- [ ] Uses centralized `queryKeys` factory
- [ ] Exports from `lib/hooks/index.ts`
- [ ] Query hooks have proper TypeScript types
- [ ] Mutation hooks pass correct options

### API Layer (lib/api/*.ts)
- [ ] Exports TypeScript interfaces for entity and inputs
- [ ] Has `fetch[Entity]s()` for listing
- [ ] Has `create[Entity]()`, `update[Entity]()`, `delete[Entity]()`
- [ ] **CRITICAL**: Invalidates cache after mutations
- [ ] Throws errors on non-OK responses
- [ ] Exports from `lib/api/index.ts`

### Query Keys (lib/query-keys.ts)
- [ ] Added new `[entity]` key factory
- [ ] Has `all`, `list()`, `detail(id)` pattern
- [ ] Related entity keys (e.g., `members(teamId)`) included

### Route Handlers (app/api/[entity]/route.ts)
- [ ] Uses `auth.api.getSession()` for auth
- [ ] Checks `session.user.role` for authorization
- [ ] Awaits async `params` (Next.js 15+)
- [ ] Validates numeric IDs with `isNaN()` check
- [ ] Returns proper HTTP status codes (200, 201, 400, 403, 404, 409, 500)
- [ ] Uses `pool.connect()` with `try/finally`

### Error Handling
- [ ] API layer throws descriptive errors
- [ ] Client shows toast with error.message
- [ ] Server returns JSON error responses

---

## Anti-Patterns to Avoid

❌ **Don't use `useEffect` for data fetching**
```typescript
// WRONG - Don't do this
useEffect(() => {
  fetch('/api/tournaments').then(res => res.json()).then(setData);
}, []);
```

✅ **Do use TanStack Query**
```typescript
const { data } = useTournaments();
```

---

❌ **Don't invalidate cache in route handlers**
```typescript
// WRONG - Route handlers are stateless
export async function POST(request: NextRequest) {
  // ... handle request
  queryClient.invalidateQueries({...}); // ❌ NO! Route handlers can't access queryClient
}
```

✅ **Do invalidate in API layer**
```typescript
// CORRECT - API layer has access to queryClient
export async function createTournament(input: CreateTournamentInput) {
  // ... handle request
  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.list() });
}
```

---

❌ **Don't forget to release pool clients**
```typescript
// WRONG
const client = await pool.connect();
const result = await client.query('SELECT * FROM table');
return result.rows; // ❌ Client never released!
```

✅ **Do use try/finally**
```typescript
// CORRECT
const client = await pool.connect();
try {
  const result = await client.query('SELECT * FROM table');
  return result.rows;
} finally {
  client.release(); // ✅ Always released
}
```

---

❌ **Don't use sync params access**
```typescript
// WRONG - Next.js 15 has async params
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id; // ❌ Type error in Next.js 15
}
```

✅ **Do await params**
```typescript
// CORRECT
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✅ Correct for Next.js 15+
}
```

---

## Common Patterns by Entity Type

### One-to-Many Relationships
When implementing child entities (e.g., Team Members for Teams):

```typescript
// Query key includes parent ID
members: (teamId: number) => [...queryKeys.teams.all, 'members', teamId] as const,

// API function takes parent ID
export async function fetchTeamMembers(teamId: number): Promise<TeamMember[]> {
  const response = await fetch(`/api/teams/${teamId}/members`);
  // ...
}
```

### Computed Fields
Server-side computed fields (like `team_count`):

```typescript
// In Server Component and API route
const result = await client.query(`
  SELECT t.*, COALESCE(tm.team_count, 0) as team_count
  FROM tournaments t
  LEFT JOIN (
    SELECT "categoryId", COUNT(*) as team_count
    FROM registered_teams
    WHERE "isDeleted" = false
    GROUP BY "categoryId"
  ) tm ON t.id = tm."categoryId"
`);
```

### Soft Delete Pattern
Use boolean flags for soft deletes:

```typescript
// Query excludes deleted records
WHERE "isDeleted" = false

// Delete marks as deleted
await client.query(
  `UPDATE registered_teams SET "isDeleted" = true, "deletedReason" = $1 WHERE id = $2`,
  [reason, teamId]
);
```

---

## Summary

The E-Champs architecture prioritizes:

1. **Server-first rendering** - Data fetched on server for SEO and speed
2. **Type safety** - TypeScript interfaces at every layer
3. **Cache coherence** - Centralized query keys, invalidation in API layer
4. **User experience** - Immediate display from server, smooth updates via TanStack Query
5. **Security** - Authentication via Better Auth, role-based access control

When in doubt, trace the tournaments feature implementation as the canonical reference pattern.
