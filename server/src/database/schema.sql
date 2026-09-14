-- SQL Schema for اعرف صاحبك وعلّم عليه (Know Your Friend & Expose Them)
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE game_status AS ENUM ('LOBBY', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');
CREATE TYPE round_phase AS ENUM ('QUESTION', 'ANSWERING', 'PREVIEW', 'MATCHING', 'RESULTS', 'FINISHED');
CREATE TYPE dare_severity AS ENUM ('MILD', 'SPICY', 'CHAOS');
CREATE TYPE dare_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED');

-- 1. Users Table (Supports Guests & Registered Accounts)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    avatar_id VARCHAR(50) DEFAULT 'avatar_1',
    is_guest BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Games / Rooms Table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(8) UNIQUE NOT NULL,
    host_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status game_status DEFAULT 'LOBBY',
    current_round_number INT DEFAULT 0,
    total_rounds INT DEFAULT 5,
    min_players INT DEFAULT 3,
    max_players INT DEFAULT 8,
    answering_timer_sec INT DEFAULT 30,
    matching_timer_sec INT DEFAULT 45,
    dare_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_games_room_code ON games(room_code);
CREATE INDEX idx_games_status ON games(status);

-- 3. Game Players  
CREATE TABLE game_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(50) NOT NULL,
    is_host BOOLEAN DEFAULT false,
    is_connected BOOLEAN DEFAULT true,
    total_score INT DEFAULT 0,
    final_rank INT,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_game_user UNIQUE (game_id, user_id)
);

CREATE INDEX idx_game_players_game_id ON game_players(game_id);

-- 4. Questions Bank
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text_ar TEXT NOT NULL,
    text_en TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Game Rounds
CREATE TABLE game_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    question_id UUID NOT NULL REFERENCES questions(id),
    phase round_phase DEFAULT 'QUESTION',
    phase_started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    phase_deadline TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_game_round UNIQUE (game_id, round_number)
);

CREATE INDEX idx_game_rounds_game_id ON game_rounds(game_id);

-- 6. Canonical Answers Dictionary & Aliases
CREATE TABLE canonical_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canonical_key VARCHAR(100) UNIQUE NOT NULL,
    display_name_ar VARCHAR(100) NOT NULL,
    display_name_en VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE answer_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canonical_id UUID NOT NULL REFERENCES canonical_answers(id) ON DELETE CASCADE,
    alias_normalized VARCHAR(150) NOT NULL,
    language VARCHAR(10) DEFAULT 'ar',
    CONSTRAINT unique_alias_normalized UNIQUE (alias_normalized)
);

CREATE INDEX idx_answer_aliases_normalized ON answer_aliases(alias_normalized);

-- 7. Round Answers
CREATE TABLE round_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
    game_player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    normalized_text TEXT NOT NULL,
    canonical_key VARCHAR(200) NOT NULL DEFAULT '',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_round_player_answer UNIQUE (round_id, game_player_id),
    CONSTRAINT unique_round_canonical_key UNIQUE (round_id, canonical_key)
);

CREATE INDEX idx_round_answers_round_id ON round_answers(round_id);
CREATE INDEX idx_round_answers_canonical_key ON round_answers(round_id, canonical_key);

-- 7. Round Guesses (Matching submissions)
CREATE TABLE round_guesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
    guesser_player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
    answer_id UUID NOT NULL REFERENCES round_answers(id) ON DELETE CASCADE,
    guessed_player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
    is_correct BOOLEAN DEFAULT false,
    points_awarded INT DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_guesser_answer UNIQUE (round_id, guesser_player_id, answer_id),
    CONSTRAINT no_self_guessing CHECK (guesser_player_id <> guessed_player_id)
);

CREATE INDEX idx_round_guesses_round_id ON round_guesses(round_id);

-- 8. Round Scores Breakdown
CREATE TABLE round_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
    game_player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
    points_gained INT DEFAULT 0,
    correct_guesses INT DEFAULT 0,
    fooled_friends INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_round_player_score UNIQUE (round_id, game_player_id)
);

-- 9. Dares Bank
CREATE TABLE dares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text_ar TEXT NOT NULL,
    severity dare_severity DEFAULT 'MILD',
    category VARCHAR(50) DEFAULT 'SOCIAL',
    is_active BOOLEAN DEFAULT true
);

-- 10. Game Dare Assignments (Loser punishment execution)
CREATE TABLE game_dare_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    dare_id UUID NOT NULL REFERENCES dares(id),
    target_player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
    assigned_by_player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
    status dare_status DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
