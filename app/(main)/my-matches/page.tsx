import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";
import Link from "next/link";

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

export default async function MyMatchesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const matches = await getMyMatches(session.user.id);
  const upcoming = matches.filter((m) => m.status !== "completed");
  const completed = matches.filter((m) => m.status === "completed");

  const statusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-[#2BE900]/20 text-[#2BE900]";
      case "ongoing":
        return "bg-[#6520EE]/20 text-[#6520EE]";
      case "ready":
        return "bg-yellow-500/20 text-yellow-500";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase mb-2">My Matches</h1>
        <p className="font-[family-name:var(--font-body)] text-gray-400">Track your tournament matches.</p>
      </div>

      {matches.length === 0 && (
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-8 text-center">
          <p className="text-gray-400 mb-4">
            You don&apos;t have any tournament matches yet.
          </p>
          <Link
            href="/tournaments"
            className="inline-block bg-[#6520EE] hover:bg-[#7c3aed] text-white font-bold px-6 py-3 rounded transition-colors"
          >
            Browse Tournaments
          </Link>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Upcoming</h2>
          {upcoming.map((match) => (
            <div
              key={match.id}
              className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[#6520EE] text-xs font-bold">
                    {match.categoryName.toUpperCase()}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    Round {match.round} - Match {match.matchNumber}
                  </h3>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-bold rounded ${statusColor(
                    match.status
                  )}`}
                >
                  {match.status.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 text-center p-4 bg-[#1a1a1a] rounded">
                  <div className="text-white font-bold">{match.myTeamName}</div>
                  <div className="text-[#6520EE] text-xs mt-1">Your Team</div>
                </div>
                <div className="text-gray-500 font-black text-xl">VS</div>
                <div className="flex-1 text-center p-4 bg-[#1a1a1a] rounded">
                  <div className="text-white font-bold">
                    {match.opponentName}
                  </div>
                  <div className="text-gray-500 text-xs mt-1">Opponent</div>
                </div>
              </div>

              {match.scheduledAt && (
                <p className="text-gray-500 text-sm mt-4">
                  Scheduled: {new Date(match.scheduledAt).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-500">Completed</h2>
          {completed.map((match) => (
            <div
              key={match.id}
              className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-6 opacity-75"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[#6520EE] text-xs font-bold">
                    {match.categoryName.toUpperCase()}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    Round {match.round} - Match {match.matchNumber}
                  </h3>
                </div>
                <span className="px-2 py-1 text-xs font-bold rounded bg-[#2BE900]/20 text-[#2BE900]">
                  COMPLETED
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div
                  className={`flex-1 text-center p-4 rounded ${
                    match.winnerName === match.myTeamName
                      ? "bg-[#2BE900]/10 border border-[#2BE900]/30"
                      : "bg-[#1a1a1a]"
                  }`}
                >
                  <div className="text-white font-bold">
                    {match.myTeamName}
                  </div>
                  {match.winnerName === match.myTeamName && (
                    <div className="text-[#2BE900] text-xs mt-1 font-bold">
                      WINNER
                    </div>
                  )}
                </div>
                <div className="text-gray-500 font-black text-xl">VS</div>
                <div
                  className={`flex-1 text-center p-4 rounded ${
                    match.winnerName === match.opponentName
                      ? "bg-[#2BE900]/10 border border-[#2BE900]/30"
                      : "bg-[#1a1a1a]"
                  }`}
                >
                  <div className="text-white font-bold">
                    {match.opponentName}
                  </div>
                  {match.winnerName === match.opponentName && (
                    <div className="text-[#2BE900] text-xs mt-1 font-bold">
                      WINNER
                    </div>
                  )}
                </div>
              </div>

              {match.playedAt && (
                <p className="text-gray-500 text-sm mt-4">
                  Played: {new Date(match.playedAt).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}