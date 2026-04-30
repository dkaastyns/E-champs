# Complex Business Logic Separation

> **AI Agent Instruction**: Follow these patterns when implementing complex business logic that needs to be separated from UI components.

## Overview

This project separates complex business logic into utility files in `/lib/` to keep components clean and focused on presentation. This approach:
- Makes complex algorithms testable in isolation
- Enables database transactions for data integrity
- Reuses logic across multiple components/API routes
- Separates concerns between UI and business rules

---

## 1. When to Separate Logic into Utility Files

### Extract Logic When:

| Scenario | Action |
|----------|--------|
| **Complex algorithm** (>50 lines of logic) | Extract to `/lib/[algorithm-name].ts` |
| **Data transformation** | Extract to `/lib/[domain]-transform.ts` |
| **Database transactions** | Extract to `/lib/[operation]-generator.ts` |
| **Multi-step business process** | Extract to `/lib/[process]-service.ts` |
| **Reusable calculation** | Extract to `/lib/utils.ts` or domain-specific file |
| **Data normalization** | Extract to transform file |

### Keep in Component When:

- Simple data formatting (use inline or helper)
- UI state management (use hooks)
- Single API call without complex logic
- Presentation-only transformations

### Examples from Codebase:

```typescript
// ✅ EXTRACTED: Complex bracket generation (200+ lines)
// File: /lib/bracket-generator.ts
export async function generateDoubleEliminationBracket(...) { ... }

// ✅ EXTRACTED: Data transformation for external library
// File: /lib/bracket-transform.ts
export function transformToLibraryFormat(matches: DBMatch[]) { ... }

// ❌ INLINE: Simple formatting
// Keep in component: new Date(date).toLocaleDateString()
```

---

## 2. File Naming Conventions

### Directory Structure

```
lib/
├── db.ts                    # Database pool configuration
├── auth.ts                  # Authentication utilities
├── utils.ts                 # General utility functions
├── bracket-generator.ts     # Complex business logic
├── bracket-transform.ts     # Data transformation
├── [domain]-service.ts      # Domain-specific services
├── [operation]-utils.ts     # Operation-specific utilities
└── api/                     # API layer (see api-layer.md)
    ├── index.ts
    ├── brackets.ts
    └── ...
```

### Naming Rules

| Pattern | Purpose | Example |
|---------|---------|---------|
| `[domain]-generator.ts` | Generates complex data structures | `bracket-generator.ts` |
| `[domain]-transform.ts` | Transforms data between formats | `bracket-transform.ts` |
| `[domain]-service.ts` | Business logic services | `payment-service.ts` |
| `[operation]-utils.ts` | Operation-specific utilities | `validation-utils.ts` |
| `[algorithm].ts` | Pure algorithm implementations | `pairing-algorithm.ts` |

### Export Conventions

```typescript
// Main functions: named exports
export async function generateDoubleEliminationBracket(...) { ... }
export function transformToLibraryFormat(...) { ... }

// Types: exported interfaces
export interface DBMatch { ... }
export interface MatchRecord { ... }

// Internal helpers: NOT exported
function nextPowerOf2(n: number): number { ... }
function mapStatus(status: string): string { ... }
```

---

## 3. Transaction Handling with pg Client

### Pattern: Accept Client as Parameter

All database operations that may participate in transactions MUST accept a pg client as the first parameter.

```typescript
// ✅ CORRECT: Accept client for transaction support
export async function generateDoubleEliminationBracket(
  client: any,  // First parameter is always the pg client
  categoryId: number,
  teams: Team[]
): Promise<...> {
  // All queries use the provided client
  await client.query(`DELETE FROM ...`, [...]);
  await client.query(`INSERT INTO ...`, [...]);
}
```

### Why This Pattern?

1. **Transaction Safety**: All operations in the function participate in the caller's transaction
2. **Testability**: Easy to mock the client for unit tests
3. **Flexibility**: Can be called within transactions or standalone
4. **Consistency**: Same pattern across all complex logic

### Creating a Client Wrapper for Standalone Use

When the function needs to be called without an existing transaction:

```typescript
// In the API route or component:
import { pool } from '@/lib/db';

const client = await pool.connect();
try {
  const result = await generateDoubleEliminationBracket(client, categoryId, teams);
  // If needed, commit transaction
} catch (error) {
  // Handle error - transaction rolls back automatically on error
  throw error;
} finally {
  client.release();
}
```

