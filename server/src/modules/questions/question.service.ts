import { pool } from '../../config/db.js';
import { Question } from '../../types/index.js';
import { CreateQuestionInput } from './question.schema.js';

/**
 * Inserts a new user-contributed question into the question bank
 */
export const createQuestion = async (input: CreateQuestionInput): Promise<Question> => {
  const query = `
    INSERT INTO questions (text_ar, text_en, is_active)
    VALUES ($1, $2, true)
    RETURNING id, text_ar, text_en;
  `;

  const result = await pool.query(query, [input.textAr, input.textEn || null]);
  return result.rows[0];
};

/**
 * Fetches all active questions from the question bank
 */
export const getAllQuestions = async (limit: number = 50): Promise<Question[]> => {
  const query = `
    SELECT id, text_ar, text_en
    FROM questions
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT $1;
  `;

  const result = await pool.query(query, [limit]);
  return result.rows;
};
