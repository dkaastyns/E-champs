# Vercel React Performance Best Practices

> **Source:** Vercel Engineering React Best Practices  
> **Impact Priority:** CRITICAL to LOW  
> **Applies to:** Next.js 16, React 19, TypeScript

This guide adapts Vercel's performance optimization patterns for the E-Champs codebase.

---

## 1. Eliminating Waterfalls (CRITICAL)

### 1.1 Defer Await Until Needed

Move `await` operations into the branches where they're actually used.

**❌ Incorrect: Always fetches auth even for early returns**

```typescript
// app/api/tournaments/route.ts
export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const body = await request.json() // This could fail parsing first
  
  if (!body.id) {
    return Response.json({ error: 'ID required' }, { status: 400 })
  }
  
  if (!session || session.user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  // Only now we need session
  return deleteTournament(body.id)
}
```

**✅ Correct: Validates first, then fetches**

```typescript
// app/api/tournaments/route.ts
export async function DELETE(request: Request) {
  const body = await request.json()
  
  if (!body.id) {
    return Response.json({ error: 'ID required' }, { status: 400 })
  }
  
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session || session.user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  return deleteTournament(body.id)
}
```

### 1.2 Promise.all() for Independent Operations

**❌ Incorrect: Sequential execution in API routes**

```typescript
// app/admin/tournaments/page.tsx
async function getDashboardData() {
  const tournaments = await getTournaments()     // 100ms
  const teams = await getTeams()                 // 100ms
  const matches = await getMatches()             // 100ms
  return { tournaments, teams, matches }           // Total: 300ms
}
```

**✅ Correct: Parallel execution**

```typescript
// app/admin/tournaments/page.tsx
async function getDashboardData() {
  const [tournaments, teams, matches] = await Promise.all([
    getTournaments(),
    getTeams(),
    getMatches()
  ])
  return { tournaments, teams, matches }         // Total: ~100ms
}
```

### 1.3 Prevent Waterfall Chains in Data Fetching

**❌ Incorrect: Each component waits for parent**

```tsx
// app/admin/brackets/[id]/page.tsx
export default async function BracketPage({ params }: { params: { id: string } }) {
  const tournament = await getTournament(params.id)      // 100ms
  const teams = await getTeams(params.id)                  // 100ms (waits)
  const matches = await getMatches(params.id)              // 100ms (waits)
  
  return <BracketClient tournament={tournament} teams={teams} matches={matches} />
}
```

**✅ Correct: Start all promises early**

```tsx
// app/admin/brackets/[id]/page.tsx
export default async function BracketPage({ params }: { params: { id: string } }) {
  const tournamentPromise = getTournament(params.id)
  const teamsPromise = getTeams(params.id)
  const matchesPromise = getMatches(params.id)
  
  const tournament = await tournamentPromise
  const [teams, matches] = await Promise.all([teamsPromise, matchesPromise])
  
  return <BracketClient tournament={tournament} teams={teams} matches={matches} />
}
```

**✅ Even Better: Component composition with Suspense**

```tsx
// app/admin/brackets/[id]/page.tsx
export default function BracketPage({ params }: { params: { id: string } }) {
  return (
    <div className="admin-layout">
      <Suspense fallback={<HeaderSkeleton />}>
        <TournamentHeader id={params.id} />
      </Suspense>
      <Suspense fallback={<BracketSkeleton />}>
        <BracketViewer id={params.id} />
      </Suspense>
      <Suspense fallback={<StatsSkeleton />}>
        <TournamentStats id={params.id} />
      </Suspense>
    </div>
  )
}

// Each component fetches its own data
async function TournamentHeader({ id }: { id: string }) {
  const tournament = await getTournament(id)
  return <h1>{tournament.name}</h1>
}
```

---

## 2. Bundle Size Optimization (CRITICAL)

### 2.1 Avoid Barrel File Imports

**❌ Incorrect: Imports entire icon library**

```tsx
// components/ui/icons.tsx
import { Check, X, Menu, User, Settings, Trophy } from '@phosphor-icons/react'
// Loads entire library even if only using 6 icons
```

