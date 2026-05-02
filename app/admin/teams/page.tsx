import { pool } from "@/lib/db";
import TeamActionsClient from './TeamActionsClient';
import { PageTransition, RevealOnScroll } from '@/components/ui/page-transition';

interface Team {
  id: number;
  teamName: string;
  categoryName: string;
  captainName: string;
  captainEmail: string;
  paymentStatus: string;
  isDeleted: boolean;
}

async function getAllTeams(): Promise<Team[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT rt.*, t.name as "categoryName", t.slug as "categorySlug",
             u.name as "captainName", u.email as "captainEmail"
      FROM registered_teams rt
      JOIN tournaments t ON rt."categoryId" = t.id
      JOIN "user" u ON rt."captainId" = u.id
      ORDER BY rt."createdAt" DESC
    `);
    return result.rows;
  } finally {
    client.release();
  }
}

export default async function AdminTeamsPage() {
  const teams = await getAllTeams();
  const pendingCount = teams.filter((t) => !t.isDeleted && t.paymentStatus === 'pending').length;
  
  return (
    <PageTransition className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase">TEAM MANAGEMENT</h1>
        <p className="font-[family-name:var(--font-body)] text-gray-400 mt-2">Manage registrations, verify payments, handle withdrawals.</p>
      </div>

      <RevealOnScroll delay={100}>
        <TeamActionsClient teams={teams} pendingCount={pendingCount} />
      </RevealOnScroll>
    </PageTransition>
  );
}