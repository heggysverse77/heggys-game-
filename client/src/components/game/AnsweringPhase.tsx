import { useState, useEffect } from 'react';
import { AlertCircle, Clock, Sparkles } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { useTimer } from '../../hooks/useTimer';
import { useSound } from '../../hooks/useSound';
import { emitSubmitAnswer, emitForceMatching, onRoundError } from '../../socket/round.events';
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
    hasSubmittedAnswer,
    answerStatuses,
    isHost,
    dispatch,
  } = useGame();
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
    const answered =
      p.hasAnswered !== undefined
        ? p.hasAnswered
        : answerStatuses?.players?.find((ap) => ap.playerId === pId)?.hasAnswered;

    return {
      id: pId,
      nickname: p.nickname || 'لاعب',
      avatarId: p.avatarId || p.avatar_id,
      hasActed: answered,
    };
  });

  const totalRounds = game?.total_rounds ?? 3;

  // Timer visual states
  const isCritical = remaining <= 5;
  const isWarning = remaining > 5 && remaining <= Math.round(totalDuration * 0.4);

  const timerBadgeColor = isCritical
    ? 'bg-[#F28482] text-white animate-pulse'
    : isWarning
    ? 'bg-[#F6BD60] text-[#1A1A1A]'
    : 'bg-[#38A3A5] text-white';

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 gap-5 sm:gap-6 select-none" dir="rtl">
      
      {/* ── 1. ROUND PROGRESS ── */}
      <div className="flex flex-col items-center gap-2 animate-[slideUp_0.2s_ease]">
        <span className="text-xs sm:text-sm font-body font-black text-[#FFF6E5] drop-shadow-sm">
          الجولة {currentRoundNumber} من {totalRounds}
        </span>
        
        {/* Connected Progress Dots */}
        <div className="flex items-center gap-2 sm:gap-3">
          {Array.from({ length: totalRounds }).map((_, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentRoundNumber;
            const isCurrent = stepNum === currentRoundNumber;

            return (
              <div key={idx} className="flex items-center">
                <div
                  className={[
                    'w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-[#1A1A1A] transition-all shadow-xs',
                    isCurrent
                      ? 'bg-[#F6BD60] ring-3 ring-[#F6BD60]/60 scale-125'
                      : isCompleted
                      ? 'bg-[#38A3A5]'
                      : 'bg-[#FFF6E5]/40',
                  ].join(' ')}
                />
                {idx < totalRounds - 1 && (
                  <div
                    className={[
                      'w-6 sm:w-10 h-1 rounded-full mx-1 transition-all',
                      isCompleted ? 'bg-[#38A3A5]' : 'bg-[#FFF6E5]/30',
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
          <div className={`inline-flex items-center gap-2 px-5 py-1.5 rounded-full border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] font-body font-black text-sm sm:text-base ${timerBadgeColor}`}>
            <Clock className="w-4 h-4 stroke-[2.5]" />
            <span className="timer-number">{remaining} ثانية</span>
          </div>
        }
      >
        {/* Center Circular Question Card */}
        <div className="w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] md:w-[360px] md:h-[360px] rounded-full bg-[#FFF6E5] border-3 sm:border-4 border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] flex flex-col items-center justify-center text-center p-4 sm:p-7 animate-[pop_0.3s_ease]">
          <span className="text-[11px] sm:text-xs font-body font-black text-[#1A1A1A]/70 mb-1 bg-[#F6BD60] px-3 py-0.5 rounded-full border-1.5 border-[#1A1A1A] shadow-xs">
            السؤال {currentRoundNumber} من {totalRounds}
          </span>
          <h2 className="text-base sm:text-xl md:text-2xl font-display font-black text-[#1A1A1A] leading-snug max-w-[95%] line-clamp-3 my-1">
            {currentQuestion?.text_ar ?? 'جاري تحميل السؤال...'}
          </h2>
          <div className="w-8 sm:w-12 h-1 bg-[#F28482] rounded-full my-1.5" />
          <p className="text-[11px] sm:text-xs text-[#1A1A1A]/70 font-body font-bold">
            جاوب بكلمة أو جملة سريعة
          </p>
        </div>
      </CircularGameTable>

      {/* ── 3. ANSWER INPUT FORM & HOST CTA ── */}
      <div className="w-full max-w-lg flex flex-col items-center gap-3 animate-[slideUp_0.35s_ease]">
        {errorMessage && (
          <div className="w-full flex items-center gap-2 p-3 rounded-xl bg-[#F28482] text-white border-2 border-[#1A1A1A] font-body font-bold text-xs sm:text-sm shadow-[2px_2px_0px_#1A1A1A] animate-[shake_0.3s_ease]">
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
                className="flex-1 w-full h-13 sm:h-14 rounded-xl sm:rounded-2xl bg-[#FFF6E5] border-2.5 border-[#1A1A1A] text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 font-body font-bold text-base sm:text-lg px-4 outline-none shadow-[3px_3px_0px_#1A1A1A] text-center sm:text-right focus:ring-3 focus:ring-[#F6BD60]/50 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), submit())}
                autoFocus
              />

              <button
                type="button"
                onClick={submit}
                disabled={!answer.trim()}
                className={[
                  'w-full sm:w-auto px-6 h-13 sm:h-14 rounded-xl sm:rounded-2xl font-body font-black text-base border-2.5 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] transition-all cursor-pointer flex items-center justify-center shrink-0',
                  answer.trim()
                    ? 'comic-btn-pink active:translate-y-0.5'
                    : 'bg-white/20 text-white/40 border-white/20 cursor-not-allowed shadow-none',
                ].join(' ')}
              >
                إرسال الإجابة
              </button>
            </div>

            {isHost && targetRoundId && (
              <button
                type="button"
                onClick={() => emitForceMatching({ gameId, roundId: targetRoundId })}
                className="text-xs sm:text-sm font-body font-bold text-[#FFF6E5] bg-[#1A1A1A]/85 hover:bg-[#1A1A1A] px-4 py-1.5 rounded-full border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] transition-all cursor-pointer inline-flex items-center gap-1.5 active:translate-y-0.5 mt-1"
              >
                <span>الانتقال لمرحلة التخمين فوراً (المضيف) ⏭️</span>
              </button>
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3 items-center">
            <div className="w-full p-5 rounded-2xl bg-[#FFF6E5] border-2.5 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] text-center animate-[pop_0.25s_ease]">
              <span className="text-[#1A1A1A] text-xl sm:text-2xl font-display font-black block">
                ✅ تم استلام إجابتك بنجاح!
              </span>
              <span className="text-xs sm:text-sm text-[#1A1A1A]/75 font-body font-bold mt-1.5 block">
                {isHost
                  ? 'يمكنك الانتقال لمرحلة التوصيل الآن كمضيف أو انتظار باقي اللاعبين.'
                  : `في انتظار باقي أصحابك يخلصوا إجاباتهم... (${answerStatuses?.submittedCount ?? 1}/${answerStatuses?.totalPlayers ?? tablePlayers.length})`}
              </span>
            </div>

            {isHost && targetRoundId && (
              <button
                type="button"
                onClick={() => emitForceMatching({ gameId, roundId: targetRoundId })}
                className="w-full h-13 sm:h-14 rounded-xl sm:rounded-2xl comic-btn-teal font-display font-black text-base sm:text-lg border-2.5 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>الانتقال لمرحلة التوصيل والتخمين (المرحلة التالية ⏭️)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
