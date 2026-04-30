import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";
import Link from "next/link";

async function getDashboardStats(userId: string) {
  const client = await pool.connect();
  try {
    const teamsResult = await client.query(
      `SELECT COUNT(*) FROM registered_teams WHERE "captainId" = $1 AND "isDeleted" = false`,
      [userId]
    );
    
    const verifiedResult = await client.query(
      `SELECT COUNT(*) FROM registered_teams WHERE "captainId" = $1 AND "paymentStatus" = 'verified' AND "isDeleted" = false`,
      [userId]
    );
    
    const upcomingResult = await client.query(
      `SELECT COUNT(*) FROM registered_teams rt
       JOIN tournaments t ON rt."categoryId" = t.id
       WHERE rt."captainId" = $1 AND rt."isDeleted" = false
       AND t.status IN ('open', 'ongoing')`,
      [userId]
    );
    
    const activeTournament = await client.query(
       `SELECT t.name, t."tournamentStartDate", rt."teamName" as "teamName"
       FROM registered_teams rt
       JOIN tournaments t ON rt."categoryId" = t.id
       WHERE rt."captainId" = $1 AND rt."isDeleted" = false
       AND t.status = 'ongoing'
       ORDER BY t."tournamentStartDate" ASC
       LIMIT 1`,
      [userId]
    );
    
    return {
      totalTeams: parseInt(teamsResult.rows[0].count),
      verifiedTeams: parseInt(verifiedResult.rows[0].count),
      upcomingTournaments: parseInt(upcomingResult.rows[0].count),
      activeTournament: activeTournament.rows[0] || null,
    };
  } finally {
    client.release();
  }
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const stats = await getDashboardStats(session.user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase mb-2">
          Dashboard
        </h1>
        <p className="font-[family-name:var(--font-body)] text-gray-400">Welcome back, {session.user.name}. Here&apos;s your tournament overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-6">
          <div className="text-3xl font-black text-white mb-1">{stats.totalTeams}</div>
          <div className="text-gray-400 text-sm">Teams Registered</div>
        </div>
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-6">
          <div className="text-3xl font-black text-[#2BE900] mb-1">{stats.verifiedTeams}</div>
          <div className="text-gray-400 text-sm">Verified Entries</div>
        </div>
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-6">
          <div className="text-3xl font-black text-[#6520EE] mb-1">{stats.upcomingTournaments}</div>
          <div className="text-gray-400 text-sm">Active Tournaments</div>
        </div>
      </div>

      {stats.activeTournament ? (
        <div className="bg-gradient-to-r from-[#6520EE]/20 to-[#2BE900]/20 border border-[#6520EE]/30 rounded-lg p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-[#2BE900] text-sm font-bold">TOURNAMENT IN PROGRESS</span>
              <h2 className="text-2xl font-black text-white mt-2">{stats.activeTournament.name}</h2>
              <p className="text-gray-400 mt-1">Team: {stats.activeTournament.teamName}</p>
            </div>
            <Link
              href="/my-matches"
              className="bg-[#2BE900] hover:bg-[#25d100] text-black font-bold px-6 py-3 rounded transition-colors"
            >
              View Matches
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-8 text-center">
          <h2 className="text-2xl font-black text-white mb-4">Ready to Compete?</h2>
          <p className="text-gray-400 mb-6">Browse available tournaments and register your team today.</p>
          <Link
            href="/tournaments"
            className="inline-block bg-[#6520EE] hover:bg-[#7c3aed] text-white font-bold px-8 py-3 rounded transition-colors"
          >
            Browse Tournaments
          </Link>
        </div>
      )}
    </div>
  );
}