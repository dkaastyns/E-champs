'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useTournaments, useMatches, useRecordMatchResult } from '@/lib/hooks';
import type { Match } from '@/lib/api';
import { PageTransition, RevealOnScroll } from '@/components/ui/page-transition';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminMatchesPage() {
  const { data: tournaments = [] } = useTournaments();
  const [selectedTournament, setSelectedTournament] = useState<string>(tournaments[0]?.id?.toString() || '');
  const { data: matches = [], isLoading } = useMatches(selectedTournament);
  const recordMatchMutation = useRecordMatchResult();

  // Update selected tournament when tournaments load
  if (tournaments.length > 0 && !selectedTournament) {
    setSelectedTournament(tournaments[0].id.toString());
  }

  const handleRecordResult = async (match: Match, winnerId: number) => {
    toast.promise(
      recordMatchMutation.mutateAsync({
        displayId: match.displayId,
        winnerId: winnerId,
      }),
      {
        loading: 'Recording match result...',
        success: 'Match result recorded successfully',
        error: (err: Error) => err.message || 'Failed to record match',
      }
    );
  };

  const filteredMatches = matches.filter((m) =>
    m.status !== 'completed' && m.teamAId && m.teamBId
  );

  return (
    <PageTransition className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase">MATCH RESULTS</h1>
        <p className="font-[family-name:var(--font-body)] text-gray-400 mt-2">Record match winners.</p>
      </div>

      <RevealOnScroll delay={100}>
      <div className="flex gap-4">
        <Select
          value={selectedTournament}
          onValueChange={setSelectedTournament}
        >
          <SelectTrigger className="w-[280px] bg-[#0d0d0d] border-[#1a1a1a] text-white focus:ring-[#6520EE] focus:ring-1">
            <SelectValue placeholder="Select tournament" />
          </SelectTrigger>
          <SelectContent className="bg-[#0d0d0d] border-[#1a1a1a]">
            {tournaments.map((tournament) => (
              <SelectItem
                key={tournament.id}
                value={tournament.id.toString()}
                className="text-white hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] cursor-pointer"
              >
                {tournament.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      </RevealOnScroll>

      {isLoading ? (
        <div className="text-white">Loading...</div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.length === 0 && (
            <RevealOnScroll delay={150}>
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-8 text-center">
            <p className="text-gray-400">No matches ready for recording.</p>
          </div>
          </RevealOnScroll>
          )}

          {filteredMatches.map((match, idx) => (
            <RevealOnScroll key={match.id} delay={idx * 80}>
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-500">
                  {match.categoryName} - Round {match.round} - Match {match.matchNumber}
                </div>
                <span className={`px-2 py-1 text-xs font-bold ${
                  match.bracket === 'winners' 
                    ? 'bg-[#2BE900]/20 text-[#2BE900]' 
                    : 'bg-orange-500/20 text-orange-500'
                }`}>
                  {match.bracket.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleRecordResult(match, match.teamAId!)}
                  disabled={recordMatchMutation.isPending}
                  className="flex-1 bg-[#1a1a1a] hover:bg-[#2BE900]/20 border border-[#1a1a1a] hover:border-[#2BE900] p-4 transition-colors disabled:opacity-50"
                >
                  <div className="font-[family-name:var(--font-heading)] text-white">{match.teamAName}</div>
                  <div className="text-[#2BE900] text-sm mt-1">Mark as Winner</div>
                </button>

                <div className="text-gray-500 font-bold">VS</div>

                <button
                  onClick={() => handleRecordResult(match, match.teamBId!)}
                  disabled={recordMatchMutation.isPending}
                  className="flex-1 bg-[#1a1a1a] hover:bg-[#2BE900]/20 border border-[#1a1a1a] hover:border-[#2BE900] p-4 transition-colors disabled:opacity-50"
                >
                  <div className="font-[family-name:var(--font-heading)] text-white">{match.teamBName}</div>
                  <div className="text-[#2BE900] text-sm mt-1">Mark as Winner</div>
                </button>
              </div>
            </div>
            </RevealOnScroll>
          ))}
        </div>
      )}
    </PageTransition>
  );
}