import { useState, useEffect } from 'react';
import { Play, Timer, Check } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../hooks/useAuth';
import { useTimer } from '../../hooks/useTimer';
import { useSound } from '../../hooks/useSound';
import { emitSubmitGuesses } from '../../socket/game.events';
import { emitForceResults } from '../../socket/round.events';
import CircularGameTable, { type TablePlayer } from './CircularGameTable';

interface MatchingPhaseProps {
  gameId: string;
}

export default function MatchingPhase({ gameId }: MatchingPhaseProps) {
  const {
    anonymousAnswers,
    playersToMatch,
    players: allGamePlayers,
    currentRoundId,
    timerSeconds,
    game,
    myPlayerId,
    hasSubmittedGuesses,
    myGuesses,
    guessStatuses,
    isHost,
    dispatch,
  } = useGame();
  const { user } = useAuth();
  const { play } = useSound();

  const totalDuration = timerSeconds || game?.matching_timer_sec || 45;
  const { remaining, isExpired } = useTimer(totalDuration, !hasSubmittedGuesses);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);

  const getAnswerId = (a: any): string => a.answerId || a.answer_id || a.id || '';
  const getPlayerId = (p: any): string => p.gamePlayerId || p.userId || p.id || '';

  // Use playersToMatch or fallback to allGamePlayers
  const activePlayers = playersToMatch.length > 0 ? playersToMatch : allGamePlayers;

  const isMeCheck = (p: any) => {
    return Boolean(
      (user && (p.userId === user.id || p.userId === (user as any).userId)) ||
      (myPlayerId && (p.gamePlayerId === myPlayerId || p.userId === myPlayerId || p.id === myPlayerId))
    );
  };

  const candidatePlayers = activePlayers.filter((p: any) => !isMeCheck(p));
  const answersToMatch = anonymousAnswers;

  const totalAnswers = answersToMatch.length;
  const matchedCount = Object.keys(myGuesses).filter(
    (k) => myGuesses[k] && answersToMatch.some((a) => getAnswerId(a) === k)
  ).length;
  const allGuessed = totalAnswers > 0 && matchedCount >= totalAnswers;

  const handleSelectAnswer = (answerId: string) => {
    if (hasSubmittedGuesses) return;
    setSelectedAnswerId((prev) => (prev === answerId ? null : answerId));
  };

  const handleSelectPlayer = (player: TablePlayer) => {
    if (!selectedAnswerId || hasSubmittedGuesses || player.isMe) return;
    dispatch({ type: 'GUESS_SET', answerId: selectedAnswerId, playerId: player.id });
    play('submit');
    setSelectedAnswerId(null);
  };

  const handleUnlinkGuess = (answerId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (hasSubmittedGuesses) return;
    dispatch({ type: 'GUESS_UNSET', answerId });
  };

  const handleSubmit = () => {
    if (!currentRoundId || hasSubmittedGuesses || !allGuessed) return;
    const guesses = Object.entries(myGuesses)
      .filter(([answerId]) => answersToMatch.some((a) => getAnswerId(a) === answerId))
      .map(([answerId, guessedPlayerId]) => ({
        answerId,
        guessedPlayerId,
      }));
    emitSubmitGuesses({ gameId, roundId: currentRoundId, guesses });
    dispatch({ type: 'GUESSES_SUBMITTED' });
    play('submit');
  };

  useEffect(() => {
    if (isExpired && !hasSubmittedGuesses && currentRoundId) {
      const guesses = Object.entries(myGuesses)
        .filter(([answerId]) => answersToMatch.some((a) => getAnswerId(a) === answerId))
        .map(([answerId, guessedPlayerId]) => ({
          answerId,
          guessedPlayerId,
        }));
      emitSubmitGuesses({ gameId, roundId: currentRoundId, guesses });
      dispatch({ type: 'GUESSES_SUBMITTED' });
      play('submit');
    }
  }, [isExpired, hasSubmittedGuesses, currentRoundId, myGuesses, gameId, answersToMatch, dispatch, play]);

  const tablePlayers: TablePlayer[] = activePlayers.map((p: any) => {
    const pId = getPlayerId(p);
    const isMe = isMeCheck(p);
    
    // Check if player has submitted their matching guesses
    const statusObj = guessStatuses?.players?.find(
      (gs) => (gs.userId && gs.userId === p.userId) || (gs.gamePlayerId && (gs.gamePlayerId === p.gamePlayerId || gs.gamePlayerId === pId))
    );
    const hasFinishedGuessing = isMe ? hasSubmittedGuesses : Boolean(statusObj?.hasGuessed);

    const isTargetOfSelected = selectedAnswerId ? myGuesses[selectedAnswerId] === pId : false;

    return {
      id: pId,
      nickname: p.nickname || 'لاعب',
      avatarId: p.avatarId || p.avatar_id,
      isMe,
      hasActed: hasFinishedGuessing,
      isSelected: isTargetOfSelected,
      isDisabled: hasSubmittedGuesses || isMe,
    };
  });

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-3 sm:px-6 py-2 sm:py-4 gap-3 sm:gap-4 select-none" dir="rtl">
      
      {/* ── 1. HEADER BANNER (Identical to Screen 3 Mockup) ── */}
      <div className="text-center animate-[slideUp_0.2s_ease]">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-[#FFF6E5] drop-shadow-[2px_2px_0px_#1A1A1A]">
          وصل الإجابات لأصحابها
        </h1>
        <p className="text-xs sm:text-sm font-body font-bold text-[#FFA646] mt-0.5">
          {selectedAnswerId
            ? '👈 اضغط الآن على اللاعب صاحب هذه الإجابة في الدائرة'
            : 'اسحب كل إجابة أو اضغط عليها وضعها على صاحبها'}
        </p>
      </div>

      {/* ── 2. CIRCULAR GAME TABLE (Peripheral Avatars + Center Answers Stack) ── */}
      <CircularGameTable
        players={tablePlayers}
        activePlayerId={null}
        onPlayerClick={handleSelectPlayer}
        footerBadge={
          <div className="inline-flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#F86041] text-white border-2.5 border-[#1A1A1A] shadow-[0_0_16px_rgba(248,96,65,0.5)] font-display font-black text-sm sm:text-base animate-[pop_0.2s_ease] shrink-0 leading-none">
            <Timer className="w-4.5 h-4.5 stroke-[2.5]" />
            <span className="timer-number font-mono">{remaining}s</span>
          </div>
        }
      >
        {/* Center Vertical Stack of Cream Answer Cards (Screen 3) */}
        <div className="flex flex-col gap-2 w-full max-w-[210px] sm:max-w-[240px] max-h-full overflow-y-auto p-1.5 custom-scrollbar">
          {answersToMatch.map((a: any) => {
            const ansId = getAnswerId(a);
            const isSelected = selectedAnswerId === ansId;
            const assignedPlayerId = myGuesses[ansId];
            const assignedPlayer = candidatePlayers.find((p: any) => getPlayerId(p) === assignedPlayerId);

            return (
              <button
                key={ansId}
                type="button"
                onClick={() => handleSelectAnswer(ansId)}
                className={[
                  'w-full p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border-2 sm:border-2.5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 select-none',
                  isSelected
                    ? 'bg-[#FFA646] text-[#1A1A1A] border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] scale-[1.03] font-black'
                    : assignedPlayer
                    ? 'bg-[#33A9AC] text-white border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]'
                    : 'bg-[#FFF6E5] text-[#1A1A1A] border-[#1A1A1A] hover:bg-white shadow-[2px_2px_0px_#1A1A1A]',
                ].join(' ')}
              >
                <span className="text-sm sm:text-base font-display font-black leading-tight truncate max-w-full px-1">
                  {a.text}
                </span>

                {assignedPlayer && (
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full mt-0.5">
                    <Check className="w-3 h-3" />
                    <span className="truncate max-w-[90px]">{assignedPlayer.nickname}</span>
                    <span
                      onClick={(e) => handleUnlinkGuess(ansId, e)}
                      className="text-red-300 hover:text-white mr-1 cursor-pointer font-black"
                      title="إلغاء الربط"
                    >
                      ×
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CircularGameTable>

      {/* ── 3. BOTTOM ACTIONS: CONFIRM GUESSES ── */}
      <div className="w-full max-w-md flex flex-col items-center gap-2.5 animate-[slideUp_0.3s_ease]">
        {!hasSubmittedGuesses ? (
          <div className="w-full flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allGuessed}
              className={[
                'w-full min-h-[46px] sm:min-h-[50px] px-6 rounded-xl sm:rounded-2xl font-display font-black text-base sm:text-lg border-2.5 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] transition-all cursor-pointer flex items-center justify-center gap-2 select-none whitespace-nowrap',
                allGuessed
                  ? 'bg-[#F86041] text-white hover:bg-[#E85536] active:translate-y-0.5'
                  : 'bg-white/20 text-white/40 border-white/20 cursor-not-allowed shadow-none',
              ].join(' ')}
            >
              <Play className="w-4 h-4" />
              <span>
                {allGuessed
                  ? 'تأكيد وإرسال التخمينات'
                  : `وصل باقي الإجابات (${matchedCount}/${totalAnswers})`}
              </span>
            </button>

            {isHost && (
              <button
                type="button"
                onClick={() => emitForceResults({ gameId, roundId: currentRoundId || '' })}
                className="text-xs font-body font-bold text-[#FFF6E5] bg-[#1A1A1A]/85 hover:bg-[#1A1A1A] px-4 py-1.5 rounded-full border-1.5 border-[#1A1A1A] shadow-xs self-center transition-all cursor-pointer active:translate-y-0.5"
              >
                <span>كشف النتائج فوراً (المضيف) ⏭️</span>
              </button>
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col gap-2.5 items-center">
            <div className="w-full p-4 rounded-2xl bg-[#FFF6E5] border-3 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] text-center animate-[pop_0.25s_ease]">
              <span className="text-[#1A1A1A] text-lg sm:text-xl font-display font-black block">
                ✅ تم إرسال تخميناتك بنجاح!
              </span>
              <span className="text-xs sm:text-sm text-[#1A1A1A]/70 font-body font-bold mt-1 block">
                في انتظار انتهاء باقي اللاعبين لكشف النتائج...
              </span>
            </div>

            {isHost && (
              <button
                type="button"
                onClick={() => emitForceResults({ gameId, roundId: currentRoundId || '' })}
                className="w-full h-13 sm:h-14 rounded-2xl bg-[#33A9AC] text-white font-display font-black text-base sm:text-lg border-3 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                <span>كشف نتائج الجولة (المرحلة التالية ⏭️)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
