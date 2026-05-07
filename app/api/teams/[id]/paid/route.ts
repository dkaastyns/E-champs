import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { pool } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: teamId } = await params;

  if (!teamId) {
    return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    // Check if user is captain of the team
    const teamResult = await client.query(
      `SELECT "captainId", "paymentStatus" FROM registered_teams WHERE id = $1 AND "isDeleted" = false`,
      [teamId]
    );

    if (teamResult.rows.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const team = teamResult.rows[0];
    
    if (team.captainId !== session.user.id) {
      return NextResponse.json({ error: 'Only team captain can mark as paid' }, { status: 403 });
    }

    if (team.paymentStatus !== 'pending') {
      return NextResponse.json({ 
        error: `Team is already ${team.paymentStatus}` 
      }, { status: 400 });
    }

    // Update payment status to 'paid'
    await client.query(
      `UPDATE registered_teams 
       SET "paymentStatus" = 'paid', "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [teamId]
    );

    return NextResponse.json({ message: 'Team marked as paid' });
  } finally {
    client.release();
  }
}
