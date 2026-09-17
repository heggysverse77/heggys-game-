import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider, useSocket } from './contexts/SocketContext';
import { GameProvider, useGameContext } from './contexts/GameContext';
import { SoundProvider } from './contexts/SoundContext';
import { ToastProvider, useToast } from './components/ui/Toast';

import HomePage from './pages/HomePage';
import JoinPage from './pages/JoinPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';

import { AppLoadingSplash } from './components/ui';

import { createRoom, type CreateGameOptions } from './services/game.service';
import { emitJoinRoom } from './socket/lobby.events';

import { onRoundStart } from './socket/round.events';
import { onCurrentState, onUpdatePlayers, onSettingsUpdated, onRematchStarted } from './socket/lobby.events';

type AppPage = 'home' | 'join' | 'lobby' | 'game';

interface RoomInfo {
  gameId: string;
  roomCode: string;
}

// Inner app has access to all contexts
function InnerApp() {
  const [room, setRoom] = useState<RoomInfo | null>(() => {
    try {
      const saved = localStorage.getItem('heggy_active_room');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [page, setPage] = useState<AppPage>(() => {
    try {
      const saved = localStorage.getItem('heggy_active_room');
      return saved ? 'game' : 'home';
    } catch {
      return 'home';
    }
  });

  const updateRoom = (newRoom: RoomInfo | null) => {
    setRoom(newRoom);
    if (newRoom) {
      localStorage.setItem('heggy_active_room', JSON.stringify(newRoom));
    } else {
      localStorage.removeItem('heggy_active_room');
    }
  };

  const [showInitialSplash, setShowInitialSplash] = useState(true);
  const { user, token, isAuthenticated } = useAuth();
  const { connect, socket, status } = useSocket();
  const { dispatch, state } = useGameContext();
  const game = state.game;

  // Return to lobby view if game status returns to LOBBY
  useEffect(() => {
    if (page === 'game' && game?.status === 'LOBBY') {
      setPage('lobby');
    }
  }, [page, game?.status]);

  // Reconnect socket when token becomes available
  useEffect(() => {
    if (isAuthenticated && token) connect(token);
  }, [isAuthenticated, token, connect]);

  // Auto re-join active room after socket connection/refresh
  useEffect(() => {
    if (socket && status === 'connected' && room?.gameId) {
      console.log('📡 [App] Auto re-joining active room after refresh/connect:', room.roomCode);
      emitJoinRoom({ gameId: room.gameId });
    }
  }, [socket, status, room?.gameId]);

  // Global socket listener: transitions all players to the game simultaneously
  useEffect(() => {
    if (!socket) return;

    const offRoundStart = onRoundStart((payload) => {
      console.log('🎮 [App] ROUND:START broadcast received. Transitioning all players to game!');
      const timer = payload.timer ?? (payload as any).answeringTimerSec ?? 30;
      dispatch({
        type: 'ROUND_STARTED',
        roundId: payload.roundId,
        roundNumber: payload.roundNumber,
        question: payload.question,
        timer,
      });
      setPage('game');
    });

    const offCurrentState = onCurrentState((payload: any) => {
      dispatch({
        type: 'GAME_JOINED',
        game: payload.game,
        players: payload.players,
        myPlayerId: user?.id || '',
      });

      if (payload.game?.id && payload.game?.room_code) {
        updateRoom({ gameId: payload.game.id, roomCode: payload.game.room_code });
      }

      if (payload.game.status === 'IN_PROGRESS' || payload.game.status === 'FINISHED' || payload.isReconnection) {
        setPage('game');

        const roundData = payload.currentRoundData;
        if (roundData) {
          console.log('🔄 [App] Restoring active round state after refresh:', roundData.phase);
          if (roundData.phase === 'ANSWERING') {
            dispatch({
              type: 'ROUND_STARTED',
              roundId: roundData.roundId,
              roundNumber: roundData.roundNumber,
              question: roundData.question,
              timer: roundData.timer,
            });
            if (roundData.hasAnswered) {
              dispatch({ type: 'ANSWER_SUBMITTED' });
            }
            if (roundData.answerStatuses) {
              dispatch({ type: 'ANSWER_STATUSES', statuses: roundData.answerStatuses });
            }
          } else if (roundData.phase === 'MATCHING') {
            dispatch({
              type: 'ROUND_STARTED',
              roundId: roundData.roundId,
              roundNumber: roundData.roundNumber,
              question: roundData.question,
              timer: roundData.timer,
            });
            dispatch({
              type: 'MATCHING_STARTED',
              answers: roundData.matchingData?.anonymousAnswers || [],
              players: roundData.matchingData?.playersToMatch || [],
              timer: roundData.matchingData?.matchingTimerSec || 45,
            });
            if (roundData.matchingData?.hasGuessed) {
              dispatch({ type: 'GUESSES_SUBMITTED' });
            }
          } else if (roundData.phase === 'RESULTS') {
            dispatch({
              type: 'ROUND_STARTED',
              roundId: roundData.roundId,
              roundNumber: roundData.roundNumber,
              question: roundData.question,
              timer: roundData.timer,
            });
            dispatch({
              type: 'RESULTS_RECEIVED',
              results: roundData.resultsData,
            });
          } else if (roundData.phase === 'FINAL') {
            dispatch({
              type: 'FINAL_RESULTS',
              results: roundData.finalResultsData,
            });
          }
        }
      } else if (payload.game.status === 'LOBBY') {
        setPage('lobby');
      }
    });

    const offPlayers = onUpdatePlayers((payload) => {
      dispatch({ type: 'PLAYERS_UPDATED', players: payload.players });
    });

    const offSettingsUpdated = onSettingsUpdated((payload) => {
      console.log('⚙️ [App] LOBBY:SETTINGS_UPDATED received:', payload.game);
      dispatch({ type: 'GAME_SETTINGS_UPDATED', game: payload.game });
    });

    const offRematch = onRematchStarted((payload) => {
      console.log('🔄 [App] LOBBY:REMATCH_STARTED received! Returning to lobby with room code:', payload.game.room_code);
      dispatch({ type: 'RESET' });
      dispatch({
        type: 'GAME_JOINED',
        game: payload.game,
        players: payload.players,
        myPlayerId: user?.id || '',
      });
      updateRoom({ gameId: payload.game.id, roomCode: payload.game.room_code });
      setPage('lobby');
    });

    return () => {
      offRoundStart();
      offCurrentState();
      offPlayers();
      offSettingsUpdated();
      offRematch();
    };
  }, [socket, dispatch, user, room?.gameId]);

  const { showToast } = useToast();

  const handleCreateRoom = async (opts?: CreateGameOptions) => {
    if (!token) {
      showToast({ message: 'يرجى تسجيل الدخول أولاً', type: 'warn' });
      return;
    }
    try {
      const { game, hostPlayer } = await createRoom(opts);
      dispatch({
        type: 'GAME_JOINED',
        game,
        players: hostPlayer ? [hostPlayer] : [],
        myPlayerId: user?.id || '',
      });
      updateRoom({ gameId: game.id, roomCode: game.room_code });
      emitJoinRoom({ gameId: game.id });
      setPage('lobby');
    } catch (err: any) {
      console.error('Failed to create room:', err);
      showToast({
        message: err?.message || 'تعذر إنشاء الغرفة! تأكد أن السيرفر يعمل.',
        type: 'error',
      });
    }
  };

  const handleLeaveRoom = () => {
    dispatch({ type: 'RESET' });
    updateRoom(null);
    setPage('home');
  };

  return (
    <>
      {showInitialSplash && (
        <AppLoadingSplash onFinished={() => setShowInitialSplash(false)} />
      )}

      {page === 'home' && (
        <HomePage
          onEnterLobby={handleCreateRoom}
          onJoinRoom={() => setPage('join')}
        />
      )}
      {page === 'join' && (
        <JoinPage
          onJoined={(gameId, roomCode) => {
            updateRoom({ gameId, roomCode });
            setPage('lobby');
          }}
          onBack={() => setPage('home')}
        />
      )}
      {page === 'lobby' && room && (
        <LobbyPage
          gameId={room.gameId}
          roomCode={room.roomCode}
          onGameStarted={() => setPage('game')}
          onLeave={handleLeaveRoom}
        />
      )}
      {page === 'game' && room && (
        <GamePage
          gameId={room.gameId}
          roomCode={room.roomCode}
          onLeaveGame={handleLeaveRoom}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <GameProvider>
          <SoundProvider>
            <ToastProvider>
              <InnerApp />
            </ToastProvider>
          </SoundProvider>
        </GameProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
