import { pool } from '../../config/db.js';
import { Server } from 'socket.io';
import {
  submitRoundAnswer,
  getRoundAnswerStatuses,
  submitPlayerGuesses,
  getMatchingGuessStatuses,
} from './round.service.js';
import { triggerMatchingPhase, triggerResultsPhase } from '../../sockets/round.handler.js';

interface BotProfile {
  name: string;
  avatarId: string;
}

const BOT_PROFILES: BotProfile[] = [
  { name: 'أبو صقر 🦅', avatarId: 'avatar_2' },
  { name: 'كابتن ماجد ⚽', avatarId: 'avatar_3' },
  { name: 'شاورما دبل 🌯', avatarId: 'avatar_4' },
  { name: 'طمطم 🍅', avatarId: 'avatar_5' },
  { name: 'فيلسوف الشلة 🧐', avatarId: 'avatar_6' },
  { name: 'نمس اللعبة 🕵️', avatarId: 'avatar_7' },
  { name: 'المعلم سردينة 🐟', avatarId: 'avatar_8' },
  { name: 'البرنس 👑', avatarId: 'avatar_9' },
  { name: 'زيزو المشاكس ⚡', avatarId: 'avatar_10' },
  { name: 'سوبر هنيدي 🎭', avatarId: 'avatar_1' },
];

const FUNNY_BOT_ANSWERS = [
  'دايماً بينسى محفظته أول ما الحساب ييجي 😂',
  'بيشرب شاي بالنعناع في عز حر الصيف',
  'بيقول أنا في الطريق وهو لسه تحت البطانية',
  'أكتر واحد بيبعت فويسات مدتها 8 دقايق',
  'بيعمل دايت يوم السبت ويبوظه السبت بالليل',
  'بيفتح التلاجة ويبص فيها ويفضل متنح ويمشي',
  'بيرد على الرسايل بعد 4 شهور بـ تمام يا غالي',
  'بيسمع كلام الفيديوهات اللي بتبدأ بـ سر لا يعرفه أحد',
  'بيطلب أكل تيك أواي وهو لسه مخلص غدا حالا',
  'أول واحد بينام في أي قعدة أصحاب',
  'بيشحن الموبايل لما يوصل 1%',
  'بيعمل 50 منبه عشان يصحى، ومبيصحاش برضه',
  'بيحلف إنه مش هياكل سكر تاني وبعدها بساعة يطلب كنافة',
  'بيشتري لبس جيم ومبينزلش خالص',
  'بيسأل على سعر الحاجة وهو عارف إنه مش هيشتريها',
  'بيغير باسوورد الواي فاي لما الضيوف تطلبها',
  'بيحفظ نكت قديمة ويضحك عليها لوحده',
  'بيقرأ مسجات الجروب ومبيردش غير بإيموجي واحد بعد يومين',
];

/**
 * Adds a test bot to the specified game room.
 */
export const addBotToGame = async (gameId: string) => {
  // 1. Get existing players in game
  const playersRes = await pool.query(
    'SELECT nickname, user_id FROM game_players WHERE game_id = $1',
    [gameId]
  );
  const existingNames = new Set(playersRes.rows.map((p) => p.nickname));

  // 2. Pick a bot profile whose name is not already in the game
  const profile = BOT_PROFILES.find((b) => !existingNames.has(b.name)) || {
    name: `بوت ${playersRes.rows.length + 1} 🤖`,
    avatarId: `avatar_${((playersRes.rows.length % 10) + 1)}`,
  };

  // 3. Ensure bot user exists in users table
  const email = `bot_${encodeURIComponent(profile.name.replace(/[^a-zA-Z0-9]/g, ''))}_${Date.now()}@heggyverse.local`;
  const insertUserQuery = `
    INSERT INTO users (username, email, avatar_id, is_guest)
    VALUES ($1, $2, $3, true)
    RETURNING id;
  `;
  const userRes = await pool.query(insertUserQuery, [profile.name, email, profile.avatarId]);
  const botUserId = userRes.rows[0].id;

  // 4. Insert bot into game_players
  const insertPlayerQuery = `
    INSERT INTO game_players (game_id, user_id, nickname, is_host, is_connected)
    VALUES ($1, $2, $3, false, true)
    RETURNING *;
  `;
  const playerRes = await pool.query(insertPlayerQuery, [gameId, botUserId, profile.name]);
  return {
    ...playerRes.rows[0],
    avatarId: profile.avatarId,
    isBot: true,
  };
};

