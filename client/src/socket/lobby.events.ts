import { getSocket } from './socket.client';
import {
  SOCKET_EVENTS,
  type LobbyJoinRoomPayload,
  type LobbyLeaveRoomPayload,
  type LobbyUpdatePlayersPayload,
  type LobbyUpdateSettingsPayload,
  type LobbySettingsUpdatedPayload,
  type GameCurrentStatePayload,
} from './socket.types';

export function emitJoinRoom(payload: LobbyJoinRoomPayload): void {
  getSocket().emit(SOCKET_EVENTS.LOBBY_JOIN_ROOM, payload);
}

export function emitLeaveRoom(payload: LobbyLeaveRoomPayload): void {
  getSocket().emit(SOCKET_EVENTS.LOBBY_LEAVE_ROOM, payload);
}

export function onUpdatePlayers(cb: (payload: LobbyUpdatePlayersPayload) => void): () => void {
  const socket = getSocket();
  socket.on(SOCKET_EVENTS.LOBBY_UPDATE_PLAYERS, cb);
  return () => socket.off(SOCKET_EVENTS.LOBBY_UPDATE_PLAYERS, cb);
}

export function onCurrentState(cb: (payload: GameCurrentStatePayload) => void): () => void {
  const socket = getSocket();
  socket.on(SOCKET_EVENTS.GAME_CURRENT_STATE, cb);
  return () => socket.off(SOCKET_EVENTS.GAME_CURRENT_STATE, cb);
}

export function emitStartGame(gameId: string): void {
  getSocket().emit(SOCKET_EVENTS.LOBBY_START_GAME, { gameId });
}

export function emitUpdateSettings(payload: LobbyUpdateSettingsPayload): void {
  getSocket().emit(SOCKET_EVENTS.LOBBY_UPDATE_SETTINGS, payload);
}

export function onSettingsUpdated(cb: (payload: LobbySettingsUpdatedPayload) => void): () => void {
  const socket = getSocket();
  socket.on(SOCKET_EVENTS.LOBBY_SETTINGS_UPDATED, cb);
  return () => socket.off(SOCKET_EVENTS.LOBBY_SETTINGS_UPDATED, cb);
}

export function emitAddBot(payload: { gameId: string }): void {
  getSocket().emit(SOCKET_EVENTS.LOBBY_ADD_BOT, payload);
}

export function emitRemoveBot(payload: { gameId: string }): void {
  getSocket().emit(SOCKET_EVENTS.LOBBY_REMOVE_BOT, payload);
}

export function emitRematch(payload: { gameId: string }): void {
  getSocket().emit(SOCKET_EVENTS.LOBBY_REMATCH, payload);
}

export function onRematchStarted(cb: (payload: { gameId: string; game: any; players: any[] }) => void): () => void {
  const socket = getSocket();
  socket.on(SOCKET_EVENTS.LOBBY_REMATCH_STARTED, cb);
  return () => socket.off(SOCKET_EVENTS.LOBBY_REMATCH_STARTED, cb);
}

export function emitKickPlayer(payload: { gameId: string; targetPlayerId: string }): void {
  getSocket().emit('LOBBY:KICK_PLAYER', payload);
}

export function onKicked(cb: (payload: { message: string }) => void): () => void {
  const socket = getSocket();
  socket.on('LOBBY:KICKED', cb);
  return () => socket.off('LOBBY:KICKED', cb);
}

export function emitReturnToLobby(payload: { gameId: string }): void {
  getSocket().emit('LOBBY:RETURN_TO_LOBBY', payload);
}

export function emitTransferHost(payload: { gameId: string; targetPlayerId: string }): void {
  getSocket().emit('GAME:TRANSFER_HOST', payload);
}

export function onHostTransferred(cb: (payload: { gameId: string; newHostUserId: string; newHostNickname: string; message: string }) => void): () => void {
  const socket = getSocket();
  socket.on('LOBBY:HOST_TRANSFERRED', cb);
  return () => socket.off('LOBBY:HOST_TRANSFERRED', cb);
}



