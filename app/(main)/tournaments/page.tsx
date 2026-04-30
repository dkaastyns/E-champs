import { pool } from "@/lib/db";
import Link from "next/link";
import { formatCompact } from "@indodev/toolkit/currency";
import { formatDate } from "@indodev/toolkit/datetime";

interface Tournament {
  id: number;
  name: string;
  slug: string;
  description: string;
  maxTeams: number;
  teamSize: number;
  registrationFee: number;
  tournamentStartDate: string;
  tournamentEndDate: string;
  status: string;
}

async function getTournaments(): Promise<Tournament[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM tournaments WHERE status = 'open' ORDER BY "tournamentStartDate" ASC`
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export default async function TournamentsPage() {
  const tournaments = await getTournaments();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase mb-2">Tournaments</h1>
        <p className="font-[family-name:var(--font-body)] text-gray-400">Browse and register for upcoming competitions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tournaments.map((tournament) => (
          <div key={tournament.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-6 hover:border-[#6520EE]/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[#2BE900] text-xs font-bold">OPEN FOR REGISTRATION</span>
                <h2 className="text-xl font-bold text-white mt-1">{tournament.name}</h2>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-6">{tournament.description}</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-lg font-bold text-white">{tournament.teamSize}v{tournament.teamSize}</div>
                <div className="text-xs text-gray-500">Team Size</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">{tournament.maxTeams}</div>
                <div className="text-xs text-gray-500">Max Teams</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[#6520EE]">{formatCompact(tournament.registrationFee)}</div>
                <div className="text-xs text-gray-500">Entry Fee</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#1a1a1a]">
              <div className="text-sm text-gray-400">
                Starts: {formatDate(new Date(tournament.tournamentStartDate), 'long')}
              </div>
              <Link
                href={`/tournaments/${tournament.id}/register`}
                className="bg-[#6520EE] hover:bg-[#7c3aed] text-white font-medium px-6 py-2 rounded transition-colors text-sm"
              >
                Register Team
              </Link>
            </div>
          </div>
        ))}
      </div>

      {tournaments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No open tournaments at the moment.</p>
          <p className="text-gray-500 text-sm mt-2">Check back later for new competitions.</p>
        </div>
      )}
    </div>
  );
}