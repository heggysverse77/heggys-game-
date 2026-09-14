import { z } from 'zod';

export const createQuestionSchema = z.object({
  textAr: z
    .string({ required_error: 'Arabic question text is required' })
    .min(5, 'Question must be at least 5 characters long')
    .max(300, 'Question must not exceed 300 characters')
    .trim(),
  textEn: z
    .string()
    .max(300, 'English question must not exceed 300 characters')
    .trim()
    .optional(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
