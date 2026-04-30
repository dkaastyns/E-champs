import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { pool } from '@/lib/db';

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

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
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