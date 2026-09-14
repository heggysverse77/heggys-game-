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
