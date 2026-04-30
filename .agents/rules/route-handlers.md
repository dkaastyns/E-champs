# Next.js Route Handler Pattern

> **Rule**: All API routes in this codebase use Next.js App Router Route Handlers with PostgreSQL (pg Pool) and Better Auth for authentication.

---

## 1. File Structure

Route handlers are organized under `app/api/` using the Next.js App Router conventions:

```
app/api/
├── auth/[...all]/route.ts      # Better Auth handler
├── tournaments/
│   ├── route.ts                # GET, POST /api/tournaments
│   └── [id]/
│       └── route.ts            # PUT, DELETE /api/tournaments/[id]
├── admin/
│   ├── ban/route.ts            # POST /api/admin/ban
│   └── promote/route.ts        # POST /api/admin/promote
└── teams/
    ├── route.ts                # Team operations
    └── [id]/members/route.ts   # Member operations for specific team
```

### File Naming Conventions

| Pattern | Use Case |
|---------|----------|
| `route.ts` | Defines HTTP handlers for the route |
| `[id]/route.ts` | Dynamic route parameter (tournament ID, team ID) |
| `[...all]` | Catch-all route (used for Better Auth) |
| `route.ts` exports | Named exports: `GET`, `POST`, `PUT`, `DELETE` |

---

## 2. Standard Imports

Every route handler must import:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { pool } from '@/lib/db';
```

### Import Reference

| Import | Purpose |
|--------|---------|
| `NextRequest, NextResponse` | Next.js server types |
| `auth` | Better Auth instance for session validation |
| `headers` | Access request headers for auth |
| `pool` | PostgreSQL connection pool |

---

## 3. Auth Pattern (Better Auth)

### Session Validation

All protected routes must validate the session before processing:

```typescript
// Validate session
const session = await auth.api.getSession({ headers: await headers() });

// Check if session exists
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Check role for admin-only routes
if (session.user.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Session Object Structure

```typescript
{
  user: {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    banned: boolean;
    banReason: string | null;
    // ... other fields
  },
  session: {
    id: string;
    // ... session metadata
  }
}
```

### Auth Pattern Rules

1. **Always await headers()**: `auth.api.getSession({ headers: await headers() })`
2. **Check session first**: Return 401 if no session
3. **Check role for admin routes**: Return 403 if not admin
4. **Use strict equality**: `session.user.role !== 'admin'`

---

## 4. Role-Based Access Control

### Admin-Only Route Pattern

```typescript
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  // ... protected logic
}
```

### Role Values

| Role | Description |
|------|-------------|
| `user` | Regular authenticated user |
| `admin` | Administrator with elevated privileges |

### Access Patterns

| Endpoint Type | Status Codes |
|--------------|--------------|
| No session | 401 Unauthorized |
| Non-admin accessing admin route | 403 Forbidden |
| Admin accessing admin route | 200 OK |

---

## 5. Request Body Parsing

### JSON Request Body

Standard pattern for JSON API requests:

```typescript
const body = await request.json();
const { field1, field2 } = body;
```

### Form Data Request Body

For form submissions (flexible parsing):

```typescript
const text = await request.text();
let body: Record<string, string>;
try {
  body = JSON.parse(text);
} catch {
  body = Object.fromEntries(new URLSearchParams(text));
}
const { field1, field2 } = body;
```

### Input Validation

```typescript
if (!field1 || !field2) {
  return NextResponse.json({ error: 'Field1 and field2 are required' }, { status: 400 });
}

if (typeof value !== 'boolean') {
  return NextResponse.json({ error: 'Value must be boolean' }, { status: 400 });
}
```

### Query Parameters (GET)

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('category');
  
  if (!categoryId) {
    return NextResponse.json({ error: 'Category ID required' }, { status: 400 });
  }
  
  // ... use categoryId
}
```

### Dynamic Route Parameters

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = parseInt(id);
  
  if (isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }
  
  // ... use numericId
}
```

---

## 6. Database Operations with pg Pool

### Connection Management

Always use the pool with proper client release:

```typescript
const client = await pool.connect();
try {
  // ... database operations
} finally {
  client.release();
}
```

### Query Patterns

#### SELECT Query

