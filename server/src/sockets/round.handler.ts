import { Server } from 'socket.io';
import { AuthenticatedSocket } from './lobby.handler.js';
import {
  startGameSession,
  submitRoundAnswer,
  getRoundAnswerStatuses,
  startMatchingPhase,
  submitPlayerGuesses,
  getMatchingGuessStatuses,
  calculateRoundScores,
  getRoundRevealedAnswers,
  advanceToNextRound,
  assignGameDare,
  completeGameDare,
  GuessSubmission,
} from '../modules/games/round.service.js';
import { pool } from '../config/db.js';
import { handleBotAnswering, handleBotMatching } from '../modules/games/bot.service.js';

export const triggerMatchingPhase = async (io: Server, roundId: string, gameId: string) => {
  const roomChannel = `game_${gameId}`;
  const matchingData = await startMatchingPhase(roundId, gameId);
  const guessStatuses = await getMatchingGuessStatuses(roundId, gameId);

  io.to(roomChannel).emit('ROUND:START_MATCHING', {
    gameId,
    ...matchingData,
    timer: matchingData.matchingTimerSec,
    submittedCount: guessStatuses.submittedCount,
    totalPlayers: guessStatuses.totalPlayers,
    players: guessStatuses.players,
  });

  // Trigger bots to submit matching guesses
  handleBotMatching(io, roundId, gameId);
};

export const triggerResultsPhase = async (io: Server, roundId: string, gameId: string) => {
  const roomChannel = `game_${gameId}`;
  const leaderboard = await calculateRoundScores(roundId, gameId);
  const revealedAnswers = await getRoundRevealedAnswers(roundId);

  const roundRes = await pool.query(
    'SELECT round_number FROM game_rounds WHERE id = $1;',
    [roundId]
  );
  const roundNumber = roundRes.rows[0]?.round_number || 1;

  const formattedLeaderboard = leaderboard.map((p) => ({
    playerId: p.gamePlayerId || p.userId,
    userId: p.userId,
    nickname: p.nickname,
    avatarId: p.avatarId,
    totalScore: p.totalScore,
    pointsGained: p.pointsGained,
    correctGuesses: p.correctGuesses,
    fooledFriends: p.fooledFriends,
    rank: p.rank,
    titleBadge: p.titleBadge,
    commentary: p.commentary,
  }));

  io.to(roomChannel).emit('ROUND:RESULTS', {
    gameId,
    roundId,
    roundNumber,
    leaderboard: formattedLeaderboard,
    scores: formattedLeaderboard,
    revealedAnswers,
  });
};

