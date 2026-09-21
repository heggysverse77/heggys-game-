import { useState, useEffect } from 'react';

interface AppLoadingSplashProps {
  onFinished?: () => void;
  minDurationMs?: number;
}

export default function AppLoadingSplash({
  onFinished,
  minDurationMs = 2800,
}: AppLoadingSplashProps) {
  const [progress, setProgress] = useState(10);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const [shotPhase, setShotPhase] = useState(0); // 0: initial, 1: shot 1, 2: shot 2, 3: shot 3

  // Progress simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const jump = Math.floor(Math.random() * 14) + 12;
        return Math.min(100, prev + jump);
      });
    }, 110);

    return () => clearInterval(interval);
  }, []);

  // Gunshot impact sequencing for dynamic cinematic feel
  useEffect(() => {
    const t1 = setTimeout(() => setShotPhase(1), 200);
    const t2 = setTimeout(() => setShotPhase(2), 550);
    const t3 = setTimeout(() => setShotPhase(3), 900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Finish splash screen
  const finishSplash = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    setTimeout(() => {
      setIsMounted(false);
      if (onFinished) onFinished();
    }, 450);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      finishSplash();
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs]);

  if (!isMounted) return null;

  return (
    <div
      onClick={finishSplash}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center text-center select-none transition-all duration-500 ease-out px-4 sm:px-6 overflow-hidden cursor-pointer ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at 50% 46%, #E07A10 0%, #A64E04 35%, #592202 70%, #200901 100%)',
      }}
      dir="rtl"
    >
      {/* ── Background Vignette & Ambient Warm Light ── */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(254, 215, 170, 0.25) 0%, transparent 60%)',
        }}
      />

      {/* ── Floating Gunshot Sparks & Embers ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Spark streaks radiating from gunshot impacts */}
        <svg className="w-full h-full absolute inset-0 opacity-80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="sparkGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="40%" stopColor="#FDE047" />
              <stop offset="80%" stopColor="#F97316" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Left gunshot spark burst */}
          {shotPhase >= 1 && (
            <g className="animate-pulse" style={{ transformOrigin: '32% 42%' }}>
              <line x1="32%" y1="42%" x2="22%" y2="35%" stroke="#FEF08A" strokeWidth="2" strokeDasharray="6 14" opacity="0.9" />
              <line x1="32%" y1="42%" x2="20%" y2="48%" stroke="#F97316" strokeWidth="2.5" strokeDasharray="8 16" opacity="0.8" />
              <line x1="32%" y1="42%" x2="26%" y2="58%" stroke="#FED7AA" strokeWidth="1.5" strokeDasharray="5 12" opacity="0.7" />
              <line x1="32%" y1="42%" x2="35%" y2="30%" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 10" opacity="0.9" />
            </g>
          )}

          {/* Lower right gunshot spark burst */}
          {shotPhase >= 3 && (
            <g className="animate-pulse" style={{ transformOrigin: '68% 54%' }}>
              <line x1="68%" y1="54%" x2="78%" y2="46%" stroke="#FEF08A" strokeWidth="2.5" strokeDasharray="6 14" opacity="0.9" />
              <line x1="68%" y1="54%" x2="82%" y2="58%" stroke="#F97316" strokeWidth="3" strokeDasharray="8 18" opacity="0.85" />
              <line x1="68%" y1="54%" x2="75%" y2="68%" stroke="#FED7AA" strokeWidth="2" strokeDasharray="5 15" opacity="0.75" />
              <line x1="68%" y1="54%" x2="62%" y2="66%" stroke="#FFFFFF" strokeWidth="1.8" strokeDasharray="4 12" opacity="0.8" />
            </g>
          )}
        </svg>

        {/* Flying glowing spark particles */}
        <div className="absolute top-[38%] left-[24%] w-2 h-2 rounded-full bg-yellow-200 shadow-[0_0_8px_#FDE047] animate-ping" />
        <div className="absolute top-[48%] left-[28%] w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#F59E0B] animate-pulse" />
        <div className="absolute top-[32%] left-[36%] w-2.5 h-2.5 rounded-full bg-orange-300 shadow-[0_0_10px_#FB923C] animate-ping delay-200" />
        <div className="absolute top-[52%] right-[26%] w-2 h-2 rounded-full bg-yellow-100 shadow-[0_0_10px_#FEF08A] animate-ping delay-500" />
        <div className="absolute top-[58%] right-[32%] w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_6px_#F59E0B] animate-pulse delay-300" />
        <div className="absolute top-[44%] right-[22%] w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_8px_#EA580C] animate-ping delay-700" />
      </div>

      {/* ── Center Stage: Logo, Gunshot Bullet Holes, Gunsmoke & Flying Bullet ── */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-2xl w-full">
        
        {/* Flying Golden Bullet / Shell Casing (Top Right) */}
        <div 
          className="absolute -top-4 sm:-top-8 right-6 sm:right-16 z-30 transition-transform duration-1000 ease-out"
          style={{
            transform: 'rotate(-25deg)',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
          }}
        >
          <svg width="48" height="14" viewBox="0 0 48 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-[float_2.5s_ease-in-out_infinite]">
            {/* Brass bullet cartridge */}
            <path d="M 0 3 C 0 1.5 1.5 1.5 3 1.5 L 34 1.5 L 34 12.5 L 3 12.5 C 1.5 12.5 0 12.5 0 11 Z" fill="url(#bulletBrass)" />
            {/* Copper bullet head */}
            <path d="M 34 1.5 L 42 3.5 C 46 5.5 48 7 48 7 C 48 7 46 8.5 42 10.5 L 34 12.5 Z" fill="url(#bulletCopper)" />
            {/* Cartridge rim groove */}
            <rect x="5" y="1.5" width="2" height="11" fill="#78350F" opacity="0.6" />
            <defs>
              <linearGradient id="bulletBrass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="45%" stopColor="#D97706" />
                <stop offset="80%" stopColor="#92400E" />
                <stop offset="100%" stopColor="#451A03" />
              </linearGradient>
              <linearGradient id="bulletCopper" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FED7AA" />
                <stop offset="50%" stopColor="#EA580C" />
                <stop offset="100%" stopColor="#7C2D12" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* ── Gunshot Impact 1: Left Flank with Expanding Smoke Puff ── */}
        {shotPhase >= 1 && (
          <div 
            className="absolute top-[22%] sm:top-[26%] left-[4%] sm:left-[12%] z-20 pointer-events-none transition-all duration-300"
            style={{ transform: 'scale(1.15)' }}
          >
            {/* Dense Gunsmoke Cloud */}
            <div className="absolute -top-10 -left-12 w-28 sm:w-36 h-28 sm:h-36 rounded-full bg-gradient-to-br from-white/70 via-gray-300/40 to-transparent blur-xl animate-[pulse_2s_infinite]" />
            <div className="absolute -top-6 -left-6 w-20 sm:w-24 h-20 sm:h-24 rounded-full bg-white/50 blur-lg" />
            
            {/* Bullet Puncture Hole */}
            <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              {/* Outer jagged dent */}
              <circle cx="21" cy="21" r="16" fill="#1C1917" stroke="#94A3B8" strokeWidth="2.5" />
              {/* Deep black core */}
              <circle cx="21" cy="21" r="9" fill="#09090B" />
              {/* Metallic highlight rim */}
              <path d="M 12 16 C 14 10 24 9 29 13" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
              {/* Star stress fractures */}
              <line x1="21" y1="5" x2="21" y2="10" stroke="#CBD5E1" strokeWidth="1.5" />
              <line x1="21" y1="32" x2="21" y2="37" stroke="#CBD5E1" strokeWidth="1.5" />
              <line x1="5" y1="21" x2="10" y2="21" stroke="#CBD5E1" strokeWidth="1.5" />
              <line x1="32" y1="21" x2="37" y2="21" stroke="#CBD5E1" strokeWidth="1.5" />
            </svg>
          </div>
        )}

        {/* ── Gunshot Impact 2: Top Left Shoulder with Gunsmoke ── */}
        {shotPhase >= 2 && (
          <div 
            className="absolute top-[8%] sm:top-[12%] left-[22%] sm:left-[28%] z-20 pointer-events-none transition-all duration-300"
            style={{ transform: 'scale(0.95)' }}
          >
            {/* Gunsmoke Cloud */}
            <div className="absolute -top-8 -left-8 w-24 sm:w-28 h-24 sm:h-28 rounded-full bg-gradient-to-br from-white/60 via-gray-200/35 to-transparent blur-lg animate-[pulse_2.5s_infinite]" />
            {/* Bullet Puncture Hole */}
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              <circle cx="17" cy="17" r="13" fill="#1C1917" stroke="#94A3B8" strokeWidth="2" />
              <circle cx="17" cy="17" r="7" fill="#09090B" />
              <path d="M 10 13 C 12 8 20 8 24 11" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
            </svg>
          </div>
        )}

        {/* ── Gunshot Impact 3: Lower Right Flank with Billowing Smoke ── */}
        {shotPhase >= 3 && (
          <div 
            className="absolute bottom-[18%] sm:bottom-[22%] right-[6%] sm:right-[14%] z-20 pointer-events-none transition-all duration-300"
            style={{ transform: 'scale(1.2)' }}
          >
            {/* Gunsmoke Cloud */}
            <div className="absolute -top-10 -right-8 w-32 sm:w-40 h-32 sm:h-40 rounded-full bg-gradient-to-tl from-white/70 via-gray-300/45 to-transparent blur-xl animate-[pulse_2s_infinite]" />
            <div className="absolute -top-6 -right-4 w-20 sm:w-24 h-20 sm:h-24 rounded-full bg-white/55 blur-md" />
            
            {/* Bullet Puncture Hole */}
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              <circle cx="22" cy="22" r="17" fill="#1C1917" stroke="#94A3B8" strokeWidth="2.5" />
              <circle cx="22" cy="22" r="9.5" fill="#09090B" />
              <path d="M 13 17 C 15 11 25 10 30 14" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
              <line x1="22" y1="5" x2="22" y2="10" stroke="#CBD5E1" strokeWidth="1.5" />
              <line x1="22" y1="34" x2="22" y2="39" stroke="#CBD5E1" strokeWidth="1.5" />
              <line x1="5" y1="22" x2="10" y2="22" stroke="#CBD5E1" strokeWidth="1.5" />
              <line x1="34" y1="22" x2="39" y2="22" stroke="#CBD5E1" strokeWidth="1.5" />
            </svg>
          </div>
        )}

        {/* ── Main Brand Emblem with 3D Depth, Flip & Elevation ── */}
        <div 
          className="relative flex flex-col items-center justify-center my-1"
          style={{ perspective: '1400px' }}
        >
          <style>{`
            @keyframes splashLogoFlipElevate {
              0% {
                transform: translateY(8px) rotateY(0deg) rotateX(2.5deg) scale(0.97);
              }
              25% {
                transform: translateY(-22px) rotateY(90deg) rotateX(-5deg) scale(1.03);
              }
              50% {
                transform: translateY(-42px) rotateY(180deg) rotateX(2.5deg) scale(1.08);
              }
              75% {
                transform: translateY(-22px) rotateY(270deg) rotateX(-5deg) scale(1.03);
              }
              100% {
                transform: translateY(8px) rotateY(360deg) rotateX(2.5deg) scale(0.97);
              }
            }

            @keyframes splashLogoShadowPulse {
              0%, 100% {
                transform: scale(1);
                opacity: 0.85;
                filter: blur(6px);
              }
              50% {
                transform: scale(0.62) translateY(14px);
                opacity: 0.3;
                filter: blur(18px);
              }
            }

            @keyframes splashHaloRotate {
              0% {
                transform: rotate(0deg) scale(0.95);
                opacity: 0.75;
              }
              50% {
                transform: rotate(180deg) scale(1.1);
                opacity: 0.95;
              }
              100% {
                transform: rotate(360deg) scale(0.95);
                opacity: 0.75;
              }
            }

            .splash-logo-flip-container {
              animation: splashLogoFlipElevate 3.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
              will-change: transform;
              transform-style: preserve-3d;
            }

            .splash-logo-shadow {
              animation: splashLogoShadowPulse 3.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
              will-change: transform, opacity, filter;
            }

            .splash-halo-glow {
              animation: splashHaloRotate 8s linear infinite;
              will-change: transform, opacity;
            }

            .splash-logo-depth {
              filter: 
                drop-shadow(0 3px 5px rgba(0, 0, 0, 0.5))
                drop-shadow(0 12px 20px rgba(0, 0, 0, 0.65))
                drop-shadow(0 28px 46px rgba(0, 0, 0, 0.85))
                drop-shadow(0 0 35px rgba(245, 158, 11, 0.65))
                drop-shadow(0 0 12px rgba(254, 215, 170, 0.45));
            }
          `}</style>

          {/* Intense warm amber / fiery core glow behind emblem */}
          <div 
            className="absolute -inset-10 sm:-inset-16 rounded-full blur-3xl pointer-events-none splash-halo-glow"
            style={{
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.75) 0%, rgba(234, 88, 12, 0.5) 42%, rgba(120, 53, 15, 0.25) 72%, transparent 100%)',
            }}
          />

          {/* 3D Flipping & Elevating Emblem (with Double-Sided Mesh so text is never reversed) */}
          <div className="relative splash-logo-flip-container">
            {/* Front Face */}
            <div 
              style={{
                transform: 'translateZ(8px)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              <img
                src="/images/logo.png?v=20260920b"
                alt="اعرف صاحبك وعلم عليه"
                className="w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 object-contain splash-logo-depth select-none pointer-events-none"
                loading="eager"
              />
            </div>

            {/* Back Face (Oriented right-side up when card flips 180°) */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: 'rotateY(180deg) translateZ(8px)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              <img
                src="/images/logo.png?v=20260920b"
                alt="اعرف صاحبك وعلم عليه"
                className="w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 object-contain splash-logo-depth select-none pointer-events-none"
                loading="eager"
              />
            </div>
          </div>

          {/* Responsive 3D Ground Cast Shadow that responds to the rising & flipping */}
          <div 
            className="w-48 sm:w-64 md:w-72 h-7 sm:h-9 rounded-[100%] pointer-events-none mt-2 splash-logo-shadow"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(12, 4, 1, 0.9) 0%, rgba(35, 12, 3, 0.55) 45%, transparent 75%)',
            }}
          />
        </div>

        {/* ── Minimalist Circular Spinner & Loading Indicator ── */}
        <div className="mt-8 flex flex-col items-center gap-3">
          {/* Sleek Circular Rotating Spinner */}
          <div className="relative w-9 h-9 sm:w-10 sm:h-10">
            <svg className="w-full h-full animate-spin" viewBox="0 0 36 36" fill="none">
              <circle
                cx="18"
                cy="18"
                r="14"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="3.5"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                stroke="#FFFFFF"
                strokeWidth="3.5"
                strokeDasharray="60 30"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Progress Percent */}
          <div className="text-white/80 font-mono font-bold text-xs sm:text-sm tracking-wider">
            {Math.min(100, progress)}%
          </div>

          {/* Skip hint */}
          <span className="text-[11px] text-white/50 font-bold hover:text-white/90 transition-colors cursor-pointer">
            (اضغط في أي مكان للدخول مباشرة)
          </span>
        </div>

      </div>
    </div>
  );
}

