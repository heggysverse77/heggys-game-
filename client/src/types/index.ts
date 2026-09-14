export type GameStatus = 'LOBBY' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';

export type RoundPhase = 
  | 'QUESTION'
  | 'ANSWERING'
  | 'PREVIEW'
  | 'MATCHING'
  | 'RESULTS'
  | 'FINISHED';

export type QuestionCategory = 'FUNNY' | 'DEEP' | 'SECRETS' | 'DAILY_LIFE' | 'SPICY';

export type DareSeverity = 'MILD' | 'SPICY' | 'CHAOS';

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar_id: string;
  is_guest: boolean;
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
}

export interface Question {
  id: string;
  text_ar: string;
  category: QuestionCategory;
}

export interface AnonymousAnswerDTO {
  answer_id: string;
  text: string;
}

export interface RoundScore {
  game_player_id: string;
  points_gained: number;
  correct_guesses: number;
  fooled_friends: number;
}
