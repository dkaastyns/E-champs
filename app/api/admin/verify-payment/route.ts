import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('id');

  if (!teamId) {
    return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE registered_teams
       SET "paymentStatus" = 'verified', "paymentVerifiedAt" = CURRENT_TIMESTAMP, "paymentVerifiedBy" = $2
       WHERE id = $1`,
      [teamId, session.user.id]
    );
    return NextResponse.json({ message: 'Payment verified' });
  } finally {
    client.release();
  }
}
