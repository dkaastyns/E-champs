import { pool } from "@/lib/db";
import { formatDate } from "@indodev/toolkit/datetime";

interface ScheduleItem {
  teamId: number;
  teamName: string;
  memberCount: number;
  paymentStatus: string;
  registeredAt: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  tournamentStartDate: string;
  tournamentStatus: string;
  captainName: string;
  captainEmail: string;
  captainImage: string | null;
}

async function getSchedule(): Promise<ScheduleItem[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        rt.id AS "teamId",
        rt."teamName" as "teamName",
        (SELECT COUNT(*) FROM team_members tm WHERE tm."teamId" = rt.id) as "memberCount",
        rt."paymentStatus",
        rt."createdAt" AS "registeredAt",
        t.id AS "categoryId",
        t.name AS "categoryName",
        t.slug AS "categorySlug",
        t."tournamentStartDate",
        t.status AS "tournamentStatus",
        u.name AS "captainName",
        u.email AS "captainEmail",
        u.image AS "captainImage"
      FROM registered_teams rt
      INNER JOIN tournaments t ON rt."categoryId" = t.id
      INNER JOIN "user" u ON rt."captainId" = u.id
      WHERE rt."isDeleted" = FALSE
        AND rt."paymentStatus" IN ('paid', 'verified')
        AND t.status IN ('open', 'ongoing')
      ORDER BY t."tournamentStartDate" ASC, rt."createdAt" ASC
    `);
    return result.rows;
  } finally {
    client.release();
  }
}

export default async function SchedulePage() {
  const schedule = await getSchedule();

  const groupedByCategory: Record<number, ScheduleItem[]> = {};
  schedule.forEach((item) => {
    if (!groupedByCategory[item.categoryId]) {
      groupedByCategory[item.categoryId] = [];
    }
    groupedByCategory[item.categoryId].push(item);
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase">
          Tournament Schedule
        </h1>
        <p className="font-[family-name:var(--font-body)] text-gray-400 mt-2">
          Verified teams across all tournaments.
        </p>
      </div>

      {Object.entries(groupedByCategory).map(([categoryId, teams]) => {
        const category = teams[0];
        return (
          <div key={categoryId} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#1a1a1a] bg-gradient-to-r from-[#6520EE]/10 to-transparent">
              <h2 className="text-xl font-bold text-white">{category.categoryName}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                <span>Tournament Date: {formatDate(new Date(category.tournamentStartDate), 'long')}</span>
                <span className="text-[#2BE900]">{teams.length} Verified Teams</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1a1a1a]">
                    <th className="text-left py-3 px-6 text-gray-400 font-medium">Team</th>
                    <th className="text-left py-3 px-6 text-gray-400 font-medium">Captain</th>
                    <th className="text-left py-3 px-6 text-gray-400 font-medium">Members</th>
                    <th className="text-left py-3 px-6 text-gray-400 font-medium">Payment</th>
                    <th className="text-left py-3 px-6 text-gray-400 font-medium">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.teamId} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]">
                      <td className="py-4 px-6">
                        <div className="font-bold text-white">{team.teamName}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#6520EE] flex items-center justify-center text-white font-bold text-sm">
                            {team.captainName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="text-white">{team.captainName}</div>
                            <div className="text-gray-500 text-sm">{team.captainEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-white">
                          {team.memberCount + 1} players
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          team.paymentStatus === 'verified' 
                            ? 'bg-[#2BE900]/20 text-[#2BE900]' 
                            : 'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {team.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-400">
                        {new Date(team.registeredAt).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {schedule.length === 0 && (
        <div className="text-center py-12 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg">
          <p className="text-gray-400">No verified teams found.</p>
          <p className="text-gray-500 text-sm mt-2">Teams will appear here once their payment is verified.</p>
        </div>
      )}
    </div>
  );
}