---

## 4. Database Client Parameter Convention

### Function Signature Template

```typescript
/**
 * [Function description]
 * @param client - PostgreSQL client (for transaction support)
 * @param [param1] - [Description]
 * @param [param2] - [Description]
 * @returns [Description of return value]
 */
export async function functionName(
  client: any,        // Always first
  param1: Type1,     // Business parameters follow
  param2: Type2,
  ...
): Promise<ReturnType> {
  // Implementation uses client.query()
}
```

### Example: Bracket Generator Functions

```typescript
// Main bracket generation
export async function generateDoubleEliminationBracket(
  client: any,
  categoryId: number,
  teams: Team[]
): Promise<{ teams: number; bracketSize: number; numByes: number; numRounds: number }> {
  // Uses client.query() for all database operations
}

// Secondary function following same pattern
export async function createGrandFinalsMatch2(
  client: any,
  categoryId: number,
  grandFinals1Id: number
): Promise<string> {
  // Uses client.query()
}
```

### TypeScript Types for Client

```typescript
// Use 'any' for flexibility (the actual type is PoolClient)
// Or import the proper type:
import { PoolClient } from 'pg';

export async function functionName(
  client: PoolClient,  // More specific type
  ...
): Promise<...>
```

---

## 5. Complex Algorithm Implementation

### Structure for Complex Logic

Break complex algorithms into clear phases with comments:

```typescript
/**
 * Double Elimination Bracket Generator
 * Generates complete double elimination brackets with winners, losers, and grand finals
 */
export async function generateDoubleEliminationBracket(
  client: any,
  categoryId: number,
  teams: Team[]
): Promise<{ teams: number; bracketSize: number; numByes: number; numRounds: number }> {
  
  // =============
  // VALIDATION
  // =============
  const numTeams = teams.length;
  const MIN_TEAMS = 8;
  if (numTeams < MIN_TEAMS) {
    throw new Error(`Need at least ${MIN_TEAMS} verified teams...`);
  }

  // =============
  // CALCULATION
  // =============
  const bracketSize = nextPowerOf2(numTeams);
  const numByes = bracketSize - numTeams;
  const numRounds = Math.log2(bracketSize);

  // Clear existing matches
  await client.query(`DELETE FROM tournament_matches WHERE "categoryId" = $1`, [categoryId]);

  const winnersMatches: MatchRecord[] = [];
  const losersMatches: MatchRecord[] = [];

  // ============================================
  // PHASE 1: Generate Winners Bracket (Upper)
  // ============================================
  
  // Round 1 - Initial matches with teams
  let teamIdx = 0;
  const round1Matches = bracketSize / 2;
  
  for (let i = 0; i < round1Matches; i++) {
    // Logic for creating matches...
    const result = await client.query(`INSERT INTO ...`, [...]);
    winnersMatches.push({ ... });
  }

  // Subsequent rounds of winners bracket
  for (let round = 2; round <= numRounds; round++) {
    // Logic for subsequent rounds...
  }

  // ============================================
  // PHASE 2: Generate Losers Bracket (Lower)
  // ============================================
  
  // Pattern: alternating between dropping from WB and LB consolidation
  // ... implementation ...

  // ============================================
  // PHASE 3: Generate Grand Finals Match 1
  // ============================================
  
  // ... implementation ...

  // ============================================
  // PHASE 4: Advance Bye Winners
  // ============================================
  
  // ... implementation ...

  // =============
  // CLEANUP
  // =============
  
  // Update category status
  await client.query(`UPDATE tournaments SET status = 'ongoing' WHERE id = $1`, [categoryId]);

  return {
    teams: numTeams,
    bracketSize,
    numByes,
    numRounds
  };
}
```

### Key Principles

1. **Clear Phase Separation**: Use comments to divide into logical phases
2. **Track State**: Use arrays/objects to track created records
3. **Batch Operations**: Group related operations together
4. **Link Relationships**: Update foreign keys/relationships after creation
5. **Return Summary**: Return structured data about what was created

---

## 6. Returning Structured Data

### Return Type Conventions