/**
 * Removes the most recently added bot from the room.
 */
export const removeBotFromGame = async (gameId: string) => {
  const query = `
    DELETE FROM game_players 
    WHERE id = (
      SELECT gp.id FROM game_players gp
      JOIN users u ON gp.user_id = u.id
      WHERE gp.game_id = $1 
        AND u.email LIKE '%@heggyverse.local'
        AND gp.status NOT IN ('KICKED', 'LEFT')
      ORDER BY gp.joined_at DESC
      LIMIT 1
    )
    RETURNING *;
  `;
  const res = await pool.query(query, [gameId]);
  if (res.rows[0]) {
    await pool.query('DELETE FROM round_answers WHERE game_player_id = $1;', [res.rows[0].id]);
    await pool.query('DELETE FROM round_guesses WHERE guesser_player_id = $1 OR guessed_player_id = $1;', [res.rows[0].id]);
  }
  return res.rows[0] || null;
};

/**
 * Queries all active bots currently in the game.
 */
export const getGameBots = async (gameId: string) => {
  const query = `
    SELECT gp.id AS "gamePlayerId", gp.user_id AS "userId", gp.nickname, u.avatar_id AS "avatarId"
    FROM game_players gp
    JOIN users u ON gp.user_id = u.id
    WHERE gp.game_id = $1 
      AND u.email LIKE '%@heggyverse.local'
      AND gp.status NOT IN ('KICKED', 'LEFT')
      AND gp.is_connected = true;
  `;
  const res = await pool.query(query, [gameId]);
  return res.rows;
};

/**
 * Simulates bots submitting answers during the Answering phase.
 */
export const handleBotAnswering = async (io: Server, roundId: string, gameId: string) => {
  try {
    const bots = await getGameBots(gameId);
    if (bots.length === 0) return;

    // Get already answered player IDs for this round
    const answeredRes = await pool.query(
      'SELECT game_player_id, raw_text FROM round_answers WHERE round_id = $1;',
      [roundId]
    );
    const answeredPlayerIds = new Set(answeredRes.rows.map((r) => r.game_player_id));
    const usedTexts = new Set(answeredRes.rows.map((r) => r.raw_text.toLowerCase()));

    const unansweredBots = bots.filter((b) => !answeredPlayerIds.has(b.gamePlayerId));
    if (unansweredBots.length === 0) return;

    console.log(`🤖 [Bots] Scheduling answers for ${unansweredBots.length} bot(s) in round [${roundId}]`);

    unansweredBots.forEach((bot, index) => {
      // Random delay between 1.8s and 4.5s per bot
      const delayMs = 1800 + index * 1200 + Math.floor(Math.random() * 800);

      setTimeout(async () => {
        try {
          // Check if round is still in ANSWERING phase
          const roundCheck = await pool.query('SELECT phase FROM game_rounds WHERE id = $1;', [roundId]);
          if (roundCheck.rows[0]?.phase !== 'ANSWERING') return;

          // Check if bot is still active in the game
          const botCheck = await pool.query(
            "SELECT id FROM game_players WHERE id = $1 AND status NOT IN ('KICKED', 'LEFT') AND is_connected = true;",
            [bot.gamePlayerId]
          );
          if (botCheck.rows.length === 0) return;

          // Pick an unused funny answer
          let chosenAnswer = FUNNY_BOT_ANSWERS[Math.floor(Math.random() * FUNNY_BOT_ANSWERS.length)];
          for (const ans of FUNNY_BOT_ANSWERS) {
            if (!usedTexts.has(ans.toLowerCase())) {
              chosenAnswer = ans;
              break;
            }
          }
          usedTexts.add(chosenAnswer.toLowerCase());

          await submitRoundAnswer(roundId, bot.gamePlayerId, chosenAnswer);
          console.log(`🤖 [Bot ${bot.nickname}] answered: "${chosenAnswer}"`);

          const answerStatuses = await getRoundAnswerStatuses(roundId, gameId);
          const roomChannel = `game_${gameId}`;

          io.to(roomChannel).emit('ROUND:ANSWER_STATUSES', {
            roundId,
            submittedCount: answerStatuses.submittedCount,
            totalPlayers: answerStatuses.totalPlayers,
            players: answerStatuses.players,
          });

          // If all players (humans + bots) have answered, advance to matching phase!
          if (
            answerStatuses.totalPlayers > 0 &&
            answerStatuses.submittedCount >= answerStatuses.totalPlayers
          ) {
            console.log(`✅ All players answered in game [${gameId}]. Bots auto-triggering MATCHING phase!`);
            await triggerMatchingPhase(io, roundId, gameId);
          }
        } catch (err) {
          console.error(`Error in bot answering for [${bot.nickname}]:`, err);
        }
      }, delayMs);
    });
  } catch (err) {
    console.error('Error in handleBotAnswering:', err);
  }
};

