import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { initSocket, disconnectSocket } from '../socket/socket.client';
import type { Socket } from 'socket.io-client';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface SocketContextValue {
  socket: Socket | null;
  status: ConnectionStatus;
  connect: (token: string) => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  const connect = useCallback((token: string) => {
    setStatus('connecting');
    const s = initSocket(token);

    s.on('connect',       () => setStatus('connected'));
    s.on('disconnect',    () => setStatus('disconnected'));
    s.on('connect_error', () => setStatus('error'));

    setSocket(s);
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
    setSocket(null);
    setStatus('disconnected');
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { disconnectSocket(); }, []);

  return (
    <SocketContext.Provider value={{ socket, status, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
}
