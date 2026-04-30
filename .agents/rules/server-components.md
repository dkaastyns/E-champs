# React Server Components Data Fetching Pattern

## Overview

This codebase uses a **Server Component-first** data fetching pattern where:
- Server Components fetch data directly using PostgreSQL pool
- SQL queries are written inline in Server Components
- Data is passed to Client Components as props
- Pool connections are managed with proper cleanup

## When to Use Server Components vs Client Components

### Use Server Components When:
- **Fetching initial data** on page load (database queries, API calls)
- **Accessing server-side resources** (database, file system)
- **Rendering static content** that doesn't need interactivity
- **SEO-sensitive content** that needs to be in the initial HTML
- **No browser APIs needed** (localStorage, window, document)

### Use Client Components When:
- **User interactivity** is required (buttons, forms, dialogs)
- **State management** with React hooks (useState, useEffect)
- **Browser APIs** are needed
- **Real-time updates** are required
- **Client-side mutations** (create, update, delete operations)

### Pattern in This Codebase:
```tsx
// app/admin/tournaments/page.tsx (Server Component)
async function getTournaments() { /* ... */ }

export default async function AdminTournamentsPage() {
  const tournaments = await getTournaments(); // Fetch on server
  return <TournamentsClient tournaments={tournaments} />; // Pass to client
}

// components/admin/TournamentsClient.tsx (Client Component)
'use client';
export default function TournamentsClient({ tournaments }: Props) {
  // Handle interactivity, mutations, state
}
```

## Data Fetching Pattern with pg Pool

### Required Setup

```typescript
// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export { pool };
```

### Standard Fetch Pattern

```typescript
import { pool } from "@/lib/db";

// Define interface for type safety
interface Tournament {
  id: number;
  name: string;
  // ... other fields
}

async function getTournaments(): Promise<Tournament[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM tournaments ORDER BY "createdAt" DESC
    `);
    return result.rows;
  } finally {
    client.release(); // MUST release connection
  }
}

