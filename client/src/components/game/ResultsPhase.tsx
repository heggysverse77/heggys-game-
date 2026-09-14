import { useState, useEffect } from 'react';
import { Check, X, Sparkles, BarChart3, Flame } from 'lucide-react';
import { Avatar } from '../ui';
import { useGame } from '../../hooks/useGame';
import { useSound } from '../../hooks/useSound';
import { emitNextRound, emitShowScoreboard, onScoreboardDisplayed } from '../../socket/round.events';

interface ResultsPhaseProps {
  gameId: string;
}

export default function ResultsPhase({ gameId }: ResultsPhaseProps) {
  const { roundResults, leaderboard, isHost, game, currentRoundNumber } = useGame();
  const { play } = useSound();
  const [step, setStep] = useState<'answers' | 'scoreboard'>('answers');

  useEffect(() => {
    play('round_start');
  }, [play]);

  // Synchronize transition to scoreboard for all players
  useEffect(() => {
    const unsub = onScoreboardDisplayed(() => {
      setStep('scoreboard');
      play('submit');
    });
    return unsub;
  }, [play]);

  const totalRounds = game?.total_rounds ?? 3;
  const isLastRound = currentRoundNumber >= totalRounds;

  const handleShowScoreboard = () => {
    emitShowScoreboard({ gameId });
    setStep('scoreboard');
  };

  const handleNextRound = () => {
    emitNextRound({ gameId });
  };

  return (
    <div
      className="flex flex-col items-center w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 gap-6 sm:gap-8 select-none"
      dir="rtl"
    >
      {/* ══════════════════════════════════════════════════════════════════
          STEP 1: REVEALED ANSWERS & DETAILED USER GUESSES
          ══════════════════════════════════════════════════════════════════ */}
      {step === 'answers' && (
        <>
          {/* Header Banner */}
          <div className="flex flex-col items-center text-center gap-2 animate-[slideUp_0.2s_ease]">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#F6BD60] text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-xs font-body font-black text-xs sm:text-sm">
              <span>الجولة {currentRoundNumber} من {totalRounds}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-black text-[#FFF6E5] drop-shadow-sm">
              كشف الإجابات وتخمينات الأصدقاء 🎭
            </h1>
            <p className="text-xs sm:text-base font-body font-bold text-[#F6BD60] max-w-xl drop-shadow-xs">
              مين صاحب كل إجابة؟ ومين خمّن صح ومين اتخدع في إجابات أصحابه!
            </p>
          </div>

          {/* Cards List */}
          <div className="flex flex-col gap-5 sm:gap-6 w-full animate-[pop_0.25s_ease]">
            {roundResults?.revealedAnswers && roundResults.revealedAnswers.length > 0 ? (
              roundResults.revealedAnswers.map((r: any, idx: number) => {
                const guessers = r.guessers || [];
                const fooledGuessers = guessers.filter((g: any) => !g.isCorrect);

                return (
                  <div
                    key={r.answerId || idx}
                    className="flex flex-col gap-4 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#FFF6E5] border-3 border-[#1A1A1A] shadow-[5px_5px_0px_#1A1A1A] text-[#1A1A1A] w-full"
                  >
                    {/* Top Row: Author Info & Deception Reward */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full border-b-2 border-[#1A1A1A]/15 pb-4">
                      {/* Author Avatar + Badge */}
                      <div className="flex items-center gap-3">
                        <Avatar
                          avatarId={r.avatarId || r.playerId}
                          size="lg"
                          ring="none"
                          className="border-2.5 border-[#1A1A1A] shadow-xs shrink-0 w-14 h-14 sm:w-16 sm:h-16"
                        />
                        <div className="flex flex-col gap-0.5">
                          <span className="font-display font-black text-xl sm:text-2xl text-[#1A1A1A]">
                            {r.nickname}
                          </span>
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#1A1A1A] text-[#F6BD60] border border-[#1A1A1A] w-fit">
                            ✍️ صاحب الإجابة الأصلية
                          </span>
                        </div>
                      </div>

                      {/* Deception bonus pill */}
                      {fooledGuessers.length > 0 ? (
                        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F28482] text-white border-2 border-[#1A1A1A] text-xs sm:text-sm font-body font-black shadow-xs shrink-0">
                          <Flame className="w-4 h-4 text-[#F6BD60]" />
                          <span>خدع {fooledGuessers.length} من أصحابه! (+{fooledGuessers.length * 50} نقطة)</span>
                        </div>
                      ) : (
                        <div className="px-3 py-1 rounded-full bg-[#1A1A1A]/5 border border-[#1A1A1A]/20 text-[11px] font-bold text-[#1A1A1A]/60 shrink-0">
                          إجابة مكشوفة للجميع
                        </div>
                      )}
                    </div>

                    {/* Speech Bubble Answer */}
                    <div className="w-full bg-white border-2.5 border-[#1A1A1A] rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-1">
                      <span className="text-[11px] font-body font-bold text-[#1A1A1A]/60">
                        💬 الإجابة المكتوبة كانت:
                      </span>
                      <span className="font-display font-black text-xl sm:text-2xl text-[#1A1A1A] break-words leading-relaxed">
                        "{r.text}"
                      </span>
                    </div>

                    {/* Guesses Section */}
                    <div className="flex flex-col gap-2 pt-1">
                      <span className="font-display font-black text-xs sm:text-sm text-[#1A1A1A]/80">
                        👥 تخمينات الأصدقاء:
                      </span>

                      {guessers.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {guessers.map((g: any, gIdx: number) => (
                            <div
                              key={g.guesserPlayerId || gIdx}
                              className={[
                                'flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-xs sm:text-sm font-body font-black shadow-xs',
                                g.isCorrect
                                  ? 'bg-[#DCFCE7] text-[#14532D] border-[#166534]'
                                  : 'bg-[#FFE4E6] text-[#881337] border-[#9F1239]',
                              ].join(' ')}
                            >
                              <Avatar
                                avatarId={g.avatarId || g.guesserPlayerId}
                                size="sm"
                                ring="none"
                                className="w-6 h-6 border border-[#1A1A1A]"
                              />
                              <span>{g.guesserNickname || 'لاعب'}</span>
                              {g.isCorrect ? (
                                <span className="flex items-center gap-0.5 text-[#15803D]">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>(+100)</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-[#B91C1C]">
                                  <X className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>(0)</span>
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-[#1A1A1A]/50 font-bold">
                          لم يقم أحد باختيار هذه الإجابة
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 rounded-2xl bg-[#FFF6E5] text-[#1A1A1A] border-3 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] text-center">
                <span className="text-lg font-bold">جاري تجهيز نتائج الجولة...</span>
              </div>
            )}
          </div>

          {/* Bottom Action */}
          <div className="w-full max-w-md mt-2 animate-[slideUp_0.3s_ease]">
            {isHost ? (
              <button
                type="button"
                onClick={handleShowScoreboard}
                className="w-full h-14 rounded-xl sm:rounded-2xl comic-btn-teal font-display font-black text-lg border-2.5 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-5 h-5" />
                <span>عرض لوحة الصدارة وترتيب النقاط 📊</span>
              </button>
            ) : (
              <div className="w-full p-4 rounded-xl sm:rounded-2xl bg-[#FFF6E5] text-[#1A1A1A] border-2.5 border-[#1A1A1A] shadow-xs text-center font-body font-black text-sm sm:text-base">
                في انتظار المضيف لعرض لوحة الصدارة...
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP 2: DETAILED LEADERBOARD AFTER ROUND
          ══════════════════════════════════════════════════════════════════ */}
      {step === 'scoreboard' && (
        <div className="w-full flex flex-col items-center gap-6 animate-[slideUp_0.25s_ease]">
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-display font-black text-[#FFF6E5] drop-shadow-sm">
              ترتيب النقاط بعد الجولة {currentRoundNumber} 🏆
            </h1>
            <p className="text-xs sm:text-sm font-body font-bold text-[#F6BD60] mt-1">
              النقاط الإجمالية ومكافآت التخمين والذكاء
            </p>
          </div>

          {/* Leaderboard Table Card */}
          <div className="w-full p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#FFF6E5] border-3 border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] flex flex-col gap-3">
            {leaderboard.map((entry, idx) => {
              const rankNum = idx + 1;
              const isFirst = rankNum === 1;

              return (
                <div
                  key={entry.playerId || idx}
                  className={[
                    'flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all shadow-xs gap-3',
                    isFirst ? 'bg-[#F6BD60] text-[#1A1A1A] border-[#1A1A1A]' : 'bg-white text-[#1A1A1A] border-[#1A1A1A]',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-display font-black text-lg sm:text-xl w-7 text-center shrink-0">
                      {isFirst ? '🥇' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : `#${rankNum}`}
                    </span>
                    <Avatar avatarId={entry.avatarId} size="md" ring="none" className="border-2 border-[#1A1A1A] shrink-0 w-11 h-11 sm:w-13 sm:h-13" />
                    <span className="font-display font-black text-base sm:text-lg truncate min-w-0 flex-1">
                      {entry.nickname}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {entry.roundScore !== undefined && entry.roundScore > 0 && (
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#166534]">
                        +{entry.roundScore}
                      </span>
                    )}
                    <span className="font-display font-black text-base sm:text-xl">
                      {entry.totalScore} <span className="text-xs font-bold text-[#1A1A1A]/70">نقطة</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Next Round / Final Action */}
          <div className="w-full max-w-md mt-2">
            {isHost ? (
              <button
                type="button"
                onClick={handleNextRound}
                className="w-full h-14 rounded-xl sm:rounded-2xl comic-btn-pink font-display font-black text-lg border-2.5 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>{isLastRound ? 'الانتقال للنتيجة النهائية والتتويج 🏆' : 'بدء الجولة التالية ⏭️'}</span>
              </button>
            ) : (
              <div className="w-full p-4 rounded-xl sm:rounded-2xl bg-[#FFF6E5] text-[#1A1A1A] border-2.5 border-[#1A1A1A] shadow-xs text-center font-body font-black text-sm sm:text-base">
                {isLastRound ? 'في انتظار المضيف لإعلان الفائز النهائي...' : 'في انتظار المضيف لبدء الجولة التالية...'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
