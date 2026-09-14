import { getSocket } from './socket.client';
import {
  SOCKET_EVENTS,
  type DareAssignPayload,
  type DareAnnouncedPayload,
  type DareCompletePayload,
} from './socket.types';

export function emitDareAssign(payload: DareAssignPayload): void {
  getSocket().emit(SOCKET_EVENTS.DARE_ASSIGN, payload);
}

export function onDareAnnounced(cb: (payload: DareAnnouncedPayload) => void): () => void {
  const socket = getSocket();
  socket.on(SOCKET_EVENTS.DARE_ANNOUNCED, cb);
  return () => socket.off(SOCKET_EVENTS.DARE_ANNOUNCED, cb);
}

export function emitDareComplete(payload: DareCompletePayload): void {
  getSocket().emit(SOCKET_EVENTS.DARE_COMPLETE, payload);
}
