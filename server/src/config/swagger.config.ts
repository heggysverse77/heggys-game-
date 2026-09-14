export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Heggy Game Server API - اعرف صاحبك وعلّم عليه',
    version: '1.0.0',
    description:
      'Official REST & WebSocket documentation for the multiplayer party game "اعرف صاحبك وعلّم عليه" (Know Your Friend & Expose Them).',
    contact: {
      name: 'Heggy Game Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'VALIDATION_ERROR' },
          message: { type: 'string', example: 'Invalid request payload' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          username: { type: 'string', example: 'Heggy' },
          avatar_id: { type: 'string', example: 'avatar_1' },
          is_guest: { type: 'boolean', example: true },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      CreateGameInput: {
        type: 'object',
        required: ['totalRounds', 'maxPlayers'],
        properties: {
          totalRounds: { type: 'integer', minimum: 1, maximum: 10, default: 5 },
          maxPlayers: { type: 'integer', minimum: 3, maximum: 12, default: 8 },
          answeringTimerSec: { type: 'integer', minimum: 15, maximum: 90, default: 30 },
          matchingTimerSec: { type: 'integer', minimum: 20, maximum: 120, default: 45 },
          dareEnabled: { type: 'boolean', default: true },
        },
      },
      CreateQuestionInput: {
        type: 'object',
        required: ['textAr'],
        properties: {
          textAr: {
            type: 'string',
            example: 'إيه أكتر موقف محرج حصلك في مكان عام؟',
            description: 'Arabic question text',
          },
          textEn: {
            type: 'string',
            example: 'What is your most embarrassing public moment?',
            description: 'Optional English translation',
          },
        },
      },
    },
  },
  paths: {
    '/api/v1/auth/guest': {
      post: {
        summary: 'Authenticate as a Guest User',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username'],
                properties: {
                  username: { type: 'string', example: 'Heggy' },
                  avatarId: { type: 'string', example: 'avatar_1' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Guest authenticated successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          400: { description: 'Validation error' },
        },
      },
    },
    '/api/v1/auth/register': {
      post: {
        summary: 'Register a Permanent Account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string', example: 'HeggyPro' },
                  email: { type: 'string', format: 'email', example: 'heggy@example.com' },
                  password: { type: 'string', minLength: 6, example: 'password123' },
                  avatarId: { type: 'string', example: 'avatar_2' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        summary: 'Login with Email & Password',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'heggy@example.com' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/v1/auth/me': {
      get: {
        summary: 'Get Current Authenticated User Profile',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User profile data' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/v1/games': {
      post: {
        summary: 'Host Creates a New Game Room',
        tags: ['Game Rooms'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateGameInput' },
            },
          },
        },
        responses: {
          201: { description: 'Game room created with unique room code' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/v1/games/code/{code}': {
      get: {
        summary: 'Pre-check Room Availability via Room Code',
        tags: ['Game Rooms'],
        parameters: [
          {
            name: 'code',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'X8K2M',
          },
        ],
        responses: {
          200: { description: 'Room details (currentPlayers, maxPlayers, canJoin)' },
          404: { description: 'Room not found' },
        },
      },
    },
    '/api/v1/games/{id}': {
      get: {
        summary: 'Get Full Game Room Details & Connected Players',
        tags: ['Game Rooms'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: { description: 'Full game metadata & player list' },
          404: { description: 'Game not found' },
        },
      },
    },
    '/api/v1/questions': {
      post: {
        summary: 'Contribute a Question to the Question Bank',
        tags: ['Question Bank'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateQuestionInput' },
            },
          },
        },
        responses: {
          201: { description: 'Question created and made active for games' },
          400: { description: 'Validation error' },
        },
      },
      get: {
        summary: 'List Active Questions in Bank',
        tags: ['Question Bank'],
        responses: {
          200: { description: 'List of active questions' },
        },
      },
    },
  },
};
