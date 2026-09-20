import pool from '../config/db.js';

/**
 * Periodically cleans up expired guest users, abandoned lobbies,
 * and old completed games so the database never fills up or bloats.
 */
export const runDatabaseCleanup = async () => {
  try {
    console.log('🧹 [DB Maintenance] Starting scheduled database cleanup...');

    // 1. Delete completed/abandoned games older than 48 hours (cascades to rounds, answers, guesses, scores)
    const gamesCleanupRes = await pool.query(`
      DELETE FROM games 
      WHERE (status = 'FINISHED' AND finished_at < NOW() - INTERVAL '48 hours')
         OR (status = 'LOBBY' AND created_at < NOW() - INTERVAL '24 hours')
         OR (created_at < NOW() - INTERVAL '7 days');
    `);

    // 2. Delete temporary guest users older than 48 hours who are not currently in an active game
    const guestCleanupRes = await pool.query(`
      DELETE FROM users 
      WHERE is_guest = true 
        AND created_at < NOW() - INTERVAL '48 hours'
        AND id NOT IN (
          SELECT gp.user_id 
          FROM game_players gp 
          JOIN games g ON gp.game_id = g.id 
          WHERE g.status = 'IN_PROGRESS'
        );
    `);

    // 3. Delete temporary bot user accounts not in active games
    const botCleanupRes = await pool.query(`
      DELETE FROM users
      WHERE email LIKE '%@heggyverse.local'
        AND created_at < NOW() - INTERVAL '24 hours'
        AND id NOT IN (
          SELECT user_id FROM game_players
        );
    `);

    console.log(`✅ [DB Maintenance] Cleanup complete:`, {
      purgedGames: gamesCleanupRes.rowCount || 0,
      purgedGuests: guestCleanupRes.rowCount || 0,
      purgedBots: botCleanupRes.rowCount || 0,
    });
  } catch (error) {
    console.error('⚠️ [DB Maintenance] Error during scheduled cleanup:', error);
  }
};

/**
 * Starts an automated interval that runs cleanup every 6 hours
 */
export const startDatabaseCleanupSchedule = () => {
  // Run once on server startup after a brief delay
  setTimeout(runDatabaseCleanup, 15000);

  // Then run every 6 hours
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  setInterval(runDatabaseCleanup, SIX_HOURS_MS);
};
