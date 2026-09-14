import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_heggy_game_key_2026';
const JWT_EXPIRES_IN = '7d'; // Token valid for 7 days

export interface JwtPayload {
  userId: string;
  username: string;
  isGuest: boolean;
}

/**
 * Signs a payload into a JWT token
 */
export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verifies and decodes a JWT token string
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    // Returns null if token is expired, malformed, or signature check fails
    return null;
  }
};