```typescript
// Simple success with metadata
export async function generateDoubleEliminationBracket(
  client: any,
  categoryId: number,
  teams: Team[]
): Promise<{ 
  teams: number;        // Number of teams processed
  bracketSize: number;  // Total bracket size
  numByes: number;     // Number of bye matches
  numRounds: number;   // Number of rounds generated
}> {
  // ... implementation
  return {
    teams: numTeams,
    bracketSize,
    numByes,
    numRounds
  };
}

// Return created entity IDs
export async function createGrandFinalsMatch2(
  client: any,
  categoryId: number,
  grandFinals1Id: number
): Promise<string> {
  // ... implementation
  return displayId;  // Return the created entity identifier
}

// Return complex objects
export async function generateTournamentStructure(
  client: any,
  tournamentId: number
): Promise<{
  winnersBracket: MatchRecord[];
  losersBracket: MatchRecord[];
  finals: MatchRecord[];
  metadata: {
    totalMatches: number;
    estimatedDuration: number;
  };
}> {
  // ... implementation
}
```

### Benefits of Structured Returns

1. **Testing**: Easy to verify what was created
2. **Logging**: Can log summary statistics
3. **API Responses**: Can return to client
4. **Debugging**: Can inspect structure in development

---

## 7. Complete Code Examples

### Example 1: Bracket Generator (`/lib/bracket-generator.ts`)

