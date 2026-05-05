import { pool } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import {
  Users,
  SquaresFour,
  CurrencyDollar,
  CheckCircle,
  XCircle,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import { PageTransition, RevealOnScroll } from "@/components/ui/page-transition";
import { AdminQuickActions } from "@/components/admin/AdminQuickActions";

const getAdminStats = unstable_cache(
  async () => {
    const client = await pool.connect();
    try {
      const [tournamentsResult, teamsResult, pendingResult, verifiedResult, withdrawnResult] =
        await Promise.all([
          client.query(`SELECT COUNT(*) FROM tournaments`),
          client.query(`SELECT COUNT(*) FROM registered_teams WHERE "isDeleted" = false`),
          client.query(`SELECT COUNT(*) FROM registered_teams WHERE "paymentStatus" = 'pending' AND "isDeleted" = false`),
          client.query(`SELECT COUNT(*) FROM registered_teams WHERE "paymentStatus" = 'verified' AND "isDeleted" = false`),
          client.query(`SELECT COUNT(*) FROM registered_teams WHERE "isDeleted" = true`),
        ]);
      return {
        totalTournaments: parseInt(tournamentsResult.rows[0].count),
        totalTeams: parseInt(teamsResult.rows[0].count),
        pendingPayments: parseInt(pendingResult.rows[0].count),
        verifiedTeams: parseInt(verifiedResult.rows[0].count),
        withdrawnTeams: parseInt(withdrawnResult.rows[0].count),
      };
    } finally {
      client.release();
    }
  },
  ["admin-stats"],
  { revalidate: 60, tags: ["admin"] }
);

async function AdminStats() {
  const stats = await getAdminStats();

  const statCards = [
    { icon: SquaresFour, value: stats.totalTournaments, label: "Tournaments", iconColor: "text-gray-400", iconBg: "bg-[#1a1a1a]", hoverBorder: "hover:border-[#333]", valueColor: "text-white" },
    { icon: Users, value: stats.totalTeams, label: "Total Teams", iconColor: "text-gray-400", iconBg: "bg-[#1a1a1a]", hoverBorder: "hover:border-[#333]", valueColor: "text-white" },
    { icon: CurrencyDollar, value: stats.pendingPayments, label: "Pending Payment", iconColor: "text-[#6520EE]", iconBg: "bg-[#6520EE]/20", hoverBorder: "hover:border-[#6520EE]/50", valueColor: "text-[#6520EE]" },
    { icon: CheckCircle, value: stats.verifiedTeams, label: "Verified", iconColor: "text-[#2BE900]", iconBg: "bg-[#2BE900]/20", hoverBorder: "hover:border-[#2BE900]/50", valueColor: "text-[#2BE900]" },
    { icon: XCircle, value: stats.withdrawnTeams, label: "Withdrawn", iconColor: "text-orange-500", iconBg: "bg-orange-500/20", hoverBorder: "hover:border-orange-500/50", valueColor: "text-orange-500" },
  ];

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <RevealOnScroll key={card.label} delay={i * 70}>
            <div className={`bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-5 ${card.hoverBorder} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} weight="fill" />
                </div>
                <div className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</div>
              </div>
              <div className="text-gray-400 text-base font-[family-name:var(--font-body)]">{card.label}</div>
            </div>
          </RevealOnScroll>
        ))}
      </div>

      {/* Quick actions */}
      <RevealOnScroll delay={400}>
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-white mb-5">
            Quick Actions
          </h2>
          <AdminQuickActions />
        </div>
      </RevealOnScroll>

      {/* Admin tip banner */}
      <RevealOnScroll delay={600}>
        <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4 flex items-start gap-3 transition-all duration-300 hover:border-[#6520EE]/20">
          <WarningCircle className="w-5 h-5 text-[#6520EE] mt-0.5 shrink-0 animate-pulse" weight="fill" />
          <div>
            <div className="text-white font-medium text-sm font-[family-name:var(--font-body)] mb-1">
              Admin Tips
            </div>
            <p className="text-gray-400 text-sm font-[family-name:var(--font-body)] leading-relaxed">
              Remember to verify payment proofs before approving teams. Use the team management page to review registration details and communicate with captains if needed.
            </p>
          </div>
        </div>
      </RevealOnScroll>
    </>
  );
}

function AdminStatsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#1a1a1a]" />
              <div className="h-7 w-8 bg-[#1a1a1a] rounded" />
            </div>
            <div className="h-4 w-20 bg-[#1a1a1a] rounded" />
          </div>
        ))}
      </div>
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-6 h-32 animate-pulse" />
    </>
  );
}

export default async function AdminDashboard() {
  return (
    <PageTransition className="space-y-8">
      {/* Page header — renders immediately, no DB needed */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase mb-2">
          Admin Dashboard
        </h1>
        <p className="font-[family-name:var(--font-body)] text-gray-400 mt-2">
          Tournament management overview.
        </p>
      </div>

      {/* Stats stream in once DB resolves */}
      <Suspense fallback={<AdminStatsSkeleton />}>
        <AdminStats />
      </Suspense>
    </PageTransition>
  );
}