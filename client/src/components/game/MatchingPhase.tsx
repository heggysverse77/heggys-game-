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
  const { remaining, isExpired } = useTimer(totalDuration, true, currentRoundId);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);

  const getAnswerId = (a: any): string => a.answerId || a.answer_id || a.id || '';
  const getPlayerId = (p: any): string => p.gamePlayerId || p.userId || p.id || '';

  // Use playersToMatch or fallback to allGamePlayers
  const activePlayers = (playersToMatch.length > 0 ? playersToMatch : allGamePlayers).filter(
    (p: any) => p.status !== 'KICKED' && p.status !== 'LEFT'
  );

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

  const tablePlayers: TablePlayer[] = candidatePlayers.map((p: any) => {
    const pId = getPlayerId(p);
    
    // Check if this friend has submitted their matching guesses
    const statusObj = guessStatuses?.players?.find(
      (gs) => (gs.userId && gs.userId === p.userId) || (gs.gamePlayerId && (gs.gamePlayerId === p.gamePlayerId || gs.gamePlayerId === pId))
    );
    const hasFinishedGuessing = Boolean(statusObj?.hasGuessed);

    // Check if an answer in my current form is assigned to this player
    const assignedAnswerId = Object.keys(myGuesses).find((ansId) => myGuesses[ansId] === pId);
    const isTargetOfSelected = selectedAnswerId ? myGuesses[selectedAnswerId] === pId : false;

    return {
      id: pId,
      nickname: p.nickname || 'لاعب',
      avatarId: p.avatarId || p.avatar_id,
      isMe: false,
      hasActed: hasFinishedGuessing,
      statusText: 'يخمن...',
      isAssignedInMatching: Boolean(assignedAnswerId),
      isSelected: isTargetOfSelected,
      isDisabled: hasSubmittedGuesses,
    };
  });

  const selectedAnswerObj = answersToMatch.find((a: any) => getAnswerId(a) === selectedAnswerId);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-2 sm:px-6 py-1 sm:py-3 gap-2 sm:gap-3 select-none" dir="rtl">
      
      {/* ── 1. HEADER BANNER ── */}
      <div className="text-center animate-[slideUp_0.2s_ease]">
        <h1 className="text-xl sm:text-3xl md:text-4xl font-display font-black text-[#FFF6E5] drop-shadow-[2px_2px_0px_#1A1A1A]">
          وصل الإجابات لأصحابها
        </h1>
        <div className="mt-0.5 flex items-center justify-center min-h-[24px]">
          {selectedAnswerId ? (
            <span className="inline-flex items-center gap-1.5 bg-[#1C1917] text-[#FDE047] px-3 py-0.5 rounded-full border-1.5 border-[#F59E0B] text-xs font-black shadow-[1.5px_1.5px_0px_#F59E0B] animate-pulse">
              <span>👈 اضغط على صاحب إجابة:</span>
              <span className="text-white underline truncate max-w-[140px] sm:max-w-[200px]">"{selectedAnswerObj?.text || 'المختارة'}"</span>
            </span>
          ) : (
            <p className="text-xs sm:text-sm font-body font-bold text-[#FFA646]">
              اسحب كل إجابة أو اضغط عليها وضعها على صاحبها
            </p>
          )}
        </div>
      </div>

      {/* ── 2. CIRCULAR GAME TABLE (Peripheral Avatars + Center Answers Stack) ── */}
      <CircularGameTable
        players={tablePlayers}
        activePlayerId={null}
        onPlayerClick={handleSelectPlayer}
        footerBadge={
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-[#F86041] text-white border-2 sm:border-2.5 border-[#1A1A1A] shadow-[0_0_14px_rgba(248,96,65,0.4)] font-display font-black text-xs sm:text-base animate-[pop_0.2s_ease] shrink-0 leading-none">
            <Timer className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
            <span className="timer-number font-mono">{remaining}s</span>
          </div>
        }
      >
        {/* Center Vertical Stack of Cream Answer Cards */}
        <div
          className={[
            'flex flex-col gap-1 w-full max-h-[165px] sm:max-h-[220px] overflow-y-auto custom-scrollbar p-1 z-20',
            answersToMatch.length > 4 ? 'max-w-[210px] sm:max-w-[250px]' : 'max-w-[180px] sm:max-w-[220px]',
          ].join(' ')}
        >
          {answersToMatch.length === 0 ? (
            <div className="p-3 text-center bg-[#FFF6E5] rounded-2xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
              <span className="text-xs sm:text-sm font-display font-black text-[#1A1A1A]">
                جاري تحميل الإجابات...
              </span>
            </div>
          ) : (
            <>
              {answersToMatch.length > 4 && (
                <div className="text-[10px] sm:text-xs font-display font-black text-[#F59E0B] text-center mb-0.5 leading-none shrink-0 select-none">
                  ↕ اسحب للإجابات ({matchedCount}/{totalAnswers})
                </div>
              )}
              {answersToMatch.map((a: any, idx: number) => {
                const ansId = getAnswerId(a);
                const isSelected = selectedAnswerId === ansId;
                const assignedPlayerId = myGuesses[ansId];
                const assignedPlayer = candidatePlayers.find((p: any) => getPlayerId(p) === assignedPlayerId);
                const suits = ['♠', '♥', '♦', '♣'];
                const suitChar = suits[idx % suits.length];
                const isRedSuit = suitChar === '♥' || suitChar === '♦';
                const rawText = a.text ? String(a.text).trim() : '';
                const displayText = rawText || `إجابة لاعب #${idx + 1}`;

                return (
                  <button
                    key={ansId}
                    type="button"
                    onClick={() => handleSelectAnswer(ansId)}
                    className={[
                      'w-full px-2 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border-1.5 sm:border-2 text-right transition-all cursor-pointer flex items-center justify-between gap-1 select-none shrink-0 relative overflow-hidden',
                      isSelected
                        ? 'bg-[#F59E0B] text-[#1C1917] border-[#1C1917] shadow-[2px_2px_0px_#1C1917] scale-[1.02] font-black'
                        : assignedPlayer
                        ? 'bg-[#0D9488] text-white border-[#1C1917] shadow-[1.5px_1.5px_0px_#1C1917]'
                        : 'bg-[#FFF8EB] text-[#1C1917] border-[#1C1917] hover:bg-white shadow-[1.5px_1.5px_0px_#1C1917]',
                    ].join(' ')}
                  >
                    {/* Right side: Suit icon + Answer text */}
                    <div className="flex items-center gap-1 min-w-0 flex-1 text-right">
                      <span
                        className="text-[11px] sm:text-xs font-mono font-bold shrink-0 opacity-70"
                        style={{ color: isRedSuit ? '#DC2626' : '#1C1917' }}
                      >
                        {suitChar}
                      </span>
                      <span className="text-[11px] sm:text-xs md:text-sm font-display font-black leading-tight truncate">
                        {displayText}
                      </span>
                    </div>

                    {/* Left side: Matched player pill (if assigned) */}
                    {assignedPlayer && (
                      <div className="shrink-0 flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] font-bold bg-black/25 text-white px-1.5 py-0.5 rounded-md">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span className="truncate max-w-[55px] sm:max-w-[75px]">{assignedPlayer.nickname}</span>
                        <span
                          onClick={(e) => handleUnlinkGuess(ansId, e)}
                          className="text-red-300 hover:text-white mr-0.5 cursor-pointer font-black text-xs leading-none"
                          title="إلغاء الربط"
                        >
                          ×
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </CircularGameTable>

      {/* ── 3. BOTTOM ACTIONS: CONFIRM GUESSES ── */}
      <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center gap-1.5 sm:gap-2 animate-[slideUp_0.3s_ease]">
        {!hasSubmittedGuesses ? (
          <div className="w-full flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allGuessed}
              className={[
                'w-full min-h-[40px] sm:min-h-[46px] px-4 sm:px-6 rounded-xl sm:rounded-2xl font-display font-black text-sm sm:text-base border-2 sm:border-2.5 border-[#1A1A1A] shadow-[2.5px_2.5px_0px_#1A1A1A] transition-all cursor-pointer flex items-center justify-center gap-2 select-none whitespace-nowrap',
                allGuessed
                  ? 'bg-[#F86041] text-white hover:bg-[#E85536] active:translate-y-0.5'
                  : 'bg-white/20 text-white/40 border-white/20 cursor-not-allowed shadow-none',
              ].join(' ')}
            >
              <Play className="w-4 h-4" />
              <span>
                {allGuessed
                  ? 'تأكيد وإرسال التخمينات 🚀'
                  : `وصل باقي الإجابات (${matchedCount}/${totalAnswers})`}
              </span>
            </button>

            {isHost && (
              <button
                type="button"
                onClick={() => emitForceResults({ gameId, roundId: currentRoundId || '' })}
                className="text-[11px] sm:text-xs font-body font-bold text-[#FFF6E5] bg-[#1A1A1A]/85 hover:bg-[#1A1A1A] px-3.5 py-1 rounded-full border border-[#1A1A1A] shadow-xs self-center transition-all cursor-pointer active:translate-y-0.5"
              >
                <span>كشف النتائج فوراً (المضيف) ⏭️</span>
              </button>
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col gap-2 items-center">
            <div className="w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FFF6E5] border-2 sm:border-3 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] text-center animate-[pop_0.25s_ease]">
              <span className="text-[#1A1A1A] text-base sm:text-lg font-display font-black block">
                ✅ تم إرسال تخميناتك بنجاح!
              </span>
              <span className="text-xs sm:text-sm text-[#1A1A1A]/70 font-body font-bold mt-0.5 block">
                في انتظار انتهاء باقي اللاعبين لكشف النتائج...
              </span>
            </div>

            {isHost && (
              <button
                type="button"
                onClick={() => emitForceResults({ gameId, roundId: currentRoundId || '' })}
                className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-[#33A9AC] text-white font-display font-black text-sm sm:text-base border-2.5 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>كشف نتائج الجولة (المرحلة التالية ⏭️)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
