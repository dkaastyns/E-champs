import { pool } from "@/lib/db";
import TournamentsClient from "./TournamentsClient";

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

  return <TournamentsClient initialTournaments={tournaments} />;
}