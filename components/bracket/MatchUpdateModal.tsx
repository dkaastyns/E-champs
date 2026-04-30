'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRecordMatchResult } from '@/lib/hooks';

interface Participant {
  id: string;
  resultText: string | null;
  isWinner: boolean;
  status: 'PLAYED' | 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | null;
  name: string;
}

interface LibraryMatch {
  id: string;
  name: string;
  nextMatchId: string | null;
  nextLooserMatchId?: string | null;
  tournamentRoundText: string;
  startTime: string;
  state: 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | 'DONE' | 'SCORE_DONE';
  participants: [Participant, Participant];
}

interface MatchUpdateModalProps {
  match: LibraryMatch;
  categoryId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function MatchUpdateModal({ match, onClose, onSuccess }: MatchUpdateModalProps) {
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const recordMatchMutation = useRecordMatchResult();

  const teamA = match.participants[0];
  const teamB = match.participants[1];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!winnerId) {
      toast.error('Please select a winner');
      return;
    }

    toast.promise(
      recordMatchMutation.mutateAsync({
        displayId: match.id,
        winnerId: parseInt(winnerId),
      }),
      {
        loading: 'Recording match result...',
        success: (data) => {
          onSuccess();
          return data.bracketReset 
            ? 'Match result recorded! Grand Finals Match 2 created for bracket reset.'
            : 'Match result recorded successfully!';
        },
        error: (err: Error) => err.message || 'Failed to update match',
      }
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-8 max-w-md w-full">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-white mb-6 uppercase text-center">
          UPDATE MATCH
        </h2>

        <div className="mb-6 space-y-4">
          <div 
            className={`p-4 border-2 cursor-pointer transition-all ${
              winnerId === teamA.id 
                ? 'border-[#2BE900] bg-[#2BE900]/10' 
                : 'border-[#1a1a1a] hover:border-[#6520EE]'
            }`}
            onClick={() => setWinnerId(teamA.id)}
          >
            <div className="text-[#6520EE] text-sm mb-1 font-[family-name:var(--font-heading)]">Team A</div>
            <div className="text-white font-bold text-lg">{teamA.name}</div>
          </div>

          <div className="text-center text-gray-500 font-bold text-sm">VS</div>

          <div 
            className={`p-4 border-2 cursor-pointer transition-all ${
              winnerId === teamB.id 
                ? 'border-[#2BE900] bg-[#2BE900]/10' 
                : 'border-[#1a1a1a] hover:border-[#6520EE]'
            }`}
            onClick={() => setWinnerId(teamB.id)}
          >
            <div className="text-[#6520EE] text-sm mb-1 font-[family-name:var(--font-heading)]">Team B</div>
            <div className="text-white font-bold text-lg">{teamB.name}</div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={recordMatchMutation.isPending}
            className="flex-1 py-3 border border-[#1a1a1a] text-gray-400 hover:text-white hover:border-gray-500 transition-colors font-[family-name:var(--font-heading)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={recordMatchMutation.isPending || !winnerId}
            className="flex-1 py-3 bg-[#6520EE] text-white font-bold disabled:opacity-50 hover:bg-[#7c3aed] transition-colors font-[family-name:var(--font-heading)]"
          >
            {recordMatchMutation.isPending ? 'Saving...' : 'Confirm Winner'}
          </button>
        </div>
      </div>
    </div>
  );
}
