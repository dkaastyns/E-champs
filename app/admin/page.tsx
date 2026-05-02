import { pool } from "@/lib/db";
import Link from "next/link";
import {
  Users,
  SquaresFour,
  CurrencyDollar,
  CheckCircle,
  XCircle,
  WarningCircle,
  Hexagon,
  Diamond,
  ChartBar,
} from "@phosphor-icons/react/dist/ssr";

async function getAdminStats() {
  const client = await pool.connect();
  try {
    const [
      tournamentsResult,
      teamsResult,
      pendingResult,
      verifiedResult,
      withdrawnResult,
    ] = await Promise.all([
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
}

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  return (
      <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase mb-2">
          Admin Dashboard
        </h1>
        <p className="font-[family-name:var(--font-body)] text-gray-400 mt-2">
          Tournament management overview.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-5 hover:border-[#333333] transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
              <SquaresFour className="w-5 h-5 text-gray-400" weight="fill" />
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.totalTournaments}
            </div>
          </div>
          <div className="text-gray-400 text-base font-[family-name:var(--font-body)]">
            Tournaments
          </div>
        </div>

        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-5 hover:border-[#333333] transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-400" weight="fill" />
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.totalTeams}
            </div>
          </div>
          <div className="text-gray-400 text-base font-[family-name:var(--font-body)]">
            Total Teams
          </div>
        </div>

        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-5 hover:border-[#6520EE]/50 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#6520EE]/20 flex items-center justify-center">
              <CurrencyDollar
                className="w-5 h-5 text-[#6520EE]"
                weight="fill"
              />
            </div>
            <div className="text-2xl font-bold text-[#6520EE]">
              {stats.pendingPayments}
            </div>
          </div>
          <div className="text-gray-400 text-base font-[family-name:var(--font-body)]">
            Pending Payment
          </div>
        </div>

        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-5 hover:border-[#2BE900]/50 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#2BE900]/20 flex items-center justify-center">
              <CheckCircle
                className="w-5 h-5 text-[#2BE900]"
                weight="fill"
              />
            </div>
            <div className="text-2xl font-bold text-[#2BE900]">
              {stats.verifiedTeams}
            </div>
          </div>
          <div className="text-gray-400 text-base font-[family-name:var(--font-body)]">
            Verified
          </div>
        </div>

        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-5 hover:border-orange-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-orange-500" weight="fill" />
            </div>
            <div className="text-2xl font-bold text-orange-500">
              {stats.withdrawnTeams}
            </div>
          </div>
          <div className="text-gray-400 text-base font-[family-name:var(--font-body)]">
            Withdrawn
          </div>
        </div>
      </div>

      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-white mb-5">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/tournaments/new"
            className="group bg-[#6520EE]/10 border border-[#6520EE]/30 hover:bg-[#6520EE]/20 hover:border-[#6520EE]/50 rounded-lg p-5 transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-lg bg-[#6520EE]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
              <Hexagon
                className="w-6 h-6 text-[#6520EE]"
                weight="fill"
              />
            </div>
            <div className="text-white font-semibold font-[family-name:var(--font-body)] mb-1">
              Create Tournament
            </div>
            <div className="text-gray-500 text-sm font-[family-name:var(--font-body)]">
              Set up new tournament events
            </div>
          </Link>

          <Link
            href="/admin/teams"
            className="group bg-[#2BE900]/10 border border-[#2BE900]/30 hover:bg-[#2BE900]/20 hover:border-[#2BE900]/50 rounded-lg p-5 transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-lg bg-[#2BE900]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
              <Diamond
                className="w-6 h-6 text-[#2BE900]"
                weight="fill"
              />
            </div>
            <div className="text-white font-semibold font-[family-name:var(--font-body)] mb-1">
              Verify Payments
            </div>
            <div className="text-gray-500 text-sm font-[family-name:var(--font-body)]">
              Review and approve team registrations
            </div>
          </Link>

          <Link
            href="/admin/brackets"
            className="group bg-[#6520EE]/10 border border-[#6520EE]/30 hover:bg-[#6520EE]/20 hover:border-[#6520EE]/50 rounded-lg p-5 transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-lg bg-[#6520EE]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
              <ChartBar
                className="w-6 h-6 text-[#6520EE]"
                weight="fill"
              />
            </div>
            <div className="text-white font-semibold font-[family-name:var(--font-body)] mb-1">
              Manage Brackets
            </div>
            <div className="text-gray-500 text-sm font-[family-name:var(--font-body)]">
              Configure tournament brackets
            </div>
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4 flex items-start gap-3">
        <WarningCircle
          className="w-5 h-5 text-[#6520EE] mt-0.5 flex-shrink-0"
          weight="fill"
        />
        <div>
          <div className="text-white font-medium text-sm font-[family-name:var(--font-body)] mb-1">
            Admin Tips
          </div>
          <p className="text-gray-400 text-sm font-[family-name:var(--font-body)] leading-relaxed">
            Remember to verify payment proofs before approving teams. Use the team
            management page to review registration details and communicate with
            captains if needed.
          </p>
        </div>
      </div>
    </div>
  );
}