```typescript
/**
 * Double Elimination Bracket Generator
 * Generates complete double elimination brackets with winners, losers, and grand finals
 */

import { randomUUID } from 'crypto';

interface Team {
  id: number;
  teamName: string;
}

interface MatchRecord {
  id: number;
  displayId: string;
  round: number;
  matchNumber: number;
  bracket: 'winners' | 'losers' | 'finals';
}

// Internal helper - NOT exported
function nextPowerOf2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Generate complete double elimination bracket
 * @param client - PostgreSQL client for transaction support
 * @param categoryId - Tournament category ID
 * @param teams - Array of verified teams
 * @returns Summary of generated bracket
 */
export async function generateDoubleEliminationBracket(
  client: any,
  categoryId: number,
  teams: Team[]
): Promise<{ teams: number; bracketSize: number; numByes: number; numRounds: number }> {
  const numTeams = teams.length;
  const MIN_TEAMS = 8;
  if (numTeams < MIN_TEAMS) {
    throw new Error(`Need at least ${MIN_TEAMS} verified teams to generate bracket (currently have ${numTeams})`);
  }

  const bracketSize = nextPowerOf2(numTeams);
  const numByes = bracketSize - numTeams;
  const numRounds = Math.log2(bracketSize);

  // Clear existing matches
  await client.query(`DELETE FROM tournament_matches WHERE "categoryId" = $1`, [categoryId]);

  const winnersMatches: MatchRecord[] = [];
  const losersMatches: MatchRecord[] = [];

  // ============================================
  // PHASE 1: Generate Winners Bracket (Upper)
  // ============================================
  
  // Round 1 - Initial matches with teams
  let teamIdx = 0;
  const round1Matches = bracketSize / 2;
  
  for (let i = 0; i < round1Matches; i++) {
    const teamA = teamIdx < numTeams ? teams[teamIdx++] : null;
    const teamB = teamIdx < numTeams ? teams[teamIdx++] : null;
    
    const hasBye = !teamA || !teamB;
    const winnerId = hasBye ? (teamA?.id || teamB?.id || null) : null;
    const displayId = randomUUID();
    
    const result = await client.query(
      `INSERT INTO tournament_matches (
        "categoryId", bracket, round, "matchNumber",
        "teamAId", "teamBId", "isBye", "winnerId", status, "displayId"
      ) VALUES ($1, 'winners', 1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, "displayId", round, "matchNumber"`,
      [
        categoryId, i + 1,
        teamA?.id || null, teamB?.id || null,
        hasBye, winnerId,
        hasBye ? 'completed' : 'pending',
        displayId
      ]
    );

    winnersMatches.push({
      id: result.rows[0].id,
      displayId: result.rows[0].displayId,
      round: 1,
      matchNumber: i + 1,
      bracket: 'winners'
    });
  }

  // Subsequent rounds...
  // [Additional phases for losers bracket, finals, etc.]

  // Update category status
  await client.query(
    `UPDATE tournaments SET status = 'ongoing' WHERE id = $1`,
    [categoryId]
  );

  return {
    teams: numTeams,
    bracketSize,
    numByes,
    numRounds
  };
}

/**
 * Create Grand Finals Match 2 (Bracket Reset)
 * Called dynamically when LB winner defeats WB winner in Match 1
 * @param client - PostgreSQL client for transaction support
 * @param categoryId - Tournament category ID
 * @param grandFinals1Id - ID of Grand Finals Match 1
 * @returns Display ID of created match
 */
export async function createGrandFinalsMatch2(
  client: any,
  categoryId: number,
  grandFinals1Id: number
): Promise<string> {
  const displayId = randomUUID();
  
  const result = await client.query(
    `INSERT INTO tournament_matches (
      "categoryId", bracket, round, "matchNumber", status, "displayId"
    ) VALUES ($1, 'finals', 2, 1, 'pending', $2)
    RETURNING id, "displayId"`,
    [categoryId, displayId]
  );
  
  const grandFinals2Id = result.rows[0].id;
  
  // Link Grand Finals 1 to Grand Finals 2
  await client.query(
    `UPDATE tournament_matches SET "nextMatchWinnersId" = $1 WHERE id = $2`,
    [grandFinals2Id, grandFinals1Id]
  );
  
  return displayId;
}
```

### Example 2: Data Transformer (`/lib/bracket-transform.ts`)

```typescript
/**
 * Transform database matches to @g-loot/react-tournament-brackets format
 */

// Exported type for use in components
export interface DBMatch {
  id: number;
  displayId: string;
  bracket: 'winners' | 'losers' | 'finals';
  round: number;
  matchNumber: number;
  teamAId: number | null;
  teamBId: number | null;
  teamAName: string | null;
  teamBName: string | null;
  winnerId: number | null;
  isBye: boolean;
  status: string;
  nextMatchWinnersId: number | null;
  nextMatchLosersId: number | null;
  scheduledAt: string | null;
  tournamentStartDate: string;
}

// Internal types - NOT exported
interface LibraryParticipant { ... }
interface LibraryMatch { ... }

// Internal helper
function mapStatus(status: string, isBye: boolean): LibraryMatch['state'] {
  if (isBye) return 'WALK_OVER';
  if (status === 'completed') return 'DONE';
  if (status === 'ongoing') return 'SCORE_DONE';
  if (status === 'ready') return 'NO_SHOW';
  return 'NO_PARTY';
}

/**
 * Transform database matches to library format
 * @param matches - Database matches from query
 * @param tournamentStartDate - Optional base date for scheduling
 * @returns Upper and lower bracket matches in library format
 */
export function transformToLibraryFormat(
  matches: DBMatch[],
  tournamentStartDate?: string
): { upper: LibraryMatch[]; lower: LibraryMatch[] } {
  const upper: LibraryMatch[] = [];
  const lower: LibraryMatch[] = [];

  const baseDate = tournamentStartDate ? new Date(tournamentStartDate) : new Date();

  // Process winners bracket (upper)
  const winnersMatches = matches.filter(m => m.bracket === 'winners' || m.bracket === 'finals');

  for (const match of winnersMatches) {
    const isGrandFinals = match.bracket === 'finals';
    const matchDate = new Date(baseDate);
    matchDate.setDate(baseDate.getDate() + (match.round - 1));

    const libraryMatch: LibraryMatch = {
      id: match.displayId,
      name: isGrandFinals
        ? `Grand Finals${match.round === 2 ? ' (Reset)' : ''}`
        : `WB R${match.round} M${match.matchNumber}`,
      // ... rest of transformation
    };

    upper.push(libraryMatch);
  }

  // Process losers bracket (lower)
  const losersMatches = matches.filter(m => m.bracket === 'losers');
  // ... transformation logic

  return { upper, lower };
}
```

### Example 3: API Route Using Business Logic

```typescript
// File: /app/api/brackets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { pool } from '@/lib/db';
import { generateDoubleEliminationBracket } from '@/lib/bracket-generator';

// POST /api/brackets - Generate double elimination bracket
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { categoryId } = await request.json();

  if (!categoryId) {
    return NextResponse.json({ error: 'Category ID required' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    // Get verified teams for this category
    const teamsResult = await client.query(
      `SELECT id, "teamName" FROM registered_teams 
       WHERE "categoryId" = $1 AND "paymentStatus" = 'verified' AND "isDeleted" = false
       ORDER BY "createdAt" ASC`,
      [categoryId]
    );

    const teams = teamsResult.rows;

    // Call the complex logic function, passing the client
    const result = await generateDoubleEliminationBracket(client, parseInt(categoryId), teams);

    return NextResponse.json({ 
      message: 'Double elimination bracket generated successfully',
      ...result
    });
  } catch (error) {
    console.error('Bracket generation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate bracket' 
    }, { status: 500 });
  } finally {
    client.release();
  }
}
```

### Example 4: Component Using Transformed Data

```typescript
// File: /app/admin/brackets/[id]/page.tsx
import { pool } from '@/lib/db';
import { transformToLibraryFormat, DBMatch } from '@/lib/bracket-transform';
import { InteractiveBracket } from '@/components/bracket/InteractiveBracket';

async function getBracket(tournamentId: string): Promise<DBMatch[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT tm.*,
              ta."teamName" as "teamAName",
              tb."teamName" as "teamBName",
              tw."teamName" as "winnerName",
              t.name as "categoryName",
              t."tournamentStartDate" as "tournamentStartDate"
       FROM tournament_matches tm
       LEFT JOIN registered_teams ta ON tm."teamAId" = ta.id
       LEFT JOIN registered_teams tb ON tm."teamBId" = tb.id
       LEFT JOIN registered_teams tw ON tm."winnerId" = tw.id
       JOIN tournaments t ON tm."categoryId" = t.id
       WHERE tm."categoryId" = $1
       ORDER BY tm."bracket", tm."round", tm."matchNumber"`,
      [tournamentId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export default async function BracketDetailPage({ params }: { params: { id: string } }) {
  const matches = await getBracket(params.id);

  if (matches.length === 0) {
    return <div>No bracket generated yet.</div>;
  }

  // Transform data before passing to component
  const tournamentStartDate = matches[0]?.tournamentStartDate;
  const libraryMatches = transformToLibraryFormat(matches, tournamentStartDate);

  // Component receives already-transformed data
  return (
    <InteractiveBracket 
      matches={libraryMatches} 
      categoryId={parseInt(params.id)}
    />
  );
}
```

---

## 8. Checklist for Complex Logic Implementation

Before completing a complex business logic module, verify:

### File Structure
- [ ] File created at `/lib/[domain]-generator.ts` or `/lib/[domain]-transform.ts`
- [ ] File name follows conventions (kebab-case, descriptive)
- [ ] Internal helpers are NOT exported
- [ ] Types and main functions ARE exported

### Function Signatures
- [ ] First parameter is `client: any` (or `PoolClient`)
- [ ] Function has JSDoc comments describing purpose and params
- [ ] Return type is explicitly defined
- [ ] Business parameters follow the client parameter

### Database Operations
- [ ] All queries use the provided `client` parameter
- [ ] No direct imports of `pool` inside the utility function
- [ ] Complex logic is broken into phases with clear comments
- [ ] Error handling is in place for constraint violations

### Integration
- [ ] API routes connect to pool, pass client to utility
- [ ] Components receive already-transformed data
- [ ] Error handling at the API/route level
- [ ] Transactions wrap complex operations when needed

### Testing Considerations
- [ ] Function can be unit tested with a mock client
- [ ] Return values provide enough information for assertions
- [ ] Edge cases are handled (empty arrays, minimums, maximums)

---

## Related Files

- `/lib/db.ts` - Database pool configuration
- `/lib/bracket-generator.ts` - Example complex generator
- `/lib/bracket-transform.ts` - Example data transformer
- `/app/api/brackets/route.ts` - API route using generator
- `/app/admin/brackets/[id]/page.tsx` - Page using transformer
- `.agents/rules/api-layer.md` - API layer patterns

---

## Summary

**Golden Rule**: Complex business logic lives in `/lib/` with these signatures:

```typescript
export async function doComplexThing(
  client: any,           // First: pg client for transactions
  businessParam1: Type,  // Then: business parameters
  businessParam2: Type
): Promise<{ summary: Data }> {  // Return: structured data
  // Implementation uses client.query()
}
```

**Call Pattern** from API routes:

```typescript
const client = await pool.connect();
try {
  const result = await doComplexThing(client, param1, param2);
  return NextResponse.json(result);
} finally {
  client.release();
}
```

This separation enables:
- **Testable** business logic (mock the client)
- **Reusable** algorithms (call from multiple places)
- **Transactional** integrity (all operations in one transaction)
- **Clean** components (receive ready-to-render data)
