import { apiRequest } from './api';
import type { Game, GamePlayer } from '../types';

export interface CreateGameOptions {
  totalRounds?: number;
  answeringTimerSec?: number;
  matchingTimerSec?: number;
  dareEnabled?: boolean;
  maxPlayers?: number;
}

export interface CreateGameResponse {
  game: Game;
  hostPlayer: GamePlayer;
}

export interface RoomCodeCheckResponse {
  gameId: string;
  roomCode: string;
  status: string;
  currentPlayers: number;
  maxPlayers: number;
  canJoin: boolean;
}

export interface GameDetailsResponse {
  game: Game;
  players: GamePlayer[];
}

export async function createRoom(opts: CreateGameOptions = {}): Promise<CreateGameResponse> {
  const res = await apiRequest<{ success: boolean; data: CreateGameResponse }>('/games', {
    method: 'POST',
    auth: true,
    body: {
      totalRounds: opts.totalRounds ?? 5,
      answeringTimerSec: opts.answeringTimerSec ?? 30,
      matchingTimerSec: opts.matchingTimerSec ?? 45,
      dareEnabled: opts.dareEnabled ?? true,
      maxPlayers: opts.maxPlayers ?? 8,
    },
  });
  return res.data;
}

export async function getRoomByCode(code: string): Promise<RoomCodeCheckResponse> {
  const res = await apiRequest<{ success: boolean; data: RoomCodeCheckResponse }>(
    `/games/code/${code}`
  );
  return res.data;
}

export async function getRoomById(gameId: string): Promise<GameDetailsResponse> {
  const res = await apiRequest<{ success: boolean; data: GameDetailsResponse }>(
    `/games/${gameId}`,
    { auth: true }
  );
  return res.data;
}

export async function updateGameSettings(
  gameId: string,
  opts: Partial<CreateGameOptions>
): Promise<Game> {
  const res = await apiRequest<{ success: boolean; data: Game }>(`/games/${gameId}`, {
    method: 'PATCH',
    auth: true,
    body: opts,
  });
  return res.data;
}

export async function getDaresPreview(): Promise<any[]> {
  const res = await apiRequest<{ success: boolean; data: any[] }>('/games/dares/preview');
  return res.data;
}

