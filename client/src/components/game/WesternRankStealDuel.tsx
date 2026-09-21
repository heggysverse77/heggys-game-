import { useState, useEffect } from 'react';
import { Trophy, Skull } from 'lucide-react';
import { Avatar } from '../ui';
import Button from '../Button/Button';
import type { LeaderboardEntry } from '../../socket/socket.types';

interface WesternRankStealDuelProps {
  newWinner?: LeaderboardEntry;
  previousWinner?: LeaderboardEntry;
  onContinue?: () => void;
}

const fallbackWinner: LeaderboardEntry = {
  playerId: 'w1',
  nickname: 'heggyyye',
  avatarId: 'avatar_4',
  totalScore: 600,
  pointsGained: 150,
  correctGuesses: 3,
  fooledFriends: 2,
  rank: 1,
};

const fallbackPrevious: LeaderboardEntry = {
  playerId: 'p2',
  nickname: 'كريم',
  avatarId: 'avatar_2',
  totalScore: 500,
  pointsGained: 100,
  correctGuesses: 2,
  fooledFriends: 1,
  rank: 2,
};

// Helper to remove any emojis from player names and titles
const cleanText = (text?: string): string => {
  if (!text) return '';
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}\u{FE00}-\u{FE0F}]/gu, '')
    .trim();
};

// Western Playing Card Rank Badge (Ace ♠ vs King ♦) attached to Avatar with Western Theme colors
function AvatarCardRankBadge({
  rank,
  suit,
  suitColor,
  isAce = false,
}: {
  rank: string;
  suit: string;
  suitColor: string;
  isAce?: boolean;
}) {
  return (
    <div
      key={`${rank}-${suit}`}
      className={`absolute -top-3 -right-3 z-40 flex flex-col items-center justify-center w-8 h-10 sm:w-10 sm:h-12 rounded-xl border-2.5 border-[#3D180A] shadow-[2.5px_2.5px_0px_#3D180A] select-none transition-all duration-500 animate-[pop_0.4s_cubic-bezier(0.34,1.56,0.64,1)] ${
        isAce
          ? 'bg-gradient-to-b from-[#FFFDF8] via-[#FEF3C7] to-[#FDE047] scale-105 sm:scale-110 shadow-[3px_3px_0px_#3D180A]'
          : 'bg-gradient-to-b from-[#FFFDF8] to-[#FFF8EB] scale-95 sm:scale-100'
      }`}
    >
      {/* Dashed inner frame */}
      <div className="absolute inset-1 rounded-lg border border-[#3D180A]/20 border-dashed pointer-events-none" />
      <span className="font-mono font-black text-xs sm:text-sm leading-none" style={{ color: suitColor }}>
        {rank}
      </span>
      <span className="text-xs sm:text-sm leading-none" style={{ color: suitColor }}>
        {suit}
      </span>
    </div>
  );
}

