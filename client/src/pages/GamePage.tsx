import { useEffect } from 'react';
import GameLayout from '../components/layout/GameLayout';
import GameHeader from '../components/layout/GameHeader';
import { Spinner } from '../components/ui';
import PhaseController from '../components/game/PhaseController';
import { useGame } from '../hooks/useGame';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { onRoundStart, onAnswerStatuses, onRoundResults } from '../socket/round.events';
import { onStartMatching, onGuessStatuses, onFinalResults } from '../socket/game.events';
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

  // Wire game-specific live status events (global transitions are handled at App root)
  useEffect(() => {
    if (!socket) return;

    const cleanups = [
      // Live Answer statuses (checkboxes updating during answering)
      onAnswerStatuses((p) => dispatch({ type: 'ANSWER_STATUSES', statuses: p })),

      // Matching live guess statuses (per-avatar checkmarks during matching)
      onGuessStatuses((p) => dispatch({ type: 'GUESS_STATUSES', statuses: p })),
    ];

    return () => cleanups.forEach((fn) => fn());
  }, [socket, dispatch]);

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
        leaveLabel="مغادرة"
        onLogout={onLeaveGame}
      />

      <div className="hv-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingBlock: 24 }}>
        {/* Timer bar lives at top of each phase (hv-timer-track). Active challenge
            is highlighted via hv-card-active inside phase components. */}
        {!phase || phase === 'LOBBY' ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 animate-[fadeIn_0.3s_ease]">
            <Spinner size="lg" />
            <p className="font-display font-black text-lg sm:text-xl text-[#F59E0B] drop-shadow-sm">
              جاري مزامنة بيانات اللعبة... 🤠
            </p>
            {onLeaveGame && (
              <button
                type="button"
                onClick={onLeaveGame}
                className="hv-btn hv-btn-ghost hv-btn-sm"
              >
                العودة للرئيسية
              </button>
            )}
          </div>
        ) : (
          <PhaseController gameId={gameId} />
        )}
      </div>
    </GameLayout>
  );
}