```typescript
const result = await client.query(
  `SELECT t.*, COALESCE(tm.team_count, 0) as team_count
   FROM tournaments t
   LEFT JOIN (SELECT "categoryId", COUNT(*) as team_count 
              FROM registered_teams 
              WHERE "isDeleted" = false 
              GROUP BY "categoryId") tm ON t.id = tm."categoryId"
   ORDER BY t."tournamentStartDate" ASC`
);
return NextResponse.json(result.rows);
```

#### INSERT with RETURNING

```typescript
const result = await client.query(
  `INSERT INTO tournaments (name, slug, description, "maxTeams", "teamSize")
   VALUES ($1, $2, $3, $4, $5)
   RETURNING *`,
  [name, slug, description, maxTeams, teamSize]
);
return NextResponse.json(result.rows[0], { status: 201 });
```

#### UPDATE with Check

```typescript
const result = await client.query(
  `UPDATE tournaments 
   SET name = $1, slug = $2, description = $3
   WHERE id = $4
   RETURNING *`,
  [name, slug, description, tournamentId]
);

if (result.rows.length === 0) {
  return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
}

return NextResponse.json(result.rows[0]);
```

#### DELETE with Dependencies Check

```typescript
// Check for dependent records first
const teamsResult = await client.query(
  `SELECT COUNT(*) FROM registered_teams WHERE "categoryId" = $1`,
  [tournamentId]
);

const teamCount = parseInt(teamsResult.rows[0].count);
if (teamCount > 0) {
  return NextResponse.json(
    { error: `Cannot delete: ${teamCount} team(s) exist` },
    { status: 409 }
  );
}

await client.query(`DELETE FROM tournaments WHERE id = $1`, [tournamentId]);
return NextResponse.json({ message: 'Tournament deleted successfully' });
```

### SQL Naming Conventions

- **CamelCase columns in quotes**: `"categoryId"`, `"teamAId"`, `"maxTeams"`
- **snake_case columns unquoted**: `name`, `slug`, `status`, `created_at`
- **Always check quote usage**: PostgreSQL is case-sensitive with quoted identifiers

---

## 7. Error Handling & HTTP Status Codes

### Status Code Reference

| Status | Meaning | Use Case |
|--------|---------|----------|
| 200 OK | Success | Standard successful response |
| 201 Created | Resource created | POST creating new resource |
| 400 Bad Request | Invalid input | Missing fields, invalid format, validation errors |
| 401 Unauthorized | Not authenticated | No valid session |
| 403 Forbidden | No permission | Admin-only route accessed by user |
| 404 Not Found | Resource not found | ID doesn't exist in database |
| 409 Conflict | Resource conflict | Cannot delete due to dependencies |
| 500 Internal Server Error | Server error | Database errors, unexpected exceptions |

### Error Response Format

```typescript
// Standard error
return NextResponse.json({ error: 'Error message' }, { status: 400 });

// With context
return NextResponse.json(
  { error: 'Cannot delete: 3 team(s) exist for this tournament' },
  { status: 409 }
);
```

### Error Handling Pattern

```typescript
try {
  // ... database operation
} catch (error) {
  console.error('Operation error:', error);
  return NextResponse.json({ 
    error: error instanceof Error ? error.message : 'Failed to perform operation' 
  }, { status: 500 });
} finally {
  client.release();
}
```

### Critical Error Handling Rules

1. **Always release client in `finally` block**
2. **Log errors with context**: `console.error('Specific action:', error)`
3. **Return user-friendly messages**: Don't expose internal error details
4. **Preserve specific error messages** when helpful: `error.message`

---

## 8. Response Patterns

### Success Responses

```typescript
// Single object
return NextResponse.json(result.rows[0]);

// Array of objects
return NextResponse.json(result.rows);

// Created resource (201)
return NextResponse.json(result.rows[0], { status: 201 });

// With message
return NextResponse.json({ message: 'Operation successful' });

// With additional data
return NextResponse.json({ 
  message: 'Operation successful',
  data: result.rows[0] 
});

// Complex response
return NextResponse.json({ 
  message: 'Bracket generated',
  matchesCreated: count,
  teamsCount: teams.length
});
```

### Error Responses

```typescript
// Simple error
return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

// Validation error
return NextResponse.json({ 
  error: 'Validation failed',
  details: 'Field1 is required'
}, { status: 400 });

// Auth errors
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

// Conflict error
return NextResponse.json({ 
  error: 'Cannot delete: 3 team(s) registered' 
}, { status: 409 });
```

---

## 9. Code Examples

### Complete GET Handler (Public)

