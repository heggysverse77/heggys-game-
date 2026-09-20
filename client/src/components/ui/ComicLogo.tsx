export interface ComicLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  showSubtitle?: boolean;
  animate?: boolean;
  onClick?: () => void;
}

export default function ComicLogo({
  size = 'hero',
  className = '',
  showSubtitle = false,
  animate = true,
  onClick,
}: ComicLogoProps) {
  // Height and aspect ratio scaling for the circular Western emblem
  const sizeStyles = {
    xs: {
      imgClass: 'h-9 w-9 sm:h-10 sm:w-10',
      glowClass: 'blur-md -inset-1 opacity-40',
    },
    sm: {
      imgClass: 'h-12 w-12 sm:h-14 sm:w-14',
      glowClass: 'blur-lg -inset-2 opacity-50',
    },
    md: {
      imgClass: 'h-20 w-20 sm:h-24 sm:w-24',
      glowClass: 'blur-xl -inset-3 opacity-60',
    },
    lg: {
      imgClass: 'h-32 w-32 sm:h-40 sm:w-40',
      glowClass: 'blur-2xl -inset-4 opacity-70',
    },
    hero: {
      imgClass: 'h-48 w-48 sm:h-56 sm:w-56 md:h-64 md:w-64 max-w-full',
      glowClass: 'blur-3xl -inset-6 opacity-75',
    },
  }[size];

  return (
    <div
      className={`inline-flex flex-col items-center select-none text-center relative group ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      dir="rtl"
      onClick={onClick}
    >
      {/* Dynamic ambient color glow matching the Western palette (#F59E0B, #EA580C, #78350F) */}
      <div
        className={`absolute rounded-full pointer-events-none -z-10 transition-transform duration-700 ${sizeStyles.glowClass} ${
          animate ? 'animate-pulse' : ''
        }`}
        style={{
          background:
            'radial-gradient(circle, rgba(245,158,11,0.45) 0%, rgba(234,88,12,0.3) 45%, rgba(120,53,15,0.2) 75%, transparent 100%)',
        }}
      />

      {/* The official brand 3D illustrated logo with coin flip hover animation */}
      <div className="relative [perspective:1000px] cursor-pointer">
        <img
          src="/images/logo.png"
          alt="اعرف صاحبك وعلّم عليه"
          className={`w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] [transform-style:preserve-3d] ${sizeStyles.imgClass} ${
            animate
              ? 'hover:[transform:rotateY(180deg)_scale(1.08)] active:scale-95 hover:drop-shadow-[0_16px_28px_rgba(245,158,11,0.6)]'
              : ''
          }`}
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Optional sub-badge */}
      {showSubtitle && (
        <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1e2044]/90 border border-[#343779] text-[#FFF6E5] text-xs sm:text-sm font-body font-bold shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
          <span className="w-2 h-2 rounded-full bg-[#33A9AC] animate-ping" />
          <span>لعبة التحديات والتخمين الجماعية للأصدقاء</span>
        </div>
      )}
    </div>
  );
}
