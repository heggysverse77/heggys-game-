import { useState, useEffect } from 'react';
import { Flame, Gamepad2 } from 'lucide-react';

interface AppLoadingSplashProps {
  onFinished?: () => void;
  minDurationMs?: number;
}

export default function AppLoadingSplash({
  onFinished,
  minDurationMs = 2300,
}: AppLoadingSplashProps) {
  const fullText = 'اعرف صاحبك وعلّم عليه';
  const part1 = 'اعرف صاحبك';

  const [displayedCount, setDisplayedCount] = useState(0);
  const [progress, setProgress] = useState(15);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Typewriter typing effect
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (displayedCount < fullText.length) {
      const delay = Math.floor(Math.random() * 30) + 45;
      timeout = setTimeout(() => {
        setDisplayedCount((prev) => prev + 1);
      }, delay);
    }

    return () => clearTimeout(timeout);
  }, [displayedCount, fullText.length]);

  // Loading progress bar simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(100, prev + Math.floor(Math.random() * 15) + 8);
      });
    }, 110);

    return () => clearInterval(interval);
  }, []);

  // Dismiss splash after typing & minimum duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setIsMounted(false);
        if (onFinished) onFinished();
      }, 500); // fade out duration
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs, onFinished]);

  if (!isMounted) return null;

  const currentText = fullText.slice(0, displayedCount);
  let renderedPart1 = '';
  let renderedPart2 = '';

  if (currentText.length <= part1.length) {
    renderedPart1 = currentText;
  } else {
    renderedPart1 = part1;
    renderedPart2 = currentText.slice(part1.length);
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center text-center select-none transition-all duration-500 ease-out px-4 sm:px-6 overflow-hidden ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      dir="rtl"
    >
      {/* ── 1. Retro Egypt Background with Depth Blur ────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat filter blur-[8px] scale-110"
        style={{
          backgroundImage: "url('/images/retro_egypt_bg.jpg')",
        }}
      />

      {/* Cinematic Vignette Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#0B1519]/50 via-[#0B1519]/30 to-[#0B1519]/70"
        aria-hidden="true"
      />

      {/* ── 2. Center Comic Pop Card ─────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-xl bg-[#FFF6E5] text-[#1A1A1A] border-3.5 sm:border-4 border-[#1A1A1A] rounded-[2.5rem] p-8 sm:p-12 shadow-[8px_8px_0px_#1A1A1A] sm:shadow-[10px_10px_0px_#1A1A1A] flex flex-col items-center gap-6 sm:gap-7 animate-[pop_0.4s_ease] overflow-hidden">
        
        {/* Flame Emblem */}
        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-[#FFA646] border-3 border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] animate-[bounce_2s_infinite]">
          <Flame className="w-10 h-10 fill-[#1A1A1A] stroke-[2.5]" />
        </div>

        {/* ── Typewriter Comic Title ─────────────────────────────────── */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-display font-black text-3xl sm:text-5xl tracking-tight leading-tight flex items-center justify-center flex-wrap gap-2 text-center">
            {/* Part 1: اعرف صاحبك */}
            <span className="text-[#1A1A1A]">
              {renderedPart1}
            </span>

            {/* Part 2: وعلّم عليه */}
            {renderedPart2 && (
              <span className="text-[#F86041] drop-shadow-[2px_2px_0px_#1A1A1A]">
                {renderedPart2}
              </span>
            )}

            {/* Blinking Typewriter Cursor */}
            <span className="inline-block h-8 sm:h-11 w-1.5 sm:w-2 bg-[#FFA646] border-2 border-[#1A1A1A] rounded-full shadow-[1px_1px_0px_#1A1A1A] animate-pulse ml-1" />
          </h1>

          {/* Subtitle Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] text-xs sm:text-sm font-body font-black shadow-[2px_2px_0px_#1A1A1A] mt-1">
            <Gamepad2 className="w-3.5 h-3.5 text-[#F86041]" />
            <span>لعبة التحديات والتخمين الجماعية للأصدقاء</span>
          </div>
        </div>

        {/* ── 3. Comic Progress Bar ──────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 w-full max-w-sm mt-2">
          <div className="w-full h-5 rounded-full bg-white border-2.5 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] overflow-hidden p-0.5 relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FFA646] to-[#F86041] border-r-2 border-[#1A1A1A] transition-all duration-200 ease-out"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>

          <div className="flex items-center justify-between w-full px-1 text-xs font-body font-black text-[#1A1A1A]/70">
            <span>جاري تجهيز سيرفر اللعبة...</span>
            <span className="font-mono text-[#F86041] font-black">{Math.min(100, progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

