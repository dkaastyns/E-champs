import { pool } from '@/lib/db';
import { transformToLibraryFormat, DBMatch } from '@/lib/bracket-transform';
import { InteractiveBracket } from '@/components/bracket/InteractiveBracket';
import Link from 'next/link';
import { PageTransition, RevealOnScroll } from '@/components/ui/page-transition';

async function getBracket(tournamentId: string): Promise<DBMatch[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT tm.*,
              ta."teamName" as "teamAName",
              tb."teamName" as "teamBName",
              tw."teamName" as "winnerName",
              t.name as "categoryName",
              t."tournamentStartDate" as "tournamentStartDate"
       FROM tournament_matches tm
       LEFT JOIN registered_teams ta ON tm."teamAId" = ta.id
       LEFT JOIN registered_teams tb ON tm."teamBId" = tb.id
       LEFT JOIN registered_teams tw ON tm."winnerId" = tw.id
       JOIN tournaments t ON tm."categoryId" = t.id
       WHERE tm."categoryId" = $1
       ORDER BY tm."bracket", tm."round", tm."matchNumber"`,
      [tournamentId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

async function getTournamentName(tournamentId: string): Promise<string> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT name FROM tournaments WHERE id = $1`,
      [tournamentId]
    );
    return result.rows[0]?.name || 'Unknown';
  } finally {
    client.release();
  }
}

interface BracketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BracketDetailPage({ params }: BracketDetailPageProps) {
  const { id } = await params;
  const matches = await getBracket(id);
  const tournamentName = await getTournamentName(id);

  if (matches.length === 0) {
    return (
      <PageTransition className="space-y-8">
        <div>
          <Link href="/admin/brackets" className="text-[#6520EE] hover:underline mb-4 inline-block">
            ← Back to Brackets
          </Link>
          <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase">
            {tournamentName}
          </h1>
        </div>
        
        <RevealOnScroll delay={100}>
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-8 text-center">
          <p className="text-gray-400 mb-4">No bracket generated yet.</p>
          <Link 
            href="/admin/brackets"
            className="inline-block bg-[#6520EE] hover:bg-[#7c3aed] text-white font-bold py-3 px-6 font-[family-name:var(--font-heading)] transition-colors"
          >
            Generate Bracket
          </Link>
        </div>
        </RevealOnScroll>
      </PageTransition>
    );
  }

  // Get tournament start date from first match or use a fallback
  const tournamentStartDate = matches[0]?.tournamentStartDate;
  const libraryMatches = transformToLibraryFormat(matches, tournamentStartDate);

  return (
    <PageTransition className="space-y-8">
      <div>
        <Link href="/admin/brackets" className="text-[#6520EE] hover:underline mb-4 inline-block">
          ← Back to Brackets
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase">
          {tournamentName}
        </h1>
        <p className="font-[family-name:var(--font-body)] text-gray-400 mt-2">
          Double Elimination Tournament Bracket — Click matches to update results
        </p>
      </div>

      <RevealOnScroll delay={100}>
      <InteractiveBracket 
        matches={libraryMatches} 
        categoryId={parseInt(id)}
      />
      </RevealOnScroll>
    </PageTransition>
  );
}