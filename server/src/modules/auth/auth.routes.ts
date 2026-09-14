import { Router } from 'express';
import { registerGuestHandler, updateProfileHandler } from './auth.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';

const router = Router();

// POST /api/v1/auth/guest
router.post('/guest', registerGuestHandler);

// PUT /api/v1/auth/profile
router.put('/profile', authenticateJwt, updateProfileHandler);

export default router;
