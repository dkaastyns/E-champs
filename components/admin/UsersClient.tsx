'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { usePromoteUser, useBanUser } from '@/lib/hooks';
import { PageTransition, RevealOnScroll } from '@/components/ui/page-transition';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  createdAt: string;
}

interface ConfirmationDialog {
  isOpen: boolean;
  user: AdminUser | null;
  action: 'promote' | 'demote' | 'ban' | 'unban' | null;
  banReason: string;
}

export default function UsersClient({ users: initialUsers }: { users: AdminUser[] }) {
  const promoteUserMutation = usePromoteUser();
  const banUserMutation = useBanUser();
  const [dialog, setDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    user: null,
    action: null,
    banReason: '',
  });

  const openPromoteDialog = (user: AdminUser) => {
    const action = user.role === 'admin' ? 'demote' : 'promote';
    setDialog({ isOpen: true, user, action, banReason: '' });
  };

  const openBanDialog = (user: AdminUser) => {
    const action = user.banned ? 'unban' : 'ban';
    setDialog({ isOpen: true, user, action, banReason: '' });
  };

  const closeDialog = () => {
    setDialog({ isOpen: false, user: null, action: null, banReason: '' });
  };

  const handleConfirm = async () => {
    if (!dialog.user || !dialog.action) return;

    if (dialog.action === 'promote' || dialog.action === 'demote') {
      const newRole = dialog.action === 'promote' ? 'admin' : 'user';
      toast.promise(
        promoteUserMutation.mutateAsync({ userId: dialog.user.id, role: newRole }),
        {
          loading: 'Updating role...',
          success: `User ${dialog.action === 'promote' ? 'promoted to admin' : 'demoted to user'}`,
          error: 'Failed to update role',
        }
      );
    } else {
      const newBanned = dialog.action === 'ban';
      const banReason = newBanned ? dialog.banReason || undefined : undefined;
      toast.promise(
        banUserMutation.mutateAsync({ userId: dialog.user.id, banned: newBanned, banReason }),
        {
          loading: 'Updating ban status...',
          success: `User ${newBanned ? 'banned' : 'unbanned'}`,
          error: 'Failed to update ban status',
        }
      );
    }

    closeDialog();
  };

  const getDialogContent = () => {
    if (!dialog.user || !dialog.action) return { title: '', description: '' };

    switch (dialog.action) {
      case 'promote':
        return {
          title: 'Promote to Admin?',
          description: `Are you sure you want to promote ${dialog.user.name} to admin? They will have full access to all admin features.`,
        };
      case 'demote':
        return {
          title: 'Demote to User?',
          description: `Are you sure you want to demote ${dialog.user.name} to user? They will lose all admin privileges.`,
        };
      case 'ban':
        return {
          title: 'Ban User?',
          description: `Are you sure you want to ban ${dialog.user.name}? They will lose access to their account and be unable to login.`,
        };
      case 'unban':
        return {
          title: 'Unban User?',
          description: `Are you sure you want to unban ${dialog.user.name}? They will regain access to their account.`,
        };
    }
  };

  const dialogContent = getDialogContent();

  return (
    <PageTransition className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase">USERS</h1>
        <p className="font-[family-name:var(--font-body)] text-gray-400 mt-2">Manage user accounts.</p>
      </div>

      <RevealOnScroll delay={100}>
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1a1a1a]">
              <th className="text-left py-3 px-4 text-gray-400 font-[family-name:var(--font-heading)] text-sm">USER</th>
              <th className="text-left py-3 px-4 text-gray-400 font-[family-name:var(--font-heading)] text-sm">EMAIL</th>
              <th className="text-left py-3 px-4 text-gray-400 font-[family-name:var(--font-heading)] text-sm">ROLE</th>
              <th className="text-left py-3 px-4 text-gray-400 font-[family-name:var(--font-heading)] text-sm">STATUS</th>
              <th className="text-left py-3 px-4 text-gray-400 font-[family-name:var(--font-heading)] text-sm">JOINED</th>
              <th className="text-left py-3 px-4 text-gray-400 font-[family-name:var(--font-heading)] text-sm">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {initialUsers.map((user) => (
              <tr key={user.id} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#6520EE] flex items-center justify-center text-white font-bold text-sm">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="font-[family-name:var(--font-heading)] text-white">{user.name}</div>
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-400 font-[family-name:var(--font-body)]">{user.email}</td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 text-xs font-bold ${
                    user.role === 'admin'
                      ? 'bg-[#6520EE]/20 text-[#6520EE]'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {(user.role || 'USER').toUpperCase()}
                  </span>
                </td>
                <td className="py-4 px-4">
                  {user.banned && (
                    <span className="px-2 py-1 text-xs font-bold bg-red-500/20 text-red-500">BANNED</span>
                  )}
                  {!user.banned && (
                    <span className="px-2 py-1 text-xs font-bold bg-[#2BE900]/20 text-[#2BE900]">ACTIVE</span>
                  )}
                </td>
                <td className="py-4 px-4 text-gray-400 text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="py-4 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openPromoteDialog(user)}
                      disabled={promoteUserMutation.isPending}
                      className={`px-3 py-1 text-sm font-[family-name:var(--font-heading)] transition-colors disabled:opacity-50 cursor-pointer ${
                        user.role === 'admin'
                          ? 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/30'
                          : 'bg-[#6520EE]/20 text-[#6520EE] hover:bg-[#6520EE]/30'
                      }`}
                    >
                      {user.role === 'admin' ? 'DEMOTE' : 'PROMOTE'}
                    </button>
                    <button
                      onClick={() => openBanDialog(user)}
                      disabled={banUserMutation.isPending}
                      className={`px-3 py-1 text-sm font-[family-name:var(--font-heading)] transition-colors disabled:opacity-50 cursor-pointer ${
                        user.banned
                          ? 'bg-[#2BE900]/20 text-[#2BE900] hover:bg-[#2BE900]/30'
                          : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                      }`}
                    >
                      {user.banned ? 'UNBAN' : 'BAN'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </RevealOnScroll>

      {initialUsers.length === 0 && (
        <RevealOnScroll delay={200}>
        <div className="text-center py-12 bg-[#0d0d0d] border border-[#1a1a1a]">
          <p className="text-gray-400">No users found.</p>
        </div>
        </RevealOnScroll>
      )}

      <AlertDialog open={dialog.isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
          </AlertDialogHeader>
          {dialog.action === 'ban' && (
            <div className="my-4">
              <label htmlFor="banReason" className="block text-sm text-gray-400 mb-2">
                Ban Reason (optional)
              </label>
              <textarea
                id="banReason"
                value={dialog.banReason}
                onChange={(e) => setDialog({ ...dialog, banReason: e.target.value })}
                placeholder="Enter reason for ban..."
                className="w-full bg-[#0d0d0d] border border-[#1a1a1a] text-white px-3 py-2 text-sm focus:border-[#6520EE] focus:outline-none resize-none"
                rows={3}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={dialog.action === 'ban' ? 'bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50' : ''}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
