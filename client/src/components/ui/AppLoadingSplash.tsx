import { useState, useEffect } from 'react';
import { Sparkles, Crown, Users, HelpCircle, CheckCircle2 } from 'lucide-react';

interface AppLoadingSplashProps {
  onFinished?: () => void;
  minDurationMs?: number;
}

export default function AppLoadingSplash({
  onFinished,
  minDurationMs = 2600,
}: AppLoadingSplashProps) {
  const [progress, setProgress] = useState(10);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const [phraseIdx, setPhraseIdx] = useState(0);

  const phrases = [
    'بنجهز الأسئلة والمقالب...',
    'بنرتب كروت التحديات...',
    'بنولع المنافسة بين الصحاب...',
    'جاهز تفضح صاحبك؟ يلا بينا! 🔥',
  ];

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
    }, 120);

    return () => clearInterval(interval);
  }, []);

  // Cycle phrases
  useEffect(() => {
    const phraseTimer = setInterval(() => {
      setPhraseIdx((prev) => (prev + 1) % phrases.length);
    }, 700);

    return () => clearInterval(phraseTimer);
  }, [phrases.length]);

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
        isFadingOut ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: '#FDF9EE',
        backgroundImage: "url('/images/comic_city_bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}
      dir="rtl"
    >
      {/* ── Background Floating Glow Orbs ─────────────────── */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-[#33A9AC]/15 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-[#FFA646]/15 blur-3xl pointer-events-none animate-pulse delay-700" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#982062]/20 blur-3xl pointer-events-none animate-pulse delay-1000" />

      {/* ── Centerpiece: Animated Logo & Floating Badges ── */}
      <div className="relative z-10 flex flex-col items-center max-w-lg w-full">
        
        {/* Halo Glow Rings around the Logo */}
        <div className="relative flex items-center justify-center">
          {/* Outer rotating color ring */}
          <div
            className="absolute -inset-10 sm:-inset-14 rounded-full opacity-60 blur-2xl animate-spin pointer-events-none"
            style={{
              background: 'conic-gradient(from 0deg, #33A9AC, #FFA646, #F86041, #982062, #343779, #33A9AC)',
              animationDuration: '10s',
            }}
          />

          {/* Floating mini badges representing the 3 cards in the logo */}
          <div className="absolute -top-6 -right-4 sm:-right-8 animate-bounce delay-100 z-20">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-[#FFA646] text-[#121212] font-black text-xs shadow-[2.5px_2.5px_0px_#1A1A1A] border-2 border-[#1A1A1A]">
              <Users className="w-3.5 h-3.5" />
              <span>صحابك</span>
            </div>
          </div>

          <div className="absolute top-0 -left-4 sm:-left-8 animate-bounce delay-300 z-20">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-[#33A9AC] text-white font-black text-xs shadow-[2.5px_2.5px_0px_#1A1A1A] border-2 border-[#1A1A1A]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>علم عليه</span>
            </div>
          </div>

          <div className="absolute -bottom-4 -right-3 sm:-right-6 animate-pulse delay-500 z-20">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-[#982062] text-white font-black text-xs shadow-[2.5px_2.5px_0px_#1A1A1A] border-2 border-[#1A1A1A]">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>أسئلة وحكاوي</span>
            </div>
          </div>

          {/* Crown sparkle accent */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[#FFA646] animate-pulse">
            <Sparkles className="w-5 h-5 text-[#FFA646]" />
            <Crown className="w-7 h-7 text-[#FFC107] fill-[#FFC107] drop-shadow-[0_0_12px_#FFC107]" />
            <Sparkles className="w-5 h-5 text-[#FFA646]" />
          </div>

          {/* The Main Logo with 3D scale-in & gentle float */}
          <div className="relative animate-[pop_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">
            <img
              src="/images/logo.png"
              alt="اعرف صاحبك وعلّم عليه"
              className="w-auto h-48 sm:h-64 md:h-72 max-w-[90vw] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.3)] animate-[float_4s_ease-in-out_infinite]"
            />
          </div>
        </div>

        {/* ── Subtitle / Game tagline ──────────────────────── */}
        <div className="mt-4 flex items-center gap-2 px-5 py-2 rounded-full bg-[#FFF6E5] border-2 border-[#1A1A1A] shadow-[2.5px_2.5px_0px_#1A1A1A]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#33A9AC] animate-ping" />
          <span className="text-xs sm:text-sm font-body font-black text-[#1A1A1A]">
            لعبة التحديات والتخمين الجماعية للأصدقاء
          </span>
        </div>

        {/* ── Progress Bar in Palette Gradient ──────────────── */}
        <div className="w-full max-w-xs sm:max-w-sm mt-8 flex flex-col items-center gap-2.5">
          {/* Bar track */}
          <div className="w-full h-3.5 sm:h-4 rounded-full bg-[#FFF0D4] border-2 border-[#1A1A1A] p-0.5 overflow-hidden shadow-[2px_2px_0px_#1A1A1A] relative">
            <div
              className="h-full rounded-full transition-all duration-200 ease-out relative overflow-hidden"
              style={{
                width: `${Math.min(100, progress)}%`,
                background: 'linear-gradient(90deg, #33A9AC 0%, #FFA646 35%, #F86041 70%, #982062 100%)',
                boxShadow: '0 0 14px rgba(255,166,70,0.6)',
              }}
            >
              {/* Shimmer light sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>
          </div>

          {/* Dynamic Cheeky Phrase & Percentage */}
          <div className="w-full flex items-center justify-between text-xs font-body font-semibold px-1">
            <span className="text-[#33A9AC] transition-all duration-300 font-bold">
              {phrases[phraseIdx]}
            </span>
            <span className="font-mono text-[#FFA646] font-bold">
              {Math.min(100, progress)}%
            </span>
          </div>

          <span className="text-[11px] text-[#1A1A1A]/60 mt-1 font-bold hover:text-[#1A1A1A] transition-colors">
            (اضغط في أي مكان للدخول مباشرة)
          </span>
        </div>
      </div>
    </div>
  );
}
