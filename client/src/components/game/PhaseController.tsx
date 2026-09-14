import { useGame } from '../../hooks/useGame';
import AnsweringPhase from './AnsweringPhase';
import MatchingPhase from './MatchingPhase';
import ResultsPhase from './ResultsPhase';
import FinalPhase from './FinalPhase';
import DarePhase from './DarePhase';

interface PhaseControllerProps {
  gameId: string;
}

export default function PhaseController({ gameId }: PhaseControllerProps) {
  const { phase } = useGame();

  switch (phase) {
    case 'ANSWERING': return <AnsweringPhase gameId={gameId} />;
    case 'MATCHING':  return <MatchingPhase  gameId={gameId} />;
    case 'RESULTS':   return <ResultsPhase   gameId={gameId} />;
    case 'FINAL':     return <FinalPhase     gameId={gameId} />;
    case 'DARE':      return <DarePhase      gameId={gameId} />;
    default:          return null;
  }
}
