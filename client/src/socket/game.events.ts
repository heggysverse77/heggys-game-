import { getSocket } from './socket.client';
import {
  SOCKET_EVENTS,
  type RoundStartMatchingPayload,
  type MatchingSubmitGuessesPayload,
  type GameFinalResultsPayload,
} from './socket.types';

export function onStartMatching(cb: (payload: RoundStartMatchingPayload) => void): () => void {
  const socket = getSocket();
  socket.on(SOCKET_EVENTS.ROUND_START_MATCHING, cb);
  return () => socket.off(SOCKET_EVENTS.ROUND_START_MATCHING, cb);
}

export function emitSubmitGuesses(payload: MatchingSubmitGuessesPayload): void {
  getSocket().emit(SOCKET_EVENTS.MATCHING_SUBMIT_GUESSES, payload);
}

export function onFinalResults(cb: (payload: GameFinalResultsPayload) => void): () => void {
  const socket = getSocket();
  socket.on(SOCKET_EVENTS.GAME_FINAL_RESULTS, cb);
  return () => socket.off(SOCKET_EVENTS.GAME_FINAL_RESULTS, cb);
}

export function onGuessStatuses(cb: (payload: { roundId: string; submittedCount: number; totalPlayers: number; players: Array<{ userId: string; gamePlayerId: string; nickname: string; avatarId: string; hasGuessed: boolean }> }) => void): () => void {
  const socket = getSocket();
  socket.on('MATCHING:GUESS_STATUSES', cb);
  return () => socket.off('MATCHING:GUESS_STATUSES', cb);
}
