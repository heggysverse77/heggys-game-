import { Router } from 'express';
import { createQuestionHandler, listQuestionsHandler } from './question.controller.js';

const router = Router();

// POST /api/v1/questions (User contributes question to bank)
router.post('/', createQuestionHandler);

// GET /api/v1/questions (List questions)
router.get('/', listQuestionsHandler);

export default router;
