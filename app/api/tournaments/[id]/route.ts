import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { pool } from '@/lib/db';

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
    const teamsResult = await client.query(
      `SELECT COUNT(*) FROM registered_teams WHERE "categoryId" = $1`,
      [tournamentId]
    );

    const teamCount = parseInt(teamsResult.rows[0].count);
    if (teamCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${teamCount} team(s) registered in this tournament` },
        { status: 409 }
      );
    }

    const matchesResult = await client.query(
      `SELECT COUNT(*) FROM tournament_matches WHERE "categoryId" = $1`,
      [tournamentId]
    );

    const matchCount = parseInt(matchesResult.rows[0].count);
    if (matchCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${matchCount} match(es) exist for this tournament` },
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