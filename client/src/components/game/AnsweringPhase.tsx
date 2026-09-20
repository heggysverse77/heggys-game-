import { useState, useEffect } from 'react';
import { AlertCircle, Timer, Play, SkipForward } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../hooks/useAuth';
import { useTimer } from '../../hooks/useTimer';
import { useSound } from '../../hooks/useSound';
import { emitSubmitAnswer, emitForceMatching, emitSkipQuestion, onRoundError } from '../../socket/round.events';
import CircularGameTable, { type TablePlayer } from './CircularGameTable';

interface AnsweringPhaseProps {
  gameId: string;
}

export default function AnsweringPhase({ gameId }: AnsweringPhaseProps) {
  const {
    currentQuestion,
    currentRoundNumber,
    currentRoundId,
    timerSeconds,
    game,
    players,
    myPlayerId,
    hasSubmittedAnswer,
    answerStatuses,
    isHost,
    dispatch,
  } = useGame();
  const { user } = useAuth();
  const { play } = useSound();

  const totalDuration = timerSeconds || game?.answering_timer_sec || 30;
  const { remaining, isExpired } = useTimer(totalDuration, !hasSubmittedAnswer);
  const [answer, setAnswer] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const targetRoundId = currentRoundId || currentQuestion?.id;

  // Listen to round errors
  useEffect(() => {
    const unsub = onRoundError((err) => {
      setErrorMessage(err.message || 'حدث خطأ أثناء إرسال الإجابة');
      dispatch({ type: 'ANSWER_RESET' });
    });
    return unsub;
  }, [dispatch]);

  const submit = () => {
    if (!answer.trim() || hasSubmittedAnswer || !targetRoundId) return;
    setErrorMessage(null);
    emitSubmitAnswer({ gameId, roundId: targetRoundId, text: answer.trim() });
    dispatch({ type: 'ANSWER_SUBMITTED' });
    play('submit');
  };

  // Auto-submit when timer expires
  useEffect(() => {
    if (isExpired && !hasSubmittedAnswer && targetRoundId) {
      const finalAnswer = answer.trim() || 'لا توجد إجابة';
      emitSubmitAnswer({ gameId, roundId: targetRoundId, text: finalAnswer });
      dispatch({ type: 'ANSWER_SUBMITTED' });
      play('submit');
      setAnswer('');
    }
  }, [isExpired, hasSubmittedAnswer, targetRoundId, answer, gameId, dispatch, play]);

  // Map room players into table players with their answered status
  const tablePlayers: TablePlayer[] = (answerStatuses?.players || players || []).map((p: any) => {
    const pId = p.playerId || p.gamePlayerId || p.userId || p.id;
    const isMe = Boolean(
      (user && (p.userId === user.id || p.userId === (user as any).userId)) ||
      (myPlayerId && (p.gamePlayerId === myPlayerId || p.userId === myPlayerId || p.id === myPlayerId))
    );
    const answered =
      p.hasAnswered !== undefined
        ? p.hasAnswered
        : answerStatuses?.players?.find((ap: any) => ap.playerId === pId || ap.userId === p.userId || ap.gamePlayerId === pId)?.hasAnswered;

    return {
      id: pId,
      nickname: p.nickname || 'لاعب',
      avatarId: p.avatarId || p.avatar_id,
      isMe,
      hasActed: Boolean(answered),
      statusText: isMe ? 'تكتب...' : 'يكتب...',
    };
  });

  const totalRounds = game?.total_rounds ?? 3;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 sm:px-6 py-2 sm:py-4 gap-3 sm:gap-5 select-none" dir="rtl">
      
      {/* ── 1. ROUND PROGRESS (Identical to Screen 2) ── */}
      <div className="flex flex-col items-center gap-1.5 animate-[slideUp_0.2s_ease]">
        <h2 className="text-base sm:text-lg font-display font-black text-[#FFF6E5] drop-shadow-[2px_2px_0px_#1A1A1A]">
          الجولة {currentRoundNumber} من {totalRounds}
        </h2>
        
        {/* Connected Progress Dots */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-[#1A1A1A]/70 px-4 py-1.5 rounded-full border-1.5 border-[#FFA646]">
          {Array.from({ length: totalRounds }).map((_, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentRoundNumber;
            const isCurrent = stepNum === currentRoundNumber;

            return (
              <div key={idx} className="flex items-center">
                <div
                  className={[
                    'w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-[#1A1A1A] transition-all',
                    isCurrent
                      ? 'bg-[#FFA646] ring-3 ring-[#FFA646]/70 scale-125 shadow-[0_0_10px_#FFA646]'
                      : isCompleted
                      ? 'bg-[#33A9AC]'
                      : 'bg-white/30',
                  ].join(' ')}
                />
                {idx < totalRounds - 1 && (
                  <div
                    className={[
                      'w-5 sm:w-8 h-1 rounded-full mx-1 transition-all',
                      isCompleted ? 'bg-[#33A9AC]' : 'bg-white/20',
                    ].join(' ')}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. CIRCULAR GAME TABLE WITH CENTER QUESTION ── */}
      <CircularGameTable
        players={tablePlayers}
        footerBadge={
          /* Red/Coral timer pill from Screen 2 ("⏱️ 20s") */
          <div className="inline-flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#F86041] text-white border-2.5 border-[#1A1A1A] shadow-[0_0_16px_rgba(248,96,65,0.5)] font-display font-black text-sm sm:text-base animate-[pop_0.2s_ease] shrink-0 leading-none">
            <Timer className="w-4.5 h-4.5 stroke-[2.5]" />
            <span className="timer-number font-mono">{remaining}s</span>
          </div>
        }
      >
        {/* Center Western Question Playing Card (Compact & Proportioned) */}
        <div className="w-full h-full rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#FFFDF8] to-[#FFF8EB] border-2.5 sm:border-3 border-[#1C1917] shadow-[4px_4px_0px_#1C1917] flex flex-col items-center justify-center text-center animate-[pop_0.3s_ease] overflow-hidden p-2 sm:p-3.5 relative">
          {/* Playing Card Inner Inset Double Border */}
          <div className="pointer-events-none absolute inset-1.5 sm:inset-2 rounded-xl border border-[#1C1917]/20 border-dashed" />

          {/* Playing Card Corner Suits */}
          <div className="pointer-events-none absolute top-1.5 right-2 sm:top-2 sm:right-2.5 flex flex-col items-center leading-none select-none text-[#1C1917] opacity-60">
            <span className="font-mono text-[10px] sm:text-xs font-black">A</span>
            <span className="text-[10px] sm:text-xs">♠</span>
          </div>
          <div className="pointer-events-none absolute bottom-1.5 left-2 sm:bottom-2 sm:left-2.5 flex flex-col items-center leading-none select-none text-[#1C1917] opacity-60 rotate-180">
            <span className="font-mono text-[10px] sm:text-xs font-black">A</span>
            <span className="text-[10px] sm:text-xs">♠</span>
          </div>

          <span className="text-[10px] sm:text-xs font-body font-black text-[#78350F] mb-0.5 z-10">
            كارت السؤال {currentRoundNumber} من {totalRounds}
          </span>
          <div className="flex-1 flex items-center justify-center overflow-y-auto custom-scrollbar w-full z-10 px-1">
            <h1 className="text-xs sm:text-base md:text-lg font-display font-black text-[#1C1917] leading-snug break-words">
              {currentQuestion?.text_ar ?? 'جاري تحميل السؤال...'}
            </h1>
          </div>
        </div>
      </CircularGameTable>

      {/* ── 3. ANSWER INPUT FORM & HOST CTA ── */}
      <div className="w-full max-w-lg flex flex-col items-center gap-2.5 animate-[slideUp_0.35s_ease]">
        {errorMessage && (
          <div className="w-full flex items-center gap-2 p-3 rounded-xl bg-[#F86041] text-white border-2 border-[#1A1A1A] font-body font-bold text-xs sm:text-sm shadow-[2px_2px_0px_#1A1A1A] animate-[shake_0.3s_ease]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!hasSubmittedAnswer ? (
          <div className="w-full flex flex-col items-center gap-2.5">
            <div className="w-full flex flex-col sm:flex-row items-center gap-2.5">
              <input
                type="text"
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="اكتب إجابتك هنا..."
                maxLength={60}
                className="flex-1 w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-[#FFF6E5] border-2.5 border-[#1A1A1A] text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 font-body font-bold text-sm sm:text-base px-4 outline-none shadow-[2.5px_2.5px_0px_#1A1A1A] text-center sm:text-right focus:ring-3 focus:ring-[#FFA646]/50 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), submit())}
                autoFocus
              />

              <button
                type="button"
                onClick={submit}
                disabled={!answer.trim()}
                className={[
                  'w-full sm:w-auto px-5 sm:px-6 h-11 sm:h-12 rounded-xl sm:rounded-2xl font-display font-black text-sm sm:text-base border-2.5 border-[#1A1A1A] shadow-[2.5px_2.5px_0px_#1A1A1A] transition-all cursor-pointer flex items-center justify-center shrink-0 whitespace-nowrap',
                  answer.trim()
                    ? 'bg-[#F86041] text-white hover:bg-[#E85536] active:translate-y-0.5'
                    : 'bg-white/20 text-white/40 border-white/20 cursor-not-allowed shadow-none',
                ].join(' ')}
              >
                إرسال الإجابة
              </button>

              {isHost && targetRoundId && (
                <button
                  type="button"
                  onClick={() => emitSkipQuestion({ gameId, roundId: targetRoundId })}
                  className={[
                    'w-full sm:w-auto px-5 sm:px-6 h-11 sm:h-12 rounded-xl sm:rounded-2xl font-display font-black text-sm sm:text-base border-2.5 border-[#1A1A1A] shadow-[2.5px_2.5px_0px_#1A1A1A] transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap',
                    'bg-[#FFA646] text-[#1A1A1A] hover:bg-[#F59A33] active:translate-y-0.5',
                  ].join(' ')}
                  title="تخطي هذا السؤال واختيار سؤال جديد (للمضيف)"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>تخطي السؤال</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3 items-center">
            <div className="w-full p-4 sm:p-5 rounded-2xl bg-[#FFF6E5] border-3 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] text-center animate-[pop_0.25s_ease]">
              <span className="text-[#1A1A1A] text-xl sm:text-2xl font-display font-black block">
                ✅ تم استلام إجابتك بنجاح!
              </span>
              <span className="text-xs sm:text-sm text-[#1A1A1A]/75 font-body font-bold mt-1 block">
                {isHost
                  ? 'يمكنك الانتقال لمرحلة التوصيل الآن كمضيف أو انتظار باقي اللاعبين.'
                  : `في انتظار باقي أصحابك يخلصوا إجاباتهم... (${answerStatuses?.submittedCount ?? 1}/${answerStatuses?.totalPlayers ?? tablePlayers.length})`}
              </span>
            </div>

            {isHost && targetRoundId && (
              <button
                type="button"
                onClick={() => emitForceMatching({ gameId, roundId: targetRoundId })}
                className="w-full h-13 sm:h-14 rounded-2xl bg-[#33A9AC] text-white hover:bg-[#23787B] font-display font-black text-base sm:text-lg border-3 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                <span>الانتقال لمرحلة التوصيل والتخمين (المرحلة التالية ⏭️)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
