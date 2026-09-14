import { Request, Response } from 'express';
import { createGuestSchema } from './auth.schema.js';
import { registerGuestUser, updateUserProfile } from './auth.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

/**
 * Controller: Handles POST /api/v1/auth/guest
 */
export const registerGuestHandler = async (req: Request, res: Response) => {
  try {
    const parseResult = createGuestSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { username, avatarId } = parseResult.data;
    const authData = await registerGuestUser(username, avatarId);

    return res.status(201).json({
      success: true,
      message: 'Guest account created successfully',
      data: authData,
    });
  } catch (error) {
    console.error('Error in registerGuestHandler:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to create guest user account',
    });
  }
};

/**
 * Controller: Handles PUT /api/v1/auth/profile
 */
export const updateProfileHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
    }

    const { username, avatarId } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Username is required' });
    }

    const authData = await updateUserProfile(userId, username.trim(), avatarId || 'avatar_1');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: authData,
    });
  } catch (error: any) {
    console.error('Error in updateProfileHandler:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to update user profile',
    });
  }
};
