import { pool } from "@/lib/db";
import TournamentEditForm from "@/components/admin/TournamentEditForm";
import { notFound } from "next/navigation";

async function getTournament(id: number) {
  const client = await pool.connect();
  try {
    const result = await client.query(`SELECT * FROM tournaments WHERE id = $1`, [id]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTournamentPage({ params }: PageProps) {
  const { id } = await params;
  const tournamentId = parseInt(id);
  if (isNaN(tournamentId)) notFound();

  const tournament = await getTournament(tournamentId);
  if (!tournament) notFound();

  return <TournamentEditForm tournament={tournament} />;
}