import { pool } from '../../config/db.js';
import { GameRound, Question } from '../../types/index.js';
import { normalizeArabicText } from '../../utils/arabic.nlp.js';
import {
  resolveCanonicalAnswer,
  isCanonicalAnswerTakenInRound,
} from './canonical.service.js';

export interface PlayerAnswerStatus {
  userId: string;
  gamePlayerId: string;
  nickname: string;
  avatarId: string;
  hasAnswered: boolean;
}

export interface StartGameResult {
  gameId: string;
  round: GameRound;
  question: Question;
  answeringTimerSec: number;
}

/**
 * Normalizes answer text using the Arabic NLP engine for consistent comparison and deduplication
 */
export const normalizeAnswerText = (text: string): string => {
  return normalizeArabicText(text);
};

/**
 * Validates host status and starts the game session (Transition LOBBY -> IN_PROGRESS)
 */
export const startGameSession = async (
  gameId: string,
  hostUserId: string
): Promise<StartGameResult> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verify game exists and host user is indeed the room host
    const gameRes = await client.query(
      'SELECT * FROM games WHERE id = $1 FOR UPDATE;',
      [gameId]
    );

    if (gameRes.rows.length === 0) {
      throw new Error('GAME_NOT_FOUND');
    }

    const game = gameRes.rows[0];

    if (game.host_user_id !== hostUserId) {
      throw new Error('NOT_HOST');
    }

    if (game.status !== 'LOBBY') {
      throw new Error('GAME_ALREADY_STARTED');
    }

    // 2. Verify connected player count meets requirement (count active human players + bots)
    const countRes = await client.query(
      `SELECT COUNT(*)::int AS count FROM game_players 
       WHERE game_id = $1 
         AND (is_connected = true OR is_bot = true) 
         AND status NOT IN ('KICKED', 'LEFT');`,
      [gameId]
    );

    const connectedCount = countRes.rows[0].count;
    const minRequired = Math.min(game.min_players, 2);
    if (connectedCount < minRequired) {
      throw new Error(`INSUFFICIENT_PLAYERS:${minRequired}`);
    }

    // 3. Update game status to IN_PROGRESS and set current_round_number = 1
    await client.query(
      "UPDATE games SET status = 'IN_PROGRESS', current_round_number = 1 WHERE id = $1;",
      [gameId]
    );

    // Ensure room_used_questions table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS room_used_questions (
        room_code VARCHAR(10) NOT NULL,
        question_id VARCHAR(64) NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (room_code, question_id)
      );
    `);

    // 4. Select a random active question from questions bank excluding questions used in this room
    let questionRes = await client.query(
      `SELECT * FROM questions 
       WHERE is_active = true 
         AND id::text NOT IN (SELECT question_id::text FROM room_used_questions WHERE room_code = $1)
       ORDER BY RANDOM() LIMIT 1;`,
      [game.room_code]
    );

    // Fallback: if all questions have been used in this room, reset history for this room and pick again
    if (questionRes.rows.length === 0) {
      await client.query('DELETE FROM room_used_questions WHERE room_code = $1;', [game.room_code]);
      questionRes = await client.query(
        'SELECT * FROM questions WHERE is_active = true ORDER BY RANDOM() LIMIT 1;'
      );
    }

    const question: Question = questionRes.rows[0];

    // Mark question as used for this room
    await client.query(
      `INSERT INTO room_used_questions (room_code, question_id)
       VALUES ($1, $2)
       ON CONFLICT (room_code, question_id) DO NOTHING;`,
      [game.room_code, question.id]
    );

    // 5. Create Round 1 record
    const deadline = new Date(Date.now() + game.answering_timer_sec * 1000);
    const insertRoundQuery = `
      INSERT INTO game_rounds (game_id, round_number, question_id, phase, phase_deadline)
      VALUES ($1, 1, $2, 'ANSWERING', $3)
      RETURNING *;
    `;

    const roundRes = await client.query(insertRoundQuery, [
      gameId,
      question.id,
      deadline,
    ]);

    const round: GameRound = roundRes.rows[0];

    await client.query('COMMIT');

    return {
      gameId,
      round,
      question,
      answeringTimerSec: game.answering_timer_sec,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Submits or updates a player's secret answer for a round
 * Enforces Canonical Answer uniqueness (e.g. "برجر" vs "Hamburger" vs "همبرجر")
 */
export const submitRoundAnswer = async (
  roundId: string,
  gamePlayerId: string,
  rawText: string
) => {
  // 0. Verify round is in ANSWERING phase
  const roundRes = await pool.query('SELECT phase FROM game_rounds WHERE id = $1;', [roundId]);
  if (roundRes.rows.length === 0 || roundRes.rows[0].phase !== 'ANSWERING') {
    throw new Error('ROUND_NOT_IN_ANSWERING_PHASE');
  }

  // 1. Resolve Canonical Key (e.g. "Hamburger" -> "BURGER")
  const resolution = await resolveCanonicalAnswer(rawText);

  if (!resolution.normalizedText) {
    throw new Error('EMPTY_ANSWER');
  }

  // 2. Check if this Canonical Answer is already claimed by another player in this round
  const isTaken = await isCanonicalAnswerTakenInRound(
    roundId,
    resolution.canonicalKey,
    gamePlayerId,
    rawText
  );

  if (isTaken) {
    throw new Error('ANSWER_ALREADY_TAKEN');
  }

  // 3. Save unique answer into round_answers
  const query = `
    INSERT INTO round_answers (round_id, game_player_id, raw_text, normalized_text, canonical_key)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (round_id, game_player_id)
    DO UPDATE SET 
      raw_text = EXCLUDED.raw_text,
      normalized_text = EXCLUDED.normalized_text,
      canonical_key = EXCLUDED.canonical_key,
      submitted_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  const result = await pool.query(query, [
    roundId,
    gamePlayerId,
    rawText.trim(),
    resolution.normalizedText,
    resolution.canonicalKey,
  ]);

  return result.rows[0];
};

