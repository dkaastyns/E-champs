import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const { userId, banned, banReason } = body;

  if (!userId || typeof banned !== 'boolean') {
    return NextResponse.json({ error: 'User ID and banned status required' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE "user" SET banned = $1, "banReason" = $2 WHERE id = $3`,
      [banned, banReason || null, userId]
    );
    return NextResponse.json({ message: banned ? 'User banned' : 'User unbanned' });
  } catch {
    return NextResponse.json({ error: 'Failed to update ban status' }, { status: 500 });
  } finally {
    client.release();
  }
}
