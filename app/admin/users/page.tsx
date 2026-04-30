import { pool } from "@/lib/db";
import UsersClient from "@/components/admin/UsersClient";

async function getUsers() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT id, name, email, image, role, banned, "createdAt"
      FROM "user"
      ORDER BY "createdAt" DESC
    `);
    return result.rows;
  } finally {
    client.release();
  }
}

export default async function AdminUsersPage() {
  const users = await getUsers();
  return <UsersClient users={users} />;
}
