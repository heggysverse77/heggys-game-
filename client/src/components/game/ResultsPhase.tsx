import { useState, useEffect } from 'react';
import { Check, X, Play, Trophy } from 'lucide-react';
import { Avatar } from '../ui';
import Button from '../Button/Button';
import Card from '../Card/Card';
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
    <div className="hv-container" dir="rtl" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, maxWidth: 720, paddingBlock: 8 }}>
      {step === 'answers' && (
        <>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: 0 }}>الإجابات الحقيقية</h1>
            <p style={{ fontSize: 16, fontWeight: 500, color: '#33A9AC', margin: '8px 0 0' }}>شوف كل واحد قال ايه!</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            {roundResults?.revealedAnswers && roundResults.revealedAnswers.length > 0 ? (
              roundResults.revealedAnswers.map((r: any, idx: number) => {
                const guessers: any[] = r.guessers || [];
                const right = guessers.filter((g: any) => g.isCorrect);
                const wrong = guessers.filter((g: any) => !g.isCorrect);
                return (
                  <Card key={r.answerId || idx} padding={16}>
                    {/* Author + answer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, minWidth: 0 }}>
                      <Avatar avatarId={r.avatarId || r.playerId} size="sm" ring="none" />
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.nickname}
                      </span>
                      <span style={{ color: '#9E9E9E', fontSize: 13 }}>قال:</span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#FFA646', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        “{r.text}”
                      </span>
                    </div>

                    {/* Who guessed RIGHT */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: wrong.length > 0 ? 12 : 0 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#81C784' }}>
                        <Check style={{ width: 15, height: 15 }} />
                        خمّن صح ({right.length})
                      </span>
                      {right.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {right.map((g: any, i: number) => (
                            <span
                              key={g.guesserPlayerId || i}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.4)', padding: '4px 10px 4px 4px', borderRadius: 9999, fontSize: 12, fontWeight: 700, color: '#fff' }}
                            >
                              <Avatar avatarId={g.avatarId} size="xs" ring="none" />
                              {g.nickname}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#9E9E9E' }}>محدش عرف صاحب الإجابة دي</span>
                      )}
                    </div>

                    {/* Who guessed WRONG */}
                    {wrong.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#EF9A9A' }}>
                          <X style={{ width: 15, height: 15 }} />
                          خمّن غلط ({wrong.length})
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {wrong.map((g: any, i: number) => (
                            <span
                              key={g.guesserPlayerId || i}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(244,67,54,0.10)', border: '1px solid rgba(244,67,54,0.35)', padding: '4px 10px 4px 4px', borderRadius: 9999, fontSize: 12, fontWeight: 700, color: '#E0E0E0' }}
                            >
                              <Avatar avatarId={g.avatarId} size="xs" ring="none" />
                              {g.nickname}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            ) : (
              <Card>
                <div style={{ padding: 16, textAlign: 'center', fontWeight: 700, color: '#9E9E9E' }}>
                  جاري تحميل نتائج الإجابات...
                </div>
              </Card>
            )}
          </div>

          <div style={{ width: '100%', maxWidth: 480 }}>
            {isHost ? (
              <Button variant="primary" fullWidth size="lg" onClick={handleShowScoreboard}>
                عرض الترتيب
              </Button>
            ) : (
              <Card>
                <p style={{ margin: 0, textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#9E9E9E' }}>
                  في انتظار المضيف للانتقال للترتيب...
                </p>
              </Card>
            )}
          </div>
        </>
      )}

      {step === 'scoreboard' && (
        <>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: 0 }}>الترتيب</h1>
            <p style={{ fontSize: 16, fontWeight: 500, color: '#33A9AC', margin: '8px 0 0' }}>بعد الجولة {currentRoundNumber}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            {leaderboard.map((entry, idx) => {
              const rankNum = idx + 1;
              const isFirst = rankNum === 1;
              return (
                <Card key={entry.playerId || idx} variant={isFirst ? 'winner' : undefined} padding={16}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                      {isFirst ? (
                        <Trophy style={{ width: 22, height: 22, color: '#C13A85', flexShrink: 0 }} />
                      ) : (
                        <span style={{ fontWeight: 800, fontSize: 18, width: 24, textAlign: 'center', color: '#9E9E9E', flexShrink: 0 }}>
                          {rankNum}
                        </span>
                      )}
                      <Avatar avatarId={entry.avatarId} size="sm" ring="none" />
                      <span style={{ fontWeight: 700, fontSize: 16, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.nickname}
                      </span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 13, padding: '6px 14px', borderRadius: 9999, background: isFirst ? '#982062' : '#121212', color: isFirst ? '#fff' : '#E0E0E0', border: `1px solid ${isFirst ? '#982062' : '#333'}`, flexShrink: 0 }}>
                      {entry.totalScore} نقاط
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>

          <div style={{ width: '100%', maxWidth: 480 }}>
            {isHost ? (
              <Button variant="secondary" fullWidth size="lg" icon={<Play style={{ width: 18, height: 18 }} />} onClick={handleNextRound}>
                {isLastRound ? 'التتويج النهائي' : 'الجولة التالية'}
              </Button>
            ) : (
              <Card>
                <p style={{ margin: 0, textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#9E9E9E' }}>
                  {isLastRound ? 'في انتظار المضيف لإعلان الفائز النهائي...' : 'في انتظار المضيف لبدء الجولة التالية...'}
                </p>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
