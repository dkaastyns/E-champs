/**
 * Transform database matches to @g-loot/react-tournament-brackets format
 */

export interface DBMatch {
  id: number;
  displayId: string;
  bracket: 'winners' | 'losers' | 'finals';
  round: number;
  matchNumber: number;
  teamAId: number | null;
  teamBId: number | null;
  teamAName: string | null;
  teamBName: string | null;
  winnerId: number | null;
  isBye: boolean;
  status: string;
  nextMatchWinnersId: number | null;
  nextMatchLosersId: number | null;
  scheduledAt: string | null;
  tournamentStartDate: string;
}

interface LibraryParticipant {
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
  participants: [LibraryParticipant, LibraryParticipant];
}

/**
 * Map database status to library state
 */
function mapStatus(status: string, isBye: boolean): LibraryMatch['state'] {
  if (isBye) return 'WALK_OVER';
  if (status === 'completed') return 'DONE';
  if (status === 'ongoing') return 'SCORE_DONE';
  if (status === 'ready') return 'NO_SHOW';
  return 'NO_PARTY';
}

/**
 * Get displayId from database id
 */
function getDisplayId(matches: DBMatch[], dbId: number | null): string | null {
  if (!dbId) return null;
  const match = matches.find(m => m.id === dbId);
  return match?.displayId || null;
}

/**
 * Transform database matches to library format
 */
export function transformToLibraryFormat(
  matches: DBMatch[],
  tournamentStartDate?: string
): { upper: LibraryMatch[]; lower: LibraryMatch[] } {
  const upper: LibraryMatch[] = [];
  const lower: LibraryMatch[] = [];

  // Use tournament start date as base for match scheduling
  // Fall back to current date if no start date provided
  const baseDate = tournamentStartDate
    ? new Date(tournamentStartDate)
    : new Date();

  // Process winners bracket (upper)
  const winnersMatches = matches.filter(m => m.bracket === 'winners' || m.bracket === 'finals');

  for (const match of winnersMatches) {
    const isGrandFinals = match.bracket === 'finals';

    // Calculate a scheduled date based on round number (1 round per day)
    // Each round gets offset by (round - 1) days from tournament start
    const matchDate = new Date(baseDate);
    matchDate.setDate(baseDate.getDate() + (match.round - 1));

    const libraryMatch: LibraryMatch = {
      id: match.displayId,
      name: isGrandFinals
        ? `Grand Finals${match.round === 2 ? ' (Reset)' : ''}`
        : `WB R${match.round} M${match.matchNumber}`,
      nextMatchId: getDisplayId(matches, match.nextMatchWinnersId),
      nextLooserMatchId: match.bracket === 'winners' ? getDisplayId(matches, match.nextMatchLosersId) : null,
      tournamentRoundText: isGrandFinals ? 'Finals' : `Round ${match.round}`,
      startTime: matchDate.toISOString(),
      state: mapStatus(match.status, match.isBye),
      participants: [
        {
          id: match.teamAId?.toString() || `tbd-a-${match.displayId}`,
          resultText: match.winnerId && match.winnerId === match.teamAId ? 'WON' : match.winnerId ? 'LOST' : null,
          isWinner: match.teamAId ? match.winnerId === match.teamAId : false,
          status: null,
          name: match.isBye && !match.teamBId && match.teamAName
            ? `${match.teamAName} (Bye)`
            : (match.teamAName || 'TBD')
        },
        {
          id: match.teamBId?.toString() || `tbd-b-${match.displayId}`,
          resultText: match.winnerId && match.winnerId === match.teamBId ? 'WON' : match.winnerId ? 'LOST' : null,
          isWinner: match.teamBId ? match.winnerId === match.teamBId : false,
          status: null,
          name: match.isBye && !match.teamAId && match.teamBName
            ? `${match.teamBName} (Bye)`
            : (match.teamBName || 'TBD')
        }
      ]
    };

    upper.push(libraryMatch);
  }

  // Process losers bracket (lower)
  const losersMatches = matches.filter(m => m.bracket === 'losers');

  for (const match of losersMatches) {
    // Losers bracket matches also get scheduled based on round
    const matchDate = new Date(baseDate);
    matchDate.setDate(baseDate.getDate() + (match.round - 1));

    const libraryMatch: LibraryMatch = {
      id: match.displayId,
      name: `LB R${match.round} M${match.matchNumber}`,
      nextMatchId: getDisplayId(matches, match.nextMatchWinnersId),
      // Losers bracket matches don't have nextLooserMatchId
      tournamentRoundText: `Round ${match.round}`,
      startTime: matchDate.toISOString(),
      state: mapStatus(match.status, match.isBye),
      participants: [
        {
          id: match.teamAId?.toString() || `tbd-a-${match.displayId}`,
          resultText: match.winnerId && match.winnerId === match.teamAId ? 'WON' : match.winnerId ? 'LOST' : null,
          isWinner: match.teamAId ? match.winnerId === match.teamAId : false,
          status: null,
          name: match.teamAName || 'TBD'
        },
        {
          id: match.teamBId?.toString() || `tbd-b-${match.displayId}`,
          resultText: match.winnerId && match.winnerId === match.teamBId ? 'WON' : match.winnerId ? 'LOST' : null,
          isWinner: match.teamBId ? match.winnerId === match.teamBId : false,
          status: null,
          name: match.teamBName || 'TBD'
        }
      ]
    };

    lower.push(libraryMatch);
  }

  return { upper, lower };
}

/**
 * Find match by displayId
 */
export function findMatchByDisplayId(matches: DBMatch[], displayId: string): DBMatch | undefined {
  return matches.find(m => m.displayId === displayId);
}
