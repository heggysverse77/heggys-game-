import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt.utils.js';
import { registerLobbyHandlers, AuthenticatedSocket } from './lobby.handler.js';
import { registerRoundHandlers } from './round.handler.js';

let io: Server | null = null;

/**
 * Initializes and attaches Socket.io to the HTTP server
 */
export const initSocketServer = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow all local origins (e.g. mobile phones on same Wi-Fi, other tabs, localhost)
        callback(null, true);
      },
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Middleware: Authenticate socket connection during handshake
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next(new Error('Authentication error: Token invalid or expired'));
    }

    // Attach decoded user payload to socket instance
    socket.user = payload;
    next();
  });

  // Handle connection events
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`⚡ Socket connected: ID=${socket.id}, User=${socket.user?.username}`);

    // Register module socket event handlers
    registerLobbyHandlers(io!, socket);
    registerRoundHandlers(io!, socket);
  });

  return io;
};

/**
 * Helper to retrieve global Socket.io instance if initialized
 */
export const getSocketIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io server has not been initialized yet!');
  }
  return io;
};
