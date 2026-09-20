import { useState, useEffect } from 'react';
import { Trophy, RefreshCw, Home, Sparkles, Swords } from 'lucide-react';
import { Avatar } from '../ui';
import Button from '../Button/Button';
import WesternRankStealDuel from './WesternRankStealDuel';
import { useGame } from '../../hooks/useGame';
import { useConfetti } from '../../hooks/useConfetti';
import { useSound } from '../../hooks/useSound';
import { emitRematch, emitReturnToLobby } from '../../socket/lobby.events';

import { getCardRank } from '../../utils/cardRank.utils';

interface FinalPhaseProps {
  _gameId?: string;
  gameId?: string;
}

export default function FinalPhase(props: FinalPhaseProps) {
  const { leaderboard, previousLeaderboard, game, isHost } = useGame();
  const { celebrate } = useConfetti();
  const { play } = useSound();

  const winner = leaderboard[0];
  const rest = leaderboard.slice(1);
  const previousWinner = (previousLeaderboard && previousLeaderboard.length > 0) ? previousLeaderboard[0] : null;

  // Detect if 1st place was stolen in the final round
  const isRank1Stolen = Boolean(
    winner &&
    previousWinner &&
    previousWinner.playerId &&
    winner.playerId &&
    previousWinner.playerId !== winner.playerId
  );

  const [showDuel, setShowDuel] = useState<boolean>(() => isRank1Stolen);

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

  return (
    <>
      {/* ── Western Rank Steal Duel Showdown Overlay ── */}
      {showDuel && winner && (
        <WesternRankStealDuel
          newWinner={winner}
          previousWinner={previousWinner || rest[0]}
          onContinue={() => setShowDuel(false)}
        />
      )}

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

          {/* Quick Duel Preview Trigger Button */}
          {winner && (
            <button
              type="button"
              onClick={() => setShowDuel(true)}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#F59E0B] text-[#1C1917] font-display font-black text-xs sm:text-sm border-2.5 border-[#1C1917] shadow-[2.5px_2.5px_0px_#1C1917] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              <span>مشاهدة مواجهة ومبارزة الصدارة</span>
            </button>
          )}
        </div>

      {/* Winner card — Western Ace of Spades ♠ Champion Playing Card */}
      {winner && (() => {
        const aceRank = getCardRank(1);
        return (
          <div
            className="relative overflow-hidden"
            style={{
              width: '100%',
              background: aceRank.bgGradient,
              border: `3.5px solid ${aceRank.borderColor}`,
              borderRadius: 22,
              boxShadow: '6px 6px 0px #1C1917',
              padding: '28px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              position: 'relative',
            }}
          >
            {/* Western Playing Card Inner Inset Double Border */}
            <div className="pointer-events-none absolute inset-2.5 sm:inset-3 rounded-2xl border-1.5 border-[#1C1917]/25 border-dashed" />

            {/* Top-Right Playing Card Ace of Spades Index ♠ */}
            <div className="pointer-events-none absolute top-3 right-4 flex flex-col items-center leading-none select-none text-[#1C1917] opacity-85">
              <span className="font-mono text-base sm:text-lg font-black">{aceRank.rank}</span>
              <span className="text-base sm:text-lg" style={{ color: aceRank.suitColor }}>{aceRank.suit}</span>
            </div>

            {/* Bottom-Left Playing Card Ace of Spades Index ♠ (Rotated 180) */}
            <div className="pointer-events-none absolute bottom-3 left-4 flex flex-col items-center leading-none select-none text-[#1C1917] opacity-85 rotate-180">
              <span className="font-mono text-base sm:text-lg font-black">{aceRank.rank}</span>
              <span className="text-base sm:text-lg" style={{ color: aceRank.suitColor }}>{aceRank.suit}</span>
            </div>

            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: 'linear-gradient(135deg, #F59E0B, #EA580C)',
                border: '3px solid #1C1917',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '3px 3px 0px #1C1917',
              }}
            >
              <Trophy style={{ width: 38, height: 38, color: '#FFFFFF' }} />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1C1917', color: '#FDE047', padding: '6px 18px', borderRadius: 9999, fontSize: 13, fontWeight: 900, border: '2px solid #F59E0B', boxShadow: '2px 2px 0px #1C1917' }}>
              👑 {aceRank.title}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ border: '2.5px solid #1C1917', borderRadius: 9999, overflow: 'hidden', boxShadow: '2px 2px 0px #1C1917' }}>
                <Avatar avatarId={winner.avatarId} size="lg" ring="gold" />
              </div>
              <span style={{ fontSize: 'clamp(24px, 5.5vw, 32px)', fontWeight: 900, color: '#1C1917', textShadow: 'none' }}>
                {winner.nickname}
              </span>
            </div>

            <span
              style={{
                fontSize: 16,
                fontWeight: 900,
                padding: '8px 24px',
                borderRadius: 9999,
                background: '#0D9488',
                color: '#FFFFFF',
                border: '2px solid #1C1917',
                boxShadow: '3px 3px 0px #1C1917',
              }}
            >
              {winner.totalScore} نقطة 🎉
            </span>
          </div>
        );
      })()}

      {/* Rest of leaderboard (Ranked Playing Cards: King (K)=2nd, Queen (Q)=3rd, Jack (J)=4th, 10=5th, 9=6th...) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        {rest.map((entry, i) => {
          const rankPosition = i + 2; // 2 = King, 3 = Queen, 4 = Jack, 5 = 10, 6 = 9...
          const cardInfo = getCardRank(rankPosition);

          return (
            <div
              key={entry.playerId || i}
              className="relative overflow-hidden"
              style={{
                background: cardInfo.bgGradient,
                border: '2.5px solid #1C1917',
                borderRadius: 16,
                boxShadow: '3.5px 3.5px 0px #1C1917',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              {/* Playing Card Inner Inset Line */}
              <div className="pointer-events-none absolute inset-2 rounded-xl border border-[#1C1917]/15 border-dashed" />

              {/* Corner Suit watermark */}
              <div className="pointer-events-none absolute top-2 right-2 flex flex-col items-center leading-none select-none text-[#1C1917] opacity-60">
                <span className="font-mono text-xs font-black">{cardInfo.rank}</span>
                <span className="text-xs" style={{ color: cardInfo.suitColor }}>{cardInfo.suit}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1, zIndex: 1 }}>
                {/* Playing card suit rank badge */}
                <span
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: '#FEF3C7',
                    border: '2px solid #1C1917',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 13,
                    lineHeight: 1,
                    color: cardInfo.suitColor,
                    flexShrink: 0,
                    boxShadow: '1.5px 1.5px 0px #1C1917',
                  }}
                  title={cardInfo.title}
                >
                  <span className="font-mono font-black">{cardInfo.rank}</span>
                  <span style={{ fontSize: 13 }}>{cardInfo.suit}</span>
                </span>

                <div style={{ border: '2px solid #1C1917', borderRadius: 9999, overflow: 'hidden', boxShadow: '1.5px 1.5px 0px #1C1917', flexShrink: 0 }}>
                  <Avatar avatarId={entry.avatarId} size="sm" ring="none" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontWeight: 900, fontSize: 17, color: '#1C1917', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.nickname}
                  </span>
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
                  background: '#FEF3C7',
                  color: '#1C1917',
                  border: '2px solid #1C1917',
                  boxShadow: '2px 2px 0px #1C1917',
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

      {/* Bottom actions */}
      <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 520, flexWrap: 'wrap', marginTop: 8 }}>
        {isHost && (
          <div style={{ flex: 1, minWidth: 200 }}>
            <Button variant="secondary" fullWidth size="lg" icon={<RefreshCw style={{ width: 18, height: 18 }} />} onClick={handleRematch}>
              العب مجدداً 🔄
            </Button>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 200 }}>
          <Button variant="ghost" fullWidth size="lg" icon={<Home style={{ width: 18, height: 18 }} />} onClick={handleBackToLobby}>
            العودة للرئيسية 🏠
          </Button>
        </div>
      </div>
    </div>
  </>
);
}