```typescript
import { NextResponse } from 'next/server';
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
```

### Complete POST Handler (Admin Only)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { pool } from '@/lib/db';

// POST /api/tournaments - Create new tournament (admin only)
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const { name, slug, description, maxTeams } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO tournaments (name, slug, description, "maxTeams")
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, slug, description, maxTeams]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Create tournament error:', error);
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 });
  } finally {
    client.release();
  }
}
```

### Complete PUT Handler (Admin + Dynamic Route)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { pool } from '@/lib/db';

// PUT /api/tournaments/[id] - Update tournament (admin only)
export async function PUT(
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

  const body = await request.json();
  const { name, description, status } = body;

  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE tournaments 
       SET name = $1, description = $2, status = $3
       WHERE id = $4
       RETURNING *`,
      [name, description, status, tournamentId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Update tournament error:', error);
    return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 });
  } finally {
    client.release();
  }
}
```

### Complete DELETE Handler (Admin + Dependency Check)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { pool } from '@/lib/db';

// DELETE /api/tournaments/[id] - Delete tournament (admin only)
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
    // Check for dependent records
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
  } catch (error) {
    console.error('Delete tournament error:', error);
    return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 });
  } finally {
    client.release();
  }
}
```

### GET with Query Parameters

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// GET /api/matches?category=123
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('category');
  
  if (!categoryId) {
    return NextResponse.json({ error: 'Category ID required' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM tournament_matches WHERE "categoryId" = $1`,
      [categoryId]
    );
    return NextResponse.json(result.rows);
  } finally {
    client.release();
  }
}
```

### Session Validation Pattern

```typescript
// Simple session check
const session = await auth.api.getSession({ headers: await headers() });
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Admin check
const session = await auth.api.getSession({ headers: await headers() });
if (!session || session.user.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Access user data
const userId = session.user.id;
const userRole = session.user.role;
```

---

## 10. Best Practices Checklist

### When Creating New Route Handlers

- [ ] Use correct imports (`NextRequest`, `NextResponse`, `auth`, `headers`, `pool`)
- [ ] Add auth check for protected routes (admin check after session check)
- [ ] Validate all required body/query parameters
- [ ] Validate dynamic route parameters with `parseInt` + `isNaN` check
- [ ] Use parameterized queries (`$1`, `$2`) - never interpolate SQL
- [ ] Always wrap DB operations in `try`/`finally` with `client.release()`
- [ ] Return appropriate HTTP status codes
- [ ] Return JSON error responses with clear messages
- [ ] Log errors with context before returning 500
- [ ] Quote camelCase column names in SQL

### Security Checklist

- [ ] Session validation happens before any data access
- [ ] Role checks use strict equality: `!== 'admin'`
- [ ] No SQL injection (parameterized queries only)
- [ ] Input validation before DB operations
- [ ] Resource existence check before update/delete
- [ ] Dependency check before delete operations

### Performance Checklist

- [ ] Client released in `finally` block
- [ ] Use `RETURNING *` to avoid second query
- [ ] Add appropriate indexes for queried columns
- [ ] Consider pagination for large result sets

---

## 11. Common Patterns

### Transaction Pattern

```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  // ... multiple queries
  await client.query('INSERT INTO ...');
  await client.query('UPDATE ...');
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### Batch Operations

```typescript
// Insert multiple rows
const values = items.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(',');
const flatParams = items.flatMap(item => [item.a, item.b]);
await client.query(
  `INSERT INTO table (col_a, col_b) VALUES ${values}`,
  flatParams
);
```

---

## 12. Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "relation does not exist" | Check table name spelling and schema |
| "column does not exist" | Check column name, use quotes for camelCase |
| "undefined" in response | Check `result.rows[0]` exists before accessing |
| Auth always failing | Ensure `await headers()` is used |
| 500 without details | Check console logs for error details |
| Client not released | Always use `finally { client.release() }` |

### Debug Pattern

```typescript
// Add temporary logging
try {
  console.log('Request body:', body);
  console.log('Session:', session);
  // ... operations
} catch (error) {
  console.error('Full error:', error);
  // ... error response
}
```

---

## Reference Files

- **Auth config**: `lib/auth.ts` - Better Auth configuration
- **Database**: `lib/db.ts` - pg Pool configuration
- **Example routes**: `app/api/tournaments/route.ts` - Full CRUD patterns
