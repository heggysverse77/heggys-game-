import { pool } from '../../config/db.js';
import { signToken } from '../../utils/jwt.utils.js';
import { User } from '../../types/index.js';

export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * Creates a new guest user in PostgreSQL database and generates a JWT token
 */
export const registerGuestUser = async (
  username: string,
  avatarId: string = 'avatar_1'
): Promise<AuthResponse> => {
  // 1. Insert guest user into PostgreSQL
  const query = `
    INSERT INTO users (username, avatar_id, is_guest)
    VALUES ($1, $2, true)
    RETURNING id, username, email, avatar_id, is_guest, created_at;
  `;

  const result = await pool.query(query, [username, avatarId]);
  const user: User = result.rows[0];

  // 2. Generate signed JWT token
  const token = signToken({
    userId: user.id,
    username: user.username,
    isGuest: user.is_guest,
  });

  return { token, user };
};

/**
 * Updates an existing user's username and avatar_id in DB and updates active game_players
 */
export const updateUserProfile = async (
  userId: string,
  username: string,
  avatarId: string = 'avatar_1'
): Promise<AuthResponse> => {
  const query = `
    UPDATE users
    SET username = $1, avatar_id = $2
    WHERE id = $3
    RETURNING id, username, email, avatar_id, is_guest, created_at;
  `;

  const result = await pool.query(query, [username, avatarId, userId]);
  if (result.rows.length === 0) {
    throw new Error('USER_NOT_FOUND');
  }

  const user: User = result.rows[0];

  // Update nickname in active game rooms
  await pool.query(
    `UPDATE game_players SET nickname = $1 WHERE user_id = $2`,
    [username, userId]
  );

  const token = signToken({
    userId: user.id,
    username: user.username,
    isGuest: user.is_guest,
  });

  return { token, user };
};
