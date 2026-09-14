import { z } from 'zod';

export const createGuestSchema = z.object({
  username: z
    .string()
    .min(2, { message: 'Username must be at least 2 characters long' })
    .max(30, { message: 'Username cannot exceed 30 characters' })
    .trim(),
  avatarId: z.string().optional().default('avatar_1'),
});

export type CreateGuestInput = z.infer<typeof createGuestSchema>;
