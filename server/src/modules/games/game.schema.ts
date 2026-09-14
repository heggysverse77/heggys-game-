import { z } from 'zod';

export const createGameSchema = z.object({
  totalRounds: z.number().min(1).max(10).default(5),
  maxPlayers: z.number().min(3).max(10).default(8),
  answeringTimerSec: z.number().min(15).max(120).default(30),
  matchingTimerSec: z.number().min(15).max(120).default(45),
  dareEnabled: z.boolean().default(true),
});

export type CreateGameInput = z.infer<typeof createGameSchema>;

export const updateGameSchema = createGameSchema.partial();
export type UpdateGameInput = z.infer<typeof updateGameSchema>;

