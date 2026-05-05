import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import { PageTransition, RevealOnScroll } from "@/components/ui/page-transition";

const getDashboardStats = unstable_cache(
  async (userId: string) => {
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
        `SELECT t.name, t."tournamentStartDate", rt."teamName"
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
  },
  ["dashboard-stats"],
  { revalidate: 30, tags: ["dashboard"] }
);

async function DashboardStats({ userId }: { userId: string }) {
  const stats = await getDashboardStats(userId);

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { value: stats.totalTeams, label: "Teams Registered", color: "text-white" },
          { value: stats.verifiedTeams, label: "Verified Entries", color: "text-[#2BE900]" },
          { value: stats.upcomingTournaments, label: "Active Tournaments", color: "text-[#6520EE]" },
        ].map((stat, i) => (
          <RevealOnScroll
            key={stat.label}
            delay={i * 100}
            className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-6 card-hover-glow"
          >
            <div className={`text-3xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
            <div className="text-gray-400 text-base">{stat.label}</div>
          </RevealOnScroll>
        ))}
      </div>

      {/* Active tournament banner or empty CTA */}
      <RevealOnScroll delay={300}>
        {stats.activeTournament ? (
          <div className="bg-gradient-to-r from-[#6520EE]/20 to-[#2BE900]/20 border border-[#6520EE]/30 rounded-lg p-8 transition-all duration-300 hover:border-[#6520EE]/60 hover:shadow-[0_0_30px_rgba(101,32,238,0.2)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className="text-[#2BE900] text-sm font-bold">TOURNAMENT IN PROGRESS</span>
                <h2 className="text-2xl font-black text-white mt-2">{stats.activeTournament.name}</h2>
                <p className="text-gray-400 mt-1">Team: {stats.activeTournament.teamName}</p>
              </div>
              <Link
                href="/my-matches"
                className="btn-press bg-[#2BE900] hover:bg-[#25d100] text-black font-bold px-6 py-3 rounded transition-all hover:shadow-[0_0_20px_rgba(43,233,0,0.4)]"
              >
                View Matches
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-8 text-center transition-all duration-300 hover:border-[#6520EE]/30 hover:shadow-[0_0_30px_rgba(101,32,238,0.1)]">
            <h2 className="text-2xl font-black text-white mb-4">Ready to Compete?</h2>
            <p className="text-gray-400 mb-6">Browse available tournaments and register your team today.</p>
            <Link
              href="/tournaments"
              className="btn-press inline-block bg-[#6520EE] hover:bg-[#7c3aed] text-white font-bold px-8 py-3 rounded transition-all hover:shadow-[0_0_20px_rgba(101,32,238,0.4)]"
            >
              Browse Tournaments
            </Link>
          </div>
        )}
      </RevealOnScroll>
    </>
  );
}

function DashboardStatsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-6 animate-pulse">
            <div className="h-8 w-12 bg-[#1a1a1a] rounded mb-2" />
            <div className="h-4 w-28 bg-[#1a1a1a] rounded" />
          </div>
        ))}
      </div>
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-8 animate-pulse">
        <div className="h-6 w-48 bg-[#1a1a1a] rounded" />
      </div>
    </>
  );
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  return (
    <PageTransition className="space-y-8">
      {/* Page header — renders immediately, no DB needed */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase mb-2">
          Dashboard
        </h1>
        <p className="font-[family-name:var(--font-body)] text-gray-400">
          Welcome back, {session.user.name}. Here&apos;s your tournament overview.
        </p>
      </div>

      {/* Stats stream in once DB query resolves */}
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats userId={session.user.id} />
      </Suspense>
    </PageTransition>
  );
}