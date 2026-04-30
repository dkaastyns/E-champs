'use client';

import { InteractiveBracket } from '@/components/bracket/InteractiveBracket';
import { transformToLibraryFormat, type DBMatch } from '@/lib/bracket-transform';

interface BracketClientWrapperProps {
  matches: DBMatch[];
  categoryId: number;
}

export function BracketClientWrapper({ matches, categoryId }: BracketClientWrapperProps) {
  const libraryMatches = transformToLibraryFormat(matches);

  return (
    <InteractiveBracket
      matches={libraryMatches}
      categoryId={categoryId}
    />
  );
}