**✅ Correct: Import individual icons**

```tsx
// components/ui/icons.tsx
import { Check } from '@phosphor-icons/react/dist/icons/Check'
import { X } from '@phosphor-icons/react/dist/icons/X'
import { Trophy } from '@phosphor-icons/react/dist/icons/Trophy'
// Loads only what's needed
```

**Alternative: Already configured in next.config.ts**

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react']
  }
}
```

### 2.2 Dynamic Imports for Heavy Components

**❌ Incorrect: Heavy bracket viewer in initial bundle**

```tsx
// app/admin/brackets/[id]/page.tsx
import { InteractiveBracket } from '@/components/bracket/InteractiveBracket'
// ~100KB added to initial bundle

export default function BracketPage() {
  return <InteractiveBracket />
}
```

**✅ Correct: Lazy load heavy components**

```tsx
// app/admin/brackets/[id]/page.tsx
import dynamic from 'next/dynamic'

const InteractiveBracket = dynamic(
  () => import('@/components/bracket/InteractiveBracket').then(m => m.InteractiveBracket),
  { 
    ssr: false,  // Bracket uses browser APIs
    loading: () => <BracketSkeleton /> 
  }
)

export default function BracketPage() {
  return <InteractiveBracket />
}
```

### 2.3 Defer Non-Critical Libraries

**❌ Incorrect: Analytics blocks hydration**

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />  // Blocks hydration
      </body>
    </html>
  )
}
```

**✅ Correct: Load after hydration**

```tsx
// app/layout.tsx
import dynamic from 'next/dynamic'

const Analytics = dynamic(
  () => import('@vercel/analytics/react').then(m => m.Analytics),
  { ssr: false }
)

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />  {/* Loads after hydration */}
      </body>
    </html>
  )
}
```

---

## 3. Server-Side Performance (HIGH)

### 3.1 React.cache() for Per-Request Deduplication

**❌ Incorrect: Same request made multiple times**

```tsx
// app/admin/tournaments/page.tsx
async function getStats() {
  const tournaments = await getTournaments()  // Query 1
  const active = tournaments.filter(t => t.status === 'ongoing')
  const total = tournaments.length
  
  return { active, total }
}

// app/admin/page.tsx
async function getOverview() {
  const tournaments = await getTournaments()  // Query 1 again!
  return { tournaments }
}
```

**✅ Correct: Cache per request**

```typescript
// lib/api/tournaments.ts
import { cache } from 'react'

export const getTournaments = cache(async () => {
  const client = await pool.connect()
  try {
    const result = await client.query('SELECT * FROM tournaments')
    return result.rows
  } finally {
    client.release()
  }
})

// Now multiple calls in same request are deduplicated
```

### 3.2 Minimize Serialization at RSC Boundaries

**❌ Incorrect: Passing entire objects to Client Components**

```tsx
// app/admin/tournaments/page.tsx
import { TournamentsClient } from './TournamentsClient'

export default async function Page() {
  const tournaments = await getTournaments()
  
  return (
    <TournamentsClient 
      tournaments={tournaments}  // Serializes full objects
    />
  )
}
```

**✅ Correct: Pass minimal data needed**

```tsx
// app/admin/tournaments/page.tsx
import { TournamentsClient } from './TournamentsClient'

export default async function Page() {
  const tournaments = await getTournaments()
  
  return (
    <TournamentsClient 
      initialData={tournaments}
      // Client uses TanStack Query for real-time updates
    />
  )
}

// Client fetches fresh data via useTournaments(initialData)
```

---

## 4. Client-Side Data Fetching (MEDIUM-HIGH)

### 4.1 Use TanStack Query for Deduplication

**❌ Incorrect: Multiple components fetch same data**