export const registerRoundHandlers = (io: Server, socket: AuthenticatedSocket) => {
  if (!socket.user) return;

  const user = socket.user;

  /**
   * Event: LOBBY:START_GAME
   * Host initiates game start (Transition LOBBY -> IN_PROGRESS)
   */
  socket.on('LOBBY:START_GAME', async (payload: { gameId: string }) => {
    try {
      const { gameId } = payload;
      if (!gameId) {
        return socket.emit('GAME:ERROR', { message: 'Game ID is required' });
      }

      // Start game session in DB
      const result = await startGameSession(gameId, user.userId);
      const roomChannel = `game_${gameId}`;

      // Get initial player answer statuses (all hasAnswered = false)
      const answerStatuses = await getRoundAnswerStatuses(result.round.id, gameId);

      // 1. Broadcast game started status
      io.to(roomChannel).emit('GAME:STARTED', {
        gameId,
        status: 'IN_PROGRESS',
      });

      // 2. Broadcast Round 1 details with Question & Timer
      io.to(roomChannel).emit('ROUND:START', {
        gameId,
        roundId: result.round.id,
        roundNumber: result.round.round_number,
        phase: 'ANSWERING',
        question: {
          id: result.question.id,
          text_ar: result.question.text_ar,
          text_en: result.question.text_en,
        },
        answeringTimerSec: result.answeringTimerSec,
        timer: result.answeringTimerSec,
        submittedCount: answerStatuses.submittedCount,
        totalPlayers: answerStatuses.totalPlayers,
        players: answerStatuses.players,
      });

      // Trigger bots to answer secret questions automatically
      handleBotAnswering(io, result.round.id, gameId);

      console.log(`🎮 Game [${gameId}] started by host [${user.username}]. Round 1 initiated.`);
    } catch (error: any) {
      console.error('Error in LOBBY:START_GAME handler:', error);

      let message = 'Failed to start game';
      if (error.message === 'NOT_HOST') {
        message = 'Only the host can start the game.';
      } else if (error.message?.startsWith('INSUFFICIENT_PLAYERS')) {
        const min = error.message.split(':')[1] || 3;
        message = `At least ${min} connected players are required to start.`;
      } else if (error.message === 'GAME_ALREADY_STARTED') {
        message = 'Game has already started.';
      }

      socket.emit('GAME:ERROR', { message });
    }
  });

  /**
   * Event: ROUND:SUBMIT_ANSWER
   * Player submits secret answer for current round
   */
  socket.on(
    'ROUND:SUBMIT_ANSWER',
    async (payload: { gameId: string; roundId: string; text: string }) => {
      try {
        const { gameId, roundId, text } = payload;
        if (!gameId || !roundId || !text?.trim()) {
          return socket.emit('ROUND:ERROR', { message: 'Invalid answer submission data' });
        }

        // 1. Get player's game_player_id for this game
        const playerRes = await pool.query(
          'SELECT id FROM game_players WHERE game_id = $1 AND user_id = $2;',
          [gameId, user.userId]
        );

        if (playerRes.rows.length === 0) {
          return socket.emit('ROUND:ERROR', { message: 'Player not found in this game' });
        }

        const gamePlayerId = playerRes.rows[0].id;

        // 2. Save secret answer in DB
        await submitRoundAnswer(roundId, gamePlayerId, text);

        // Acknowledge submission to the individual player
        socket.emit('ROUND:ANSWER_CONFIRMED', {
          roundId,
          text: text.trim(),
        });

        // 3. Fetch updated per-player answer statuses (with avatar & hasAnswered)
        const answerStatuses = await getRoundAnswerStatuses(roundId, gameId);
        const roomChannel = `game_${gameId}`;

        // 4. Broadcast live per-avatar answer status updates to the room
        io.to(roomChannel).emit('ROUND:ANSWER_STATUSES', {
          roundId,
          submittedCount: answerStatuses.submittedCount,
          totalPlayers: answerStatuses.totalPlayers,
          players: answerStatuses.players,
        });

        console.log(
          `📝 Player [${user.username}] submitted answer. Progress: ${answerStatuses.submittedCount}/${answerStatuses.totalPlayers}`
        );

        // 5. If all connected players have answered, trigger MATCHING phase automatically!
        if (
          answerStatuses.totalPlayers > 0 &&
          answerStatuses.submittedCount === answerStatuses.totalPlayers
        ) {
          console.log(`✅ All players answered in game [${gameId}]. Starting MATCHING phase...`);
          await triggerMatchingPhase(io, roundId, gameId);
        }
      } catch (error: any) {
        console.error('Error in ROUND:SUBMIT_ANSWER handler:', error);
        if (error.message === 'ANSWER_ALREADY_TAKEN') {
          return socket.emit('ROUND:ERROR', {
            code: 'ANSWER_ALREADY_TAKEN',
            message: 'الإجابة دي اتاخدت بالفعل من صديق تاني 😅 اختار إجابة تانية!',
          });
        }
        socket.emit('ROUND:ERROR', { message: 'Failed to submit answer' });
      }
    }
  );

  /**
   * Event: ROUND:FORCE_MATCHING
   * Host advances immediately from answering to matching phase
   */
  socket.on('ROUND:FORCE_MATCHING', async (payload: { gameId: string; roundId: string }) => {
    try {
      const { gameId, roundId } = payload;
      if (!gameId || !roundId) return;
      console.log(`⏩ Host [${user.username}] forced advancement to MATCHING phase in game [${gameId}]`);
      await triggerMatchingPhase(io, roundId, gameId);
    } catch (error: any) {
      console.error('Error in ROUND:FORCE_MATCHING:', error);
      socket.emit('ROUND:ERROR', { message: 'Failed to advance to matching phase' });
    }
  });

  /**
   * Event: MATCHING:SUBMIT_GUESSES
   * Player submits their guesses matching anonymized answers to friends
   */
  socket.on(
    'MATCHING:SUBMIT_GUESSES',
    async (payload: { gameId: string; roundId: string; guesses: GuessSubmission[] }) => {
      try {
        const { gameId, roundId, guesses } = payload;
        if (!gameId || !roundId || !Array.isArray(guesses)) {
          return socket.emit('MATCHING:ERROR', { message: 'Invalid guesses submission data' });
        }

        // Get guesser's game_player_id
        const playerRes = await pool.query(
          'SELECT id FROM game_players WHERE game_id = $1 AND user_id = $2;',
          [gameId, user.userId]
        );

        if (playerRes.rows.length === 0) {
          return socket.emit('MATCHING:ERROR', { message: 'Player not found in this game' });
        }

        const guesserPlayerId = playerRes.rows[0].id;

        // Save guesses in DB
        await submitPlayerGuesses(roundId, guesserPlayerId, guesses);

        // Acknowledge submission to the individual player
        socket.emit('MATCHING:GUESSES_CONFIRMED', { roundId });

        const roomChannel = `game_${gameId}`;
        const guessStatuses = await getMatchingGuessStatuses(roundId, gameId);

        // Broadcast updated per-avatar guessing progress to room
        io.to(roomChannel).emit('MATCHING:GUESS_STATUSES', {
          roundId,
          submittedCount: guessStatuses.submittedCount,
          totalPlayers: guessStatuses.totalPlayers,
          players: guessStatuses.players,
        });

        console.log(
          `🔍 Player [${user.username}] submitted guesses. Progress: ${guessStatuses.submittedCount}/${guessStatuses.totalPlayers}`
        );

        // If all connected players have submitted guesses, calculate scores & broadcast results!
        if (
          guessStatuses.totalPlayers > 0 &&
          guessStatuses.submittedCount === guessStatuses.totalPlayers
        ) {
          console.log(`🏆 All players submitted guesses in game [${gameId}]. Calculating scores...`);
          await triggerResultsPhase(io, roundId, gameId);
        }
      } catch (error: any) {
        console.error('Error in MATCHING:SUBMIT_GUESSES handler:', error);
        let message = 'Failed to submit guesses';
        if (error.message === 'SELF_GUESSING_PROHIBITED') {
          message = 'You cannot guess yourself for your own answer!';
        }
        socket.emit('MATCHING:ERROR', { message });
      }
    }
  );

  /**
   * Event: ROUND:FORCE_RESULTS
   * Host advances immediately from matching to results phase
   */
  socket.on('ROUND:FORCE_RESULTS', async (payload: { gameId: string; roundId: string }) => {
    try {
      const { gameId, roundId } = payload;
      if (!gameId || !roundId) return;
      console.log(`⏩ Host [${user.username}] forced advancement to RESULTS phase in game [${gameId}]`);
      await triggerResultsPhase(io, roundId, gameId);
    } catch (error: any) {
      console.error('Error in ROUND:FORCE_RESULTS:', error);
      socket.emit('MATCHING:ERROR', { message: 'Failed to advance to results phase' });
    }
  });

  /**
   * Event: ROUND:SHOW_SCOREBOARD
   * Host requests advancing from revealed answers to the round score board
   */
  socket.on('ROUND:SHOW_SCOREBOARD', async (payload: { gameId: string }) => {
    try {
      const { gameId } = payload;
      if (!gameId) return;
      const roomChannel = `game_${gameId}`;
      io.to(roomChannel).emit('ROUND:SCOREBOARD_DISPLAYED', { gameId });
      console.log(`📊 Host [${user.username}] revealed scoreboard for game [${gameId}]`);
    } catch (error) {
      console.error('Error in ROUND:SHOW_SCOREBOARD:', error);
    }
  });

  /**
   * Event: ROUND:NEXT_ROUND
   * Host requests advancement to the next round or final game results
   */
  socket.on('ROUND:NEXT_ROUND', async (payload: { gameId: string }) => {
    try {
      const { gameId } = payload;
      if (!gameId) {
        return socket.emit('GAME:ERROR', { message: 'Game ID is required' });
      }

      const advanceResult = await advanceToNextRound(gameId, user.userId);
      const roomChannel = `game_${gameId}`;

      if (advanceResult.isGameOver) {
        // Game has finished all rounds! Broadcast final podium results
        io.to(roomChannel).emit('GAME:FINAL_RESULTS', {
          ...advanceResult.finalResult,
        });
        console.log(`🎉 Game [${gameId}] FINISHED! Final podium broadcasted.`);
      } else {
        // Start next round
        const { round, question, answeringTimerSec } = advanceResult;
        const answerStatuses = await getRoundAnswerStatuses(round.id, gameId);

        io.to(roomChannel).emit('ROUND:START', {
          gameId,
          roundId: round.id,
          roundNumber: round.round_number,
          phase: 'ANSWERING',
          question: {
            id: question.id,
            text_ar: question.text_ar,
            text_en: question.text_en,
          },
          answeringTimerSec,
          timer: answeringTimerSec,
          submittedCount: answerStatuses.submittedCount,
          totalPlayers: answerStatuses.totalPlayers,
          players: answerStatuses.players,
        });

        // Trigger bots to answer secret questions for the new round
        handleBotAnswering(io, round.id, gameId);

        console.log(`🔁 Game [${gameId}] advanced to Round [${round.round_number}].`);
      }
    } catch (error: any) {
      console.error('Error in ROUND:NEXT_ROUND handler:', error);
      let message = 'Failed to advance round';
      if (error.message === 'NOT_HOST') {
        message = 'Only the host can advance to the next round.';
      }
      socket.emit('GAME:ERROR', { message });
    }
  });

  /**
   * Event: DARE:ASSIGN
   * Winner assigns chosen Dare card to the Loser
   */
  socket.on(
    'DARE:ASSIGN',
    async (payload: { gameId: string; dareId: string }) => {
      try {
        const { gameId, dareId } = payload;
        if (!gameId || !dareId) {
          return socket.emit('DARE:ERROR', { message: 'Game ID and Dare ID are required' });
        }

        const dareResult = await assignGameDare(gameId, dareId, user.userId);
        const roomChannel = `game_${gameId}`;

        // Broadcast dare penalty announcement to the entire room!
        io.to(roomChannel).emit('DARE:ANNOUNCED', {
          gameId,
          ...dareResult,
        });

        console.log(
          `😈 Dare [${dareResult.dareId}] assigned by winner [${dareResult.winnerNickname}] to loser [${dareResult.loserNickname}]!`
        );
      } catch (error: any) {
        console.error('Error in DARE:ASSIGN handler:', error);
        let message = 'Failed to assign dare';
        if (error.message === 'ONLY_WINNER_CAN_ASSIGN_DARE') {
          message = 'Only the 1st place winner can assign a dare penalty!';
        }
        socket.emit('DARE:ERROR', { message });
      }
    }
  );

  /**
   * Event: DARE:COMPLETE
   * Loser confirms dare penalty has been executed
   */
  socket.on(
    'DARE:COMPLETE',
    async (payload: { gameId: string; assignmentId: string }) => {
      try {
        const { gameId, assignmentId } = payload;
        if (!gameId || !assignmentId) {
          return socket.emit('DARE:ERROR', { message: 'Assignment ID is required' });
        }

        await completeGameDare(assignmentId, user.userId);
        const roomChannel = `game_${gameId}`;

        io.to(roomChannel).emit('DARE:FINISHED', {
          gameId,
          assignmentId,
          message: 'The dare penalty has been completed! Thanks for playing!',
        });

        console.log(`🏆 Dare [${assignmentId}] marked COMPLETED in game [${gameId}].`);
      } catch (error) {
        console.error('Error in DARE:COMPLETE handler:', error);
        socket.emit('DARE:ERROR', { message: 'Failed to complete dare' });
      }
    }
  );
};
