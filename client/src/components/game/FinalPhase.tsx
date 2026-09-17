import { useEffect } from 'react';
import { Trophy, RefreshCw, Home, Flame, Sparkles } from 'lucide-react';
import { Avatar } from '../ui';
import Button from '../Button/Button';
import { useGame } from '../../hooks/useGame';
import { useConfetti } from '../../hooks/useConfetti';
import { useSound } from '../../hooks/useSound';
import { emitRematch, emitReturnToLobby } from '../../socket/lobby.events';

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
    if (activeGameId) {
      emitReturnToLobby({ gameId: activeGameId });
    } else {
      window.location.reload();
    }
  };

  const isDareEnabled = Boolean(
    finalResults?.dareEnabled ??
      game?.dare_enabled ??
      (finalResults?.dareCards && finalResults.dareCards.length > 0)
  );

  const winner = leaderboard[0];
  const rest = leaderboard.slice(1);
  const lastPlace = leaderboard.length > 0 ? leaderboard[leaderboard.length - 1] : null;

  // Robust dare text extractor to prevent raw JSON strings
  const getDareText = (d: any): string => {
    if (!d) return '';
    if (typeof d === 'string') {
      const trimmed = d.trim();
      if (trimmed.startsWith('{') && trimmed.includes('text_ar')) {
        try {
          const parsed = JSON.parse(trimmed);
          return parsed.text_ar || parsed.textAr || parsed.text || parsed.text_en || d;
        } catch {
          return d;
        }
      }
      return d;
    }
    return d.text_ar || d.textAr || d.text || d.text_en || 'نفذ حكماً يختاره باقي اللاعبين!';
  };

  return (
    <div className="hv-container" dir="rtl" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, maxWidth: 740, paddingBlock: 12 }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span className="hv-chip-white" style={{ marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Sparkles style={{ width: 16, height: 16, color: '#FFA646' }} />
          انتهاء اللعبة وتتويج الفائزين
        </span>
        <h1 style={{ fontSize: 'clamp(28px, 6vw, 40px)', fontWeight: 900, color: '#FFF6E5', margin: 0, textShadow: '2px 2px 0px #1A1A1A' }}>
          النتيجة النهائية 🏆
        </h1>
        <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', fontWeight: 700, color: '#FFA646', margin: '6px 0 0', textShadow: '1px 1px 0px #1A1A1A' }}>
          بعد منافسة استمرت {game?.total_rounds ?? 3} جولات حماسية!
        </p>
      </div>

      {/* Winner card — highlighted with comic gold styling */}
      {winner && (
        <div
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #FFE8C2 0%, #FFF6E5 100%)',
            border: '3.5px solid #1A1A1A',
            borderRadius: 20,
            boxShadow: '6px 6px 0px #1A1A1A',
            padding: '24px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #FFA646, #F86041)',
              border: '3px solid #1A1A1A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '3px 3px 0px #1A1A1A',
            }}
          >
            <Trophy style={{ width: 38, height: 38, color: '#FFFFFF' }} />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#982062', color: '#FFFFFF', padding: '4px 16px', borderRadius: 9999, fontSize: 13, fontWeight: 900, border: '1.5px solid #1A1A1A' }}>
            👑 الفائز بالمركز الأول
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ border: '2.5px solid #1A1A1A', borderRadius: 9999, overflow: 'hidden', boxShadow: '2px 2px 0px #1A1A1A' }}>
              <Avatar avatarId={winner.avatarId} size="md" ring="none" />
            </div>
            <span style={{ fontSize: 'clamp(24px, 5.5vw, 32px)', fontWeight: 900, color: '#1A1A1A', textShadow: 'none' }}>
              {winner.nickname}
            </span>
          </div>

          <span
            style={{
              fontSize: 16,
              fontWeight: 900,
              padding: '8px 24px',
              borderRadius: 9999,
              background: '#982062',
              color: '#FFFFFF',
              border: '2px solid #1A1A1A',
              boxShadow: '3px 3px 0px #1A1A1A',
            }}
          >
            {winner.totalScore} نقطة 🎉
          </span>
        </div>
      )}

      {/* Rest of leaderboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        {rest.map((entry, i) => {
          const rankNum = i + 2;
          const isLast = rankNum === leaderboard.length;

          return (
            <div
              key={entry.playerId || i}
              style={{
                background: '#FFF6E5',
                border: '3px solid #1A1A1A',
                borderRadius: 16,
                boxShadow: '3.5px 3.5px 0px #1A1A1A',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: isLast && isDareEnabled ? '#FFE5E5' : '#FFF0D4',
                    border: '2px solid #1A1A1A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 16,
                    color: isLast && isDareEnabled ? '#D32F2F' : '#1A1A1A',
                    flexShrink: 0,
                    boxShadow: '1.5px 1.5px 0px #1A1A1A',
                  }}
                >
                  {rankNum}
                </span>

                <div style={{ border: '2px solid #1A1A1A', borderRadius: 9999, overflow: 'hidden', boxShadow: '1.5px 1.5px 0px #1A1A1A', flexShrink: 0 }}>
                  <Avatar avatarId={entry.avatarId} size="sm" ring="none" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ fontWeight: 900, fontSize: 17, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.nickname}
                  </span>
                  {isLast && isDareEnabled && (
                    <span style={{ fontSize: 12, fontWeight: 900, padding: '3px 10px', borderRadius: 9999, background: '#F86041', color: '#FFFFFF', border: '1.5px solid #1A1A1A', boxShadow: '1.5px 1.5px 0px #1A1A1A' }}>
                      عليه العقوبة 🌶️
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
                  background: '#FFF0D4',
                  color: '#1A1A1A',
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

      {/* Loser penalties section */}
      {isDareEnabled && lastPlace && (
        <div
          style={{
            width: '100%',
            background: '#FFF0D4',
            border: '3px solid #1A1A1A',
            borderRadius: 18,
            boxShadow: '5px 5px 0px #1A1A1A',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F86041', border: '2px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 0px #1A1A1A' }}>
                <Flame style={{ width: 22, height: 22, color: '#FFFFFF' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 19, fontWeight: 900, color: '#1A1A1A', margin: 0 }}>
                  عقوبة المركز الأخير 🔥
                </h3>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#D32F2F', margin: '2px 0 0' }}>
                  الخسران: <span style={{ fontWeight: 900, textDecoration: 'underline' }}>{lastPlace.nickname}</span> — لازم ينفذ حكم من دول!
                </p>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 9999, background: '#FFE5E5', color: '#D32F2F', border: '1.5px solid #1A1A1A' }}>
              اختيار الفائز 🎯
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {((finalResults?.dareCards && finalResults.dareCards.length > 0
              ? (finalResults.dareCards as unknown as any[])
              : ['غني مقطع من أغنية بصوت عالٍ في المكالمة أو الروم', 'قلد طريقة كلام أحد اللاعبين لمدة دقيقة', 'احكِ أكثر موقف محرج حصل لك هذا العام']
            ) as any[]).map((dare: any, i: number) => {
              const text = getDareText(dare);
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: '#FFFFFF',
                    border: '2px solid #1A1A1A',
                    boxShadow: '2.5px 2.5px 0px #1A1A1A',
                    fontSize: 14,
                    color: '#1A1A1A',
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 9999,
                      background: '#F86041',
                      color: '#FFFFFF',
                      border: '1.5px solid #1A1A1A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ flex: 1, fontWeight: 800, lineHeight: 1.5 }}>
                    {text}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 6 }}>
            <Button
              variant="primary"
              fullWidth
              size="lg"
              icon={<Flame style={{ width: 18, height: 18 }} />}
              onClick={() => dispatch({ type: 'SET_PHASE', phase: 'DARE' })}
            >
              تنفيذ الأحكام الآن وتحديد العقوبة 🔥
            </Button>
          </div>
        </div>
      )}

      {/* Bottom actions */}
      <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 520, flexWrap: 'wrap', marginTop: 8 }}>
        {isHost && (
          <div style={{ flex: 1, minWidth: 200 }}>
            <Button variant="secondary" fullWidth size="lg" icon={<RefreshCw style={{ width: 18, height: 18 }} />} onClick={handleRematch}>
              العب من جديد 🔄
            </Button>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 200 }}>
          <Button variant="ghost" fullWidth size="lg" icon={<Home style={{ width: 18, height: 18 }} />} onClick={handleBackToLobby}>
            العودة للغرفة الرئيسية 🏠
          </Button>
        </div>
      </div>
    </div>
  );
}
