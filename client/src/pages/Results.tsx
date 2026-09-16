/* HeggyVerse — Results page (spec: pages/Results)
   Winner card highlighted with accent color, loser penalties listed clearly. */
import GameLayout from '../components/layout/GameLayout';
import GameHeader from '../components/layout/GameHeader';
import FinalPhase from '../components/game/FinalPhase';

interface ResultsProps {
  gameId: string;
  roomCode?: string;
  onLeave?: () => void;
}

export default function Results({ gameId, roomCode, onLeave }: ResultsProps) {
  return (
    <GameLayout>
      <GameHeader title="النتيجة النهائية" roomCode={roomCode} onLeave={onLeave} leaveLabel="مغادرة" />
      <FinalPhase gameId={gameId} />
    </GameLayout>
  );
}