```tsx
// components/admin/TournamentList.tsx
function TournamentList() {
  const [tournaments, setTournaments] = useState([])
  
  useEffect(() => {
    fetch('/api/tournaments').then(r => r.json()).then(setTournaments)
  }, [])
  return <List tournaments={tournaments} />
}

// components/admin/TournamentStats.tsx
function TournamentStats() {
  const [tournaments, setTournaments] = useState([])
  
  useEffect(() => {
    fetch('/api/tournaments').then(r => r.json()).then(setTournaments)  // Duplicate!
  }, [])
  return <Stats data={tournaments} />
}
```

**✅ Correct: TanStack Query deduplicates automatically**

```tsx
// components/admin/TournamentList.tsx
function TournamentList() {
  const { data: tournaments } = useTournaments()
  return <List tournaments={tournaments} />
}

// components/admin/TournamentStats.tsx
function TournamentStats() {
  const { data: tournaments } = useTournaments()
  return <Stats data={tournaments} />
}

// Only one request made, shared across components
```

---

## 5. Re-render Optimization (MEDIUM)

### 5.1 Extract to Memoized Components

**❌ Incorrect: Expensive calculations on every render**

```tsx
// components/bracket/InteractiveBracket.tsx
function InteractiveBracket({ matches, teams }) {
  // Runs on every render
  const bracketData = generateBracketTree(matches, teams)
  const visibleNodes = calculateVisibleNodes(bracketData)
  
  return (
    <div>
      {visibleNodes.map(node => <BracketNode key={node.id} {...node} />)}
    </div>
  )
}
```

**✅ Correct: Memoize expensive work**

```tsx
// components/bracket/InteractiveBracket.tsx
function InteractiveBracket({ matches, teams }) {
  const bracketData = useMemo(
    () => generateBracketTree(matches, teams),
    [matches, teams]
  )
  
  const visibleNodes = useMemo(
    () => calculateVisibleNodes(bracketData),
    [bracketData]
  )
  
  return (
    <div>
      {visibleNodes.map(node => <BracketNode key={node.id} {...node} />)}
    </div>
  )
}
```

### 5.2 Defer State Reads to Usage Point

**❌ Incorrect: Subscribing to state only used in callbacks**

```tsx
function TournamentActions({ tournamentId }) {
  const { data: tournament } = useTournament(tournamentId)
  const { mutate: deleteTournament } = useDeleteTournament()
  
  // Subscribes to full tournament object
  const handleDelete = useCallback(() => {
    if (confirm('Delete ' + tournament.name + '?')) {
      deleteTournament(tournament.id)
    }
  }, [tournament, deleteTournament])
  
  return <button onClick={handleDelete}>Delete</button>
}
```

**✅ Correct: Read at point of use**

```tsx
function TournamentActions({ tournamentId }) {
  const { data: tournament } = useTournament(tournamentId)
  const { mutate: deleteTournament } = useDeleteTournament()
  
  const handleDelete = useCallback(() => {
    // Read tournament inside callback
    if (confirm('Delete ' + tournament?.name + '?')) {
      deleteTournament(tournamentId)
    }
  }, [tournamentId, tournament?.name, deleteTournament])
  
  return <button onClick={handleDelete}>Delete</button>
}
```

### 5.3 Use Functional setState for Stable Callbacks

**❌ Incorrect: Stale closure in async operations**

```tsx
function TeamRegistration() {
  const [teams, setTeams] = useState([])
  const { mutate: createTeam } = useCreateTeam()
  
  const handleAdd = useCallback((newTeam) => {
    createTeam(newTeam, {
      onSuccess: (data) => {
        setTeams([...teams, data])  // teams might be stale!
      }
    })
  }, [createTeam, teams])  // Must include teams
  
  return <Form onSubmit={handleAdd} />
}
```

**✅ Correct: Functional update**

```tsx
function TeamRegistration() {
  const [teams, setTeams] = useState([])
  const { mutate: createTeam } = useCreateTeam()
  
  const handleAdd = useCallback((newTeam) => {
    createTeam(newTeam, {
      onSuccess: (data) => {
        setTeams(prev => [...prev, data])  // Always fresh
      }
    })
  }, [createTeam])  // No need for teams in deps
  
  return <Form onSubmit={handleAdd} />
}
```

