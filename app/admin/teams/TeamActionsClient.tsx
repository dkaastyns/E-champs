'use client';

import { useState } from 'react';
import { toast } from 'sonner';
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

interface Team {
  id: number;
  teamName: string;
  categoryName: string;
  captainName: string;
  captainEmail: string;
  paymentStatus: string;
  isDeleted: boolean;
}

interface DialogState {
  isOpen: boolean;
  action: 'verify' | 'withdraw' | 'delete' | 'cleanup' | null;
  team: Team | null;
  estimatedCount: number;
}

interface TeamActionsClientProps {
  teams: Team[];
  pendingCount: number;
}

export default function TeamActionsClient({ teams, pendingCount }: TeamActionsClientProps) {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    action: null,
    team: null,
    estimatedCount: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const openDialog = (action: 'verify' | 'withdraw' | 'delete', team: Team) => {
    setDialog({ isOpen: true, action, team, estimatedCount: 0 });
  };

  const openCleanupDialog = () => {
    setDialog({ isOpen: true, action: 'cleanup', team: null, estimatedCount: pendingCount });
  };

  const closeDialog = () => {
    setDialog({ isOpen: false, action: null, team: null, estimatedCount: 0 });
  };

  const handleConfirm = async () => {
    if (!dialog.action) return;
    
    setIsProcessing(true);
    
      try {
        if (dialog.action === 'cleanup') {
          const response = await fetch('/api/admin/cleanup-spam', { method: 'POST' });
          if (!response.ok) throw new Error('Failed to cleanup spam teams');
          toast.success('Spam teams removed successfully');
          window.location.reload();
          return;
        }

        if (!dialog.team) return;

        switch (dialog.action) {
          case 'verify': {
            const response = await fetch(`/api/admin/verify-payment?id=${dialog.team.id}`, {
              method: 'POST'
            });
            if (!response.ok) throw new Error('Failed to verify payment');
            toast.success(`Payment verified for ${dialog.team.teamName}`);
            break;
          }
          case 'withdraw': {
            const response = await fetch(`/api/teams?id=${dialog.team.id}&reason=Admin%20withdrawal`, {
              method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to withdraw team');
            toast.success(`${dialog.team.teamName} withdrawn successfully`);
            break;
          }
          case 'delete': {
            const response = await fetch(`/api/teams?id=${dialog.team.id}&hard=true`, {
              method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete team');
            toast.success(`${dialog.team.teamName} deleted permanently`);
            break;
          }
        }
        
        window.location.reload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Action failed');
      } finally {
        setIsProcessing(false);
        closeDialog();
      }
    };

  const getDialogContent = () => {
    switch (dialog.action) {
      case 'verify':
        return {
          title: 'Verify Payment?',
          description: `Are you sure you want to verify payment for "${dialog.team?.teamName}"? This will allow them to participate in the tournament.`,
          confirmText: 'Verify',
          destructive: false,
        };
      case 'withdraw':
        return {
          title: 'Withdraw Team?',
          description: `Are you sure you want to withdraw "${dialog.team?.teamName}"? The team will be marked as withdrawn but can be restored later.`,
          confirmText: 'Withdraw',
          destructive: true,
        };
      case 'delete':
        return {
          title: 'Permanently Delete Team?',
          description: `Are you sure you want to permanently delete "${dialog.team?.teamName}"? This action cannot be undone and all team data will be lost.`,
          confirmText: 'Delete Permanently',
          destructive: true,
        };
      case 'cleanup':
        return {
          title: 'Cleanup Spam Teams?',
          description: `This will permanently delete approximately ${dialog.estimatedCount} teams that have been pending for 7+ days. This action cannot be undone.`,
          confirmText: 'Cleanup Spam',
          destructive: true,
        };
      default:
        return { title: '', description: '', confirmText: 'Confirm', destructive: false };
    }
  };

  const dialogContent = getDialogContent();
  const activeTeams = teams.filter((t) => !t.isDeleted);
  const withdrawnTeams = teams.filter((t) => t.isDeleted);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-4">
          <div className="font-[family-name:var(--font-display)] text-3xl text-white">{activeTeams.length}</div>
          <div className="text-gray-500 text-sm font-[family-name:var(--font-body)]">Active Teams</div>
        </div>
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-4">
          <div className="font-[family-name:var(--font-display)] text-3xl text-[#6520EE]">{pendingCount}</div>
          <div className="text-gray-500 text-sm font-[family-name:var(--font-body)]">Pending Payment</div>
        </div>
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-4">
          <div className="font-[family-name:var(--font-display)] text-3xl text-[#2BE900]">{activeTeams.filter((t) => t.paymentStatus === 'verified').length}</div>
          <div className="text-gray-500 text-sm font-[family-name:var(--font-body)]">Verified</div>
        </div>
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-4">
          <div className="font-[family-name:var(--font-display)] text-3xl text-orange-500">{withdrawnTeams.length}</div>
          <div className="text-gray-500 text-sm font-[family-name:var(--font-body)]">Withdrawn</div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={openCleanupDialog}
          disabled={pendingCount === 0}
          className="bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 font-[family-name:var(--font-heading)] transition-colors"
        >
          REMOVE SPAM (7+ days pending)
        </button>
      </div>

      <div className="bg-[#0d0d0d] border border-[#1a1a1a] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1a1a1a]">
              <th className="text-left py-3 px-4 text-gray-400 font-[family-name:var(--font-heading)] text-sm">TEAM</th>
              <th className="text-left py-3 px-4 text-gray-400 font-[family-name:var(--font-heading)] text-sm">CATEGORY</th>
              <th className="text-left py-3 px-4 text-gray-400 font-[family-name:var(--font-heading)] text-sm">CAPTAIN</th>
              <th className="text-left py-3 px-4 text-gray-400 font-[family-name:var(--font-heading)] text-sm">STATUS</th>
              <th className="text-left py-3 px-4 text-gray-400 font-[family-name:var(--font-heading)] text-sm">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className={`border-b border-[#1a1a1a] ${team.isDeleted ? 'opacity-50' : ''}`}>
                <td className="py-4 px-4">
                  <div className="font-[family-name:var(--font-heading)] text-white">{team.teamName}</div>
                  {team.isDeleted && <div className="text-orange-500 text-xs">Withdrawn</div>}
                </td>
                <td className="py-4 px-4 font-[family-name:var(--font-body)] text-gray-400">
                  {team.categoryName}
                </td>
                <td className="py-4 px-4">
                  <div className="text-white">{team.captainName}</div>
                  <div className="text-gray-500 text-sm">{team.captainEmail}</div>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 text-xs font-bold ${
                    team.paymentStatus === 'verified' 
                      ? 'bg-[#2BE900]/20 text-[#2BE900]' 
                      : team.paymentStatus === 'paid'
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {team.paymentStatus.toUpperCase()}
                  </span>
                </td>
                <td className="py-4 px-4">
                  {!team.isDeleted && (
                    <div className="flex gap-2">
                      {team.paymentStatus === 'paid' && (
                        <button
                          onClick={() => openDialog('verify', team)}
                          className="bg-[#2BE900]/20 text-[#2BE900] hover:bg-[#2BE900]/30 px-3 py-1 text-sm font-[family-name:var(--font-heading)]"
                        >
                          VERIFY
                        </button>
                      )}
                      <button
                        onClick={() => openDialog('withdraw', team)}
                        className="bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 px-3 py-1 text-sm font-[family-name:var(--font-heading)]"
                      >
                        WITHDRAW
                      </button>
                      {team.paymentStatus === 'pending' && (
                        <button
                          onClick={() => openDialog('delete', team)}
                          className="bg-red-500/20 text-red-500 hover:bg-red-500/30 px-3 py-1 text-sm font-[family-name:var(--font-heading)]"
                        >
                          DELETE (SPAM)
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={dialog.isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDialog} disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              disabled={isProcessing}
              className={dialogContent.destructive ? 'bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50' : ''}
            >
              {isProcessing ? 'Processing...' : dialogContent.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
