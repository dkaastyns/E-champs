import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const teamId = parseInt(id, 10);
  
  if (isNaN(teamId)) {
    return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const countOnly = searchParams.get('count') === 'true';

  const client = await pool.connect();
  try {
    const teamResult = await client.query(
      `SELECT rt.*, t.name as "categoryName", t.slug as "categorySlug"
       FROM registered_teams rt
       INNER JOIN tournaments t ON rt."categoryId" = t.id
       WHERE rt.id = $1 AND rt."isDeleted" = FALSE`,
      [teamId]
    );

    if (teamResult.rows.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const team = teamResult.rows[0];

    const isCaptain = team.captainId === session.user.id;
    const isAdmin = session.user.role === 'admin';

    const memberCheck = await client.query(
      `SELECT 1 FROM team_members WHERE "teamId" = $1 AND "userId" = $2`,
      [teamId, session.user.id]
    );
    const isTeamMember = memberCheck.rows.length > 0;

    if (!isCaptain && !isAdmin && !isTeamMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (countOnly) {
      const countResult = await client.query(
        `SELECT COUNT(*) as count FROM team_members WHERE "teamId" = $1`,
        [teamId]
      );
      return NextResponse.json({ count: parseInt(countResult.rows[0].count, 10) });
    }

    const membersResult = await client.query(
      `SELECT 
        tm.id,
        tm."teamId",
        tm."userId",
        tm.nickname as "nickname",
        tm."gameId",
        tm.role,
        tm."isCaptain",
        tm."createdAt" as "joinedAt",
        u.name as "userName",
        u.email as "userEmail",
        u.image as "userImage"
       FROM team_members tm
       LEFT JOIN "user" u ON tm."userId" = u.id
       WHERE tm."teamId" = $1
       ORDER BY tm."isCaptain" DESC, tm."createdAt" ASC`,
      [teamId]
    );

    return NextResponse.json(membersResult.rows);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  } finally {
    client.release();
  }
}
