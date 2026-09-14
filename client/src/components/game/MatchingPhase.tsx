import { useState, useEffect } from 'react';
import { Sparkles, Clock, X, Check } from 'lucide-react';
import { Avatar } from '../ui';
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
    currentRoundId,
    timerSeconds,
    game,
    myPlayerId,
    hasSubmittedGuesses,
    myGuesses,
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

  const candidatePlayers = playersToMatch.filter((p: any) => {
    const isMe =
      (user && (p.userId === user.id || p.userId === (user as any).userId)) ||
      (myPlayerId && (p.gamePlayerId === myPlayerId || p.userId === myPlayerId || p.id === myPlayerId));
    return !isMe;
  });

  const answersToMatch = anonymousAnswers.filter((a: any) => {
    const isMine =
      (user && (a.authorUserId === user.id || a.authorUserId === (user as any).userId)) ||
      (myPlayerId && (a.authorPlayerId === myPlayerId || a.authorPlayerId === (user as any)?.id));
    return !isMine;
  });

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
    if (!selectedAnswerId || hasSubmittedGuesses) return;
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
    const assignedAnswerId = Object.keys(myGuesses).find((ansId) => myGuesses[ansId] === pId);

    return {
      id: pId,
      nickname: p.nickname || 'لاعب',
      avatarId: p.avatarId || p.avatar_id,
      hasActed: Boolean(assignedAnswerId),
      isDisabled: hasSubmittedGuesses,
    };
  });

  const isCritical = remaining <= 5;
  const isWarning = remaining > 5 && remaining <= Math.round(totalDuration * 0.4);

  const timerBadgeColor = isCritical
    ? 'bg-[#F28482] text-white animate-pulse'
    : isWarning
    ? 'bg-[#F6BD60] text-[#1A1A1A]'
    : 'bg-[#38A3A5] text-white';

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 gap-5 sm:gap-6 select-none" dir="rtl">
      
      {/* Header Banner */}
      <div className="text-center animate-[slideUp_0.2s_ease]">
        <h1 className="text-2xl sm:text-4xl font-display font-black text-[#FFF6E5] drop-shadow-sm">
          وصل الإجابات لأصحابها 🎭
        </h1>
        <p className="text-xs sm:text-sm font-body font-bold text-[#F6BD60] mt-1 drop-shadow-xs">
          {selectedAnswerId
            ? '👈 اضغط الآن على اللاعب صاحب هذه الإجابة'
            : 'اضغط على إحدى الإجابات ثم اختر اللاعب صاحبها'}
        </p>
      </div>

      {/* ── MOBILE VIEW (< sm): Stacked Cards & Player Selection ── */}
      <div className="flex sm:hidden flex-col w-full gap-4 animate-[slideUp_0.25s_ease]">
        {/* Mobile Timer Badge */}
        <div className="flex justify-center">
          <div className={`inline-flex items-center gap-2 px-4 py-1 rounded-full border-2 border-[#1A1A1A] shadow-xs font-body font-black text-xs ${timerBadgeColor}`}>
            <Clock className="w-3.5 h-3.5" />
            <span className="timer-number">{remaining}s</span>
          </div>
        </div>

        {/* Answers List on Mobile */}
        <div className="flex flex-col gap-2.5">
          {answersToMatch.map((a: any) => {
            const ansId = getAnswerId(a);
            const isSelected = selectedAnswerId === ansId;
            const assignedPlayerId = myGuesses[ansId];
            const assignedPlayer = candidatePlayers.find((p: any) => getPlayerId(p) === assignedPlayerId);

            return (
              <div
                key={ansId}
                onClick={() => handleSelectAnswer(ansId)}
                className={[
                  'p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-2',
                  isSelected
                    ? 'bg-[#F6BD60] border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] scale-[1.01]'
                    : assignedPlayer
                    ? 'bg-[#DCFCE7] border-[#166534] shadow-xs'
                    : 'bg-[#FFF6E5] border-[#1A1A1A] shadow-xs',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1A1A1A]/70">إجابة مجهولة:</span>
                  {assignedPlayer && (
                    <button
                      type="button"
                      onClick={(e) => handleUnlinkGuess(ansId, e)}
                      className="text-[11px] font-black text-red-600 bg-white/80 px-2 py-0.5 rounded-full border border-red-300 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      <span>إلغاء الربط</span>
                    </button>
                  )}
                </div>
                <p className="text-base font-display font-black text-[#1A1A1A] leading-snug">
                  "{a.text}"
                </p>
                {assignedPlayer && (
                  <div className="flex items-center gap-2 pt-1 border-t border-[#1A1A1A]/15 text-xs font-bold text-[#14532D]">
                    <Check className="w-3.5 h-3.5" />
                    <span>تم التوصيل بـ: {assignedPlayer.nickname}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Players List on Mobile */}
        {selectedAnswerId && (
          <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-[#1E2826] border-2 border-[#1A1A1A] animate-[pop_0.2s_ease]">
            <span className="text-xs font-black text-[#F6BD60] text-center">
              اختر اللاعب صاحب الإجابة المحددة أعلاه:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {tablePlayers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPlayer(p)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#FFF6E5] border-2 border-[#1A1A1A] shadow-xs active:scale-95"
                >
                  <Avatar avatarId={p.avatarId ? String(p.avatarId) : undefined} size="sm" ring="none" />
                  <span className="text-xs font-black text-[#1A1A1A] truncate">{p.nickname}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP & TABLET VIEW (>= sm): Circular Table ── */}
      <div className="hidden sm:flex flex-col items-center w-full">
        <CircularGameTable
          players={tablePlayers}
          activePlayerId={null}
          onPlayerClick={handleSelectPlayer}
          footerBadge={
            <div className={`inline-flex items-center gap-2 px-5 py-1.5 rounded-full border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] font-body font-black text-sm sm:text-base ${timerBadgeColor}`}>
              <Clock className="w-4 h-4 stroke-[2.5]" />
              <span className="timer-number">{remaining} ثانية</span>
            </div>
          }
        >
          {/* Inner Answer Cards Column */}
          <div className="flex flex-col gap-2 sm:gap-2.5 w-full max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
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
                    'p-2.5 sm:p-3 rounded-xl border-2 text-right transition-all cursor-pointer flex flex-col gap-1',
                    isSelected
                      ? 'bg-[#F6BD60] text-[#1A1A1A] border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] scale-102 font-black'
                      : assignedPlayer
                      ? 'bg-[#DCFCE7] text-[#14532D] border-[#166534] shadow-xs'
                      : 'bg-[#FFF6E5] text-[#1A1A1A] border-[#1A1A1A] hover:bg-white shadow-xs',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="text-[10px] font-bold text-[#1A1A1A]/60">إجابة:</span>
                    {assignedPlayer && (
                      <span
                        onClick={(e) => handleUnlinkGuess(ansId, e)}
                        className="text-[10px] font-bold text-red-600 hover:underline flex items-center gap-0.5"
                      >
                        <X className="w-3 h-3" />
                        <span>إلغاء</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-display font-black leading-snug line-clamp-2">
                    "{a.text}"
                  </span>
                  {assignedPlayer && (
                    <span className="text-[10px] font-bold text-[#166534] mt-0.5 truncate">
                      ✓ مربوطة بـ: {assignedPlayer.nickname}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CircularGameTable>
      </div>

      {/* ── BOTTOM ACTIONS: SUBMIT OR WAITING ── */}
      <div className="w-full max-w-md flex flex-col items-center gap-3 animate-[slideUp_0.3s_ease]">
        {!hasSubmittedGuesses ? (
          <div className="w-full flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allGuessed}
              className={[
                'w-full h-13 sm:h-14 rounded-xl sm:rounded-2xl font-body font-black text-base sm:text-lg border-2.5 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] transition-all cursor-pointer flex items-center justify-center gap-2 select-none',
                allGuessed
                  ? 'comic-btn-pink active:translate-y-0.5'
                  : 'bg-white/20 text-white/40 border-white/20 cursor-not-allowed shadow-none',
              ].join(' ')}
            >
              <Sparkles className="w-5 h-5" />
              <span>
                {allGuessed
                  ? 'تأكيد وإرسال التخمينات'
                  : `قم بتوصيل جميع الإجابات أولاً (${matchedCount}/${totalAnswers})`}
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
          <div className="w-full flex flex-col gap-3 items-center">
            <div className="w-full p-4 rounded-2xl bg-[#FFF6E5] border-2.5 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] text-center animate-[pop_0.25s_ease]">
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
                className="w-full h-13 sm:h-14 rounded-xl sm:rounded-2xl comic-btn-teal font-display font-black text-base sm:text-lg border-2.5 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>كشف نتائج الجولة (المرحلة التالية ⏭️)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
