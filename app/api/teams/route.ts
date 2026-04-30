import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('category');
  
  const client = await pool.connect();
  try {
    let query = `
      SELECT rt.*, t.name as "categoryName", t.slug as "categorySlug"
      FROM registered_teams rt
      JOIN tournaments t ON rt."categoryId" = t.id
      WHERE rt."isDeleted" = false
    `;
    const params: string[] = [];

    if (session.user.role !== 'admin') {
      query += ` AND rt."captainId" = $1`;
      params.push(session.user.id);
    }

    if (categoryId) {
      query += ` AND rt."categoryId" = $${params.length + 1}`;
      params.push(categoryId);
    }

    query += ` ORDER BY rt."createdAt" DESC`;
    
    const result = await client.query(query, params);
    return NextResponse.json(result.rows);
  } finally {
    client.release();
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

    const body = await request.json();
    const { teamName, categoryId, teamMembers, contactEmail, contactPhone, paymentProofUrl } = body;

    const client = await pool.connect();
    try {
      const existingResult = await client.query(
        `SELECT * FROM registered_teams WHERE "captainId" = $1 AND "categoryId" = $2 AND "isDeleted" = false`,
        [session.user.id, categoryId]
      );

      if (existingResult.rows.length > 0) {
        return NextResponse.json({ error: 'You already have a team in this category' }, { status: 400 });
      }

      const nameResult = await client.query(
        `SELECT * FROM registered_teams WHERE "teamName" = $1 AND "categoryId" = $2 AND "isDeleted" = false`,
        [teamName, categoryId]
      );

      if (nameResult.rows.length > 0) {
        return NextResponse.json({ error: 'Team name already exists in this category' }, { status: 400 });
      }

      const result = await client.query(
        `INSERT INTO registered_teams ("teamName", "captainId", "categoryId", "contactEmail", "contactPhone", "paymentProofUrl", "paymentStatus")
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')
         RETURNING *`,
        [teamName, session.user.id, categoryId, contactEmail, contactPhone, paymentProofUrl]
      );

      const team = result.rows[0];

      if (teamMembers && teamMembers.length > 0) {
        for (const member of teamMembers) {
          await client.query(
            `INSERT INTO team_members ("teamId", "userId", "nickname", "role")
             VALUES ($1, $2, $3, $4)`,
            [team.id, member.userId, member.nickname, member.role || 'member']
          );
        }
      }

      return NextResponse.json(team, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to register team' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('id');
  const reason = searchParams.get('reason') || 'Team withdrawal';
  const hardDelete = searchParams.get('hard') === 'true';

  if (!teamId) {
    return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const teamResult = await client.query(
      `SELECT * FROM registered_teams WHERE id = $1`,
      [teamId]
    );

    if (teamResult.rows.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const team = teamResult.rows[0];

    if (team.captainId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (hardDelete && session.user.role === 'admin') {
      await client.query(`DELETE FROM registered_teams WHERE id = $1`, [teamId]);
      return NextResponse.json({ message: 'Team hard deleted' });
    } else {
      await client.query(
        `UPDATE registered_teams
         SET "isDeleted" = true, "deletedAt" = CURRENT_TIMESTAMP, "deletedReason" = $2
         WHERE id = $1`,
        [teamId, reason]
      );
      return NextResponse.json({ message: 'Team withdrawn successfully' });
    }
  } finally {
    client.release();
  }
}
