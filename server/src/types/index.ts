export type GameStatus = 'LOBBY' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';

export type RoundPhase = 
  | 'QUESTION'
  | 'ANSWERING'
  | 'PREVIEW'
  | 'MATCHING'
  | 'RESULTS'
  | 'FINISHED';

export type DareSeverity = 'MILD' | 'SPICY' | 'CHAOS';

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar_id: string;
  is_guest: boolean;
  created_at: Date;
}

export interface Game {
  id: string;
  room_code: string;
  host_user_id: string;
  status: GameStatus;
  current_round_number: number;
  total_rounds: number;
  min_players: number;
  max_players: number;
  answering_timer_sec: number;
  matching_timer_sec: number;
  dare_enabled: boolean;
  created_at: Date;
  finished_at?: Date;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  user_id: string;
  nickname: string;
  is_host: boolean;
  is_connected: boolean;
  total_score: number;
  final_rank?: number;
  joined_at: Date;
}

export interface Question {
  id: string;
  text_ar: string;
  text_en?: string;
}

export interface GameRound {
  id: string;
  game_id: string;
  round_number: number;
  question_id: string;
  phase: RoundPhase;
  phase_started_at: Date;
  phase_deadline: Date;
  completed_at?: Date;
}

export interface RoundAnswer {
  id: string;
  round_id: string;
  game_player_id: string;
  raw_text: string;
  normalized_text: string;
  submitted_at: Date;
}

export interface RoundGuess {
  id: string;
  round_id: string;
  guesser_player_id: string;
  answer_id: string;
  guessed_player_id: string;
  is_correct: boolean;
  points_awarded: number;
  submitted_at: Date;
}

export interface RoundScore {
  id: string;
  round_id: string;
  game_player_id: string;
  points_gained: number;
  correct_guesses: number;
  fooled_friends: number;
}

export interface Dare {
  id: string;
  text_ar: string;
  severity: DareSeverity;
  category: string;
}

// Client-facing DTO for Anonymized Answers during MATCHING phase
export interface AnonymousAnswerDTO {
  answer_id: string;
  text: string;
}
