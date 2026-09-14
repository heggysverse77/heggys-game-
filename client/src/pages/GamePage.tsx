import { useEffect } from 'react';
import GameLayout from '../components/layout/GameLayout';
import GameHeader from '../components/layout/GameHeader';
import { Spinner } from '../components/ui';
import PhaseController from '../components/game/PhaseController';
import { useGame } from '../hooks/useGame';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { onRoundStart, onAnswerStatuses, onRoundResults } from '../socket/round.events';
import { onStartMatching, onFinalResults } from '../socket/game.events';
import { onUpdatePlayers } from '../socket/lobby.events';

interface GamePageProps {
  gameId: string;
  roomCode?: string;
  onLeaveGame?: () => void;
}

export default function GamePage({ gameId, roomCode, onLeaveGame }: GamePageProps) {
  const { dispatch, phase, currentRoundNumber, game } = useGame();
  const { user } = useAuth();
  const { socket } = useSocket();

  // Wire all socket events to the game state reducer
  useEffect(() => {
    if (!socket) return;

    const cleanups = [
      onUpdatePlayers((p) => dispatch({ type: 'PLAYERS_UPDATED', players: p.players })),

      // Round start
      onRoundStart((p) => dispatch({
        type: 'ROUND_STARTED',
        roundId: p.roundId,
        roundNumber: p.roundNumber,
        question: p.question,
        timer: p.timer,
      })),

      // Answer statuses
      onAnswerStatuses((p) => dispatch({ type: 'ANSWER_STATUSES', statuses: p })),

      // Matching phase
      onStartMatching((p) => dispatch({
        type: 'MATCHING_STARTED',
        answers: p.anonymousAnswers,
        players: p.playersToMatch,
        timer: p.timer,
      })),

      // Results
      onRoundResults((p) => dispatch({ type: 'RESULTS_RECEIVED', results: p })),

      // Final
      onFinalResults((p) => dispatch({ type: 'FINAL_RESULTS', results: p })),
    ];

    return () => cleanups.forEach((fn) => fn());
  }, [socket, dispatch, user]);

  const getPhaseTitle = () => {
    switch (phase) {
      case 'ANSWERING': return `الجولة ${currentRoundNumber} من ${game?.total_rounds ?? 5}`;
      case 'MATCHING':  return 'التخمين والتوصيل';
      case 'RESULTS':   return `نتائج الجولة ${currentRoundNumber}`;
      case 'FINAL':     return 'النتيجة النهائية وتتويج الفائزين';
      case 'DARE':      return 'تنفيذ العقوبة والتحدي';
      default:          return 'اعرف صاحبك';
    }
  };

  return (
    <GameLayout>
      <GameHeader
        title={getPhaseTitle()}
        roomCode={roomCode}
        onLeave={onLeaveGame}
        leaveLabel="مغادرة اللعبة"
        onLogout={onLeaveGame}
      />

      <div className="flex-1 flex flex-col items-center w-full px-3 sm:px-6 py-4 sm:py-6 max-w-5xl mx-auto">
        {!phase || phase === 'LOBBY' ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Spinner size="lg" />
            <p className="font-display font-black text-lg sm:text-xl text-[#F6BD60] drop-shadow-sm">
              جاري مزامنة بيانات اللعبة...
            </p>
          </div>
        ) : (
          <PhaseController gameId={gameId} />
        )}
      </div>
    </GameLayout>
  );
}
