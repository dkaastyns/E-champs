/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@g-loot/react-tournament-brackets' {
  import { ComponentType, ReactNode } from 'react';

  export interface Participant {
    id: string;
    resultText: string | null;
    isWinner: boolean;
    status: 'PLAYED' | 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | null;
    name: string;
  }

  export interface Match {
    id: string;
    name: string;
    nextMatchId: string | null;
    nextLooserMatchId?: string | null;
    tournamentRoundText: string;
    startTime: string;
    state: 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | 'DONE' | 'SCORE_DONE';
    participants: [Participant, Participant];
  }

  export interface BracketProps {
    matches: { upper: Match[]; lower: Match[] } | Match[];
    matchComponent?: ComponentType<any>;
    svgWrapper?: ComponentType<any>;
    options?: {
      style?: {
        roundHeader?: {
          backgroundColor?: string;
          color?: string;
          fontFamily?: string;
          fontSize?: string;
          fontWeight?: string;
          padding?: string;
        };
        connectorColor?: string;
        connectorColorHighlight?: string;
        matchBackground?: {
          won?: string;
          lost?: string;
          default?: string;
        };
        border?: {
          color?: string;
          highlightedColor?: string;
        };
      };
    };
  }

  export const DoubleEliminationBracket: ComponentType<BracketProps>;
  export const SingleEliminationBracket: ComponentType<BracketProps>;
  export const Match: ComponentType<any>;
  export const MATCH_STATES: {
    NO_SHOW: 'NO_SHOW';
    WALK_OVER: 'WALK_OVER';
    NO_PARTY: 'NO_PARTY';
    DONE: 'DONE';
    SCORE_DONE: 'SCORE_DONE';
  };
  export const SVGViewer: ComponentType<{
    width: number;
    height: number;
    background?: string;
    SVGBackground?: string;
    children?: ReactNode;
  }>;
}
