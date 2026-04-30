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
  const { userId, role } = body;

  if (!userId || !role) {
    return NextResponse.json({ error: 'User ID and role required' }, { status: 400 });
  }

  if (!['user', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE "user" SET role = $1 WHERE id = $2`,
      [role, userId]
    );
    return NextResponse.json({ message: 'Role updated successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  } finally {
    client.release();
  }
}