/**
 * Fetches per-player answer status (hasAnswered: boolean) without revealing secret answers
 */
export const getRoundAnswerStatuses = async (
  roundId: string,
  gameId: string
): Promise<{
  submittedCount: number;
  totalPlayers: number;
  players: PlayerAnswerStatus[];
}> => {
  const query = `
    SELECT 
      gp.user_id AS "userId",
      gp.id AS "gamePlayerId",
      gp.nickname,
      u.avatar_id AS "avatarId",
      CASE WHEN ra.id IS NOT NULL THEN true ELSE false END AS "hasAnswered"
    FROM game_players gp
    JOIN users u ON gp.user_id = u.id
    LEFT JOIN round_answers ra ON ra.round_id = $1 AND ra.game_player_id = gp.id
    WHERE gp.game_id = $2
      AND gp.is_connected = true
      AND gp.status NOT IN ('KICKED', 'LEFT')
    ORDER BY gp.joined_at ASC;
  `;

  const result = await pool.query(query, [roundId, gameId]);
  const players: PlayerAnswerStatus[] = result.rows;
  const submittedCount = players.filter((p) => p.hasAnswered).length;

  return {
    submittedCount,
    totalPlayers: players.length,
    players,
  };
};

export interface AnonymousAnswerDTO {
  answerId: string;
  text: string;
  authorPlayerId?: string;
  authorUserId?: string;
}

export interface GuesserDetail {
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
  avatarId: string;
  guessers?: GuesserDetail[];
}

export const getRoundRevealedAnswers = async (roundId: string): Promise<RevealedAnswer[]> => {
  const query = `
    SELECT 
      ra.id AS "answerId",
      ra.raw_text AS "text",
      gp.id AS "playerId",
      gp.nickname,
      u.avatar_id AS "avatarId",
      COALESCE(
        (
          SELECT json_agg(json_build_object(
            'guesserPlayerId', rg.guesser_player_id,
            'nickname', guesser_gp.nickname,
            'avatarId', guesser_u.avatar_id,
            'isCorrect', rg.is_correct
          ))
          FROM round_guesses rg
          JOIN game_players guesser_gp ON rg.guesser_player_id = guesser_gp.id
          JOIN users guesser_u ON guesser_gp.user_id = guesser_u.id
          WHERE rg.answer_id = ra.id AND rg.round_id = $1
        ),
        '[]'::json
      ) AS "guessers"
    FROM round_answers ra
    JOIN game_players gp ON ra.game_player_id = gp.id
    JOIN users u ON gp.user_id = u.id
    WHERE ra.round_id = $1
    ORDER BY ra.submitted_at ASC;
  `;
  const res = await pool.query(query, [roundId]);
  return res.rows;
};

export interface GuessSubmission {
  answerId: string;
  guessedPlayerId: string;
}

export interface PlayerGuessStatus {
  userId: string;
  gamePlayerId: string;
  nickname: string;
  avatarId: string;
  hasGuessed: boolean;
}

export interface PlayerScoreBreakdown {
  rank: number;
  gamePlayerId: string;
  userId: string;
  nickname: string;
  avatarId: string;
  pointsGained: number;
  correctGuesses: number;
  fooledFriends: number;
  totalScore: number;
  titleBadge: string;
  commentary: string;
}

/**
 * Generates engaging and humorous titles and commentary based on player rank
 */
