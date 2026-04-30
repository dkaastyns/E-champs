import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { pool } from '@/lib/db';

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `DELETE FROM registered_teams
       WHERE "paymentStatus" = 'pending'
         AND "createdAt" < NOW() - INTERVAL '7 days'
       RETURNING id, "teamName"`
    );
    return NextResponse.json({ 
      message: `Deleted ${result.rowCount} spam registrations`,
      teams: result.rows 
    });
  } finally {
    client.release();
  }
}
