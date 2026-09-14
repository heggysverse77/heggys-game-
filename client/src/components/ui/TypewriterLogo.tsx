import { useState, useEffect } from 'react';
import { Sparkles, Flame } from 'lucide-react';

interface TypewriterLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showBadge?: boolean;
  onComplete?: () => void;
  className?: string;
  autoLoop?: boolean;
}

export default function TypewriterLogo({
  size = 'hero',
  showBadge = true,
  onComplete,
  className = '',
  autoLoop = false,
}: TypewriterLogoProps) {
  const fullText = 'اعرف صاحبك وعلّم عليه';
  const part1 = 'اعرف صاحبك';

  const [displayedCount, setDisplayedCount] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (displayedCount < fullText.length) {
      const delay = Math.floor(Math.random() * 35) + 50;
      timeout = setTimeout(() => {
        setDisplayedCount((prev) => prev + 1);
      }, delay);
    } else {
      setIsDone(true);
      if (onComplete) onComplete();

      if (autoLoop) {
        timeout = setTimeout(() => {
          setDisplayedCount(0);
          setIsDone(false);
        }, 6000);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedCount, fullText.length, onComplete, autoLoop]);

  const currentText = fullText.slice(0, displayedCount);

  let renderedPart1 = '';
  let renderedPart2 = '';

  if (currentText.length <= part1.length) {
    renderedPart1 = currentText;
  } else {
    renderedPart1 = part1;
    renderedPart2 = currentText.slice(part1.length);
  }

  const sizeClasses = {
    sm: {
      text: 'text-2xl sm:text-3xl',
      badge: 'text-xs px-3.5 py-1',
      cursor: 'h-6 w-1',
    },
    md: {
      text: 'text-3xl sm:text-4xl',
      badge: 'text-xs px-4 py-1.5',
      cursor: 'h-8 w-1',
    },
    lg: {
      text: 'text-4xl sm:text-5xl md:text-6xl',
      badge: 'text-xs sm:text-sm px-5 py-2',
      cursor: 'h-10 sm:h-12 w-1.5',
    },
    hero: {
      text: 'text-4xl sm:text-6xl md:text-7xl lg:text-8xl',
      badge: 'text-xs sm:text-sm px-6 py-2',
      cursor: 'h-10 sm:h-14 md:h-16 w-1.5 sm:w-2',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`relative flex flex-col items-center text-center select-none ${className}`} dir="rtl">
      {/* Optional Top Category Badge */}
      {showBadge && (
        <div className={`inline-flex items-center gap-2 rounded-full bg-[#FFF6E5] border-2.5 border-[#1A1A1A] text-[#1A1A1A] font-body font-black mb-4 shadow-[3px_3px_0px_#1A1A1A] animate-[slideUp_0.3s_ease] ${currentSize.badge}`}>
          <Flame className="w-4 h-4 text-[#F28482] fill-[#F28482]" />
          <span>لعبة التحديات والتخمين الجماعية للأصدقاء</span>
          <Sparkles className="w-4 h-4 text-[#F6BD60]" />
        </div>
      )}

      {/* ── Main Typography with Comic Pop Stroke & Warm Colors ──────── */}
      <h1 className={`font-display font-black tracking-tight leading-tight flex items-center justify-center flex-wrap gap-2 ${currentSize.text}`}>
        {/* Part 1: اعرف صاحبك */}
        <span className="text-[#FFF6E5] drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] filter [paint-order:stroke_fill] [-webkit-text-stroke:3px_#1A1A1A]">
          {renderedPart1}
        </span>

        {/* Part 2: وعلّم عليه */}
        {renderedPart2 && (
          <span className="text-[#F28482] drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] filter [paint-order:stroke_fill] [-webkit-text-stroke:3px_#1A1A1A]">
            {renderedPart2}
          </span>
        )}

        {/* Blinking Typewriter Cursor */}
        <span
          className={`inline-block bg-[#F6BD60] border-2 border-[#1A1A1A] rounded-full shadow-[2px_2px_0px_#1A1A1A] transition-opacity duration-100 ${
            isDone ? 'animate-[pulse_1.5s_infinite]' : 'animate-ping'
          } ${currentSize.cursor}`}
        />
      </h1>
    </div>
  );
}
