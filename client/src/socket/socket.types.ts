import type { Game, GamePlayer, Question, AnonymousAnswerDTO, RoundScore } from '../types';

// ─── Lobby Events ─────────────────────────────────────────────────────────────

export interface LobbyJoinRoomPayload {
  gameId: string;
  nickname?: string;
}

export interface LobbyLeaveRoomPayload {
  gameId: string;
}

export interface LobbyUpdatePlayersPayload {
  gameId: string;
  players: GamePlayer[];
}

export interface LobbyUpdateSettingsPayload {
  gameId: string;
  settings: {
    totalRounds?: number;
    answeringTimerSec?: number;
    matchingTimerSec?: number;
    dareEnabled?: boolean;
    maxPlayers?: number;
  };
}

export interface LobbySettingsUpdatedPayload {
  gameId: string;
  game: Game;
}

// ─── Game State Sync ──────────────────────────────────────────────────────────

export interface GameCurrentStatePayload {
  game: Game;
  players: GamePlayer[];
  isReconnection: boolean;
}

// ─── Round Events ─────────────────────────────────────────────────────────────

export interface RoundStartPayload {
  roundId: string;
  roundNumber: number;
  question: Question;
  timer: number;
  players: GamePlayer[];
}

export interface RoundSubmitAnswerPayload {
  gameId: string;
  roundId: string;
  text: string;
}

export interface PlayerAnswerStatus {
  playerId: string;
  nickname: string;
  avatarId: string;
  hasAnswered: boolean;
  isTyping?: boolean;
}

export interface RoundAnswerStatusesPayload {
  submittedCount: number;
  totalPlayers: number;
  players: PlayerAnswerStatus[];
}

// ─── Matching Phase ───────────────────────────────────────────────────────────

export interface RoundStartMatchingPayload {
  anonymousAnswers: AnonymousAnswerDTO[];
  playersToMatch: GamePlayer[];
  timer: number;
}

export interface MatchingGuess {
  answerId: string;
  guessedPlayerId: string;
}

export interface MatchingSubmitGuessesPayload {
  gameId: string;
  roundId: string;
  guesses: MatchingGuess[];
}

// ─── Results ──────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  avatarId: string;
  totalScore: number;
  pointsGained: number;
  correctGuesses: number;
  fooledFriends: number;
  rank: number;
  titleBadge?: string;
  commentary?: string;
}

export interface RevealedAnswerGuesser {
  guesserPlayerId: string;
  nickname: string;
  avatarId: string;
  isCorrect: boolean;
}

export interface RevealedAnswer {
  answerId: string;
  text: string;
  playerId: string;
  nickname: string;
  avatarId?: string;
  guessers?: RevealedAnswerGuesser[];
}

export interface RoundResultsPayload {
  roundNumber: number;
  scores: RoundScore[];
  leaderboard: LeaderboardEntry[];
  revealedAnswers: RevealedAnswer[];
}

export interface RoundNextRoundPayload {
  gameId: string;
}

// ─── Final Results ────────────────────────────────────────────────────────────

export interface DareCard {
  id: string;
  text_ar?: string;
  textAr?: string;
  severity: 'MILD' | 'SPICY' | 'CHAOS';
  category?: string;
}

export interface GameFinalResultsPayload {
  finalLeaderboard: LeaderboardEntry[];
  winner: { playerId: string; nickname: string; avatarId: string };
  loser:  { playerId: string; nickname: string; avatarId: string };
  dareEnabled?: boolean;
  dareCards?: DareCard[];
  isRankStolen?: boolean;
  previousLeader?: LeaderboardEntry | null;
}

// ─── Dare Events ──────────────────────────────────────────────────────────────

export interface DareAssignPayload {
  gameId: string;
  dareId: string;
}

export interface DareAnnouncedPayload {
  dareText: string;
  winnerNickname: string;
  loserNickname: string;
  severity: 'MILD' | 'SPICY' | 'CHAOS';
}

export interface DareCompletePayload {
  gameId: string;
  assignmentId: string;
}

// ─── Socket Event Name Map ────────────────────────────────────────────────────

export const SOCKET_EVENTS = {
  // Lobby
  LOBBY_JOIN_ROOM:        'LOBBY:JOIN_ROOM',
  LOBBY_LEAVE_ROOM:       'LOBBY:LEAVE_ROOM',
  LOBBY_UPDATE_PLAYERS:   'LOBBY:UPDATE_PLAYERS',
  LOBBY_START_GAME:       'LOBBY:START_GAME',
  LOBBY_UPDATE_SETTINGS:  'LOBBY:UPDATE_SETTINGS',
  LOBBY_SETTINGS_UPDATED: 'LOBBY:SETTINGS_UPDATED',
  LOBBY_ADD_BOT:          'LOBBY:ADD_BOT',
  LOBBY_REMOVE_BOT:       'LOBBY:REMOVE_BOT',
  LOBBY_REMATCH:          'LOBBY:REMATCH',
  LOBBY_REMATCH_STARTED:  'LOBBY:REMATCH_STARTED',

  // Game State
  GAME_CURRENT_STATE: 'GAME:CURRENT_STATE',
  GAME_FINAL_RESULTS: 'GAME:FINAL_RESULTS',

  // Round
  ROUND_START:          'ROUND:START',
  ROUND_SUBMIT_ANSWER:  'ROUND:SUBMIT_ANSWER',
  ROUND_ANSWER_STATUSES:'ROUND:ANSWER_STATUSES',
  ROUND_START_MATCHING: 'ROUND:START_MATCHING',
  ROUND_RESULTS:        'ROUND:RESULTS',
  ROUND_NEXT_ROUND:     'ROUND:NEXT_ROUND',
  ROUND_ERROR:          'ROUND:ERROR',

  // Matching
  MATCHING_SUBMIT_GUESSES: 'MATCHING:SUBMIT_GUESSES',

  // Dare
  DARE_ASSIGN:     'DARE:ASSIGN',
  DARE_ANNOUNCED:  'DARE:ANNOUNCED',
  DARE_COMPLETE:   'DARE:COMPLETE',
} as const;