### 5.4 Use startTransition for Non-Urgent Updates

**❌ Incorrect: UI freezes on heavy operations**

```tsx
function BracketGenerator({ teams }) {
  const [bracket, setBracket] = useState(null)
  
  const generate = () => {
    // Heavy computation blocks UI
    const result = generateDoubleElimination(teams)
    setBracket(result)
  }
  
  return (
    <>
      <button onClick={generate}>Generate Bracket</button>
      {bracket && <BracketView data={bracket} />}
    </>
  )
}
```

**✅ Correct: Mark as transition**

```tsx
import { useTransition } from 'react'

function BracketGenerator({ teams }) {
  const [bracket, setBracket] = useState(null)
  const [isPending, startTransition] = useTransition()
  
  const generate = () => {
    startTransition(() => {
      // Marked as non-urgent
      const result = generateDoubleElimination(teams)
      setBracket(result)
    })
  }
  
  return (
    <>
      <button onClick={generate} disabled={isPending}>
        {isPending ? 'Generating...' : 'Generate Bracket'}
      </button>
      {isPending && <Spinner />}
      {bracket && <BracketView data={bracket} />}
    </>
  )
}
```

---

## 6. Rendering Performance (MEDIUM)

### 6.1 Hoist Static JSX Elements

**❌ Incorrect: Recreating elements on every render**

```tsx
function TournamentCard({ tournament }) {
  return (
    <div className="card">
      <Icon icon={<TrophyIcon />} />  {/* New element every render */}
      <h3>{tournament.name}</h3>
    </div>
  )
}
```

**✅ Correct: Static elements outside component**

```tsx
const trophyIcon = <TrophyIcon />

function TournamentCard({ tournament }) {
  return (
    <div className="card">
      <Icon icon={trophyIcon} />  {/* Same element reference */}
      <h3>{tournament.name}</h3>
    </div>
  )
}
```

### 6.2 CSS content-visibility for Long Lists

**❌ Incorrect: All list items render**

```tsx
function TournamentList({ tournaments }) {
  return (
    <div className="list">
      {tournaments.map(t => (
        <TournamentCard key={t.id} tournament={t} />
      ))}
    </div>
  )
}
```

**✅ Correct: content-visibility for off-screen items**

```tsx
function TournamentList({ tournaments }) {
  return (
    <div className="list">
      {tournaments.map(t => (
        <div key={t.id} style={{ contentVisibility: 'auto' }}>
          <TournamentCard tournament={t} />
        </div>
      ))}
    </div>
  )
}
```

### 6.3 Use Explicit Conditional Rendering

**❌ Incorrect: && can render unexpected values**

```tsx
function TeamCount({ teams }) {
  return (
    <div>
      {teams.length && <span>{teams.length} teams</span>}
      {/* Renders "0" when empty! */}
    </div>
  )
}
```

**✅ Correct: Use ternary for conditionals**

```tsx
function TeamCount({ teams }) {
  return (
    <div>
      {teams.length > 0 ? <span>{teams.length} teams</span> : null}
    </div>
  )
}
```

---

## 7. JavaScript Performance (LOW-MEDIUM)

### 7.1 Build Index Maps for Repeated Lookups

**❌ Incorrect: O(n) lookup in loop**

```tsx
function MatchList({ matches, teams }) {
  return (
    <ul>
      {matches.map(match => {
        const teamA = teams.find(t => t.id === match.teamAId)  // O(n) each iteration
        const teamB = teams.find(t => t.id === match.teamBId)  // O(n) each iteration
        return (
          <li key={match.id}>
            {teamA?.name} vs {teamB?.name}
          </li>
        )
      })}
    </ul>
  )
}
```

**✅ Correct: O(1) lookup with Map**

