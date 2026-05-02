import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";
import Link from "next/link";
import { PageTransition, RevealOnScroll } from "@/components/ui/page-transition";

interface Match {
  id: number;
  categoryName: string;
  bracket: string;
  round: number;
  matchNumber: number;
  teamAName: string;
  teamBName: string;
  myTeamName: string;
  opponentName: string;
  winnerName: string | null;
  status: string;
  scheduledAt: string | null;
  playedAt: string | null;
}

async function getMyMatches(userId: string): Promise<Match[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
        tm.id,
        t.name as "categoryName",
        tm."bracket",
        tm."round",
        tm."matchNumber",
        ta."teamName" as "teamAName",
        tb."teamName" as "teamBName",
        CASE
          WHEN rt_a."captainId" = $1 THEN ta."teamName"
          ELSE tb."teamName"
        END as "myTeamName",
        CASE
          WHEN rt_a."captainId" = $1 THEN tb."teamName"
          ELSE ta."teamName"
        END as "opponentName",
        tw."teamName" as "winnerName",
        tm.status,
        tm."scheduledAt",
        tm."playedAt"
      FROM tournament_matches tm
      JOIN tournaments t ON tm."categoryId" = t.id
      LEFT JOIN registered_teams ta ON tm."teamAId" = ta.id
      LEFT JOIN registered_teams tb ON tm."teamBId" = tb.id
      LEFT JOIN registered_teams rt_a ON tm."teamAId" = rt_a.id
      LEFT JOIN registered_teams rt_b ON tm."teamBId" = rt_b.id
      LEFT JOIN registered_teams tw ON tm."winnerId" = tw.id
      WHERE (rt_a."captainId" = $1 OR rt_b."captainId" = $1)
        AND tm."teamAId" IS NOT NULL
        AND tm."teamBId" IS NOT NULL
      ORDER BY tm."scheduledAt" DESC NULLS LAST, tm.id DESC`,
      [userId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

const statusColors: Record<string, string> = {
  completed: "bg-[#2BE900]/20 text-[#2BE900]",
  ongoing:   "bg-[#6520EE]/20 text-[#6520EE]",
  ready:     "bg-yellow-500/20 text-yellow-500",
};

function MatchCard({ match, dimmed = false }: { match: Match; dimmed?: boolean }) {
  const isWin  = match.winnerName === match.myTeamName;
  const isLoss = match.winnerName && match.winnerName !== match.myTeamName;

  return (
    <div className={`bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-6 card-hover-glow transition-opacity ${dimmed ? 'opacity-70 hover:opacity-100' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[#6520EE] text-xs font-bold">
            {match.categoryName.toUpperCase()}
          </span>
          <h3 className="text-lg font-bold text-white mt-1">
            Round {match.round} — Match {match.matchNumber}
          </h3>
        </div>
        <span className={`px-2 py-1 text-xs font-bold rounded ${statusColors[match.status] ?? 'bg-gray-500/20 text-gray-400'}`}>
          {match.status.toUpperCase()}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center gap-4">
        <div className={`flex-1 text-center p-4 rounded transition-all ${isWin ? 'bg-[#2BE900]/10 border border-[#2BE900]/30' : 'bg-[#1a1a1a]'}`}>
          <div className="text-white font-bold">{match.myTeamName}</div>
          <div className={`text-xs mt-1 font-bold ${isWin ? 'text-[#2BE900]' : 'text-[#6520EE]'}`}>
            {isWin ? 'WINNER ✓' : 'Your Team'}
          </div>
        </div>

        <div className="text-gray-500 font-black text-xl shrink-0">VS</div>

        <div className={`flex-1 text-center p-4 rounded transition-all ${isLoss ? 'bg-[#2BE900]/10 border border-[#2BE900]/30' : 'bg-[#1a1a1a]'}`}>
          <div className="text-white font-bold">{match.opponentName}</div>
          <div className={`text-xs mt-1 ${isLoss ? 'text-[#2BE900] font-bold' : 'text-gray-500'}`}>
            {isLoss ? 'WINNER ✓' : 'Opponent'}
          </div>
        </div>
      </div>

      {/* Timestamp */}
      {(match.scheduledAt || match.playedAt) && (
        <p className="text-gray-500 text-sm mt-4">
          {match.playedAt
            ? `Played: ${new Date(match.playedAt).toLocaleString()}`
            : `Scheduled: ${new Date(match.scheduledAt!).toLocaleString()}`}
        </p>
      )}
    </div>
  );
}

export default async function MyMatchesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const matches   = await getMyMatches(session.user.id);
  const upcoming  = matches.filter((m) => m.status !== "completed");
  const completed = matches.filter((m) => m.status === "completed");

  return (
    <PageTransition className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase mb-2">
          My Matches
        </h1>
        <p className="font-[family-name:var(--font-body)] text-gray-400">
          Track your tournament matches.
        </p>
      </div>

      {/* Empty state */}
      {matches.length === 0 && (
        <RevealOnScroll>
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-8 text-center transition-all duration-300 hover:border-[#6520EE]/30">
            <p className="text-gray-400 mb-4">You don&apos;t have any tournament matches yet.</p>
            <Link
              href="/tournaments"
              className="btn-press inline-block bg-[#6520EE] hover:bg-[#7c3aed] text-white font-bold px-6 py-3 rounded transition-all hover:shadow-[0_0_20px_rgba(101,32,238,0.4)]"
            >
              Browse Tournaments
            </Link>
          </div>
        </RevealOnScroll>
      )}

      {/* Upcoming matches */}
      {upcoming.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Upcoming</h2>
          {upcoming.map((match, i) => (
            <RevealOnScroll key={match.id} delay={i * 80}>
              <MatchCard match={match} />
            </RevealOnScroll>
          ))}
        </div>
      )}

      {/* Completed matches */}
      {completed.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-500">Completed</h2>
          {completed.map((match, i) => (
            <RevealOnScroll key={match.id} delay={i * 60}>
              <MatchCard match={match} dimmed />
            </RevealOnScroll>
          ))}
        </div>
      )}
    </PageTransition>
  );
}