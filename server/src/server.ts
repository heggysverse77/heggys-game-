import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { testDbConnection } from './config/db.js';
import { initSocketServer } from './sockets/socket.server.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

// Create HTTP server wrapping the Express app
const server = http.createServer(app);

// Initialize Socket.io server engine
initSocketServer(server);

// Start server listener and test database connection
const startServer = async () => {
  try {
    // 1. Test database connection pool
    await testDbConnection();

    // 2. Start HTTP server listener
    server.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`🚀 Heggy Game Server running in [${process.env.NODE_ENV || 'development'}] mode`);
      console.log(`📡 Listening on: http://localhost:${PORT}`);
      console.log(`🔌 Socket.io engine initialized`);
      console.log(`==================================================\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
