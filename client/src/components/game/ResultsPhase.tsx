import { useState, useEffect } from 'react';
import { Play, Trophy, Sparkles, Eye, MessageSquareQuote, Check, X } from 'lucide-react';
import { Avatar } from '../ui';
import Button from '../Button/Button';
import Card from '../Card/Card';
import { useGame } from '../../hooks/useGame';
import { useSound } from '../../hooks/useSound';
import { emitNextRound } from '../../socket/round.events';
import { getCardRank } from '../../utils/cardRank.utils';

interface ResultsPhaseProps {
  gameId: string;
}

export default function ResultsPhase({ gameId }: ResultsPhaseProps) {
  const { roundResults, leaderboard, isHost, game, currentRoundNumber, myPlayerId } = useGame();
  const { play } = useSound();
  const [step, setStep] = useState<'answers' | 'scoreboard'>('answers');

  useEffect(() => {
    play('round_start');
  }, [play]);

  const totalRounds = game?.total_rounds ?? 3;
  const isLastRound = currentRoundNumber >= totalRounds;

  const handleNextRound = () => {
    emitNextRound({ gameId });
  };

  return (
    <div className="hv-container" dir="rtl" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: 740, paddingBlock: 12 }}>
      {/* Top Tab Switcher: Available to ALL players equally */}
      <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 440, background: '#FFF8EB', padding: 6, borderRadius: 16, border: '2.5px solid #3D180A', boxShadow: '3px 3px 0px #3D180A' }}>
        <button
          type="button"
          onClick={() => setStep('answers')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 12,
            border: step === 'answers' ? '2px solid #3D180A' : '2px solid transparent',
            background: step === 'answers' ? '#D97706' : 'transparent',
            color: step === 'answers' ? '#FFFFFF' : '#3D180A',
            fontWeight: 900,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: step === 'answers' ? '2px 2px 0px #3D180A' : 'none',
          }}
        >
          🎭 كشف الإجابات
        </button>
        <button
          type="button"
          onClick={() => setStep('scoreboard')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 12,
            border: step === 'scoreboard' ? '2px solid #3D180A' : '2px solid transparent',
            background: step === 'scoreboard' ? '#F59E0B' : 'transparent',
            color: '#3D180A',
            fontWeight: 900,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: step === 'scoreboard' ? '2px 2px 0px #3D180A' : 'none',
          }}
        >
          🏅 جدول الترتيب والنقاط
        </button>
      </div>

      {step === 'answers' && (
        <>
          {/* Header Banner */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="hv-chip-white" style={{ marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFF8EB', color: '#3D180A', border: '2px solid #D4A373' }}>
              <Eye style={{ width: 16, height: 16, color: '#D97706' }} />
              كشف الإجابات • الجولة {currentRoundNumber}
            </span>
            <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 900, color: '#FFF8EB', margin: 0, textShadow: '2px 2px 0px #3D180A' }}>
              الإجابات الحقيقية 🎭
            </h1>
            <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', fontWeight: 700, color: '#FDE047', margin: '6px 0 0', textShadow: '1px 1px 0px #3D180A' }}>
              شوف كل واحد قال ايه وخمن مين عرف يصيده!
            </p>
          </div>

          {/* Answers List — Playing Card Style */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
            {roundResults?.revealedAnswers && roundResults.revealedAnswers.length > 0 ? (
              roundResults.revealedAnswers.map((r: any, idx: number) => {
                const guessers: any[] = r.guessers || [];
                const right = guessers.filter((g: any) => g.isCorrect);
                const wrong = guessers.filter((g: any) => !g.isCorrect);
                const isMyAnswer = myPlayerId === r.playerId;
                const cardInfo = getCardRank(idx + 1);

                return (
                  <div
                    key={r.answerId || idx}
                    className="relative overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
                    style={{
                      background: 'linear-gradient(145deg, #FFFDF8 0%, #FFF3DC 100%)',
                      borderRadius: 20,
                      border: '2.5px solid #D4A373',
                      boxShadow: '0 8px 24px -4px rgba(61, 24, 10, 0.35), 0 3px 0px #3D180A',
                      padding: '20px 22px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      position: 'relative',
                    }}
                  >
                    {/* Western Playing Card Inner Inset */}
                    <div className="pointer-events-none absolute inset-2.5 rounded-[15px] border border-[#D4A373]/40 border-dashed" />

                    {/* Corner Card Rank Watermarks */}
                    <div className="pointer-events-none absolute top-3 left-3.5 flex flex-col items-center leading-none select-none opacity-40">
                      <span className="font-mono text-xs font-black text-[#3D180A]">{cardInfo.rank}</span>
                      <span className="text-xs" style={{ color: cardInfo.suitColor }}>{cardInfo.suit}</span>
                    </div>
                    <div className="pointer-events-none absolute bottom-3 right-3.5 flex flex-col items-center leading-none select-none opacity-40 rotate-180">
                      <span className="font-mono text-xs font-black text-[#3D180A]">{cardInfo.rank}</span>
                      <span className="text-xs" style={{ color: cardInfo.suitColor }}>{cardInfo.suit}</span>
                    </div>

                    {/* Top Row: Author Info & Tag */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ border: '2px solid #3D180A', borderRadius: 9999, overflow: 'hidden', boxShadow: '1.5px 1.5px 0px #3D180A' }}>
                          <Avatar avatarId={r.avatarId || r.playerId} size="sm" ring="none" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#8C4300' }}>صاحب الإجابة</span>
                          <span style={{ fontWeight: 900, fontSize: 17, color: '#3D180A' }}>
                            {r.nickname}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {isMyAnswer && (
                          <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 9999, background: '#E0F2FE', color: '#0369A1', border: '1.5px solid #3D180A', boxShadow: '1.5px 1.5px 0px #3D180A' }}>
                            ✍️ إجابتك أنت
                          </span>
                        )}
                        {wrong.length > 0 && (
                          <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 9999, background: '#FEF3C7', color: '#B45309', border: '1.5px solid #3D180A', boxShadow: '1.5px 1.5px 0px #3D180A' }}>
                            🎭 خدع {wrong.length} أصحاب
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Central Vintage Answer Card Slot */}
                    <div
                      style={{
                        background: '#FFFDF9',
                        borderRadius: 14,
                        border: '2px solid #D4A373',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05), 0 2px 4px rgba(61,24,10,0.08)',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        zIndex: 1,
                      }}
                    >
                      <MessageSquareQuote style={{ width: 24, height: 24, color: '#D97706', flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 'clamp(16px, 4vw, 19px)', fontWeight: 900, color: '#3D180A', lineHeight: 1.5, wordBreak: 'break-word', flex: 1 }}>
                        “{r.text}”
                      </div>
                    </div>

                    {/* Guessers Breakdown: Right vs. Wrong */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, zIndex: 1 }}>
                      {/* Who guessed RIGHT */}
                      <div
                        style={{
                          background: '#F0FDF4',
                          border: '2px solid #16A34A',
                          borderRadius: 14,
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          boxShadow: '2px 2px 0px #16A34A',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 900, color: '#15803D' }}>
                            <Check style={{ width: 16, height: 16, strokeWidth: 3 }} />
                            صادوه صح ({right.length})
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#166534', background: '#DCFCE7', padding: '2px 8px', borderRadius: 9999 }}>
                            +100 نقطة لكل منهم
                          </span>
                        </div>

                        {right.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {right.map((g: any, i: number) => (
                              <span
                                key={g.guesserPlayerId || i}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  background: '#FFFFFF',
                                  border: '1.5px solid #3D180A',
                                  boxShadow: '1.5px 1.5px 0px #3D180A',
                                  padding: '4px 10px 4px 6px',
                                  borderRadius: 9999,
                                  fontSize: 13,
                                  fontWeight: 800,
                                  color: '#3D180A',
                                }}
                              >
                                <Avatar avatarId={g.avatarId} size="xs" ring="none" />
                                {g.nickname}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#15803D', fontStyle: 'italic' }}>
                            محدش عرف صاحبها! خدع الكل 🥷
                          </span>
                        )}
                      </div>

                      {/* Who guessed WRONG */}
                      <div
                        style={{
                          background: '#FEF2F2',
                          border: '2px solid #DC2626',
                          borderRadius: 14,
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          boxShadow: '2px 2px 0px #DC2626',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 900, color: '#B91C1C' }}>
                            <X style={{ width: 16, height: 16, strokeWidth: 3 }} />
                            اتخدعوا فيها ({wrong.length})
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#991B1B', background: '#FEE2E2', padding: '2px 8px', borderRadius: 9999 }}>
                            افتكروا حد تاني
                          </span>
                        </div>

                        {wrong.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {wrong.map((g: any, i: number) => (
                              <span
                                key={g.guesserPlayerId || i}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  background: '#FFFFFF',
                                  border: '1.5px solid #3D180A',
                                  boxShadow: '1.5px 1.5px 0px #3D180A',
                                  padding: '4px 10px 4px 6px',
                                  borderRadius: 9999,
                                  fontSize: 13,
                                  fontWeight: 800,
                                  color: '#3D180A',
                                }}
                              >
                                <Avatar avatarId={g.avatarId} size="xs" ring="none" />
                                {g.nickname}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', fontStyle: 'italic' }}>
                            محدش اتخدع فيها 🎉
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <Card>
                <div style={{ padding: 24, textAlign: 'center', fontWeight: 800, color: '#3D180A', fontSize: 16 }}>
                  جاري تحميل نتائج الإجابات...
                </div>
              </Card>
            )}
          </div>
        </>
      )}

      {step === 'scoreboard' && (
        <>
          {/* Scoreboard Header */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="hv-chip-white" style={{ marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Trophy style={{ width: 16, height: 16, color: '#FFA646' }} />
              ترتيب الجولة {currentRoundNumber} من {totalRounds}
            </span>
            <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 900, color: '#FFF6E5', margin: 0, textShadow: '2px 2px 0px #1A1A1A' }}>
              جدول النقاط والترتيب 🏅
            </h1>
          </div>

          {/* Leaderboard Entries — Western Ranked Playing Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            {leaderboard.map((entry, idx) => {
              const rankPosition = idx + 1; // 1 = Ace, 2 = King, 3 = Queen, 4 = Jack, 5 = 10...
              const isFirst = rankPosition === 1;
              const cardInfo = getCardRank(rankPosition);

              return (
                <div
                  key={entry.playerId || idx}
                  className="relative overflow-hidden"
                  style={{
                    background: cardInfo.bgGradient,
                    border: isFirst ? '3.5px solid #1A1A1A' : '2.5px solid #1A1A1A',
                    boxShadow: isFirst ? '5px 5px 0px #1A1A1A' : '3px 3px 0px #1A1A1A',
                    borderRadius: 16,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    position: 'relative',
                  }}
                >
                  {/* Western Playing Card Inner Inset */}
                  <div className="pointer-events-none absolute inset-2 rounded-xl border border-[#1A1A1A]/15 border-dashed" />

                  {/* Corner Suit watermark */}
                  <div className="pointer-events-none absolute top-2 right-2 flex flex-col items-center leading-none select-none text-[#1A1A1A] opacity-60">
                    <span className="font-mono text-xs font-black">{cardInfo.rank}</span>
                    <span className="text-xs" style={{ color: cardInfo.suitColor }}>{cardInfo.suit}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1, zIndex: 1 }}>
                    {/* Card Rank Badge (A, K, Q, J, 10...) */}
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: isFirst ? '#FEF3C7' : '#FFFFFF',
                        border: '2px solid #1A1A1A',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '2px 2px 0px #1A1A1A',
                        color: cardInfo.suitColor,
                      }}
                      title={cardInfo.title}
                    >
                      <span className="font-mono font-black text-xs leading-none">{cardInfo.rank}</span>
                      <span className="text-xs leading-none">{cardInfo.suit}</span>
                    </div>

                    <div style={{ border: '2px solid #1A1A1A', borderRadius: 9999, overflow: 'hidden', boxShadow: '1.5px 1.5px 0px #1A1A1A', flexShrink: 0 }}>
                      <Avatar avatarId={entry.avatarId} size="sm" ring={isFirst ? 'gold' : 'none'} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 900, fontSize: 17, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {entry.nickname}
                        </span>
                        {isFirst && (
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 9999, background: '#1C1917', color: '#FDE047', border: '1px solid #F59E0B' }}>
                            المتصدر 👑
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#78350F' }}>
                        {cardInfo.shortLabel}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontWeight: 900,
                      fontSize: 14,
                      padding: '6px 16px',
                      borderRadius: 9999,
                      background: isFirst ? '#0D9488' : '#FEF3C7',
                      color: isFirst ? '#FFFFFF' : '#1A1A1A',
                      border: '2px solid #1A1A1A',
                      boxShadow: '2px 2px 0px #1A1A1A',
                      flexShrink: 0,
                      zIndex: 1,
                    }}
                  >
                    {entry.totalScore} نقاط
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Next Round Action: accessible in both views */}
      <div style={{ width: '100%', maxWidth: 480, marginTop: 12 }}>
        {isHost ? (
          <Button
            variant={isLastRound ? 'primary' : 'secondary'}
            fullWidth
            size="lg"
            icon={isLastRound ? <Sparkles style={{ width: 20, height: 20 }} /> : <Play style={{ width: 18, height: 18 }} />}
            onClick={handleNextRound}
          >
            {isLastRound ? 'التتويج النهائي 🏆' : 'الجولة التالية ⚡'}
          </Button>
        ) : (
          <Card>
            <p style={{ margin: 0, textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>
              {isLastRound ? '⏳ في انتظار المضيف لإعلان الفائز النهائي وتوزيع الأحكام...' : '⏳ في انتظار المضيف لبدء الجولة التالية...'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
