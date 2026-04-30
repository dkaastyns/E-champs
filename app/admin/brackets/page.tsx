import { pool } from '@/lib/db';
import AdminBracketsPageClient from './AdminBracketsPageClient';

interface TournamentWithCounts {
  id: number;
  name: string;
  maxTeams: number;
  registeredTeams: number;
  verifiedTeams: number;
  bracketExists: boolean;
  tournamentStartDate: string;
  tournamentEndDate: string;
}

async function getTournamentsWithTeamCounts(): Promise<TournamentWithCounts[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        t.id,
        t.name,
        t."maxTeams" as "maxTeams",
        t."tournamentStartDate" as "tournamentStartDate",
        t."tournamentEndDate" as "tournamentEndDate",
        COALESCE(tm.registered_count, 0) as "registeredTeams",
        COALESCE(tm.verified_count, 0) as "verifiedTeams",
        EXISTS (
          SELECT 1 FROM tournament_matches trn
          WHERE trn."categoryId" = t.id
          LIMIT 1
        ) as "bracketExists"
      FROM tournaments t
      LEFT JOIN (
        SELECT
          "categoryId",
          COUNT(*) as registered_count,
          COUNT(*) FILTER (WHERE "paymentStatus" = 'verified') as verified_count
        FROM registered_teams
        WHERE "isDeleted" = false
        GROUP BY "categoryId"
      ) tm ON t.id = tm."categoryId"
      ORDER BY t."tournamentStartDate" ASC, t.name ASC
    `);
    return result.rows;
  } finally {
    client.release();
  }
}

export default async function AdminBracketsPage() {
  const tournaments = await getTournamentsWithTeamCounts();
  return <AdminBracketsPageClient tournaments={tournaments} />;
}