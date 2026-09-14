import { io, type Socket } from 'socket.io-client';

const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? `http://${host}:4000`;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    throw new Error('Socket not initialized. Call initSocket(token) first.');
  }
  return socket;
}

export function initSocket(token: string): Socket {
  // Disconnect old socket if exists
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] ✅ Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] 🔴 Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] ❌ Connection error:', err.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[Socket] Socket disconnected and cleaned up.');
  }
}
