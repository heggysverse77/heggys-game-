import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.utils.js';

// Extend Express Request interface to include authenticated user payload
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Express Middleware to protect private HTTP endpoints.
 * Requires header: "Authorization: Bearer <token>"
 */
export const authenticateJwt = (
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

  if (!payload) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Access denied. Token is invalid or expired.',
    });
  }

  // Attach decoded payload to request object
  req.user = payload;
  next();
};
