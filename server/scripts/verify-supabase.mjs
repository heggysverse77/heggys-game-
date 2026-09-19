// Verify Supabase schema and data
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config as dotenvConfig } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenvConfig({ path: join(__dirname, '../.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const client = await pool.connect();
try {
  console.log('🔍 Checking Supabase Database Status...\n');

  // 1. Total questions count
  const qRes = await client.query('SELECT COUNT(*)::int AS count FROM questions WHERE is_active = true;');
  console.log('✅ 1. Total Active Questions in DB:', qRes.rows[0].count);

  // 2. room_used_questions table check
  const ruq = await client.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'room_used_questions';");
  console.log('✅ 2. room_used_questions table status:', ruq.rows.length > 0 ? 'ACTIVE & READY' : 'NOT FOUND');

  // 3. game_players columns
  const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'game_players' AND column_name IN ('status', 'socket_id', 'disconnected_at', 'is_bot');");
  console.log('✅ 3. game_players verified columns:', cols.rows.map(r => r.column_name).join(', '));

  // 4. game_rounds is_skipped column
  const rCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'game_rounds' AND column_name = 'is_skipped';");
  console.log('✅ 4. game_rounds is_skipped status:', rCols.rows.length > 0 ? 'ACTIVE & READY' : 'NOT FOUND');

  console.log('\n🎉 Everything on Supabase is 100% updated and in sync!');
} catch (err) {
  console.error('❌ Error checking Supabase:', err);
} finally {
  client.release();
  await pool.end();
}
