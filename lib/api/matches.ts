import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';

export interface Match {
  id: number;
  displayId: string;
  categoryId: number;
  bracket: 'winners' | 'losers' | 'finals';
  round: number;
  matchNumber: number;
  teamAId: number | null;
  teamBId: number | null;
  winnerId: number | null;
  teamAName: string | null;
  teamBName: string | null;
  winnerName: string | null;
  categoryName: string;
  status: 'pending' | 'ready' | 'completed';
  playedAt: string | null;
  nextMatchWinnersId: number | null;
  nextMatchLosersId: number | null;
}

export interface RecordMatchResultInput {
  displayId: string;
  winnerId: number;
}

export interface RecordMatchResultResponse {
  message: string;
  bracketReset: boolean;
}

export async function fetchMatches(categoryId: string): Promise<Match[]> {
  const response = await fetch(`/api/matches?category=${categoryId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch matches');
  }
  
  return response.json();
}

export async function recordMatchResult(input: RecordMatchResultInput): Promise<RecordMatchResultResponse> {
  const response = await fetch('/api/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to record match result');
  }
  
  const data = await response.json();

  queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });

  return data;
}
