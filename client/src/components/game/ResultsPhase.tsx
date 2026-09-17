import { useState, useEffect } from 'react';
import { Play, Trophy, Sparkles, Eye } from 'lucide-react';
import { Avatar } from '../ui';
import Button from '../Button/Button';
import Card from '../Card/Card';
import { useGame } from '../../hooks/useGame';
import { useSound } from '../../hooks/useSound';
import { emitNextRound } from '../../socket/round.events';

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
      <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 440, background: '#FFF6E5', padding: 6, borderRadius: 16, border: '2.5px solid #1A1A1A', boxShadow: '3px 3px 0px #1A1A1A' }}>
        <button
          type="button"
          onClick={() => setStep('answers')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 12,
            border: step === 'answers' ? '2px solid #1A1A1A' : '2px solid transparent',
            background: step === 'answers' ? '#33A9AC' : 'transparent',
            color: step === 'answers' ? '#FFFFFF' : '#1A1A1A',
            fontWeight: 900,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: step === 'answers' ? '2px 2px 0px #1A1A1A' : 'none',
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
            border: step === 'scoreboard' ? '2px solid #1A1A1A' : '2px solid transparent',
            background: step === 'scoreboard' ? '#FFA646' : 'transparent',
            color: '#1A1A1A',
            fontWeight: 900,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: step === 'scoreboard' ? '2px 2px 0px #1A1A1A' : 'none',
          }}
        >
          🏅 جدول الترتيب والنقاط
        </button>
      </div>

      {step === 'answers' && (
        <>
          {/* Header Banner */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="hv-chip-white" style={{ marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Eye style={{ width: 16, height: 16, color: '#33A9AC' }} />
              كشف الإجابات • الجولة {currentRoundNumber}
            </span>
            <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 900, color: '#FFF6E5', margin: 0, textShadow: '2px 2px 0px #1A1A1A' }}>
              الإجابات الحقيقية 🎭
            </h1>
            <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', fontWeight: 700, color: '#FFA646', margin: '6px 0 0', textShadow: '1px 1px 0px #1A1A1A' }}>
              شوف كل واحد قال ايه وخمن مين عرف يصيده!
            </p>
          </div>

          {/* Answers List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
            {roundResults?.revealedAnswers && roundResults.revealedAnswers.length > 0 ? (
              roundResults.revealedAnswers.map((r: any, idx: number) => {
                const guessers: any[] = r.guessers || [];
                const right = guessers.filter((g: any) => g.isCorrect);
                const wrong = guessers.filter((g: any) => !g.isCorrect);
                const isMyAnswer = myPlayerId === r.playerId;

                return (
                  <div
                    key={r.answerId || idx}
                    style={{
                      background: '#FFF6E5',
                      borderRadius: 18,
                      border: '3px solid #1A1A1A',
                      boxShadow: '4px 4px 0px #1A1A1A',
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                    }}
                  >
                    {/* Top Row: Author Info & Tag */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ border: '2px solid #1A1A1A', borderRadius: 9999, overflow: 'hidden', boxShadow: '1.5px 1.5px 0px #1A1A1A' }}>
                          <Avatar avatarId={r.avatarId || r.playerId} size="sm" ring="none" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#666' }}>صاحب الإجابة</span>
                          <span style={{ fontWeight: 900, fontSize: 17, color: '#1A1A1A' }}>
                            {r.nickname}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {isMyAnswer && (
                          <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 9999, background: '#E0F7FA', color: '#23787B', border: '1.5px solid #1A1A1A', boxShadow: '1.5px 1.5px 0px #1A1A1A' }}>
                            ✍️ إجابتك أنت
                          </span>
                        )}
                        {wrong.length > 0 && (
                          <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 9999, background: '#FFF0D4', color: '#E65100', border: '1.5px solid #1A1A1A', boxShadow: '1.5px 1.5px 0px #1A1A1A' }}>
                            🎭 خدع {wrong.length} أصحاب
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Prominent Speech Bubble for the Answer */}
                    <div
                      style={{
                        background: '#FFFFFF',
                        borderRadius: 14,
                        border: '2.5px solid #1A1A1A',
                        boxShadow: '3px 3px 0px #1A1A1A',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <MessageSquareQuote style={{ width: 24, height: 24, color: '#F86041', flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 'clamp(16px, 4vw, 19px)', fontWeight: 900, color: '#1A1A1A', lineHeight: 1.5, wordBreak: 'break-word', flex: 1 }}>
                        “{r.text}”
                      </div>
                    </div>

                    {/* Guessers Breakdown: Right vs. Wrong */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                      {/* Who guessed RIGHT */}
                      <div
                        style={{
                          background: '#F1F8E9',
                          border: '2px solid #2E7D32',
                          borderRadius: 14,
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          boxShadow: '2px 2px 0px #2E7D32',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, color: '#1B5E20' }}>
                            <Check style={{ width: 16, height: 16, strokeWidth: 3 }} />
                            صادوه صح ({right.length})
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#2E7D32', background: '#DCEDC8', padding: '2px 8px', borderRadius: 9999 }}>
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
                                  border: '1.5px solid #1A1A1A',
                                  boxShadow: '1.5px 1.5px 0px #1A1A1A',
                                  padding: '4px 10px 4px 6px',
                                  borderRadius: 9999,
                                  fontSize: 13,
                                  fontWeight: 800,
                                  color: '#1A1A1A',
                                }}
                              >
                                <Avatar avatarId={g.avatarId} size="xs" ring="none" />
                                {g.nickname}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#558B2F', fontStyle: 'italic' }}>
                            محدش عرف صاحبها! خدع الكل 🥷
                          </span>
                        )}
                      </div>

                      {/* Who guessed WRONG */}
                      <div
                        style={{
                          background: '#FFEBEE',
                          border: '2px solid #C62828',
                          borderRadius: 14,
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          boxShadow: '2px 2px 0px #C62828',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, color: '#B71C1C' }}>
                            <X style={{ width: 16, height: 16, strokeWidth: 3 }} />
                            اتخدعوا فيها ({wrong.length})
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#C62828', background: '#FFCDD2', padding: '2px 8px', borderRadius: 9999 }}>
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
                                  border: '1.5px solid #1A1A1A',
                                  boxShadow: '1.5px 1.5px 0px #1A1A1A',
                                  padding: '4px 10px 4px 6px',
                                  borderRadius: 9999,
                                  fontSize: 13,
                                  fontWeight: 800,
                                  color: '#1A1A1A',
                                }}
                              >
                                <Avatar avatarId={g.avatarId} size="xs" ring="none" />
                                {g.nickname}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#C62828', fontStyle: 'italic' }}>
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
                <div style={{ padding: 24, textAlign: 'center', fontWeight: 800, color: '#1A1A1A', fontSize: 16 }}>
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

          {/* Leaderboard Entries */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            {leaderboard.map((entry, idx) => {
              const rankNum = idx + 1;
              const isFirst = rankNum === 1;

              return (
                <div
                  key={entry.playerId || idx}
                  style={{
                    background: isFirst ? 'linear-gradient(135deg, #FFF0D4, #FFE0B2)' : '#FFF6E5',
                    border: '3px solid #1A1A1A',
                    boxShadow: isFirst ? '5px 5px 0px #1A1A1A' : '3px 3px 0px #1A1A1A',
                    borderRadius: 16,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                    {isFirst ? (
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: '#982062', border: '2px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '2px 2px 0px #1A1A1A' }}>
                        <Trophy style={{ width: 20, height: 20, color: '#FFFFFF' }} />
                      </div>
                    ) : (
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          background: '#FFF0D4',
                          border: '2px solid #1A1A1A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: 16,
                          color: '#1A1A1A',
                          flexShrink: 0,
                          boxShadow: '1.5px 1.5px 0px #1A1A1A',
                        }}
                      >
                        {rankNum}
                      </span>
                    )}

                    <div style={{ border: '2px solid #1A1A1A', borderRadius: 9999, overflow: 'hidden', boxShadow: '1.5px 1.5px 0px #1A1A1A', flexShrink: 0 }}>
                      <Avatar avatarId={entry.avatarId} size="sm" ring="none" />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ fontWeight: 900, fontSize: 17, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.nickname}
                      </span>
                      {isFirst && (
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 9999, background: '#982062', color: '#FFFFFF', border: '1px solid #1A1A1A' }}>
                          المتصدر 👑
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    style={{
                      fontWeight: 900,
                      fontSize: 14,
                      padding: '6px 16px',
                      borderRadius: 9999,
                      background: isFirst ? '#982062' : '#FFA646',
                      color: isFirst ? '#FFFFFF' : '#1A1A1A',
                      border: '2px solid #1A1A1A',
                      boxShadow: '2px 2px 0px #1A1A1A',
                      flexShrink: 0,
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
