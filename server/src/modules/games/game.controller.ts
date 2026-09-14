import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { createGameSchema, updateGameSchema } from './game.schema.js';
import {
  createGameRoom,
  getGameByRoomCode,
  getGameDetailsById,
  updateGameRoomSettings,
  getActiveDares,
} from './game.service.js';

// Simple UUID v4 regex validator to prevent DB syntax errors on invalid params
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Controller: Handles POST /api/v1/games (Host creates room)
 */
export const createGameHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    // 1. Validate request body using Zod schema
    const parseResult = createGameSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    // 2. Call service to create game room and register host
    const result = await createGameRoom(req.user.userId, req.user.username, parseResult.data);

    return res.status(201).json({
      success: true,
      message: 'Game room created successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error in createGameHandler:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to create game room',
    });
  }
};

/**
 * Controller: Handles GET /api/v1/games/code/:code (Public pre-check)
 */
export const getGameByCodeHandler = async (req: Request, res: Response) => {
  try {
    const rawCode = req.params.code;
    const roomCode = typeof rawCode === 'string' ? rawCode.trim() : '';

    if (!roomCode) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Room code is required' });
    }

    const roomInfo = await getGameByRoomCode(roomCode);

    if (!roomInfo) {
      return res.status(404).json({
        error: 'ROOM_NOT_FOUND',
        message: 'No active game room found with this code',
      });
    }

    return res.status(200).json({
      success: true,
      data: roomInfo,
    });
  } catch (error) {
    console.error('Error in getGameByCodeHandler:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to query room code status',
    });
  }
};

/**
 * Controller: Handles GET /api/v1/games/:id (Fetch full details)
 */
export const getGameByIdHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    const rawId = req.params.id;
    const gameId = typeof rawId === 'string' ? rawId.trim() : '';

    if (!gameId || !UUID_REGEX.test(gameId)) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Valid Game UUID is required' });
    }

    const gameData = await getGameDetailsById(gameId);

    if (!gameData) {
      return res.status(404).json({ error: 'GAME_NOT_FOUND', message: 'Game not found' });
    }

    return res.status(200).json({
      success: true,
      data: gameData,
    });
  } catch (error) {
    console.error('Error in getGameByIdHandler:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to fetch game details',
    });
  }
};

/**
 * Controller: Handles PATCH /api/v1/games/:id (Host updates room settings in lobby)
 */
export const updateGameSettingsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    const rawId = req.params.id;
    const gameId = typeof rawId === 'string' ? rawId.trim() : '';

    if (!gameId || !UUID_REGEX.test(gameId)) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Valid Game UUID is required' });
    }

    const parseResult = updateGameSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const updatedGame = await updateGameRoomSettings(gameId, req.user.userId, parseResult.data);

    return res.status(200).json({
      success: true,
      message: 'Game settings updated successfully',
      data: updatedGame,
    });
  } catch (error: any) {
    console.error('Error in updateGameSettingsHandler:', error);
    if (error.message === 'NOT_HOST') {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Only host can change settings' });
    }
    if (error.message === 'CANNOT_UPDATE_IN_PROGRESS') {
      return res.status(400).json({
        error: 'INVALID_STATE',
        message: 'Settings can only be changed while in the lobby',
      });
    }
    if (error.message === 'GAME_NOT_FOUND') {
      return res.status(404).json({ error: 'GAME_NOT_FOUND', message: 'Game not found' });
    }
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to update game settings',
    });
  }
};

/**
 * Controller: Handles GET /api/v1/games/dares/preview (Fetch available dare cards)
 */
export const getDaresPreviewHandler = async (_req: Request, res: Response) => {
  try {
    const dares = await getActiveDares(30);
    return res.status(200).json({
      success: true,
      data: dares,
    });
  } catch (error) {
    console.error('Error in getDaresPreviewHandler:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to fetch dare cards',
    });
  }
};

