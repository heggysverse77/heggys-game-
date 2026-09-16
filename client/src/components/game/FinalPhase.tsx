import { useEffect } from 'react';
import { Trophy, RefreshCw, Home, Flame } from 'lucide-react';
import { Avatar } from '../ui';
import Button from '../Button/Button';
import Card from '../Card/Card';
import { useGame } from '../../hooks/useGame';
import { useConfetti } from '../../hooks/useConfetti';
import { useSound } from '../../hooks/useSound';
import { emitRematch } from '../../socket/lobby.events';

interface FinalPhaseProps {
  _gameId?: string;
  gameId?: string;
}

export default function FinalPhase(props: FinalPhaseProps) {
  const { leaderboard, game, isHost, finalResults, dispatch } = useGame();
  const { celebrate } = useConfetti();
  const { play } = useSound();

  const activeGameId = props.gameId || props._gameId || game?.id || '';

  useEffect(() => {
    celebrate();
    play('win');
  }, [celebrate, play]);

  const handleRematch = () => {
    if (!activeGameId) return;
    emitRematch({ gameId: activeGameId });
  };

  const handleBackToLobby = () => {
    window.location.reload();
  };

  const isDareEnabled = Boolean(
    finalResults?.dareEnabled ??
      game?.dare_enabled ??
      (finalResults?.dareCards && finalResults.dareCards.length > 0)
  );

  const winner = leaderboard[0];
  const rest = leaderboard.slice(1);
  const lastPlace = leaderboard.length > 0 ? leaderboard[leaderboard.length - 1] : null;

  return (
    <div className="hv-container" dir="rtl" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, maxWidth: 880, paddingBlock: 8 }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: 0 }}>النتيجة النهائية</h1>
        <p style={{ fontSize: 16, fontWeight: 500, color: '#9E9E9E', margin: '8px 0 0' }}>
          بعد {game?.total_rounds ?? 3} جولات
        </p>
      </div>

      {/* Winner card — highlighted with magenta #982062 */}
      {winner && (
        <Card variant="winner" style={{ width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 72, height: 72, borderRadius: 9999, background: 'linear-gradient(135deg,#982062,#C13A85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 36px rgba(152,32,98,0.55)' }}>
              <Trophy style={{ width: 34, height: 34, color: '#fff' }} />
            </div>
            <p className="hv-helper" style={{ margin: 0 }}>الفائز بالمركز الأول</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar avatarId={winner.avatarId} size="md" ring="none" />
              <span style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{winner.nickname}</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, padding: '8px 22px', borderRadius: 9999, background: '#982062', color: '#fff' }}>
              {winner.totalScore} نقطة
            </span>
          </div>
        </Card>
      )}

      {/* Rest of leaderboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        {rest.map((entry, i) => {
          const rankNum = i + 2;
          const isLast = rankNum === leaderboard.length;
          return (
            <Card key={entry.playerId || i} padding={16} variant={isLast && isDareEnabled ? 'active' : undefined}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <span style={{ fontWeight: 800, fontSize: 17, width: 24, textAlign: 'center', color: isLast ? '#FFA646' : '#9E9E9E' }}>
                    {rankNum}
                  </span>
                  <Avatar avatarId={entry.avatarId} size="sm" ring="none" />
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.nickname}
                  </span>
                  {isLast && isDareEnabled && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 9999, background: 'rgba(255,166,70,0.12)', color: '#FFA646', border: '1px solid rgba(255,166,70,0.4)' }}>
                      عليه العقوبة
                    </span>
                  )}
                </div>
                <span style={{ fontWeight: 700, fontSize: 13, padding: '6px 14px', borderRadius: 9999, background: '#121212', color: '#E0E0E0', border: '1px solid #333' }}>
                  {entry.totalScore} نقاط
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Loser penalties — listed clearly */}
      {isDareEnabled && lastPlace && (
        <Card variant="glow-orange" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Flame style={{ width: 20, height: 20, color: '#FFA646' }} />
            <h3 className="hv-card-title">عقوبة المركز الأخير</h3>
          </div>
          <p className="hv-card-subtitle" style={{ margin: '0 0 12px' }}>
            {lastPlace.nickname} — نفّذ أحد الأحكام التالية:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {((finalResults?.dareCards && finalResults.dareCards.length > 0
              ? (finalResults.dareCards as unknown as any[])
              : ['غني مقطع من أغنية بصوت عالٍ', 'قلد أحد اللاعبين لمدة دقيقة', 'احكِ موقفاً محرجاً حصل لك']
            ) as any[]).map((dare: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: 12, borderRadius: 6, background: '#121212', border: '1px solid #2A2A2A', fontSize: 14, color: '#E0E0E0' }}>
                <span style={{ fontWeight: 800, color: '#FFA646' }}>{i + 1}.</span>
                <span>{typeof dare === 'string' ? dare : dare?.text ?? JSON.stringify(dare)}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <Button variant="primary" fullWidth icon={<Flame style={{ width: 17, height: 17 }} />} onClick={() => dispatch({ type: 'SET_PHASE', phase: 'DARE' })}>
              تنفيذ الأحكام الآن
            </Button>
          </div>
        </Card>
      )}

      {/* Bottom actions — 24px apart */}
      <div style={{ display: 'flex', gap: 24, width: '100%', maxWidth: 520, flexWrap: 'wrap' }}>
        {isHost && (
          <div style={{ flex: 1, minWidth: 200 }}>
            <Button variant="secondary" fullWidth size="lg" icon={<RefreshCw style={{ width: 18, height: 18 }} />} onClick={handleRematch}>
              العب من جديد
            </Button>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 200 }}>
          <Button variant="ghost" fullWidth size="lg" icon={<Home style={{ width: 18, height: 18 }} />} onClick={handleBackToLobby}>
            العودة للوبي
          </Button>
        </div>
      </div>
    </div>
  );
}
