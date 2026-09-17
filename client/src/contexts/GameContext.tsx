import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from 'react';
import type { Game, GamePlayer, Question, AnonymousAnswerDTO } from '../types';
import type {
  LeaderboardEntry,
  RoundResultsPayload,
  GameFinalResultsPayload,
  RoundAnswerStatusesPayload,
  DareCard,
} from '../socket/socket.types';

// ─── State Shape ──────────────────────────────────────────────────────────────

type GamePhase =
  | 'LOBBY'
  | 'ANSWERING'
  | 'MATCHING'
  | 'RESULTS'
  | 'FINAL'
  | 'DARE';

interface GameState {
  game: Game | null;
  players: GamePlayer[];
  myPlayerId: string | null;

  // Round
  phase: GamePhase;
  currentRoundId: string | null;
  currentRoundNumber: number;
  currentQuestion: Question | null;
  timerSeconds: number;

  // Answering phase
  hasSubmittedAnswer: boolean;
  answerStatuses: RoundAnswerStatusesPayload | null;

  // Matching phase
  anonymousAnswers: AnonymousAnswerDTO[];
  playersToMatch: GamePlayer[];
  myGuesses: Record<string, string>; // answerId → guessedPlayerId
  hasSubmittedGuesses: boolean;

  // Results
  roundResults: RoundResultsPayload | null;
  leaderboard: LeaderboardEntry[];

  // Final
  finalResults: GameFinalResultsPayload | null;
  dareCards: DareCard[];
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type GameAction =
  | { type: 'GAME_JOINED';       game: Game; players: GamePlayer[]; myPlayerId: string }
  | { type: 'GAME_SETTINGS_UPDATED'; game: Game }
  | { type: 'SET_PHASE';         phase: GamePhase }
  | { type: 'PLAYERS_UPDATED';   players: GamePlayer[] }
  | { type: 'ROUND_STARTED';     roundId: string; roundNumber: number; question: Question; timer: number }
  | { type: 'ANSWER_SUBMITTED' }
  | { type: 'ANSWER_RESET' }
  | { type: 'ANSWER_STATUSES';   statuses: RoundAnswerStatusesPayload }
  | { type: 'MATCHING_STARTED';  answers: AnonymousAnswerDTO[]; players: GamePlayer[]; timer: number }
  | { type: 'GUESS_SET';         answerId: string; playerId: string }
  | { type: 'GUESS_UNSET';       answerId: string }
  | { type: 'GUESSES_SUBMITTED' }
  | { type: 'RESULTS_RECEIVED';  results: RoundResultsPayload }
  | { type: 'FINAL_RESULTS';     results: GameFinalResultsPayload }
  | { type: 'RESET' };


// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: GameState = {
  game: null,
  players: [],
  myPlayerId: null,
  phase: 'LOBBY',
  currentRoundId: null,
  currentRoundNumber: 0,
  currentQuestion: null,
  timerSeconds: 0,
  hasSubmittedAnswer: false,
  answerStatuses: null,
  anonymousAnswers: [],
  playersToMatch: [],
  myGuesses: {},
  hasSubmittedGuesses: false,
  roundResults: null,
  leaderboard: [],
  finalResults: null,
  dareCards: [],
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'GAME_JOINED':
      return {
        ...state,
        game: action.game,
        players: action.players,
        myPlayerId: action.myPlayerId,
        phase: action.game.status === 'IN_PROGRESS' ? (state.phase === 'LOBBY' ? 'ANSWERING' : state.phase) : 'LOBBY',
      };

    case 'GAME_SETTINGS_UPDATED':
      return { ...state, game: action.game };

    case 'SET_PHASE':
      return { ...state, phase: action.phase };

    case 'PLAYERS_UPDATED':
      return { ...state, players: action.players };

    case 'ROUND_STARTED':
      return {
        ...state,
        phase: 'ANSWERING',
        currentRoundId: action.roundId,
        currentRoundNumber: action.roundNumber,
        currentQuestion: action.question,
        timerSeconds: action.timer,
        hasSubmittedAnswer: false,
        answerStatuses: null,
        anonymousAnswers: [],
        myGuesses: {},
        hasSubmittedGuesses: false,
        roundResults: null,
        finalResults: null,
        dareCards: [],
      };

    case 'ANSWER_SUBMITTED':
      return { ...state, hasSubmittedAnswer: true };

    case 'ANSWER_RESET':
      return { ...state, hasSubmittedAnswer: false };

    case 'ANSWER_STATUSES':
      return { ...state, answerStatuses: action.statuses };

    case 'MATCHING_STARTED':
      return {
        ...state,
        phase: 'MATCHING',
        anonymousAnswers: action.answers,
        playersToMatch: action.players,
        timerSeconds: action.timer,
        myGuesses: {},
        hasSubmittedGuesses: false,
      };

    case 'GUESS_SET': {
      const updatedGuesses = { ...state.myGuesses };
      // Enforce 1-to-1 matching: remove this player from any other answer they were previously assigned to
      for (const key of Object.keys(updatedGuesses)) {
        if (updatedGuesses[key] === action.playerId) {
          delete updatedGuesses[key];
        }
      }
      updatedGuesses[action.answerId] = action.playerId;
      return {
        ...state,
        myGuesses: updatedGuesses,
      };
    }

    case 'GUESS_UNSET': {
      const updatedGuesses = { ...state.myGuesses };
      delete updatedGuesses[action.answerId];
      return {
        ...state,
        myGuesses: updatedGuesses,
      };
    }

    case 'GUESSES_SUBMITTED':
      return { ...state, hasSubmittedGuesses: true };

    case 'RESULTS_RECEIVED':
      return {
        ...state,
        phase: 'RESULTS',
        roundResults: action.results,
        leaderboard: action.results.leaderboard,
      };

    case 'FINAL_RESULTS':
      return {
        ...state,
        phase: 'FINAL',
        finalResults: action.results,
        leaderboard: action.results.finalLeaderboard,
        dareCards: action.results.dareCards ?? [],
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used inside GameProvider');
  return ctx;
}
