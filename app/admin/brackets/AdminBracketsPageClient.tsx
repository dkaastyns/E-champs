'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useGenerateBracket } from '@/lib/hooks';
import { useState } from 'react';
import { formatDate } from '@indodev/toolkit/datetime';
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

interface TournamentWithCounts {
  id: number;
  name: string;
  maxTeams: number;
  registeredTeams: number;
  verifiedTeams: number;
  bracketExists: boolean;
  tournamentStartDate: string;
  tournamentEndDate: string;
}

interface AdminBracketsPageClientProps {
  tournaments: TournamentWithCounts[];
}

const MIN_TEAMS_REQUIRED = 8;

interface ConfirmDialog {
  isOpen: boolean;
  tournamentId: number | null;
  tournamentName: string;
}

export default function AdminBracketsPageClient({ tournaments }: AdminBracketsPageClientProps) {
  const router = useRouter();
  const generateBracketMutation = useGenerateBracket();
  const [hoveredTournament, setHoveredTournament] = useState<number | null>(null);
  const [dialog, setDialog] = useState<ConfirmDialog>({
    isOpen: false,
    tournamentId: null,
    tournamentName: '',
  });

  function openGenerateDialog(tournament: TournamentWithCounts) {
    setDialog({
      isOpen: true,
      tournamentId: tournament.id,
      tournamentName: tournament.name,
    });
  }

  function closeDialog() {
    setDialog({
      isOpen: false,
      tournamentId: null,
      tournamentName: '',
    });
  }

  async function handleConfirmGenerate() {
    if (!dialog.tournamentId) return;

    toast.promise(
      generateBracketMutation.mutateAsync({ categoryId: dialog.tournamentId }),
      {
        loading: 'Generating bracket...',
        success: (data) => {
          closeDialog();
          router.push(`/admin/brackets/${dialog.tournamentId}`);
          return `Bracket generated! ${data.totalMatches} matches created`;
        },
        error: (err: Error) => {
          closeDialog();
          return err.message || 'Failed to generate bracket';
        },
      }
    );
  }

  function getMissingTeamsMessage(verifiedTeams: number): string {
    const missing = MIN_TEAMS_REQUIRED - verifiedTeams;
    return `Need ${missing} more verified team${missing === 1 ? '' : 's'} to generate bracket`;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase">
          BRACKET MANAGEMENT
        </h1>
        <p className="font-[family-name:var(--font-body)] text-gray-400 mt-2">
          Generate and manage double elimination tournament brackets.
        </p>
        <p className="font-[family-name:var(--font-body)] text-sm text-gray-500 mt-1">
          Minimum {MIN_TEAMS_REQUIRED} verified teams required to generate bracket
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tournaments.map((tournament) => {
          const canGenerate = tournament.verifiedTeams >= MIN_TEAMS_REQUIRED;
          const showGenerateButton = !tournament.bracketExists;

          return (
            <div key={tournament.id} className="bg-[#0d0d0d] border border-[#1a1a1a] p-6 flex flex-col">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-white mb-2">
                {tournament.name}
              </h2>

              <p className="font-[family-name:var(--font-body)] text-sm text-gray-500 mb-4">
                {formatDate(new Date(tournament.tournamentStartDate), 'long')} - {formatDate(new Date(tournament.tournamentEndDate), 'long')}
              </p>

              <div className="mb-4 space-y-1 flex-grow">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Registered teams:</span>
                  <span className="text-gray-300">{tournament.registeredTeams} / {tournament.maxTeams}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Verified teams:</span>
                    <span className={canGenerate ? 'text-green-400' : 'text-yellow-400'}>
                    {tournament.verifiedTeams} / {MIN_TEAMS_REQUIRED} required
                  </span>
                </div>
                {tournament.bracketExists && (
                  <div className="text-green-400 text-sm mt-2 font-medium">
                    ✓ Bracket generated
                  </div>
                )}
              </div>
              
                <div className="flex gap-4 mt-auto">
                {showGenerateButton ? (
                  <div className="flex-1 relative">
                    <button
                      onClick={() => canGenerate ? openGenerateDialog(tournament) : null}
                      disabled={generateBracketMutation.isPending || !canGenerate}
                      onMouseEnter={() => setHoveredTournament(tournament.id)}
                      onMouseLeave={() => setHoveredTournament(null)}
                      className="w-full bg-[#6520EE] hover:bg-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#6520EE] text-white font-bold py-3 font-[family-name:var(--font-heading)] transition-colors"
                    >
                      {generateBracketMutation.isPending ? 'GENERATING...' : 'GENERATE BRACKET'}
                    </button>
                    {!canGenerate && hoveredTournament === tournament.id && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded shadow-lg whitespace-nowrap z-10">
                        {getMissingTeamsMessage(tournament.verifiedTeams)}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                      </div>
                    )}
                  </div>
                ) : null}
                
                {tournament.bracketExists && (
                  <Link
                    href={`/admin/brackets/${tournament.id}`}
                    className="flex-1 bg-[#0d0d0d] border border-[#6520EE] text-[#6520EE] hover:bg-[#6520EE] hover:text-white font-bold py-3 text-center font-[family-name:var(--font-heading)] transition-colors"
                  >
                    VIEW BRACKET
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={dialog.isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Bracket?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to generate a bracket for &quot;{dialog.tournamentName}&quot;?
              <br /><br />
              This will create all matches for the double elimination tournament.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDialog} disabled={generateBracketMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmGenerate}
              disabled={generateBracketMutation.isPending}
            >
              {generateBracketMutation.isPending ? 'Generating...' : 'Generate Bracket'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