export const getRankFeedback = (
  rank: number,
  totalPlayers: number
): { titleBadge: string; commentary: string } => {
  if (rank === 1) {
    return {
      titleBadge: '🧠 كاشف الأسرار (Mind Reader)',
      commentary: 'أنت أكتر واحد عارف صحابك وفاهَمهم صح! 🔥',
    };
  }

  if (rank === totalPlayers && totalPlayers > 1) {
    return {
      titleBadge: '🤡 الصاحب المزيف (Fake Friend)',
      commentary: 'هو أنت بجد صاحبهم ولا اتعرفت عليهم امبارح؟ 😂💀',
    };
  }

  if (rank === 2) {
    return {
      titleBadge: '🕵️ المحقق الذكي (Clever Detective)',
      commentary: 'كنت قريب جداً من الصدارة.. أداء محترم! 👏',
    };
  }

  if (rank === 3) {
    return {
      titleBadge: '🎯 الصاحب الجدع (Good Friend)',
      commentary: 'محاولات ممتازة وحضور قوي! 👍',
    };
  }

  return {
    titleBadge: '👀 المتابع الصامت (Silent Watcher)',
    commentary: 'شد حيلك شوية وركز مع حركات صحابك! 😉',
  };
};

/**
 * Fisher-Yates shuffle algorithm for randomizing answer order
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Transitions round from ANSWERING to MATCHING phase and generates anonymized answers
 */
export const startMatchingPhase = async (roundId: string, gameId: string) => {
  const gameRes = await pool.query('SELECT matching_timer_sec FROM games WHERE id = $1;', [
    gameId,
  ]);
  const matchingTimerSec = gameRes.rows[0]?.matching_timer_sec || 45;

  const deadline = new Date(Date.now() + matchingTimerSec * 1000);

  // Update round phase to MATCHING
  await pool.query(
    "UPDATE game_rounds SET phase = 'MATCHING', phase_deadline = $1 WHERE id = $2;",
    [deadline, roundId]
  );

  // Fetch all submitted answers with author metadata
  const answersRes = await pool.query(
    `SELECT 
       ra.id AS "answerId", 
       ra.raw_text AS "text", 
       ra.game_player_id AS "authorPlayerId",
       gp.user_id AS "authorUserId"
     FROM round_answers ra
     JOIN game_players gp ON ra.game_player_id = gp.id
     WHERE ra.round_id = $1;`,
    [roundId]
  );

  const allAnswersWithAuthors = answersRes.rows;

  const anonymousAnswers: any[] = shuffleArray(
    answersRes.rows.map((r) => ({
      answerId: r.answerId,
      answer_id: r.answerId,
      text: r.text,
      // Note: authorPlayerId and authorUserId are intentionally NOT included here
      // in public broadcasts to prevent clients from reading answer ownership before the reveal phase.
    }))
  );

  // Fetch connected players to match against
  const playersRes = await pool.query(
    `SELECT gp.id AS "gamePlayerId", gp.user_id AS "userId", gp.nickname, u.avatar_id AS "avatarId"
     FROM game_players gp
     JOIN users u ON gp.user_id = u.id
     WHERE gp.game_id = $1 AND gp.is_connected = true
     ORDER BY gp.joined_at ASC;`,
    [gameId]
  );

  return {
    roundId,
    phase: 'MATCHING' as const,
    matchingTimerSec,
    allAnswersWithAuthors,
    anonymousAnswers,
    playersToMatch: playersRes.rows,
  };
};

/**
 * Retrieves existing matching phase data without resetting timer or deadlines (for reconnection)
 */
export const getMatchingPhaseData = async (roundId: string, gameId: string, requestingUserId?: string) => {
  const roundRes = await pool.query('SELECT phase_deadline FROM game_rounds WHERE id = $1;', [roundId]);
  const gameRes = await pool.query('SELECT matching_timer_sec FROM games WHERE id = $1;', [gameId]);
  const matchingTimerSec = gameRes.rows[0]?.matching_timer_sec || 45;

  let remainingTimer = matchingTimerSec;
  if (roundRes.rows[0]?.phase_deadline) {
    const diff = Math.ceil((new Date(roundRes.rows[0].phase_deadline).getTime() - Date.now()) / 1000);
    remainingTimer = Math.max(1, Math.min(diff, matchingTimerSec));
  }

  const answersRes = await pool.query(
    `SELECT 
       ra.id AS "answerId", 
       ra.raw_text AS "text", 
       ra.game_player_id AS "authorPlayerId",
       gp.user_id AS "authorUserId"
     FROM round_answers ra
     JOIN game_players gp ON ra.game_player_id = gp.id
     WHERE ra.round_id = $1;`,
    [roundId]
  );

  const playersRes = await pool.query(
    `SELECT gp.id AS "gamePlayerId", gp.user_id AS "userId", gp.nickname, u.avatar_id AS "avatarId"
     FROM game_players gp
     JOIN users u ON gp.user_id = u.id
     WHERE gp.game_id = $1 AND gp.is_connected = true
     ORDER BY gp.joined_at ASC;`,
    [gameId]
  );

  // Filter out the requesting user's own answer so they only match their friends' answers
  const filteredAnswers = requestingUserId
    ? answersRes.rows.filter((r) => r.authorUserId !== requestingUserId)
    : answersRes.rows;

  const anonymousAnswers: any[] = shuffleArray(
    filteredAnswers.map((r) => ({
      answerId: r.answerId,
      answer_id: r.answerId,
      text: r.text,
    }))
  );

  return {
    roundId,
    phase: 'MATCHING' as const,
    matchingTimerSec: remainingTimer,
    anonymousAnswers,
    playersToMatch: playersRes.rows,
  };
};

