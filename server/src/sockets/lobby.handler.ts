import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../utils/jwt.utils.js';
import {
  getGameDetailsById,
  joinGameRoom,
  updatePlayerConnectionStatus,
  getGamePlayersWithAvatars,
  handlePlayerDisconnectOrLeave,
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
} from '../modules/games/round.service.js';

export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

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
      const isExistingPlayer = existingPlayers.some((p) => p.user_id === user.userId);

      // 2. Validation for NEW players attempting to join
      if (!isExistingPlayer) {
        if (game.status !== 'LOBBY') {
          return socket.emit('LOBBY:ERROR', {
            message: 'Cannot join. Game is already in progress.',
          });
        }

        if (existingPlayers.length >= game.max_players) {
          return socket.emit('LOBBY:ERROR', {
            message: 'Cannot join. Game room is full.',
          });
        }
      }

      const playerNickname = nickname || user.username;

      // 3. Register or update player connection state (is_connected = true) in DB
      await joinGameRoom(gameId, user.userId, playerNickname);

      // 4. Join Socket.io room channel for real-time room broadcasts
      const roomChannel = `game_${gameId}`;
      await socket.join(roomChannel);

      // Store gameId in transient socket data for disconnect tracking
      socket.data.gameId = gameId;

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
            const rawMatching = await getMatchingPhaseData(round.id, gameId);
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

      // 2. Reset game status back to 'LOBBY' and current_round_number to 0
      await pool.query(
        "UPDATE games SET status = 'LOBBY', current_round_number = 0 WHERE id = $1;",
        [gameId]
      );

      // 3. Reset player scores to 0
      await pool.query(
        'UPDATE game_players SET total_score = 0 WHERE game_id = $1;',
        [gameId]
      );

      // 4. Fetch updated game & players list
      const updatedGameRes = await pool.query('SELECT * FROM games WHERE id = $1;', [gameId]);
      const players = await getGamePlayersWithAvatars(gameId);

      const roomChannel = `game_${gameId}`;
      io.to(roomChannel).emit('LOBBY:REMATCH_STARTED', {
        gameId,
        game: updatedGameRes.rows[0],
        players,
      });

      console.log(`🔄 Rematch started for game [${gameId}] by host [${user.username}]. Room returned to LOBBY.`);
    } catch (error: any) {
      console.error('Error in LOBBY:REMATCH handler:', error);
      socket.emit('LOBBY:ERROR', { message: error.message || 'Failed to start rematch' });
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

      const { updatedPlayers } = await handlePlayerDisconnectOrLeave(gameId, user.userId);

      const roomChannel = `game_${gameId}`;
      await socket.leave(roomChannel);
      socket.data.gameId = null;

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
   */
  socket.on('disconnect', async () => {
    const gameId = socket.data.gameId;
    if (gameId) {
      try {
        const { updatedPlayers } = await handlePlayerDisconnectOrLeave(gameId, user.userId);

        const roomChannel = `game_${gameId}`;
        io.to(roomChannel).emit('LOBBY:UPDATE_PLAYERS', {
          gameId,
          players: updatedPlayers,
        });

        console.log(`🔌 User [${user.username}] disconnected from socket room [${roomChannel}]`);
      } catch (error) {
        console.error('Error in socket disconnect handler:', error);
      }
    }
  });
};
