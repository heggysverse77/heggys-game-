import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../utils/jwt.utils.js';
import {
  getGameDetailsById,
  joinGameRoom,
  updatePlayerConnectionStatus,
  getGamePlayersWithAvatars,
  handlePlayerDisconnect,
  markPlayerLeft,
  kickGamePlayer,
  transferHost,
  updateGameRoomSettings,
} from '../modules/games/game.service.js';
import { pool } from '../config/db.js';
import {
  getRoundAnswerStatuses,
  startMatchingPhase,
  getMatchingPhaseData,
  calculateRoundScores,
  getRoundRevealedAnswers,
  getFinishedGameData,
  startGameSession,
  skipCurrentQuestion,
} from '../modules/games/round.service.js';
import { addBotToGame, removeBotFromGame, handleBotAnswering } from '../modules/games/bot.service.js';

export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

/** Grace period (ms) before a disconnected player is permanently marked as LEFT */
const RECONNECT_GRACE_MS = 30_000;

/** Map of userId → reconnect timer, cleared on successful reconnect */
const reconnectTimers = new Map<string, NodeJS.Timeout>();

export const registerLobbyHandlers = (io: Server, socket: AuthenticatedSocket) => {
  if (!socket.user) return;

  const user = socket.user;

  /**
   * Event: LOBBY:JOIN_ROOM
   * Player attempts to enter or reconnect to a game room
   */
  socket.on('LOBBY:JOIN_ROOM', async (payload: { gameId: string; nickname?: string }) => {
    try {
      const { gameId, nickname } = payload;
      if (!gameId) {
        return socket.emit('LOBBY:ERROR', { message: 'Game ID is required' });
      }

      // 1. Fetch full game room metadata and player list
      const gameDetails = await getGameDetailsById(gameId);
      if (!gameDetails) {
        return socket.emit('LOBBY:ERROR', { message: 'Game room not found' });
      }

      const { game, players: existingPlayers } = gameDetails;
      const playerNickname = (nickname || user.username).trim();

      const existingPlayer = existingPlayers.find(
        (p) => p.user_id === user.userId || p.nickname.toLowerCase() === playerNickname.toLowerCase()
      );
      const isExistingPlayer = Boolean(existingPlayer);

      // Guard: blocked kicked player from rejoining
      if (existingPlayer?.status === 'KICKED') {
        return socket.emit('LOBBY:ERROR', { message: 'لقد تم استبعادك من هذه الغرفة بواسطة المضيف.' });
      }

      // 2. Validation for players attempting to join / reconnect
      if (!isExistingPlayer) {
        if (game.status !== 'LOBBY' && game.status !== 'IN_PROGRESS') {
          return socket.emit('LOBBY:ERROR', {
            message: 'Cannot join. Game is already finished or unavailable.',
          });
        }

        if (existingPlayers.filter((p: any) => p.status !== 'KICKED').length >= game.max_players) {
          return socket.emit('LOBBY:ERROR', {
            message: 'Cannot join. Game room is full.',
          });
        }
      }

      // If reconnected with same nickname under another guest ID, migrate player mapping
      if (existingPlayer && existingPlayer.user_id !== user.userId) {
        await pool.query(
          `UPDATE game_players SET user_id = $1, is_connected = true, status = 'ACTIVE', socket_id = $2 WHERE id = $3;`,
          [user.userId, socket.id, existingPlayer.id]
        );
      }

      // Clear any pending reconnect grace period for this user
      const timerKey = `${gameId}:${user.userId}`;
      const existingTimer = reconnectTimers.get(timerKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
        reconnectTimers.delete(timerKey);
        console.log(`⏰ Grace period cleared for user [${user.username}] in game [${gameId}]`);
      }

      // 3. Register or update player connection state
      await joinGameRoom(gameId, user.userId, playerNickname);

      // Update socket_id for this connection
      await updatePlayerConnectionStatus(gameId, user.userId, true, socket.id);

      // 4. Join Socket.io room channel
      const roomChannel = `game_${gameId}`;
      await socket.join(roomChannel);
      socket.data.gameId = gameId;
      socket.data.socketId = socket.id;

      // 5. Fetch updated player list with avatars
      const updatedPlayers = await getGamePlayersWithAvatars(gameId);

      // 6. Broadcast updated player list to all connected clients in this room
      io.to(roomChannel).emit('LOBBY:UPDATE_PLAYERS', {
        gameId,
        players: updatedPlayers,
      });

      let currentRoundData: any = null;
      if (game.status === 'IN_PROGRESS') {
        const roundRes = await pool.query(
          'SELECT * FROM game_rounds WHERE game_id = $1 ORDER BY round_number DESC LIMIT 1;',
          [gameId]
        );
        if (roundRes.rows.length > 0) {
          const round = roundRes.rows[0];

          const qRes = await pool.query('SELECT * FROM questions WHERE id = $1;', [round.question_id]);
          const question = qRes.rows[0] || null;

          const answerStatuses = await getRoundAnswerStatuses(round.id, gameId);

          const myAnswerRes = await pool.query(
            `SELECT ra.* FROM round_answers ra 
             JOIN game_players gp ON ra.game_player_id = gp.id 
             WHERE ra.round_id = $1 AND gp.user_id = $2;`,
            [round.id, user.userId]
          );
          const hasAnswered = myAnswerRes.rows.length > 0;

          let matchingData: any = null;
          let resultsData: any = null;

          if (round.phase === 'MATCHING') {
            const rawMatching = await getMatchingPhaseData(round.id, gameId, user.userId);
            const myGuessesRes = await pool.query(
              `SELECT rg.* FROM round_guesses rg 
               JOIN game_players gp ON rg.guesser_player_id = gp.id 
               WHERE rg.round_id = $1 AND gp.user_id = $2;`,
              [round.id, user.userId]
            );
            const hasGuessed = myGuessesRes.rows.length > 0;
            matchingData = { ...rawMatching, hasGuessed };
          } else if (round.phase === 'RESULTS') {
            const leaderboard = await calculateRoundScores(round.id, gameId);
            const revealedAnswers = await getRoundRevealedAnswers(round.id);
            resultsData = {
              roundNumber: round.round_number,
              leaderboard,
              revealedAnswers,
            };
          }

          let remainingTimer = round.answering_timer_sec || 30;
          if (round.phase_deadline) {
            const diff = Math.ceil((new Date(round.phase_deadline).getTime() - Date.now()) / 1000);
            remainingTimer = Math.max(1, Math.min(diff, round.answering_timer_sec || 30));
          }

          currentRoundData = {
            roundId: round.id,
            roundNumber: round.round_number,
            phase: round.phase,
            question: question ? { id: question.id, text_ar: question.text_ar, text_en: question.text_en } : null,
            timer: remainingTimer,
            hasAnswered,
            answerStatuses,
            matchingData,
            resultsData,
          };
        }
      } else if (game.status === 'FINISHED') {
        const finalResult = await getFinishedGameData(gameId);
        currentRoundData = {
          phase: 'FINAL',
          finalResultsData: finalResult,
        };
      }

      // 7. Send full current game state directly to the joining/reconnecting player
      socket.emit('GAME:CURRENT_STATE', {
        game,
        players: updatedPlayers,
        isReconnection: isExistingPlayer && game.status !== 'LOBBY',
        currentRoundData,
      });

      console.log(
        `📡 User [${playerNickname}] (${isExistingPlayer ? 'Reconnected' : 'Joined'}) socket room [${roomChannel}] during status [${game.status}]`
      );
    } catch (error) {
      console.error('Error in LOBBY:JOIN_ROOM handler:', error);
      socket.emit('LOBBY:ERROR', { message: 'Failed to join or reconnect to game lobby' });
    }
  });

  /**
   * Event: LOBBY:UPDATE_SETTINGS
   * Host updates game room settings in lobby
   */
  socket.on('LOBBY:UPDATE_SETTINGS', async (payload: { gameId: string; settings: any }) => {
    try {
      const { gameId, settings } = payload;
      if (!gameId || !settings) return;

      const updatedGame = await updateGameRoomSettings(gameId, user.userId, settings);
      const roomChannel = `game_${gameId}`;

      io.to(roomChannel).emit('LOBBY:SETTINGS_UPDATED', {
        gameId,
        game: updatedGame,
      });

      console.log(`⚙️ Game settings updated for game [${gameId}] by host [${user.username}]`);
    } catch (error: any) {
      console.error('Error in LOBBY:UPDATE_SETTINGS handler:', error);
      socket.emit('LOBBY:ERROR', { message: error.message || 'Failed to update settings' });
    }
  });

  /**
   * Event: LOBBY:ADD_BOT
   * Host adds a test bot to the room
   */
  socket.on('LOBBY:ADD_BOT', async (payload: { gameId: string }) => {
    try {
      const { gameId } = payload;
      if (!gameId) return;

      const gameDetails = await getGameDetailsById(gameId);
      if (!gameDetails || gameDetails.game.host_user_id !== user.userId) {
        return socket.emit('LOBBY:ERROR', { message: 'Only the host can add bots' });
      }

      if (gameDetails.players.length >= gameDetails.game.max_players) {
        return socket.emit('LOBBY:ERROR', { message: 'Room has reached max capacity' });
      }

      await addBotToGame(gameId);
      const updatedPlayers = await getGamePlayersWithAvatars(gameId);
      const roomChannel = `game_${gameId}`;

      io.to(roomChannel).emit('LOBBY:UPDATE_PLAYERS', {
        gameId,
        players: updatedPlayers,
      });

      console.log(`🤖 Bot added to game [${gameId}] by host [${user.username}]`);
    } catch (error: any) {
      console.error('Error in LOBBY:ADD_BOT:', error);
      socket.emit('LOBBY:ERROR', { message: 'Failed to add bot' });
    }
  });

  /**
   * Event: LOBBY:REMOVE_BOT
   * Host removes a test bot from the room
   */
  socket.on('LOBBY:REMOVE_BOT', async (payload: { gameId: string }) => {
    try {
      const { gameId } = payload;
      if (!gameId) return;

      const gameDetails = await getGameDetailsById(gameId);
      if (!gameDetails || gameDetails.game.host_user_id !== user.userId) {
        return socket.emit('LOBBY:ERROR', { message: 'Only the host can remove bots' });
      }

      await removeBotFromGame(gameId);
      const updatedPlayers = await getGamePlayersWithAvatars(gameId);
      const roomChannel = `game_${gameId}`;

      io.to(roomChannel).emit('LOBBY:UPDATE_PLAYERS', {
        gameId,
        players: updatedPlayers,
      });

      console.log(`🤖 Bot removed from game [${gameId}] by host [${user.username}]`);
    } catch (error: any) {
      console.error('Error in LOBBY:REMOVE_BOT:', error);
      socket.emit('LOBBY:ERROR', { message: 'Failed to remove bot' });
    }
  });

  /**
   * Event: LOBBY:UPDATE_PROFILE
   * Player updates their avatar or username while in lobby/game
   */
  socket.on('LOBBY:UPDATE_PROFILE', async (payload: { gameId?: string; nickname: string; avatarId: string }) => {
    try {
      const { gameId, nickname, avatarId } = payload;
      if (user.userId && nickname) {
        await pool.query(
          'UPDATE users SET username = $1, avatar_id = $2 WHERE id = $3',
          [nickname, avatarId, user.userId]
        );
        await pool.query(
          'UPDATE game_players SET nickname = $1 WHERE user_id = $2',
          [nickname, user.userId]
        );

        if (gameId) {
          const updatedPlayers = await getGamePlayersWithAvatars(gameId);
          const roomChannel = `game_${gameId}`;
          io.to(roomChannel).emit('LOBBY:UPDATE_PLAYERS', {
            gameId,
            players: updatedPlayers,
          });
        }
      }
    } catch (error) {
      console.error('Error in LOBBY:UPDATE_PROFILE handler:', error);
    }
  });

  /**
   * Event: LOBBY:REMATCH
   * Host requests rematch / returning all players back to lobby for a new match
   */
  socket.on('LOBBY:REMATCH', async (payload: { gameId: string }) => {
    try {
      const { gameId } = payload;
      if (!gameId) return;

      // 1. Verify host
      const gameRes = await pool.query('SELECT * FROM games WHERE id = $1;', [gameId]);
      if (gameRes.rows.length === 0) return socket.emit('LOBBY:ERROR', { message: 'Game not found' });

      const game = gameRes.rows[0];
      if (game.host_user_id !== user.userId) {
        return socket.emit('LOBBY:ERROR', { message: 'Only host can start a rematch' });
      }

      // 2. Clean up previous round data for this game to prevent unique constraint violation on new match
      await pool.query('DELETE FROM round_guesses WHERE round_id IN (SELECT id FROM game_rounds WHERE game_id = $1);', [gameId]);
      await pool.query('DELETE FROM round_scores WHERE round_id IN (SELECT id FROM game_rounds WHERE game_id = $1);', [gameId]);
      await pool.query('DELETE FROM round_answers WHERE round_id IN (SELECT id FROM game_rounds WHERE game_id = $1);', [gameId]);
      await pool.query('DELETE FROM game_dare_assignments WHERE game_id = $1;', [gameId]);
      await pool.query('DELETE FROM game_rounds WHERE game_id = $1;', [gameId]);

      // 3. Reset game status back to 'LOBBY' and current_round_number to 0
      await pool.query(
        "UPDATE games SET status = 'LOBBY', current_round_number = 0 WHERE id = $1;",
        [gameId]
      );

      // 4. Reset player scores to 0
      await pool.query(
        'UPDATE game_players SET total_score = 0 WHERE game_id = $1;',
        [gameId]
      );

      const roomChannel = `game_${gameId}`;

      // 5. Try auto-starting a brand new game session immediately with all players
      try {
        const result = await startGameSession(gameId, user.userId);
        const answerStatuses = await getRoundAnswerStatuses(result.round.id, gameId);
        const updatedPlayers = await getGamePlayersWithAvatars(gameId);

        io.to(roomChannel).emit('LOBBY:UPDATE_PLAYERS', {
          gameId,
          players: updatedPlayers,
        });

        io.to(roomChannel).emit('GAME:STARTED', {
          gameId,
          status: 'IN_PROGRESS',
        });

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

        handleBotAnswering(io, result.round.id, gameId);
        console.log(`🎮 Rematch auto-started immediately for game [${gameId}] by host [${user.username}]. Round 1 initiated.`);
      } catch (startErr) {
        // Fallback: If not enough players to auto-start, return to lobby
        const updatedGameRes = await pool.query('SELECT * FROM games WHERE id = $1;', [gameId]);
        const players = await getGamePlayersWithAvatars(gameId);
        io.to(roomChannel).emit('LOBBY:REMATCH_STARTED', {
          gameId,
          game: updatedGameRes.rows[0],
          players,
        });
        console.log(`🔄 Rematch returned to LOBBY for game [${gameId}].`);
      }
    } catch (error: any) {
      console.error('Error in LOBBY:REMATCH handler:', error);
      socket.emit('LOBBY:ERROR', { message: error.message || 'Failed to start rematch' });
    }
  });

  /**
   * Event: LOBBY:RETURN_TO_LOBBY
   * Returns all players back to the Room Lobby phase from the Final results screen
   */
  socket.on('LOBBY:RETURN_TO_LOBBY', async (payload: { gameId: string }) => {
    try {
      const { gameId } = payload;
      if (!gameId) return;

      const gameRes = await pool.query('SELECT * FROM games WHERE id = $1;', [gameId]);
      if (gameRes.rows.length === 0) return socket.emit('LOBBY:ERROR', { message: 'Game not found' });

      // Clean up previous round data for this game
      await pool.query('DELETE FROM round_guesses WHERE round_id IN (SELECT id FROM game_rounds WHERE game_id = $1);', [gameId]);
      await pool.query('DELETE FROM round_scores WHERE round_id IN (SELECT id FROM game_rounds WHERE game_id = $1);', [gameId]);
      await pool.query('DELETE FROM round_answers WHERE round_id IN (SELECT id FROM game_rounds WHERE game_id = $1);', [gameId]);
      await pool.query('DELETE FROM game_dare_assignments WHERE game_id = $1;', [gameId]);
      await pool.query('DELETE FROM game_rounds WHERE game_id = $1;', [gameId]);

      // Reset game status to 'LOBBY' and current_round_number to 0
      const updatedGameRes = await pool.query(
        "UPDATE games SET status = 'LOBBY', current_round_number = 0 WHERE id = $1 RETURNING *;",
        [gameId]
      );

      // Reset player scores to 0
      await pool.query(
        'UPDATE game_players SET total_score = 0 WHERE game_id = $1;',
        [gameId]
      );

      const roomChannel = `game_${gameId}`;
      const players = await getGamePlayersWithAvatars(gameId);

      io.to(roomChannel).emit('LOBBY:REMATCH_STARTED', {
        gameId,
        game: updatedGameRes.rows[0],
        players,
      });

      console.log(`🏠 Returned all players to Room Lobby for game [${gameId}] by user [${user.username}].`);
    } catch (error: any) {
      console.error('Error in LOBBY:RETURN_TO_LOBBY handler:', error);
      socket.emit('LOBBY:ERROR', { message: error.message || 'Failed to return to room lobby' });
    }
  });

  /**
   * Event: LOBBY:KICK_PLAYER
   * Host removes a player/bot from the lobby (soft-kick — does not delete DB record)
   */
  socket.on('LOBBY:KICK_PLAYER', async (payload: { gameId: string; targetPlayerId: string }) => {
    try {
      const { gameId, targetPlayerId } = payload;
      if (!gameId || !targetPlayerId) return;

      const { targetUserId, targetNickname, updatedPlayers } = await kickGamePlayer(
        gameId,
        user.userId,
        targetPlayerId
      );

      const roomChannel = `game_${gameId}`;

      // Notify the kicked player's socket(s)
      const socketsInRoom = await io.in(roomChannel).fetchSockets();
      for (const s of socketsInRoom) {
        if ((s as any).user?.userId === targetUserId) {
          s.emit('LOBBY:KICKED', { message: 'تم إخراجك من الغرفة بواسطة المضيف' });
          await s.leave(roomChannel);
        }
      }

      io.to(roomChannel).emit('LOBBY:UPDATE_PLAYERS', {
        gameId,
        players: updatedPlayers,
      });

      console.log(`👢 Player [${targetNickname}] was soft-kicked from game [${gameId}] by host [${user.username}]`);
    } catch (error: any) {
      console.error('Error in LOBBY:KICK_PLAYER handler:', error);
      socket.emit('LOBBY:ERROR', { message: error.message || 'Failed to remove player' });
    }
  });

  /**
   * Event: GAME:TRANSFER_HOST
   * Host manually transfers their host role to another ACTIVE player
   */
  socket.on('GAME:TRANSFER_HOST', async (payload: { gameId: string; targetPlayerId: string }) => {
    try {
      const { gameId, targetPlayerId } = payload;
      if (!gameId || !targetPlayerId) return;

      const { newHostUserId, updatedPlayers, updatedGame } = await transferHost(
        gameId,
        user.userId,
        targetPlayerId
      );

      const roomChannel = `game_${gameId}`;
      const newHostPlayer = updatedPlayers.find((p: any) => p.user_id === newHostUserId || p.userId === newHostUserId);
      const newHostName = newHostPlayer?.nickname || 'أحد اللاعبين';

      io.to(roomChannel).emit('LOBBY:SETTINGS_UPDATED', { gameId, game: updatedGame });
      io.to(roomChannel).emit('LOBBY:HOST_TRANSFERRED', {
        gameId,
        newHostUserId,
        newHostNickname: newHostName,
        message: `👑 تم نقل قيادة الغرفة إلى ${newHostName}`,
      });
      io.to(roomChannel).emit('LOBBY:UPDATE_PLAYERS', { gameId, players: updatedPlayers });

      console.log(`👑 Host transferred in game [${gameId}] from [${user.username}] to [${newHostName}]`);
    } catch (error: any) {
      console.error('Error in GAME:TRANSFER_HOST:', error);
      socket.emit('LOBBY:ERROR', { message: error.message || 'Failed to transfer host' });
    }
  });

  /**
   * Event: GAME:SKIP_QUESTION
   * Host skips the current question. Does NOT increment round counter.
   * A new question is immediately selected and broadcast.
   */
  socket.on('GAME:SKIP_QUESTION', async (payload: { gameId: string; roundId: string }) => {
    try {
      const { gameId, roundId } = payload;
      if (!gameId || !roundId) return;

      const result = await skipCurrentQuestion(gameId, user.userId, roundId);
      const roomChannel = `game_${gameId}`;
      const answerStatuses = await getRoundAnswerStatuses(result.round.id, gameId);

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
        skipped: true,
      });

      // Trigger bot answering for the new question
      handleBotAnswering(io, result.round.id, gameId);

      console.log(`⏭️ Question skipped in game [${gameId}] by host [${user.username}]. New round started.`);
    } catch (error: any) {
      console.error('Error in GAME:SKIP_QUESTION:', error);
      socket.emit('ROUND:ERROR', { message: error.message || 'Failed to skip question' });
    }
  });

  /**
   * Event: LOBBY:LEAVE_ROOM
   * Player explicitly leaves the game lobby
   */
  socket.on('LOBBY:LEAVE_ROOM', async (payload: { gameId: string }) => {
    try {
      const { gameId } = payload;
      if (!gameId) return;

      // Explicit leave = skip grace period, mark LEFT immediately
      const { updatedPlayers, newHostUserId, updatedGame } = await markPlayerLeft(gameId, user.userId);

      const roomChannel = `game_${gameId}`;
      await socket.leave(roomChannel);
      socket.data.gameId = null;

      if (newHostUserId && updatedGame) {
        const newHostPlayer = updatedPlayers.find((p: any) => p.user_id === newHostUserId || p.userId === newHostUserId);
        const newHostName = newHostPlayer?.nickname || 'أحد اللاعبين';

        io.to(roomChannel).emit('LOBBY:SETTINGS_UPDATED', {
          gameId,
          game: updatedGame,
        });

        io.to(roomChannel).emit('LOBBY:HOST_TRANSFERRED', {
          gameId,
          newHostUserId,
          newHostNickname: newHostName,
          message: `👑 تم نقل قيادة الغرفة تلقائياً إلى ${newHostName}`,
        });
      }

      io.to(roomChannel).emit('LOBBY:UPDATE_PLAYERS', {
        gameId,
        players: updatedPlayers,
      });

      console.log(`📡 User [${user.username}] left socket room [${roomChannel}]`);
    } catch (error) {
      console.error('Error in LOBBY:LEAVE_ROOM handler:', error);
    }
  });

  /**
   * Event: disconnect
   * Socket connection closed (tab closed, internet dropped, etc.)
   * Starts a 30s grace period before permanently marking the player as LEFT.
   */
  socket.on('disconnect', async () => {
    const gameId = socket.data.gameId;
    const socketId = socket.data.socketId || socket.id;
    if (gameId) {
      try {
        const roomChannel = `game_${gameId}`;

        // Mark DISCONNECTED immediately (not LEFT — grace period running)
        const { updatedPlayers, newHostUserId, updatedGame } = await handlePlayerDisconnect(
          gameId,
          user.userId,
          socketId
        );

        // Broadcast immediate DISCONNECTED status so other players see the dot go grey
        io.to(roomChannel).emit('LOBBY:UPDATE_PLAYERS', {
          gameId,
          players: updatedPlayers,
        });

        if (newHostUserId && updatedGame) {
          const newHostPlayer = updatedPlayers.find((p: any) => p.user_id === newHostUserId || p.userId === newHostUserId);
          const newHostName = newHostPlayer?.nickname || 'أحد اللاعبين';

          io.to(roomChannel).emit('LOBBY:SETTINGS_UPDATED', { gameId, game: updatedGame });
          io.to(roomChannel).emit('LOBBY:HOST_TRANSFERRED', {
            gameId,
            newHostUserId,
            newHostNickname: newHostName,
            message: `👑 تم نقل قيادة الغرفة تلقائياً إلى ${newHostName}`,
          });
        }

        console.log(`🔌 User [${user.username}] disconnected. Grace period started (${RECONNECT_GRACE_MS / 1000}s).`);

        // Start grace period — mark LEFT if they don't reconnect in time
        const timerKey = `${gameId}:${user.userId}`;
        const timer = setTimeout(async () => {
          reconnectTimers.delete(timerKey);
          try {
            const leaveResult = await markPlayerLeft(gameId, user.userId);
            if (leaveResult.updatedPlayers.length > 0) {
              io.to(roomChannel).emit('LOBBY:UPDATE_PLAYERS', {
                gameId,
                players: leaveResult.updatedPlayers,
              });

              if (leaveResult.newHostUserId && leaveResult.updatedGame) {
                const newHostPlayer = leaveResult.updatedPlayers.find(
                  (p: any) => p.user_id === leaveResult.newHostUserId || p.userId === leaveResult.newHostUserId
                );
                const newHostName = newHostPlayer?.nickname || 'أحد اللاعبين';

                io.to(roomChannel).emit('LOBBY:SETTINGS_UPDATED', { gameId, game: leaveResult.updatedGame });
                io.to(roomChannel).emit('LOBBY:HOST_TRANSFERRED', {
                  gameId,
                  newHostUserId: leaveResult.newHostUserId,
                  newHostNickname: newHostName,
                  message: `👑 تم نقل قيادة الغرفة تلقائياً إلى ${newHostName}`,
                });
              }

              console.log(`💀 Grace period expired for user [${user.username}]. Marked as LEFT in game [${gameId}].`);
            }
          } catch (err) {
            console.error('Error in grace period handler:', err);
          }
        }, RECONNECT_GRACE_MS);

        reconnectTimers.set(timerKey, timer);
      } catch (error) {
        console.error('Error in socket disconnect handler:', error);
      }
    }
  });
};
