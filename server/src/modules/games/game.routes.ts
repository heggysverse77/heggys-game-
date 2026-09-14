import { Router } from 'express';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import {
  createGameHandler,
  getGameByCodeHandler,
  getGameByIdHandler,
  updateGameSettingsHandler,
  getDaresPreviewHandler,
} from './game.controller.js';

const router = Router();

// GET /api/v1/games/dares/preview (Fetch dare cards list)
router.get('/dares/preview', getDaresPreviewHandler);

// POST /api/v1/games (Host creates game room - Protected)
router.post('/', authenticateJwt, createGameHandler);

// GET /api/v1/games/code/:code (Public pre-check)
router.get('/code/:code', getGameByCodeHandler);

// GET /api/v1/games/:id (Fetch full room details - Protected)
router.get('/:id', authenticateJwt, getGameByIdHandler);

// PATCH /api/v1/games/:id (Host updates room settings in lobby - Protected)
router.patch('/:id', authenticateJwt, updateGameSettingsHandler);

export default router;
