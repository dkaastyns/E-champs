export const dynamic = 'force-dynamic';

import { pool } from "@/lib/db";
import TournamentsClient from "@/components/admin/TournamentsClient";

async function getTournaments() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT t.*, COALESCE(tm.team_count, 0) as team_count
      FROM tournaments t
      LEFT JOIN (
        SELECT "categoryId", COUNT(*) as team_count
        FROM registered_teams
        WHERE "isDeleted" = false
        GROUP BY "categoryId"
      ) tm ON t.id = tm."categoryId"
      ORDER BY t."createdAt" DESC
    `);
    return result.rows;
  } finally {
    client.release();
  }
}

export default async function AdminTournamentsPage() {
  const tournaments = await getTournaments();
  return <TournamentsClient tournaments={tournaments} />;
}