export default async function Page() {
  const tournaments = await getTournaments();
  return <TournamentsClient tournaments={tournaments} />;
}
```

### Critical Rules:

1. **Always use `pool.connect()`** - Never use `pool.query()` directly
2. **Always release in `finally` block** - Ensures connection is returned to pool
3. **Use parameterized queries** - For dynamic values, use `$1, $2` placeholders
4. **Return typed results** - Define interfaces for query results

## Error Handling

### Philosophy: Let It Throw

Server Components should **not** typically catch errors from database queries. Let them throw so Next.js error boundaries handle them:

```typescript
// CORRECT: Let errors bubble up
async function getTournament(id: number) {
  const client = await pool.connect();
  try {
    const result = await client.query(`SELECT * FROM tournaments WHERE id = $1`, [id]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

// WRONG: Don't catch and swallow errors
async function getTournamentWrong(id: number) {
  try {
    const client = await pool.connect();
    // ... query
  } catch (error) {
    console.error(error); // ❌ Don't do this
    return null;
  }
}
```

### When to Handle Errors:

- **Expected null results** - Use `|| null` or similar for "not found" scenarios
- **Conditional rendering** - Handle missing data for UI decisions
- **Not Found pages** - Use Next.js `notFound()` for 404s

```typescript
import { notFound } from "next/navigation";

export default async function TournamentPage({ params }: Props) {
  const tournament = await getTournament(params.id);
  
  if (!tournament) {
    notFound(); // Returns 404 page
  }
  
  return <TournamentDetail tournament={tournament} />;
}
```

## Passing Data to Client Components

### Pattern 1: Direct Props (Most Common)

```typescript
// Server Component
export default async function AdminTournamentsPage() {
  const tournaments = await getTournaments();
  return <TournamentsClient tournaments={tournaments} />;
}

// Client Component
'use client';
interface TournamentsClientProps {
  tournaments: Tournament[];
}
export default function TournamentsClient({ tournaments }: TournamentsClientProps) {
  // Use tournaments prop
}
```

### Pattern 2: With Pre-computed Values

```typescript
// Server Component
export default async function AdminTeamsPage() {
  const teams = await getAllTeams();
  const pendingCount = teams.filter((t) => t.paymentStatus === 'pending').length;
  
  return (
    <TeamActionsClient 
      teams={teams} 
      pendingCount={pendingCount} // Pre-computed on server
    />
  );
}
```

### Pattern 3: With Grouped/Transformed Data

```typescript
// Server Component
export default async function SchedulePage() {
  const schedule = await getSchedule();
  
  // Group by category on server
  const groupedByCategory: Record<number, ScheduleItem[]> = {};
  schedule.forEach((item) => {
    if (!groupedByCategory[item.categoryId]) {
      groupedByCategory[item.categoryId] = [];
    }
    groupedByCategory[item.categoryId].push(item);
  });
  
  return <ScheduleClient groupedData={groupedByCategory} />;
}
```

### Pattern 4: Multiple Data Sources

```typescript
export default async function BracketDetailPage({ params }: Props) {
  const { id } = await params;
  
  // Fetch multiple related datasets
  const [matches, tournamentName] = await Promise.all([
    getBracket(id),
    getTournamentName(id)
  ]);
  
  // Transform before passing to client
  const libraryMatches = transformToLibraryFormat(matches);
  
  return (
    <InteractiveBracket 
      matches={libraryMatches} 
      tournamentName={tournamentName}
    />
  );
}
```

## SQL Query Patterns

### 1. Basic SELECT with Ordering

```typescript
async function getUsers() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT id, name, email, role, "createdAt"
      FROM "user"
      ORDER BY "createdAt" DESC
    `);
    return result.rows;
  } finally {
    client.release();
  }
}
```

### 2. INNER JOIN for Related Data

```typescript
async function getAllTeams(): Promise<Team[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT rt.*, t.name as "categoryName", t.slug as "categorySlug",
             u.name as "captainName", u.email as "captainEmail"
      FROM registered_teams rt
      JOIN tournaments t ON rt."categoryId" = t.id
      JOIN "user" u ON rt."captainId" = u.id
      ORDER BY rt."createdAt" DESC
    `);
    return result.rows;
  } finally {
    client.release();
  }
}
```

### 3. LEFT JOIN with Subquery for Aggregates

```typescript
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
    client.release();
  }
}
```

### 4. Complex Query with Multiple Joins and Aggregations

```typescript
async function getTournamentsWithTeamCounts(): Promise<TournamentWithCounts[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        t.id,
        t.name,
        t."maxTeams" as "maxTeams",
        t."tournamentStartDate" as "tournamentStartDate",
        t."tournamentEndDate" as "tournamentEndDate",
        COALESCE(tm.registered_count, 0) as "registeredTeams",
        COALESCE(tm.verified_count, 0) as "verifiedTeams",
        EXISTS (
          SELECT 1 FROM tournament_matches trn
          WHERE trn."categoryId" = t.id
          LIMIT 1
        ) as "bracketExists"
      FROM tournaments t
      LEFT JOIN (
        SELECT
          "categoryId",
          COUNT(*) as registered_count,
          COUNT(*) FILTER (WHERE "paymentStatus" = 'verified') as verified_count
        FROM registered_teams
        WHERE "isDeleted" = false
        GROUP BY "categoryId"
      ) tm ON t.id = tm."categoryId"
      ORDER BY t."tournamentStartDate" ASC, t.name ASC
    `);
    return result.rows;
  } finally {
    client.release();
  }
}
```

### 5. Subquery in SELECT Clause

```typescript
async function getSchedule(): Promise<ScheduleItem[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        rt.id AS "teamId",
        rt."teamName" as "teamName",
        (SELECT COUNT(*) FROM team_members tm WHERE tm."teamId" = rt.id) as "memberCount",
        rt."paymentStatus",
        t.name AS "categoryName",
        u.name AS "captainName"
      FROM registered_teams rt
      INNER JOIN tournaments t ON rt."categoryId" = t.id
      INNER JOIN "user" u ON rt."captainId" = u.id
      WHERE rt."isDeleted" = FALSE
        AND rt."paymentStatus" IN ('paid', 'verified')
      ORDER BY t."tournamentStartDate" ASC
    `);
    return result.rows;
  } finally {
    client.release();
  }
}
```

### 6. CASE Statements for Conditional Logic

```typescript
async function getMyMatches(userId: string): Promise<Match[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
        tm.id,
        t.name as "categoryName",
        tm."bracket",
        tm."round",
        tm."matchNumber",
        ta."teamName" as "teamAName",
        tb."teamName" as "teamBName",
        CASE 
          WHEN rt_a."captainId" = $1 THEN ta."teamName"
          ELSE tb."teamName"
        END as "myTeamName",
        CASE 
          WHEN rt_a."captainId" = $1 THEN tb."teamName"
          ELSE ta."teamName"
        END as "opponentName"
      FROM tournament_matches tm
      JOIN tournaments t ON tm."categoryId" = t.id
      LEFT JOIN registered_teams ta ON tm."teamAId" = ta.id
      LEFT JOIN registered_teams tb ON tm."teamBId" = tb.id
      LEFT JOIN registered_teams rt_a ON tm."teamAId" = rt_a.id
      LEFT JOIN registered_teams rt_b ON tm."teamBId" = rt_b.id
      WHERE (rt_a."captainId" = $1 OR rt_b."captainId" = $1)
      ORDER BY tm."scheduledAt" DESC NULLS LAST`,
      [userId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}
```

### 7. Multiple Queries in Single Function

```typescript
async function getDashboardStats(userId: string) {
  const client = await pool.connect();
  try {
    // Run multiple queries
    const teamsResult = await client.query(
      `SELECT COUNT(*) FROM registered_teams WHERE "captainId" = $1 AND "isDeleted" = false`,
      [userId]
    );
    
    const verifiedResult = await client.query(
      `SELECT COUNT(*) FROM registered_teams WHERE "captainId" = $1 AND "paymentStatus" = 'verified'`,
      [userId]
    );
    
    const upcomingResult = await client.query(
      `SELECT COUNT(*) FROM registered_teams rt
       JOIN tournaments t ON rt."categoryId" = t.id
       WHERE rt."captainId" = $1 
       AND t.status IN ('open', 'ongoing')`,
      [userId]
    );
    
    return {
      totalTeams: parseInt(teamsResult.rows[0].count),
      verifiedTeams: parseInt(verifiedResult.rows[0].count),
      upcomingTournaments: parseInt(upcomingResult.rows[0].count),
    };
  } finally {
    client.release();
  }
}
```

## SQL Pattern Guidelines

### Quoted Identifiers

PostgreSQL identifiers with uppercase letters or special characters must be quoted:

```sql
-- Use double quotes for column/table names with camelCase
SELECT "categoryId", "teamName", "createdAt"
FROM registered_teams
WHERE "isDeleted" = false
```

### Parameterized Queries

Always use parameterized queries for dynamic values:

```typescript
// ✅ CORRECT
await client.query(`SELECT * FROM tournaments WHERE id = $1`, [id]);

// ❌ WRONG - SQL injection risk
await client.query(`SELECT * FROM tournaments WHERE id = ${id}`);
```

### COALESCE for Null Handling

Use COALESCE to provide default values for NULL results:

```sql
SELECT t.*, COALESCE(tm.team_count, 0) as team_count
```

### FILTER Clause

Use FILTER for conditional aggregation:

```sql
COUNT(*) FILTER (WHERE "paymentStatus" = 'verified') as verified_count
```

## Complete Example: Tournament Management Page

```typescript
// app/admin/tournaments/page.tsx
import { pool } from "@/lib/db";
import TournamentsClient from "@/components/admin/TournamentsClient";

interface Tournament {
  id: number;
  name: string;
  slug: string;
  description: string;
  maxTeams: number;
  teamSize: number;
  registrationFee: number;
  tournamentStartDate: string;
  status: string;
  team_count?: number;
}

async function getTournaments(): Promise<Tournament[]> {
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
    client.release();
  }
}

export default async function AdminTournamentsPage() {
  const tournaments = await getTournaments();
  return <TournamentsClient tournaments={tournaments} />;
}
```

```typescript
// components/admin/TournamentsClient.tsx
'use client';

import { useState } from 'react';
import { Tournament } from '@/lib/api';

interface TournamentsClientProps {
  tournaments: Tournament[];
}

export default function TournamentsClient({ tournaments }: TournamentsClientProps) {
  const [editing, setEditing] = useState<Tournament | null>(null);
  
  // Handle interactivity, forms, mutations...
  
  return (
    <div>
      {/* Render tournaments with interactivity */}
    </div>
  );
}
```

## Security Considerations

1. **Never expose database credentials** - Use environment variables
2. **Always use parameterized queries** - Prevents SQL injection
3. **Validate user input** - Before using in queries
4. **Handle authentication in Server Components** - Use auth headers/cookies

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null; // Or redirect to login
  }

  const data = await getUserData(session.user.id);
  return <ClientComponent data={data} />;
}
```

## Performance Tips

1. **Fetch only needed columns** - Don't use `SELECT *` in production
2. **Use appropriate indexes** - On frequently queried columns
3. **Consider query result caching** - Next.js built-in caching
4. **Parallelize independent queries** - Use `Promise.all()`
5. **Limit result sets** - Use pagination for large datasets

```typescript
// Parallel queries
const [tournaments, users] = await Promise.all([
  getTournaments(),
  getUsers()
]);
```
