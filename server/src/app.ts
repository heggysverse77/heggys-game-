import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './config/swagger.config.js';
import authRoutes from './modules/auth/auth.routes.js';
import gameRoutes from './modules/games/game.routes.js';
import questionRoutes from './modules/questions/question.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const app = express();

// CORS Configuration: support localhost and any local LAN IP device
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // In dev / LAN testing, allow any origin or no origin (e.g. mobile apps / curl)
    callback(null, true);
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Rate Limiting (Simple implementation)
// For production, consider using 'express-rate-limit'
let requestCount = 0;
app.use((req, res, next) => {
  requestCount++;
  if (requestCount > 1000) {
    return res.status(429).json({ error: 'Too Many Requests' });
  }
  setTimeout(() => {
    requestCount = 0;
  }, 60000); // Reset every minute
  next();
});

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger Interactive Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Heggy Game Server API (اعرف صاحبك وعلّم عليه)',
    version: '1.0.0',
    documentation: '/api-docs',
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/games', gameRoutes);
app.use('/api/v1/questions', questionRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
