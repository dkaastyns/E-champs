import 'dotenv/config';
import { pool } from '../lib/db';
import { readFileSync } from 'fs';

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running migration: 009_rename_to_tournaments.sql');
    
    const sql = readFileSync('./db/migrations/009_rename_to_tournaments.sql', 'utf8');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
  } catch (err: any) {
    if (err.message.includes('already exists') || err.message.includes('does not exist')) {
      console.log('ℹ️  Migration already applied or partially applied');
    } else {
      console.error('❌ Migration failed:', err.message);
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
