'use client';

import { DoubleEliminationBracket, Match, SVGViewer } from '@g-loot/react-tournament-brackets';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MatchUpdateModal } from './MatchUpdateModal';

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

interface MatchesData {
  upper: LibraryMatch[];
  lower: LibraryMatch[];
}

interface InteractiveBracketProps {
  matches: MatchesData;
  categoryId: number;
}

interface MatchComponentProps {
  match: LibraryMatch;
  onMatchClick?: (match: LibraryMatch) => void;
  onPartyClick?: (party: Participant) => void;
  onMouseEnter?: (partyId: string) => void;
  onMouseLeave?: () => void;
  topParty?: Participant;
  bottomParty?: Participant;
  topWon?: boolean;
  bottomWon?: boolean;
}

interface SVGWrapperProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  background?: string;
  SVGBackground?: string;
}

export function InteractiveBracket({ matches, categoryId }: InteractiveBracketProps) {
  const router = useRouter();
  const [selectedMatch, setSelectedMatch] = useState<LibraryMatch | null>(null);

  const handleMatchClick = (match: LibraryMatch) => {
    const hasBothTeams = match.participants.every((p: Participant) => p.name !== 'TBD');
    const isCompleted = match.state === 'DONE';
    
    if (hasBothTeams && !isCompleted) {
      setSelectedMatch(match);
    }
  };

    const CustomMatchComponent = (props: MatchComponentProps) => {
      const { match } = props;
    
      const hasBothTeams = match.participants.every((p: Participant) => p.name !== 'TBD');
      const isCompleted = match.state === 'DONE';
      const isClickable = hasBothTeams && !isCompleted;
    
      // Safe wrapper handlers - wrap library handlers to fix TS signature mismatch
      const wrapperOnClick = isClickable ? (() => handleMatchClick(match)) : undefined;
      const wrapperOnMouseEnter = () => {
        if (typeof props.onMouseEnter === 'function') {
          props.onMouseEnter(match.participants[0]?.id);
        }
      };
      const wrapperOnMouseLeave = () => {
        if (typeof props.onMouseLeave === 'function') {
          props.onMouseLeave();
        }
      };
    
      const wrapperProps: React.HTMLAttributes<HTMLDivElement> = {
        onClick: wrapperOnClick,
        onMouseEnter: wrapperOnMouseEnter,
        onMouseLeave: wrapperOnMouseLeave,
        className: isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : '',
      };
    
      // All library-specific props for Match component
      const matchProps = { ...props };
    
      return (
        <div {...wrapperProps}>
          <Match {...matchProps} />
        </div>
      );
    };

  const CustomSVGWrapper = ({ children, ...props }: SVGWrapperProps) => (
    <SVGViewer 
      width={1400} 
      height={1000}
      background="#0d0d0d"
      SVGBackground="#0d0d0d"
      {...props}
    >
      {children}
    </SVGViewer>
  );

  return (
    <>
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg overflow-auto">
        <DoubleEliminationBracket
          matches={matches}
          matchComponent={CustomMatchComponent}
          options={{
            style: {
              roundHeader: { 
                backgroundColor: '#6520EE', 
                color: '#ffffff',
                fontFamily: 'var(--font-heading)',
                fontSize: '14px',
                fontWeight: 'bold',
                padding: '8px 16px'
              },
              connectorColor: '#6520EE',
              connectorColorHighlight: '#2BE900',
              matchBackground: {
                won: '#2BE90020',
                lost: '#ff000020',
                default: '#1a1a1a'
              },
              border: {
                color: '#6520EE',
                highlightedColor: '#2BE900'
              }
            },
          }}
          svgWrapper={CustomSVGWrapper}
        />
      </div>

      {selectedMatch && (
        <MatchUpdateModal
          match={selectedMatch}
          categoryId={categoryId}
          onClose={() => setSelectedMatch(null)}
          onSuccess={() => {
            setSelectedMatch(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
