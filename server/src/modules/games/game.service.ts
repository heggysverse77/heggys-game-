import { pool } from '../../config/db.js';
import { generateRoomCode } from '../../utils/roomCode.utils.js';
import { CreateGameInput, UpdateGameInput } from './game.schema.js';
import { Game, GamePlayer } from '../../types/index.js';

export interface CreateGameResult {
  game: Game;
  hostPlayer: GamePlayer;
}

/**
 * Creates a new game room and registers the creator as host.
 * Uses a database transaction so both records are saved atomically.
 */
export const createGameRoom = async (
  hostUserId: string,
  hostNickname: string,
  settings: CreateGameInput
): Promise<CreateGameResult> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Generate collision-free room code
    let roomCode = generateRoomCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const checkRes = await client.query('SELECT id FROM games WHERE room_code = $1', [roomCode]);
      if (checkRes.rows.length === 0) {
        isUnique = true;
      } else {
        roomCode = generateRoomCode();
        attempts++;
      }
    }

    // 2. Insert Game Record
    const insertGameQuery = `
      INSERT INTO games (
        room_code, host_user_id, total_rounds, max_players,
        answering_timer_sec, matching_timer_sec, dare_enabled
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const gameRes = await client.query(insertGameQuery, [
      roomCode,
      hostUserId,
      settings.totalRounds,
      settings.maxPlayers,
      settings.answeringTimerSec,
      settings.matchingTimerSec,
      settings.dareEnabled,
    ]);

    const game: Game = gameRes.rows[0];

    // 3. Insert Host into game_players junction table
    const insertPlayerQuery = `
      INSERT INTO game_players (game_id, user_id, nickname, is_host)
      VALUES ($1, $2, $3, true)
      RETURNING *;
    `;

    const playerRes = await client.query(insertPlayerQuery, [
      game.id,
      hostUserId,
      hostNickname,
    ]);

    const hostPlayer: GamePlayer = playerRes.rows[0];

    await client.query('COMMIT');

    return { game, hostPlayer };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Validates room code availability before a user joins.
 */
export const getGameByRoomCode = async (roomCode: string) => {
  const query = `
    SELECT 
      g.id, g.room_code, g.status, g.max_players, g.min_players,
      COUNT(gp.id)::int AS current_players
    FROM games g
    LEFT JOIN game_players gp ON g.id = gp.game_id
    WHERE g.room_code = $1
    GROUP BY g.id;
  `;

  const result = await pool.query(query, [roomCode.toUpperCase()]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  const isLobbyJoinable = row.status === 'LOBBY' && row.current_players < row.max_players;
  const isInProgress = row.status === 'IN_PROGRESS';

  return {
    gameId: row.id,
    roomCode: row.room_code,
    status: row.status,
    currentPlayers: row.current_players,
    maxPlayers: row.max_players,
    canJoin: isLobbyJoinable || isInProgress,
    isInProgress,
  };
};

/**
 * Fetches full game metadata and connected players list.
 */
export const getGameDetailsById = async (gameId: string) => {
  const gameRes = await pool.query('SELECT * FROM games WHERE id = $1', [gameId]);
  if (gameRes.rows.length === 0) return null;

  const playersRes = await pool.query(
    'SELECT * FROM game_players WHERE game_id = $1 ORDER BY joined_at ASC',
    [gameId]
  );

  return {
    game: gameRes.rows[0] as Game,
    players: playersRes.rows as GamePlayer[],
  };
};

export interface PlayerWithAvatar {
  id: string;
  userId: string;
  nickname: string;
  avatarId: string;
  isHost: boolean;
  isConnected: boolean;
  totalScore: number;
  joinedAt: Date;
}

/**
 * Registers or updates a player in an existing game room.
 */
export const joinGameRoom = async (
  gameId: string,
  userId: string,
  nickname: string
): Promise<GamePlayer> => {
  const query = `
    INSERT INTO game_players (game_id, user_id, nickname, is_host, is_connected)
    VALUES ($1, $2, $3, false, true)
    ON CONFLICT (game_id, user_id) 
    DO UPDATE SET 
      nickname = EXCLUDED.nickname,
      is_connected = true
    RETURNING *;
  `;

  const result = await pool.query(query, [gameId, userId, nickname]);
  return result.rows[0];
};

/**
 * Handles player leave or disconnect and automatically promotes the next player to host if the host left.
 */
export const handlePlayerDisconnectOrLeave = async (
  gameId: string,
  userId: string
): Promise<{ newHostUserId: string | null; updatedPlayers: any[]; updatedGame: any | null }> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Mark player as disconnected
    await client.query(
      'UPDATE game_players SET is_connected = false WHERE game_id = $1 AND user_id = $2',
      [gameId, userId]
    );

    // 2. Check if game exists and if leaving player is the host
    const gameRes = await client.query('SELECT * FROM games WHERE id = $1', [gameId]);
    if (gameRes.rows.length === 0) {
      await client.query('COMMIT');
      return { newHostUserId: null, updatedPlayers: [], updatedGame: null };
    }

    let game = gameRes.rows[0];
    let newHostUserId: string | null = null;

    if (game.host_user_id === userId) {
      // Find a random connected REAL player first (excluding bots)
      let nextHostRes = await client.query(
        `SELECT user_id FROM game_players 
         WHERE game_id = $1 AND is_connected = true AND user_id != $2 AND (is_bot = false OR is_bot IS NULL)
         ORDER BY RANDOM() LIMIT 1`,
        [gameId, userId]
      );

      // Fallback: If only bots connected, allow any connected player
      if (nextHostRes.rows.length === 0) {
        nextHostRes = await client.query(
          `SELECT user_id FROM game_players 
           WHERE game_id = $1 AND is_connected = true AND user_id != $2 
           ORDER BY RANDOM() LIMIT 1`,
          [gameId, userId]
        );
      }

      if (nextHostRes.rows.length > 0) {
        newHostUserId = nextHostRes.rows[0].user_id;

        // Update games table
        const updatedGameRes = await client.query(
          'UPDATE games SET host_user_id = $1 WHERE id = $2 RETURNING *',
          [newHostUserId, gameId]
        );
        game = updatedGameRes.rows[0];

        // Ensure ONLY newHostUserId has is_host = true
        await client.query(
          'UPDATE game_players SET is_host = (user_id = $1) WHERE game_id = $2',
          [newHostUserId, gameId]
        );

        console.log(`👑 Host transferred randomly in game [${gameId}] from user [${userId}] to player [${newHostUserId}]`);
      }
    }

    await client.query('COMMIT');

    const updatedPlayers = await getGamePlayersWithAvatars(gameId);
    return { newHostUserId, updatedPlayers, updatedGame: game };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Updates a player's connection status (online / offline).
 */
export const updatePlayerConnectionStatus = async (
  gameId: string,
  userId: string,
  isConnected: boolean
): Promise<void> => {
  const query = `
    UPDATE game_players
    SET is_connected = $3
    WHERE game_id = $1 AND user_id = $2;
  `;
  await pool.query(query, [gameId, userId, isConnected]);
};

/**
 * Fetches all players in a room joined with their avatar information from users table.
 */
export const getGamePlayersWithAvatars = async (gameId: string): Promise<any[]> => {
  const query = `
    SELECT 
      gp.id,
      gp.game_id,
      gp.user_id,
      gp.user_id AS "userId",
      gp.nickname,
      gp.is_host,
      gp.is_host AS "isHost",
      gp.is_connected,
      gp.is_connected AS "isConnected",
      gp.total_score,
      gp.total_score AS "totalScore",
      gp.joined_at,
      gp.joined_at AS "joinedAt",
      u.avatar_id,
      u.avatar_id AS "avatarId"
    FROM game_players gp
    JOIN users u ON gp.user_id = u.id
    WHERE gp.game_id = $1
    ORDER BY gp.joined_at ASC;
  `;

  const result = await pool.query(query, [gameId]);
  return result.rows;
};

/**
 * Updates room settings (dareEnabled, answeringTimerSec, matchingTimerSec, totalRounds, maxPlayers).
 * Only allowed for the host and while the room status is 'LOBBY'.
 */
export const updateGameRoomSettings = async (
  gameId: string,
  hostUserId: string,
  settings: UpdateGameInput
): Promise<Game> => {
  const gameRes = await pool.query('SELECT * FROM games WHERE id = $1', [gameId]);
  if (gameRes.rows.length === 0) {
    throw new Error('GAME_NOT_FOUND');
  }

  const game = gameRes.rows[0];
  if (game.host_user_id !== hostUserId) {
    throw new Error('NOT_HOST');
  }

  if (game.status !== 'LOBBY') {
    throw new Error('CANNOT_UPDATE_IN_PROGRESS');
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (settings.totalRounds !== undefined) {
    updates.push(`total_rounds = $${paramIdx++}`);
    values.push(settings.totalRounds);
  }

  if (settings.maxPlayers !== undefined) {
    updates.push(`max_players = $${paramIdx++}`);
    values.push(settings.maxPlayers);
  }

  if (settings.answeringTimerSec !== undefined) {
    updates.push(`answering_timer_sec = $${paramIdx++}`);
    values.push(settings.answeringTimerSec);
  }

  if (settings.matchingTimerSec !== undefined) {
    updates.push(`matching_timer_sec = $${paramIdx++}`);
    values.push(settings.matchingTimerSec);
  }

  if (settings.dareEnabled !== undefined) {
    updates.push(`dare_enabled = $${paramIdx++}`);
    values.push(settings.dareEnabled);
  }

  if (updates.length === 0) {
    return game as Game;
  }

  values.push(gameId);
  const updateQuery = `
    UPDATE games 
    SET ${updates.join(', ')} 
    WHERE id = $${paramIdx} 
    RETURNING *;
  `;

  const updatedRes = await pool.query(updateQuery, values);
  return updatedRes.rows[0] as Game;
};

/**
 * Retrieves a list of active dare cards from the database
 */
export const getActiveDares = async (limit = 20) => {
  const query = `
    SELECT id, text_ar, text_ar AS "textAr", severity, category 
    FROM dares 
    WHERE is_active = true 
    ORDER BY id ASC 
    LIMIT $1;
  `;
  const res = await pool.query(query, [limit]);
  return res.rows;
};