```tsx
function MatchList({ matches, teams }) {
  const teamMap = useMemo(() => {
    const map = new Map()
    teams.forEach(t => map.set(t.id, t))
    return map
  }, [teams])
  
  return (
    <ul>
      {matches.map(match => {
        const teamA = teamMap.get(match.teamAId)  // O(1)
        const teamB = teamMap.get(match.teamBId)  // O(1)
        return (
          <li key={match.id}>
            {teamA?.name} vs {teamB?.name}
          </li>
        )
      })}
    </ul>
  )
}
```

### 7.2 Combine Multiple Array Iterations

**❌ Incorrect: Multiple passes over array**

```tsx
function processTeams(teams) {
  const active = teams.filter(t => t.status === 'active')
  const names = active.map(t => t.name)
  const sorted = names.sort()  // Mutates!
  return sorted
}
```

**✅ Correct: Single iteration**

```tsx
function processTeams(teams) {
  return teams
    .filter(t => t.status === 'active')
    .map(t => t.name)
    .toSorted()  // Immutable sort
}
```

### 7.3 Use Set for O(1) Lookups

**❌ Incorrect: Array includes check**

```tsx
function TeamSelector({ teams, selectedIds }) {
  return (
    <ul>
      {teams.map(team => {
        const isSelected = selectedIds.includes(team.id)  // O(n) check
        return <TeamRow key={team.id} team={team} selected={isSelected} />
      })}
    </ul>
  )
}
```

**✅ Correct: Set for O(1) lookup**

```tsx
function TeamSelector({ teams, selectedIds }) {
  const selectedSet = useMemo(
    () => new Set(selectedIds),
    [selectedIds]
  )
  
  return (
    <ul>
      {teams.map(team => {
        const isSelected = selectedSet.has(team.id)  // O(1)
        return <TeamRow key={team.id} team={team} selected={isSelected} />
      })}
    </ul>
  )
}
```

---

## Quick Reference: Impact by Priority

| Priority | Category | Rules |
|----------|----------|-------|
| **CRITICAL** | Eliminating Waterfalls | `Promise.all()`, defer await, prevent chains |
| **CRITICAL** | Bundle Size | Dynamic imports, barrel file avoidance |
| **HIGH** | Server-Side | React.cache(), parallel fetching |
| **MEDIUM-HIGH** | Client Fetching | TanStack Query for deduplication |
| **MEDIUM** | Re-renders | useMemo, useTransition, functional setState |
| **MEDIUM** | Rendering | content-visibility, hoisted JSX |
| **LOW-MEDIUM** | JS Performance | Index maps, combined iterations |

## Common E-Champs Patterns

### Server Component Pattern

```tsx
// app/admin/page.tsx
import { cache } from 'react'

const getStats = cache(async () => {
  const client = await pool.connect()
  try {
    const [tournaments, teams, matches] = await Promise.all([
      client.query('SELECT * FROM tournaments'),
      client.query('SELECT * FROM registered_teams'),
      client.query('SELECT * FROM tournament_matches')
    ])
    return { 
      tournaments: tournaments.rows,
      teams: teams.rows,
      matches: matches.rows
    }
  } finally {
    client.release()
  }
})

export default async function AdminPage() {
  const stats = await getStats()
  return <AdminDashboard initialData={stats} />
}
```

### Client Component Pattern

```tsx
// components/admin/AdminDashboard.tsx
'use client'

import { useTournaments, useTeams, useMatches } from '@/lib/hooks'

export function AdminDashboard({ initialData }) {
  const { data: tournaments } = useTournaments({ initialData: initialData.tournaments })
  const { data: teams } = useTeams({ initialData: initialData.teams })
  const { data: matches } = useMatches({ initialData: initialData.matches })
  
  // Use useMemo for derived data
  const stats = useMemo(() => ({
    totalTournaments: tournaments?.length || 0,
    activeTeams: teams?.filter(t => !t.isDeleted).length || 0,
    pendingMatches: matches?.filter(m => m.status === 'pending').length || 0
  }), [tournaments, teams, matches])
  
  return <DashboardStats stats={stats} />
}
```

---

**Resources:**
- [Vercel React Best Practices](https://github.com/vercel/react-best-practices)
- [React Documentation](https://react.dev)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
