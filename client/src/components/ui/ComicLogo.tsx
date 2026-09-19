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
  // Height and max-width scaling for the logo image
  const sizeStyles = {
    xs: {
      imgClass: 'h-8 max-w-[140px]',
      glowClass: 'blur-md -inset-1 opacity-40',
    },
    sm: {
      imgClass: 'h-11 sm:h-12 max-w-[180px]',
      glowClass: 'blur-lg -inset-2 opacity-50',
    },
    md: {
      imgClass: 'h-16 sm:h-20 max-w-[260px]',
      glowClass: 'blur-xl -inset-3 opacity-60',
    },
    lg: {
      imgClass: 'h-24 sm:h-32 md:h-36 max-w-[380px]',
      glowClass: 'blur-2xl -inset-4 opacity-70',
    },
    hero: {
      imgClass: 'h-36 sm:h-48 md:h-56 lg:h-64 max-w-[460px] sm:max-w-[540px]',
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
      {/* Dynamic ambient color glow matching the palette (#FFA646, #33A9AC, #982062) */}
      <div
        className={`absolute rounded-full pointer-events-none -z-10 transition-transform duration-700 ${sizeStyles.glowClass} ${
          animate ? 'animate-pulse' : ''
        }`}
        style={{
          background:
            'radial-gradient(circle, rgba(255,166,70,0.35) 0%, rgba(51,169,172,0.25) 45%, rgba(152,32,98,0.2) 75%, transparent 100%)',
        }}
      />

      {/* The official brand 3D illustrated logo */}
      <div className="relative">
        <img
          src="/images/logo.png"
          alt="اعرف صاحبك وعلّم عليه"
          className={`w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition-transform duration-300 ${sizeStyles.imgClass} ${
            animate ? 'hover:scale-105 active:scale-95' : ''
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
