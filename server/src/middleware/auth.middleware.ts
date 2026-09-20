import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.utils.js';
import { pool } from '../config/db.js';

// Extend Express Request interface to include authenticated user payload
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Express Middleware to protect private HTTP endpoints.
 * Requires header: "Authorization: Bearer <token>"
 */
export const authenticateJwt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Access denied. Missing or invalid Authorization header.',
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload || !payload.userId) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Access denied. Token is invalid or expired.',
    });
  }

  // Verify that the user still exists in the database
  try {
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [payload.userId]);
    if (userCheck.rows.length === 0) {
      return res.status(401).json({
        error: 'USER_NOT_FOUND',
        message: 'User session is no longer valid. Please log in again.',
      });
    }
  } catch (err) {
    console.error('Error verifying user in auth middleware:', err);
  }

  // Attach decoded payload to request object
  req.user = payload;
  next();
};