/**
 * Submits player guesses for anonymized answers
 */
export const submitPlayerGuesses = async (
  roundId: string,
  guesserPlayerId: string,
  guesses: GuessSubmission[]
) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify round is in MATCHING phase
    const roundCheck = await client.query('SELECT phase FROM game_rounds WHERE id = $1;', [roundId]);
    if (roundCheck.rows.length === 0 || roundCheck.rows[0].phase !== 'MATCHING') {
      throw new Error('ROUND_NOT_IN_MATCHING_PHASE');
    }

    for (const guess of guesses) {
      // Rule: Cannot guess oneself
      if (guesserPlayerId === guess.guessedPlayerId) {
        throw new Error('SELF_GUESSING_PROHIBITED');
      }

      // Fetch actual author of this answer
      const authorRes = await client.query(
        'SELECT game_player_id FROM round_answers WHERE id = $1 AND round_id = $2;',
        [guess.answerId, roundId]
      );

      if (authorRes.rows.length === 0) continue;

      const actualAuthorId = authorRes.rows[0].game_player_id;
      if (actualAuthorId === guesserPlayerId) continue;

      const isCorrect = actualAuthorId === guess.guessedPlayerId;
      const pointsAwarded = isCorrect ? 100 : 0;

      const insertGuessQuery = `
        INSERT INTO round_guesses (round_id, guesser_player_id, answer_id, guessed_player_id, is_correct, points_awarded)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (round_id, guesser_player_id, answer_id)
        DO UPDATE SET
          guessed_player_id = EXCLUDED.guessed_player_id,
          is_correct = EXCLUDED.is_correct,
          points_awarded = EXCLUDED.points_awarded,
          submitted_at = CURRENT_TIMESTAMP;
      `;

      await client.query(insertGuessQuery, [
        roundId,
        guesserPlayerId,
        guess.answerId,
        guess.guessedPlayerId,
        isCorrect,
        pointsAwarded,
      ]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Gets per-avatar guessing progress (hasGuessed: boolean)
 */
export const getMatchingGuessStatuses = async (roundId: string, gameId: string) => {
  const query = `
    SELECT 
      gp.user_id AS "userId",
      gp.id AS "gamePlayerId",
      gp.nickname,
      u.avatar_id AS "avatarId",
      CASE WHEN COUNT(rg.id) > 0 THEN true ELSE false END AS "hasGuessed"
    FROM game_players gp
    JOIN users u ON gp.user_id = u.id
    LEFT JOIN round_guesses rg ON rg.round_id = $1 AND rg.guesser_player_id = gp.id
    WHERE gp.game_id = $2
      AND gp.is_connected = true
      AND gp.status NOT IN ('KICKED', 'LEFT')
    GROUP BY gp.id, u.avatar_id
    ORDER BY gp.joined_at ASC;
  `;

  const result = await pool.query(query, [roundId, gameId]);
  const players: PlayerGuessStatus[] = result.rows;
  const submittedCount = players.filter((p) => p.hasGuessed).length;

  return {
    submittedCount,
    totalPlayers: players.length,
    players,
  };
};

/**
 * Calculates round points (+100 for correct guess, +50 for fooling friends) and updates totals
 */
export const calculateRoundScores = async (
  roundId: string,
  gameId: string
): Promise<PlayerScoreBreakdown[]> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if round is already in RESULTS phase (e.g. player reconnect or page refresh)
    const roundCheck = await client.query('SELECT phase FROM game_rounds WHERE id = $1 FOR UPDATE;', [roundId]);
    const alreadyProcessed = roundCheck.rows[0]?.phase === 'RESULTS';

    if (alreadyProcessed) {
      // Just fetch the already computed scores from round_scores without updating game_players total_score again
      const existingScoresRes = await client.query(
        `SELECT 
           gp.id AS "gamePlayerId", 
           gp.user_id AS "userId", 
           gp.nickname, 
           u.avatar_id AS "avatarId", 
           gp.total_score AS "totalScore",
           COALESCE(rs.points_gained, 0) AS "pointsGained",
           COALESCE(rs.correct_guesses, 0) AS "correctGuesses",
           COALESCE(rs.fooled_friends, 0) AS "fooledFriends"
         FROM game_players gp
         JOIN users u ON gp.user_id = u.id
         LEFT JOIN round_scores rs ON rs.game_player_id = gp.id AND rs.round_id = $1
         WHERE gp.game_id = $2;`,
        [roundId, gameId]
      );

      const scoreBreakdowns: PlayerScoreBreakdown[] = [];
      for (const p of existingScoresRes.rows) {
        scoreBreakdowns.push({
          rank: 0,
          gamePlayerId: p.gamePlayerId,
          userId: p.userId,
          nickname: p.nickname,
          avatarId: p.avatarId,
          pointsGained: p.pointsGained,
          correctGuesses: p.correctGuesses,
          fooledFriends: p.fooledFriends,
          totalScore: p.totalScore,
          titleBadge: '',
          commentary: '',
        });
      }

      await client.query('COMMIT');

      scoreBreakdowns.sort((a, b) => b.totalScore - a.totalScore);
      scoreBreakdowns.forEach((player, idx) => {
        player.rank = idx + 1;
        const feedback = getRankFeedback(player.rank, scoreBreakdowns.length);
        player.titleBadge = feedback.titleBadge;
        player.commentary = feedback.commentary;
      });

      return scoreBreakdowns;
    }

    // 1. Get all players in the game
    const playersRes = await client.query(
      `SELECT gp.id AS "gamePlayerId", gp.user_id AS "userId", gp.nickname, u.avatar_id AS "avatarId", gp.total_score AS "totalScore"
       FROM game_players gp
       JOIN users u ON gp.user_id = u.id
       WHERE gp.game_id = $1;`,
      [gameId]
    );

    const scoreBreakdowns: PlayerScoreBreakdown[] = [];

    for (const p of playersRes.rows) {
      // Count correct guesses (+100 pts each)
      const correctRes = await client.query(
        'SELECT COUNT(*)::int AS count FROM round_guesses WHERE round_id = $1 AND guesser_player_id = $2 AND is_correct = true;',
        [roundId, p.gamePlayerId]
      );
      const correctGuesses = correctRes.rows[0].count;

      // Count how many times friends were fooled by this player's answer (+50 pts each)
      // Fooled = another player guessed someone else for this player's answer OR guessed this player incorrectly
      const fooledRes = await client.query(
        `SELECT COUNT(*)::int AS count 
         FROM round_guesses rg
         JOIN round_answers ra ON rg.answer_id = ra.id
         WHERE rg.round_id = $1 AND ra.game_player_id = $2 AND rg.guesser_player_id != $2 AND rg.is_correct = false;`,
        [roundId, p.gamePlayerId]
      );
      const fooledFriends = fooledRes.rows[0].count;

      const pointsGained = correctGuesses * 100 + fooledFriends * 50;
      const newTotalScore = p.totalScore + pointsGained;

      // Update game_player total_score
      await client.query('UPDATE game_players SET total_score = $1 WHERE id = $2;', [
        newTotalScore,
        p.gamePlayerId,
      ]);

      // Save round score breakdown
      await client.query(
        `INSERT INTO round_scores (round_id, game_player_id, points_gained, correct_guesses, fooled_friends)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (round_id, game_player_id)
         DO UPDATE SET points_gained = $3, correct_guesses = $4, fooled_friends = $5;`,
        [roundId, p.gamePlayerId, pointsGained, correctGuesses, fooledFriends]
      );

      scoreBreakdowns.push({
        rank: 0, // Assigned after sorting below
        gamePlayerId: p.gamePlayerId,
        userId: p.userId,
        nickname: p.nickname,
        avatarId: p.avatarId,
        pointsGained,
        correctGuesses,
        fooledFriends,
        totalScore: newTotalScore,
        titleBadge: '',
        commentary: '',
      });
    }

    // Update round phase to RESULTS
    await client.query("UPDATE game_rounds SET phase = 'RESULTS' WHERE id = $1;", [roundId]);

    await client.query('COMMIT');

    // Sort standings by totalScore descending
    scoreBreakdowns.sort((a, b) => b.totalScore - a.totalScore);

    // Assign rank and dynamic feedback
    scoreBreakdowns.forEach((player, idx) => {
      player.rank = idx + 1;
      const feedback = getRankFeedback(player.rank, scoreBreakdowns.length);
      player.titleBadge = feedback.titleBadge;
      player.commentary = feedback.commentary;
    });

    return scoreBreakdowns;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export interface FinalPlayerRank {
  gamePlayerId: string;
  userId: string;
  nickname: string;
  avatarId: string;
  totalScore: number;
  finalRank: number;
  titleBadge: string;
  commentary: string;
}

export interface DareCard {
  id: string;
  textAr: string;
  severity: string;
  category: string;
}

export interface FinalGameResult {
  gameId: string;
  status: 'FINISHED';
  finalLeaderboard: FinalPlayerRank[];
  winner: FinalPlayerRank;
  loser: FinalPlayerRank;
  dareEnabled: boolean;
  dareCards?: DareCard[];
}

/**
 * Advances the game to the next round, or finishes the game if total rounds reached
 */
export const advanceToNextRound = async (
  gameId: string,
  hostUserId: string
): Promise<
  | { isGameOver: false; round: GameRound; question: Question; answeringTimerSec: number }
  | { isGameOver: true; finalResult: FinalGameResult }
> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Check game settings and host authorization
    const gameRes = await client.query('SELECT * FROM games WHERE id = $1 FOR UPDATE;', [gameId]);
    if (gameRes.rows.length === 0) {
      throw new Error('GAME_NOT_FOUND');
    }

    const game = gameRes.rows[0];
    if (game.host_user_id !== hostUserId) {
      throw new Error('NOT_HOST');
    }

    const nextRoundNumber = game.current_round_number + 1;

    // If all rounds are completed, finalize the game
    if (nextRoundNumber > game.total_rounds) {
      await client.query('COMMIT');
      const finalResult = await finishGameSession(gameId);
      return { isGameOver: true, finalResult };
    }

    // 2. Select a random active question not used yet in this room
    let questionRes = await client.query(
      `SELECT * FROM questions 
       WHERE is_active = true 
         AND id::text NOT IN (SELECT question_id::text FROM room_used_questions WHERE room_code = $1)
       ORDER BY RANDOM() 
       LIMIT 1;`,
      [game.room_code]
    );

    // Fallback if questions run out for this room
    if (questionRes.rows.length === 0) {
      await client.query('DELETE FROM room_used_questions WHERE room_code = $1;', [game.room_code]);
      questionRes = await client.query(
        'SELECT * FROM questions WHERE is_active = true ORDER BY RANDOM() LIMIT 1;'
      );
    }

    const question: Question = questionRes.rows[0];

    // Mark question as used for this room
    await client.query(
      `INSERT INTO room_used_questions (room_code, question_id)
       VALUES ($1, $2)
       ON CONFLICT (room_code, question_id) DO NOTHING;`,
      [game.room_code, question.id]
    );

    // 3. Update current round number on games table
    await client.query('UPDATE games SET current_round_number = $1 WHERE id = $2;', [
      nextRoundNumber,
      gameId,
    ]);

    // 4. Create new round record
    const deadline = new Date(Date.now() + game.answering_timer_sec * 1000);
    const insertRoundQuery = `
      INSERT INTO game_rounds (game_id, round_number, question_id, phase, phase_deadline)
      VALUES ($1, $2, $3, 'ANSWERING', $4)
      RETURNING *;
    `;

    const roundRes = await client.query(insertRoundQuery, [
      gameId,
      nextRoundNumber,
      question.id,
      deadline,
    ]);

    const round: GameRound = roundRes.rows[0];

    await client.query('COMMIT');

    return {
      isGameOver: false,
      round,
      question,
      answeringTimerSec: game.answering_timer_sec,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Concludes the game session, calculates final podium ranks, and retrieves dare cards
 */
export const finishGameSession = async (gameId: string): Promise<FinalGameResult> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Mark game as FINISHED
    await client.query(
      "UPDATE games SET status = 'FINISHED', finished_at = CURRENT_TIMESTAMP WHERE id = $1;",
      [gameId]
    );

    // 2. Fetch all players sorted by total_score descending
    const playersRes = await client.query(
      `SELECT gp.id AS "gamePlayerId", gp.user_id AS "userId", gp.nickname, gp.total_score AS "totalScore", u.avatar_id AS "avatarId"
       FROM game_players gp
       JOIN users u ON gp.user_id = u.id
       WHERE gp.game_id = $1
       ORDER BY gp.total_score DESC, gp.joined_at ASC;`,
      [gameId]
    );

    const finalLeaderboard: FinalPlayerRank[] = [];
    const totalPlayers = playersRes.rows.length;

    // 3. Update final_rank and assign titles in DB
    for (let index = 0; index < totalPlayers; index++) {
      const p = playersRes.rows[index];
      const finalRank = index + 1;
      const feedback = getRankFeedback(finalRank, totalPlayers);

      await client.query('UPDATE game_players SET final_rank = $1 WHERE id = $2;', [
        finalRank,
        p.gamePlayerId,
      ]);

      finalLeaderboard.push({
        playerId: p.userId,
        gamePlayerId: p.gamePlayerId,
        userId: p.userId,
        nickname: p.nickname,
        avatarId: p.avatarId,
        totalScore: p.totalScore,
        finalRank,
        titleBadge: feedback.titleBadge,
        commentary: feedback.commentary,
      } as any);
    }

    const winner = {
      ...finalLeaderboard[0],
      playerId: finalLeaderboard[0].userId,
    };
    const loser = {
      ...finalLeaderboard[finalLeaderboard.length - 1],
      playerId: finalLeaderboard[finalLeaderboard.length - 1].userId,
    };

    // 4. Check if dare is enabled
    const gameRes = await client.query('SELECT dare_enabled FROM games WHERE id = $1;', [gameId]);
    const dareEnabled = gameRes.rows[0]?.dare_enabled ?? true;

    let dareCards: DareCard[] | undefined = undefined;

    if (dareEnabled) {
      const daresRes = await client.query(
        `SELECT id, text_ar AS "textAr", text_ar, severity, category 
         FROM dares 
         WHERE is_active = true 
         ORDER BY RANDOM() 
         LIMIT 3;`
      );
      dareCards = daresRes.rows;
    }

    await client.query('COMMIT');

    return {
      gameId,
      status: 'FINISHED',
      finalLeaderboard,
      winner: winner as any,
      loser: loser as any,
      dareEnabled,
      dareCards,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Skips the current ANSWERING round without counting it as a completed round.
 * Marks the existing round as skipped, then creates a fresh round with the same
 * round_number and a new question. current_round_number is NOT incremented.
 */
export const skipCurrentQuestion = async (
  gameId: string,
  hostUserId: string,
  roundId: string
): Promise<{ round: GameRound; question: Question; answeringTimerSec: number }> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Validate host
    const gameRes = await client.query('SELECT * FROM games WHERE id = $1 FOR UPDATE;', [gameId]);
    if (gameRes.rows.length === 0) throw new Error('GAME_NOT_FOUND');
    const game = gameRes.rows[0];
    if (game.host_user_id !== hostUserId) throw new Error('NOT_HOST');
    if (game.status !== 'IN_PROGRESS') throw new Error('GAME_NOT_IN_PROGRESS');

    // 2. Validate the round
    const roundRes = await client.query(
      `SELECT * FROM game_rounds WHERE id = $1 AND game_id = $2 FOR UPDATE;`,
      [roundId, gameId]
    );
    if (roundRes.rows.length === 0) throw new Error('ROUND_NOT_FOUND');
    const currentRound = roundRes.rows[0];
    if (currentRound.phase !== 'ANSWERING') throw new Error('ROUND_NOT_IN_ANSWERING_PHASE');
    if (currentRound.is_skipped) throw new Error('ROUND_ALREADY_SKIPPED');

    // 3. Clear any partial answers submitted for this skipped round
    await client.query('DELETE FROM round_answers WHERE round_id = $1;', [roundId]);

    // 4. Select a NEW question — excluding ALL previously used questions in this room
    let questionRes = await client.query(
      `SELECT * FROM questions 
       WHERE is_active = true 
         AND id::text NOT IN (SELECT question_id::text FROM room_used_questions WHERE room_code = $1)
       ORDER BY RANDOM() LIMIT 1;`,
      [game.room_code]
    );

    // Fallback: all questions exhausted for this room
    if (questionRes.rows.length === 0) {
      await client.query('DELETE FROM room_used_questions WHERE room_code = $1;', [game.room_code]);
      questionRes = await client.query(
        'SELECT * FROM questions WHERE is_active = true ORDER BY RANDOM() LIMIT 1;'
      );
    }

    if (questionRes.rows.length === 0) throw new Error('NO_QUESTIONS_AVAILABLE');
    const question: Question = questionRes.rows[0];

    // Mark question as used for this room
    await client.query(
      `INSERT INTO room_used_questions (room_code, question_id)
       VALUES ($1, $2)
       ON CONFLICT (room_code, question_id) DO NOTHING;`,
      [game.room_code, question.id]
    );

    // 5. Update the existing round in-place with the new question and fresh deadline
    const deadline = new Date(Date.now() + game.answering_timer_sec * 1000);
    const updatedRoundRes = await client.query(
      `UPDATE game_rounds 
       SET question_id = $1, phase = 'ANSWERING', phase_deadline = $2, is_skipped = false 
       WHERE id = $3 
       RETURNING *;`,
      [question.id, deadline, roundId]
    );

    const round: GameRound = updatedRoundRes.rows[0];

    await client.query('COMMIT');

    return { round, question, answeringTimerSec: game.answering_timer_sec };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Retrieves finished game data for reconnection
 */
export const getFinishedGameData = async (gameId: string): Promise<FinalGameResult> => {
  const playersRes = await pool.query(
    `SELECT gp.id AS "gamePlayerId", gp.user_id AS "userId", gp.nickname, gp.total_score AS "totalScore", gp.final_rank AS "finalRank", u.avatar_id AS "avatarId"
     FROM game_players gp
     JOIN users u ON gp.user_id = u.id
     WHERE gp.game_id = $1
     ORDER BY COALESCE(gp.final_rank, 999) ASC, gp.total_score DESC;`,
    [gameId]
  );
  const totalPlayers = playersRes.rows.length;
  const finalLeaderboard: FinalPlayerRank[] = playersRes.rows.map((p, idx) => {
    const rank = p.finalRank || idx + 1;
    const feedback = getRankFeedback(rank, totalPlayers);
    return {
      playerId: p.userId,
      gamePlayerId: p.gamePlayerId,
      userId: p.userId,
      nickname: p.nickname,
      avatarId: p.avatarId,
      totalScore: p.totalScore,
      finalRank: rank,
      titleBadge: feedback.titleBadge,
      commentary: feedback.commentary,
    };
  });

  const winner = finalLeaderboard[0] || null;
  const loser = finalLeaderboard[finalLeaderboard.length - 1] || null;

  const gameRes = await pool.query('SELECT dare_enabled FROM games WHERE id = $1;', [gameId]);
  const dareEnabled = gameRes.rows[0]?.dare_enabled ?? true;
  let dareCards: DareCard[] | undefined = undefined;
  if (dareEnabled) {
    const daresRes = await pool.query(
      `SELECT id, text_ar AS "textAr", text_ar, severity, category 
       FROM dares 
       WHERE is_active = true 
       LIMIT 3;`
    );
    dareCards = daresRes.rows;
  }

  return {
    gameId,
    status: 'FINISHED',
    finalLeaderboard,
    winner: winner as any,
    loser: loser as any,
    dareEnabled,
    dareCards,
  };
};

/**
 * Winner assigns a chosen Dare card to the Loser
 */
export const assignGameDare = async (
  gameId: string,
  dareId: string,
  winnerUserId: string
) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Find winner player (rank 1) and loser player (last rank)
    const playersRes = await client.query(
      `SELECT gp.id AS "gamePlayerId", gp.user_id AS "userId", gp.final_rank AS "finalRank", gp.nickname
       FROM game_players gp
       WHERE gp.game_id = $1
       ORDER BY gp.final_rank ASC;`,
      [gameId]
    );

    if (playersRes.rows.length === 0) {
      throw new Error('PLAYERS_NOT_FOUND');
    }

    const winnerPlayer = playersRes.rows[0];
    const loserPlayer = playersRes.rows[playersRes.rows.length - 1];

    if (winnerPlayer.userId !== winnerUserId) {
      throw new Error('ONLY_WINNER_CAN_ASSIGN_DARE');
    }

    // 2. Insert into game_dare_assignments
    const insertDareQuery = `
      INSERT INTO game_dare_assignments (game_id, dare_id, target_player_id, assigned_by_player_id, status)
      VALUES ($1, $2, $3, $4, 'PENDING')
      RETURNING *;
    `;

    const assignmentRes = await client.query(insertDareQuery, [
      gameId,
      dareId,
      loserPlayer.gamePlayerId,
      winnerPlayer.gamePlayerId,
    ]);

    // 3. Get dare text details
    const dareRes = await client.query('SELECT text_ar, severity FROM dares WHERE id = $1;', [
      dareId,
    ]);

    await client.query('COMMIT');

    return {
      assignmentId: assignmentRes.rows[0].id,
      dareId,
      dareText: dareRes.rows[0]?.text_ar || '',
      severity: dareRes.rows[0]?.severity || 'MILD',
      winnerNickname: winnerPlayer.nickname,
      loserNickname: loserPlayer.nickname,
      loserUserId: loserPlayer.userId,
      status: 'PENDING',
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Loser marks the assigned Dare as completed
 */
export const completeGameDare = async (assignmentId: string, loserUserId: string) => {
  const query = `
    UPDATE game_dare_assignments
    SET status = 'COMPLETED'
    WHERE id = $1
    RETURNING *;
  `;
  const res = await pool.query(query, [assignmentId]);
  return res.rows[0];
};