/**
 * Simulates bots submitting guesses during the Matching phase.
 */
export const handleBotMatching = async (io: Server, roundId: string, gameId: string) => {
  try {
    const bots = await getGameBots(gameId);
    if (bots.length === 0) return;

    // Get anonymous answers for this round from active players
    const answersRes = await pool.query(
      `SELECT ra.id AS "answerId", ra.game_player_id AS "authorPlayerId"
       FROM round_answers ra
       JOIN game_players gp ON ra.game_player_id = gp.id
       WHERE ra.round_id = $1 
         AND gp.status NOT IN ('KICKED', 'LEFT') 
         AND gp.is_connected = true;`,
      [roundId]
    );
    const answers = answersRes.rows;
    if (answers.length === 0) return;

    // Get active players in game to match against
    const playersRes = await pool.query(
      "SELECT id, nickname FROM game_players WHERE game_id = $1 AND is_connected = true AND status NOT IN ('KICKED', 'LEFT');",
      [gameId]
    );
    const players = playersRes.rows;

    // Get bots that haven't guessed yet
    const guessedRes = await pool.query(
      'SELECT DISTINCT guesser_player_id FROM round_guesses WHERE round_id = $1;',
      [roundId]
    );
    const guessedPlayerIds = new Set(guessedRes.rows.map((r) => r.guesser_player_id));
    const unansweredBots = bots.filter((b) => !guessedPlayerIds.has(b.gamePlayerId));

    if (unansweredBots.length === 0) return;

    console.log(`🤖 [Bots] Scheduling guesses for ${unansweredBots.length} bot(s) in round [${roundId}]`);

    unansweredBots.forEach((bot, index) => {
      // Delay between 2.2s and 4.5s
      const delayMs = 2200 + index * 1200 + Math.floor(Math.random() * 1000);

      setTimeout(async () => {
        try {
          const roundCheck = await pool.query('SELECT phase FROM game_rounds WHERE id = $1;', [roundId]);
          if (roundCheck.rows[0]?.phase !== 'MATCHING') return;

          const botCheck = await pool.query(
            "SELECT id FROM game_players WHERE id = $1 AND status NOT IN ('KICKED', 'LEFT') AND is_connected = true;",
            [bot.gamePlayerId]
          );
          if (botCheck.rows.length === 0) return;

          // For each answer (excluding bot's own answer), pick candidate players (excluding bot)
          const botAnswers = answers.filter((ans) => ans.authorPlayerId !== bot.gamePlayerId);
          let candidatePlayers = players.filter((p) => p.id !== bot.gamePlayerId);
          if (candidatePlayers.length === 0) {
            candidatePlayers = players;
          }

          const guesses = botAnswers.map((ans) => {
            const picked = candidatePlayers[Math.floor(Math.random() * candidatePlayers.length)];
            return {
              answerId: ans.answerId,
              guessedPlayerId: picked ? picked.id : bot.gamePlayerId,
            };
          });

          await submitPlayerGuesses(roundId, bot.gamePlayerId, guesses);
          console.log(`🤖 [Bot ${bot.nickname}] submitted matching guesses.`);

          const roomChannel = `game_${gameId}`;
          const guessStatuses = await getMatchingGuessStatuses(roundId, gameId);

          io.to(roomChannel).emit('MATCHING:GUESS_STATUSES', {
            roundId,
            submittedCount: guessStatuses.submittedCount,
            totalPlayers: guessStatuses.totalPlayers,
            players: guessStatuses.players,
          });

          // If all players have guessed, trigger Results!
          if (
            guessStatuses.totalPlayers > 0 &&
            guessStatuses.submittedCount >= guessStatuses.totalPlayers
          ) {
            console.log(`🏆 All players guessed in game [${gameId}]. Bots auto-triggering RESULTS phase!`);
            await triggerResultsPhase(io, roundId, gameId);
          }
        } catch (err) {
          console.error(`Error in bot matching for [${bot.nickname}]:`, err);
        }
      }, delayMs);
    });
  } catch (err) {
    console.error('Error in handleBotMatching:', err);
  }
};
