import { Request, Response } from 'express';
import { createQuestionSchema } from './question.schema.js';
import { createQuestion, getAllQuestions } from './question.service.js';

/**
 * Controller: Handles POST /api/v1/questions (User submits question to bank)
 */
export const createQuestionHandler = async (req: Request, res: Response) => {
  try {
    const parseResult = createQuestionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const question = await createQuestion(parseResult.data);

    return res.status(201).json({
      success: true,
      message: 'Question added to question bank successfully! It will now appear in games.',
      data: question,
    });
  } catch (error) {
    console.error('Error in createQuestionHandler:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to create question',
    });
  }
};

/**
 * Controller: Handles GET /api/v1/questions (Fetch active questions list)
 */
export const listQuestionsHandler = async (req: Request, res: Response) => {
  try {
    const questions = await getAllQuestions(100);

    return res.status(200).json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    console.error('Error in listQuestionsHandler:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve questions',
    });
  }
};
