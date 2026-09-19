// Migration runner — uses server's own DB config
import pg from 'pg';
import { readFileSync } from 'fs';
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

const sql = `
-- Phase 21 Migration: Player Status, Socket ID, Bot Flag, Skip Flag

-- 1. Player status: ACTIVE / DISCONNECTED / KICKED / LEFT
ALTER TABLE game_players
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- 2. Socket tracking
ALTER TABLE game_players
  ADD COLUMN IF NOT EXISTS socket_id VARCHAR(100);

ALTER TABLE game_players
  ADD COLUMN IF NOT EXISTS disconnected_at TIMESTAMP WITH TIME ZONE;

-- 3. Bot flag (may already exist)
ALTER TABLE game_players
  ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false;

-- 4. Skip flag on rounds
ALTER TABLE game_rounds
  ADD COLUMN IF NOT EXISTS is_skipped BOOLEAN NOT NULL DEFAULT false;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_game_players_status
  ON game_players(game_id, status);

-- 6. Backfill
UPDATE game_players SET status = 'ACTIVE' WHERE status IS NULL OR status = '';

-- 7. Room Used Questions table (Zero repetition per room)
CREATE TABLE IF NOT EXISTS room_used_questions (
  room_code VARCHAR(10) NOT NULL,
  question_id VARCHAR(64) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (room_code, question_id)
);

CREATE INDEX IF NOT EXISTS idx_room_used_questions_code
  ON room_used_questions(room_code);
`;

const client = await pool.connect();
try {
  console.log('🔄 Running Phase 21 migration...');
  await client.query(sql);
  console.log('✅ Migration complete!');
} catch (err) {
  console.error('❌ Migration failed:', err);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
