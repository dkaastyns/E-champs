import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  banned: boolean;
  banReason: string | null;
  createdAt: string;
}

export async function promoteUser(userId: string, role: 'user' | 'admin'): Promise<void> {
  const response = await fetch('/api/admin/promote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, role }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update user role');
  }

  queryClient.invalidateQueries({ queryKey: queryKeys.users.list() });
}

export async function banUser(userId: string, banned: boolean, banReason?: string): Promise<void> {
  const response = await fetch('/api/admin/ban', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, banned, banReason }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update ban status');
  }

  queryClient.invalidateQueries({ queryKey: queryKeys.users.list() });
}