export default function WesternRankStealDuel({
  newWinner,
  previousWinner,
  onContinue = () => {},
}: WesternRankStealDuelProps) {
  const winner = newWinner || fallbackWinner;
  const opponent = previousWinner || fallbackPrevious;

  // Guard against self-duel (e.g. Heggy shooting Heggy)
  const isSelfDuel = Boolean(
    !winner ||
    !opponent ||
    winner.nickname === opponent.nickname ||
    winner.playerId === opponent.playerId ||
    ((winner as any).userId && (opponent as any).userId && (winner as any).userId === (opponent as any).userId)
  );

  useEffect(() => {
    if (isSelfDuel) {
      onContinue();
    }
  }, [isSelfDuel, onContinue]);

  if (isSelfDuel) {
    return null;
  }

  const cleanWinnerName = cleanText(winner.nickname);
  const cleanOpponentName = cleanText(opponent.nickname);

  // Duel animation timeline phases:
  // 0: Standoff / Dramatic tension & Tumbleweed rolling (Opponent has Ace ♠, Winner has King ♦)
  // 1: Quick Draw & Aiming towards opponent
  // 2: Gunshot Fired! (Thunderous blast, muzzle flare, fast bullet flies)
  // 3: Impact & Knockback! (Opponent hit, Ace ♠ badge launches in flight across to the Winner)
  // 4: Champion Crowned! (Ace ♠ lands on winner with gold celebration, Opponent settles with King ♦)
  const [duelPhase, setDuelPhase] = useState<number>(0);
  const [replayKey, setReplayKey] = useState<number>(0);

  // Cinematic Western Colt .45 Gunshot Sound Synthesizer (Web Audio API)
  const playThunderousGunshot = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // ── 1. Explosive Gunpowder Blast ──
      const blastLen = ctx.sampleRate * 0.5;
      const blastBuf = ctx.createBuffer(1, blastLen, ctx.sampleRate);
      const blastData = blastBuf.getChannelData(0);
      let lastVal = 0;
      for (let i = 0; i < blastLen; i++) {
        const white = Math.random() * 2 - 1;
        lastVal = (lastVal + (0.02 * white)) / 1.02;
        const decay = Math.exp(-i / (ctx.sampleRate * 0.08));
        blastData[i] = (lastVal * 3.5 + white * 0.35) * decay;
      }
      const blastSrc = ctx.createBufferSource();
      blastSrc.buffer = blastBuf;

      const blastFilter = ctx.createBiquadFilter();
      blastFilter.type = 'lowpass';
      blastFilter.frequency.setValueAtTime(2600, now);
      blastFilter.frequency.exponentialRampToValueAtTime(120, now + 0.35);

      const blastGain = ctx.createGain();
      blastGain.gain.setValueAtTime(1.8, now);
      blastGain.gain.exponentialRampToValueAtTime(0.005, now + 0.45);

      blastSrc.connect(blastFilter);
      blastFilter.connect(blastGain);
      blastGain.connect(ctx.destination);
      blastSrc.start(now);

      // ── 2. Deep Sub-Bass Chest Thump (130Hz -> 28Hz) ──
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(130, now);
      subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.3);

      subGain.gain.setValueAtTime(1.4, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.38);

      // ── 3. Sharp Metallic Hammer Snap ──
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(3200, now);
      snapOsc.frequency.exponentialRampToValueAtTime(500, now + 0.06);

      snapGain.gain.setValueAtTime(0.7, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapOsc.start(now);
      snapOsc.stop(now + 0.07);

      // ── 4. Canyon Echo Reverb Reflections ──
      const echoDelays = [0.07, 0.16, 0.28, 0.42];
      const echoGains = [0.3, 0.18, 0.09, 0.04];

      echoDelays.forEach((delayTime, idx) => {
        const echoOsc = ctx.createOscillator();
        const echoGain = ctx.createGain();
        echoOsc.type = 'sine';
        echoOsc.frequency.setValueAtTime(200 / (idx + 1), now + delayTime);
        echoOsc.frequency.exponentialRampToValueAtTime(45, now + delayTime + 0.22);

        echoGain.gain.setValueAtTime(echoGains[idx], now + delayTime);
        echoGain.gain.exponentialRampToValueAtTime(0.001, now + delayTime + 0.22);

        echoOsc.connect(echoGain);
        echoGain.connect(ctx.destination);
        echoOsc.start(now + delayTime);
        echoOsc.stop(now + delayTime + 0.22);
      });
    } catch {
      // Audio fallback
    }
  };

  const startDuelSequence = () => {
    setDuelPhase(0);
    setReplayKey((k) => k + 1);

    // Timeline:
    const t1 = setTimeout(() => setDuelPhase(1), 800);   // Draw & Aim
    const t2 = setTimeout(() => {
      setDuelPhase(2);   // Fire gunshot!
      playThunderousGunshot();
    }, 1600);
    const t3 = setTimeout(() => setDuelPhase(3), 2000);  // Opponent hit & Ace badge launches in flight
    const t4 = setTimeout(() => setDuelPhase(4), 3100);  // Ace lands on Winner victoriously

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  };

  useEffect(() => {
    const cleanup = startDuelSequence();
    return cleanup;
  }, []);

  // Card Rank States:
  // Before hit (< 3): Opponent has Ace (A♠), Challenger has King (K♦)
  // During hit (=== 3): Ace is flying in the air, Opponent drops to King (K♦)
  // After landing (>= 4): Winner has Ace (A♠), Opponent has King (K♦)
  const showOpponentAce = duelPhase < 3;
  const showOpponentKing = duelPhase >= 3;
  const showWinnerKing = duelPhase < 4;
  const showWinnerAce = duelPhase >= 4;

  return (
    <div 
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-between text-center select-none overflow-hidden p-3 sm:p-6"
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, #E07A10 0%, #A64E04 35%, #6B2906 70%, #3D180A 100%)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* ── Desert Horizon Dust & Ambient Sunlight Background ── */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: "url('/images/western_sunset_hd.svg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 75%',
          mixBlendMode: 'luminosity',
        }}
      />

      {/* ── Warm Desert Color Graded Tumbleweed Rolling Across Horizon ── */}
      <div 
        key={`tumble-${replayKey}`}
        className="absolute bottom-4 sm:bottom-10 pointer-events-none z-10"
        style={{
          right: '-160px',
          animation: 'tumbleweedRoll 6.5s cubic-bezier(0.25, 1, 0.5, 1) infinite',
        }}
      >
        <img
          src="/images/tumbleweed.png"
          alt="Tumbleweed"
          className="w-24 h-24 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain"
          style={{
            filter: 'sepia(0.85) saturate(2.4) hue-rotate(-20deg) brightness(0.88) contrast(1.15) drop-shadow(0 14px 22px rgba(45, 15, 4, 0.8))',
            animation: 'tumbleweedSpin 1.6s linear infinite',
          }}
        />
      </div>

      {/* ── Top Header Banner (Warm Western Theme Colors) ── */}
      <div className="relative z-20 mt-2 sm:mt-5 flex flex-col items-center gap-1.5 sm:gap-2 max-w-xl animate-[pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)]" dir="rtl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#4A1D0D] border-2 border-[#F59E0B] text-[#FDE047] text-xs sm:text-sm font-black shadow-[2.5px_2.5px_0px_#2D1006]">
          <Skull className="w-4 h-4 text-[#EF4444]" />
          <span>مواجهة الحسم في الجولة الأخيرة</span>
        </div>

        <h1 className="text-xl sm:text-3xl md:text-5xl font-display font-black text-[#FDE047] drop-shadow-[3px_3px_0px_#3D180A] tracking-wide">
          سرقة الصدارة في اللحظة الأخيرة
        </h1>

        <p className="text-[11px] sm:text-sm md:text-base font-body font-bold text-[#FED7AA] drop-shadow-[1.5px_1.5px_0px_#3D180A]">
          {duelPhase < 3 ? (
            <span>ترقبوا المواجهة بين بطل الجولة وبطل الترتيب السابق</span>
          ) : (
            <span className="text-[#FDE047] text-xs sm:text-lg animate-pulse">
              <strong className="text-white">{cleanWinnerName}</strong> أطاح بـ <strong className="text-red-300">{cleanOpponentName}</strong> وانتزع المركز الأول
            </span>
          )}
        </p>
      </div>

      {/* ── Main Western Duel Arena ── */}
      <div className="relative z-20 w-full max-w-4xl flex-1 flex items-center justify-center my-1 sm:my-2 px-1 sm:px-4">
        
        {/* Arena Ground Shadow Line */}
        <div className="absolute bottom-4 sm:bottom-10 left-4 right-4 sm:left-8 sm:right-8 h-3 sm:h-4 rounded-full bg-[#3D180A]/60 blur-md pointer-events-none" />

        <div className="w-full flex items-center justify-between px-2 sm:px-10 md:px-16 relative" dir="ltr">

          {/* ────────────────────────────────────────────────────────── */}
          {/* LEFT: Opponent (Starts with Ace ♠ -> Drops to King ♦)     */}
          {/* ────────────────────────────────────────────────────────── */}
          <div 
            className="flex flex-col items-center gap-1.5 sm:gap-3 transition-all duration-300 relative shrink-0"
            style={{
              transform: duelPhase >= 3 
                ? 'translateX(-18px) sm:translateX(-30px) rotate(-16deg) scale(0.92)' 
                : 'translateX(0) rotate(0deg) scale(1)',
            }}
          >
            {/* Dizzy Cartoon Stars 💫 when hit */}
            {duelPhase >= 3 && (
              <div className="absolute -top-6 sm:-top-8 z-30 flex items-center gap-1 animate-spin">
                <span className="text-xl sm:text-2xl">💫</span>
                <span className="text-sm sm:text-lg">⭐</span>
                <span className="text-base sm:text-xl">💥</span>
              </div>
            )}

            {/* Bullet Impact Shockwave & Smoke */}
            {duelPhase === 2 || duelPhase === 3 ? (
              <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-red-500/50 blur-xl animate-ping" />
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 blur-md animate-pulse" />
                <div className="text-2xl sm:text-3xl animate-bounce">💥</div>
              </div>
            ) : null}

            {/* Player Avatar */}
            <div className={`relative ${duelPhase >= 3 ? 'animate-bounce' : ''}`}>
              <div className="p-0.5 sm:p-1 rounded-full bg-[#8A2514] border-2.5 sm:border-4 border-[#3D180A] shadow-[3px_3px_0px_#3D180A]">
                <Avatar avatarId={opponent.avatarId} size="xl" ring="purple" />
              </div>

              {/* Card Rank Badge on Opponent */}
              {showOpponentAce && (
                <AvatarCardRankBadge rank="A" suit="♠" suitColor="#3D180A" isAce={true} />
              )}
              {showOpponentKing && (
                <AvatarCardRankBadge rank="K" suit="♦" suitColor="#DC2626" isAce={false} />
              )}

              {/* Status Badge (Warm Western theme colors) */}
              <div className="absolute -bottom-2.5 sm:-bottom-3 left-1/2 -translate-x-1/2 px-2 sm:px-3 py-0.5 rounded-full bg-[#4A1D0D] text-[#FED7AA] border border-[#F59E0B] text-[9px] sm:text-xs font-black whitespace-nowrap shadow-[2px_2px_0px_#2D1006]" dir="rtl">
                {duelPhase >= 3 ? 'تراجع للمركز الثاني (الملك)' : 'المركز الأول سابقاً (الآس)'}
              </div>
            </div>

            {/* Nickname & Points */}
            <div className="mt-1.5 sm:mt-2 text-center" dir="rtl">
              <div className="text-sm sm:text-xl font-display font-black text-[#FFF8EB] drop-shadow-[2px_2px_0px_#3D180A]">
                {cleanOpponentName}
              </div>
              <div className="text-[11px] sm:text-sm font-mono font-bold text-red-300">
                {opponent.totalScore} نقطة
              </div>
            </div>
          </div>


          {/* ────────────────────────────────────────────────────────── */}
          {/* CENTER: Flying Ace Card Badge & Bullet Flight              */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="flex-1 flex items-center justify-center relative px-1 sm:px-6 h-12 sm:h-16">
            
            {/* VS Badge in Standoff */}
            {duelPhase < 2 && (
              <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#4A1D0D] border-2 sm:border-3 border-[#F59E0B] flex items-center justify-center font-display font-black text-sm sm:text-2xl text-[#FDE047] shadow-[2.5px_2.5px_0px_#2D1006] animate-pulse">
                VS
              </div>
            )}

            {/* Small crisp bullet flying rapidly from Right -> Left — ONLY during Phase 2 */}
            {duelPhase === 2 && (
              <div className="absolute inset-0 flex items-center pointer-events-none">
                <div 
                  className="absolute z-30"
                  style={{
                    animation: 'bulletFlyAcross 0.38s cubic-bezier(0.2, 0.8, 0.4, 1) forwards',
                  }}
                >
                  <div className="w-3.5 h-1.5 sm:w-5 sm:h-2.5 bg-gradient-to-l from-yellow-200 via-amber-400 to-amber-600 rounded-l-full shadow-[0_0_12px_#FDE047]" />
                </div>
              </div>
            )}

            {/* The Ace ♠ Card Badge Flying from Opponent -> Winner during Phase 3 */}
            {duelPhase === 3 && (
              <div 
                className="absolute z-50 pointer-events-none"
                style={{
                  animation: 'aceCardFlyAcross 1.1s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                }}
              >
                <div className="w-9 h-11 sm:w-11 sm:h-13 rounded-xl bg-gradient-to-b from-[#FFFDF8] via-[#FEF3C7] to-[#FDE047] border-2.5 border-[#3D180A] shadow-[4px_4px_0px_#3D180A] flex flex-col items-center justify-center scale-110">
                  <div className="absolute inset-1 rounded-lg border border-[#3D180A]/25 border-dashed" />
                  <span className="font-mono font-black text-xs sm:text-sm leading-none text-[#3D180A]">A</span>
                  <span className="text-xs sm:text-sm leading-none text-[#3D180A]">♠</span>
                </div>
              </div>
            )}
          </div>


          {/* ────────────────────────────────────────────────────────── */}
          {/* RIGHT: Winner (Starts with King ♦ -> Receives Ace ♠)      */}
          {/* ────────────────────────────────────────────────────────── */}
          <div 
            className="flex flex-col items-center gap-1.5 sm:gap-3 transition-all duration-300 relative shrink-0"
            style={{
              transform: duelPhase >= 2 
                ? 'translateX(-8px) sm:translateX(-10px) scale(1.05)' 
                : 'translateX(0) scale(1)',
            }}
          >
            {/* Proportional Western Revolver mounted on Left side aiming towards Left 🔫 */}
            <div 
              className="absolute -left-9 sm:-left-14 top-1/3 z-30 transition-all duration-300 pointer-events-none"
              style={{
                transform: duelPhase >= 2
                  ? 'rotate(-3deg) scale(1)'
                  : duelPhase >= 1
                  ? 'rotate(0deg) scale(0.95)'
                  : 'rotate(18deg) scale(0.75)',
                transformOrigin: 'right center',
              }}
            >
              <img
                src="/images/western_revolver.png"
                alt="Western Revolver"
                className="w-12 sm:w-20 h-auto object-contain drop-shadow-[0_4px_8px_rgba(45,15,4,0.85)]"
                style={{
                  transform: 'scaleX(-1)', // Mirrored so barrel points directly at opponent
                }}
              />

              {/* Muzzle Flash Flare at gun barrel tip — only during gunshot */}
              {duelPhase === 2 && (
                <div 
                  className="absolute -left-4 -top-2.5 w-10 h-10 sm:w-14 sm:h-14 rounded-full pointer-events-none animate-ping"
                  style={{
                    background: 'radial-gradient(circle, #FFFFFF 0%, #FDE047 35%, #EA580C 70%, transparent 100%)',
                    boxShadow: '0 0 20px #FDE047, 0 0 35px #EA580C',
                  }}
                />
              )}
            </div>

            {/* Champion Winner Avatar */}
            <div className="relative">
              <div className="p-0.5 sm:p-1 rounded-full bg-gradient-to-tr from-[#F59E0B] via-[#FDE047] to-[#EA580C] border-2.5 sm:border-4 border-[#3D180A] shadow-[3px_3px_0px_#3D180A]">
                <Avatar avatarId={winner.avatarId} size="xl" ring="gold" />
              </div>

              {/* Card Rank Badge on Winner */}
              {showWinnerKing && (
                <AvatarCardRankBadge rank="K" suit="♦" suitColor="#DC2626" isAce={false} />
              )}
              {showWinnerAce && (
                <AvatarCardRankBadge rank="A" suit="♠" suitColor="#3D180A" isAce={true} />
              )}

              {/* Status Badge (Warm Western theme colors) */}
              <div className="absolute -bottom-2.5 sm:-bottom-3 left-1/2 -translate-x-1/2 px-2 sm:px-3 py-0.5 rounded-full bg-[#4A1D0D] text-[#FDE047] border border-[#F59E0B] text-[9px] sm:text-xs font-black whitespace-nowrap shadow-[2px_2px_0px_#2D1006]" dir="rtl">
                {duelPhase >= 3 ? 'بطل الصدارة الجديد (الآس)' : 'المنافس (الملك)'}
              </div>
            </div>

            {/* Nickname & Points */}
            <div className="mt-1.5 sm:mt-2 text-center" dir="rtl">
              <div className="text-sm sm:text-xl font-display font-black text-[#FFF8EB] drop-shadow-[2px_2px_0px_#3D180A]">
                {cleanWinnerName}
              </div>
              <div className="text-[11px] sm:text-sm font-mono font-bold text-[#FDE047]">
                {winner.totalScore} نقطة
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom Control Actions (Theme Styled) ── */}
      <div className="relative z-20 mb-2 sm:mb-3 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 w-full max-w-md" dir="rtl">
        <Button 
          variant="primary" 
          size="lg" 
          onClick={onContinue}
          icon={<Trophy className="w-5 h-5" />}
          className="flex-1 !py-2.5 sm:!py-3 !text-sm sm:!text-base !font-black !shadow-[3px_3px_0px_#3D180A]"
        >
          عرض جدول التتويج النهائي
        </Button>

        <button
          type="button"
          onClick={startDuelSequence}
          className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-[#FFF8EB] text-[#3D180A] font-black text-xs sm:text-sm border-2 sm:border-2.5 border-[#3D180A] shadow-[2.5px_2.5px_0px_#3D180A] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="إعادة تشغيل حركة المبارزة"
        >
          إعادة الرمي
        </button>
      </div>

      {/* ── Keyframe Animations ── */}
      <style>{`
        @keyframes bulletFlyAcross {
          0% {
            left: 88%;
            opacity: 1;
            transform: scale(1.1);
          }
          95% {
            left: 6%;
            opacity: 1;
            transform: scale(0.95);
          }
          100% {
            left: 0%;
            opacity: 0;
            transform: scale(0.5);
          }
        }

        @keyframes aceCardFlyAcross {
          0% {
            left: 12%;
            top: 0px;
            transform: rotate(0deg) scale(1);
            opacity: 1;
          }
          40% {
            left: 45%;
            top: -45px;
            transform: rotate(180deg) scale(1.25);
            opacity: 1;
          }
          90% {
            left: 80%;
            top: 0px;
            transform: rotate(360deg) scale(1.1);
            opacity: 1;
          }
          100% {
            left: 85%;
            top: 0px;
            transform: rotate(360deg) scale(1);
            opacity: 0;
          }
        }

        @keyframes tumbleweedRoll {
          0% {
            transform: translateX(0px) translateY(0px);
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          25% {
            transform: translateX(-30vw) translateY(-60px);
          }
          50% {
            transform: translateX(-60vw) translateY(0px);
          }
          75% {
            transform: translateX(-90vw) translateY(-45px);
          }
          92% {
            opacity: 1;
          }
          100% {
            transform: translateX(-125vw) translateY(0px);
            opacity: 0;
          }
        }

        @keyframes tumbleweedSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(-360deg);
          }
        }
      `}</style>
    </div>
  );
}
