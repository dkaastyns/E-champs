'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useTeams, useWithdrawTeam, useMarkTeamAsPaid } from '@/lib/hooks';
import { useState } from 'react';
import type { Team } from '@/lib/api';
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
import { PageTransition, RevealOnScroll } from '@/components/ui/page-transition';

interface DialogState {
  isOpen: boolean;
  teamId: number | null;
  teamName: string;
}

interface PaidDialogState {
  isOpen: boolean;
  teamId: number | null;
  teamName: string;
}

/** Status badge color mapping */
const statusColors: Record<string, string> = {
  verified: 'bg-[#2BE900]/20 text-[#2BE900]',
  paid:     'bg-yellow-500/20 text-yellow-500',
};

export default function MyTeamsPage() {
  const { data: teams = [], isLoading } = useTeams();
  const withdrawTeamMutation = useWithdrawTeam();
  const markTeamAsPaidMutation = useMarkTeamAsPaid();
  const [dialog, setDialog] = useState<DialogState>({ isOpen: false, teamId: null, teamName: '' });
  const [paidDialog, setPaidDialog] = useState<PaidDialogState>({ isOpen: false, teamId: null, teamName: '' });

  function openWithdrawDialog(team: Team) {
    setDialog({ isOpen: true, teamId: team.id, teamName: team.teamName });
  }

  function closeDialog() {
    setDialog({ isOpen: false, teamId: null, teamName: '' });
  }

  function openPaidDialog(team: Team) {
    setPaidDialog({ isOpen: true, teamId: team.id, teamName: team.teamName });
  }

  function closePaidDialog() {
    setPaidDialog({ isOpen: false, teamId: null, teamName: '' });
  }

  const handleWithdraw = async () => {
    if (!dialog.teamId) return;
    toast.promise(
      withdrawTeamMutation.mutateAsync({ teamId: dialog.teamId, reason: 'Team withdrawal' }),
      {
        loading: 'Withdrawing team...',
        success: () => { closeDialog(); return 'Team withdrawn successfully'; },
        error: (err: Error) => { closeDialog(); return err.message || 'Failed to withdraw team'; },
      }
    );
  };

  const handleMarkAsPaid = async () => {
    if (!paidDialog.teamId) return;
    toast.promise(
      markTeamAsPaidMutation.mutateAsync(paidDialog.teamId),
      {
        loading: 'Marking team as paid...',
        success: () => { closePaidDialog(); return 'Team marked as paid. Awaiting admin verification.'; },
        error: (err: Error) => { closePaidDialog(); return err.message || 'Failed to mark team as paid'; },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#0d0d0d] border border-[#1a1a1a] p-6 h-24 rounded" />
        ))}
      </div>
    );
  }

  const activeTeams    = teams.filter((t: Team) => !t.isDeleted);
  const withdrawnTeams = teams.filter((t: Team) =>  t.isDeleted);

  return (
    <PageTransition className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase mb-2">MY TEAMS</h1>
        <p className="font-[family-name:var(--font-body)] text-gray-400">Manage your tournament registrations.</p>
      </div>

      {/* Empty state */}
      {activeTeams.length === 0 && withdrawnTeams.length === 0 && (
        <RevealOnScroll>
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-8 text-center transition-all duration-300 hover:border-[#6520EE]/30 hover:shadow-[0_0_20px_rgba(101,32,238,0.1)]">
            <p className="text-gray-400 mb-4">You haven&apos;t registered any teams yet.</p>
            <Link
              href="/tournaments"
              className="btn-press bg-[#6520EE] hover:bg-[#7c3aed] text-white font-bold px-6 py-3 inline-block transition-all hover:shadow-[0_0_16px_rgba(101,32,238,0.4)]"
            >
              BROWSE TOURNAMENTS
            </Link>
          </div>
        </RevealOnScroll>
      )}

      {/* Active teams */}
      {activeTeams.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-[family-name:var(--font-heading)] text-xl text-white">Active Teams</h2>
          {activeTeams.map((team: Team, i: number) => (
            <RevealOnScroll key={team.id} delay={i * 80}>
              <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-6 card-hover-glow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-[family-name:var(--font-display)] text-2xl text-white">{team.teamName}</h3>
                      <span className={`px-2 py-1 text-xs font-bold ${statusColors[team.paymentStatus] ?? 'bg-gray-500/20 text-gray-400'}`}>
                        {team.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-400 font-[family-name:var(--font-body)]">{team.categoryName}</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Registered: {new Date(team.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {team.paymentStatus === 'pending' && (
                      <button
                        onClick={() => openPaidDialog(team)}
                        disabled={markTeamAsPaidMutation.isPending}
                        className="btn-press bg-[#6520EE]/20 text-[#6520EE] hover:bg-[#6520EE]/30 px-4 py-2 font-[family-name:var(--font-heading)] text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_12px_rgba(101,32,238,0.3)]"
                      >
                        {markTeamAsPaidMutation.isPending ? 'PROCESSING...' : 'MARK AS PAID'}
                      </button>
                    )}
                    <button
                      onClick={() => openWithdrawDialog(team)}
                      disabled={withdrawTeamMutation.isPending}
                      className="btn-press bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 px-4 py-2 font-[family-name:var(--font-heading)] text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_12px_rgba(249,115,22,0.3)]"
                    >
                      {withdrawTeamMutation.isPending ? 'WITHDRAWING...' : 'WITHDRAW'}
                    </button>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      )}

      {/* Withdrawn teams */}
      {withdrawnTeams.length > 0 && (
        <RevealOnScroll>
          <div className="space-y-4">
            <h2 className="font-[family-name:var(--font-heading)] text-xl text-gray-500">Withdrawn Teams</h2>
            {withdrawnTeams.map((team: Team) => (
              <div key={team.id} className="bg-[#0d0d0d] border border-[#1a1a1a] p-6 opacity-50">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl text-white line-through">{team.teamName}</h3>
                  <span className="text-orange-500 text-xs">WITHDRAWN</span>
                </div>
                <p className="text-gray-400 font-[family-name:var(--font-body)]">{team.categoryName}</p>
                <p className="text-gray-600 text-sm mt-1">Reason: {team.deletedReason}</p>
              </div>
            ))}
          </div>
        </RevealOnScroll>
      )}

      {/* Withdraw confirmation dialog */}
      <AlertDialog open={dialog.isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Team?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw &quot;{dialog.teamName}&quot;?
              <br /><br />
              This will remove your team from the tournament. You may be able to re-register depending on the tournament rules.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDialog} disabled={withdrawTeamMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWithdraw}
              disabled={withdrawTeamMutation.isPending}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50"
            >
              {withdrawTeamMutation.isPending ? 'Withdrawing...' : 'Withdraw Team'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Paid confirmation dialog */}
      <AlertDialog open={paidDialog.isOpen} onOpenChange={(open) => !open && closePaidDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Team as Paid?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm you have completed the payment for &quot;{paidDialog.teamName}&quot;.
              <br /><br />
              This will notify the admin for verification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closePaidDialog} disabled={markTeamAsPaidMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkAsPaid}
              disabled={markTeamAsPaidMutation.isPending}
              className="bg-[#6520EE]/20 hover:bg-[#6520EE]/30 text-[#6520EE] border border-[#6520EE]/50"
            >
              {markTeamAsPaidMutation.isPending ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
