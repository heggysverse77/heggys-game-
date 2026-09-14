import { getSocket } from './socket.client';
import {
  SOCKET_EVENTS,
  type RoundStartPayload,
  type RoundSubmitAnswerPayload,
  type RoundAnswerStatusesPayload,
  type RoundNextRoundPayload,
  type RoundResultsPayload,
} from './socket.types';

export function onRoundStart(cb: (payload: RoundStartPayload) => void): () => void {
  const socket = getSocket();
  socket.on(SOCKET_EVENTS.ROUND_START, cb);
  return () => socket.off(SOCKET_EVENTS.ROUND_START, cb);
}

export function emitSubmitAnswer(payload: RoundSubmitAnswerPayload): void {
  getSocket().emit(SOCKET_EVENTS.ROUND_SUBMIT_ANSWER, payload);
}

export function onAnswerStatuses(cb: (payload: RoundAnswerStatusesPayload) => void): () => void {
  const socket = getSocket();
  socket.on(SOCKET_EVENTS.ROUND_ANSWER_STATUSES, cb);
  return () => socket.off(SOCKET_EVENTS.ROUND_ANSWER_STATUSES, cb);
}

export function onRoundResults(cb: (payload: RoundResultsPayload) => void): () => void {
  const socket = getSocket();
  socket.on(SOCKET_EVENTS.ROUND_RESULTS, cb);
  return () => socket.off(SOCKET_EVENTS.ROUND_RESULTS, cb);
}

export function emitNextRound(payload: RoundNextRoundPayload): void {
  getSocket().emit(SOCKET_EVENTS.ROUND_NEXT_ROUND, payload);
}

export function emitForceMatching(payload: { gameId: string; roundId: string }): void {
  getSocket().emit('ROUND:FORCE_MATCHING', payload);
}

export function emitForceResults(payload: { gameId: string; roundId: string }): void {
  getSocket().emit('ROUND:FORCE_RESULTS', payload);
}

export function emitShowScoreboard(payload: { gameId: string }): void {
  getSocket().emit('ROUND:SHOW_SCOREBOARD', payload);
}

export function onScoreboardDisplayed(cb: (payload: { gameId: string }) => void): () => void {
  const socket = getSocket();
  socket.on('ROUND:SCOREBOARD_DISPLAYED', cb);
  return () => socket.off('ROUND:SCOREBOARD_DISPLAYED', cb);
}

export function onRoundError(cb: (payload: { message: string; code?: string }) => void): () => void {
  const socket = getSocket();
  socket.on(SOCKET_EVENTS.ROUND_ERROR, cb);
  return () => socket.off(SOCKET_EVENTS.ROUND_ERROR, cb);
}
