interface ComicLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  showSubtitle?: boolean;
}

export default function ComicLogo({
  size = 'hero',
  className = '',
  showSubtitle = false,
}: ComicLogoProps) {
  const sizeConfig = {
    sm: {
      t1: 'text-2xl sm:text-3xl',
      t2: 'text-xl sm:text-2xl',
      shadow: 'drop-shadow-[3px_3px_0px_#1A1A1A]',
      stroke: '2px',
    },
    md: {
      t1: 'text-3xl sm:text-4xl',
      t2: 'text-2xl sm:text-3xl',
      shadow: 'drop-shadow-[4px_4px_0px_#1A1A1A]',
      stroke: '3px',
    },
    lg: {
      t1: 'text-4xl sm:text-5xl md:text-6xl',
      t2: 'text-3xl sm:text-4xl md:text-5xl',
      shadow: 'drop-shadow-[5px_5px_0px_#1A1A1A]',
      stroke: '4px',
    },
    hero: {
      t1: 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl',
      t2: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl',
      shadow: 'drop-shadow-[6px_6px_0px_#1A1A1A]',
      stroke: '4px',
    },
  }[size];

  return (
    <div className={`flex flex-col items-center select-none text-center relative ${className}`} dir="rtl">
      {/* Decorative comic starburst / glow in hero size */}
      {size === 'hero' && (
        <div className="absolute -inset-6 bg-[#FFA646]/20 rounded-full blur-2xl -z-10 pointer-events-none animate-pulse" />
      )}

      {/* Main 3D Comic Title */}
      <div className="flex flex-col items-center leading-none tracking-tight font-display font-black">
        {/* Line 1: اعرف صاحبك */}
        <span
          className={`${sizeConfig.t1} text-transparent bg-clip-text bg-gradient-to-b from-[#FFF275] via-[#FFB703] to-[#FB8500] font-black`}
          style={{
            WebkitTextStroke: '2.5px #1A1A1A',
            filter: 'drop-shadow(4px 4px 0px #1A1A1A) drop-shadow(6px 6px 0px #023E8A)',
          }}
        >
          اعرف صاحبك
        </span>

        {/* Line 2: وعلّم عليه */}
        <span
          className={`${sizeConfig.t2} -mt-1 sm:-mt-2 text-transparent bg-clip-text bg-gradient-to-b from-[#FFFDF0] via-[#FEE440] to-[#F77F00] font-black`}
          style={{
            WebkitTextStroke: '2.5px #1A1A1A',
            filter: 'drop-shadow(4px 4px 0px #1A1A1A) drop-shadow(6px 6px 0px #D62828)',
          }}
        >
          وعلّم عليه
        </span>
      </div>

      {showSubtitle && (
        <p className="mt-3 text-sm sm:text-base font-body font-bold text-[#FFF6E5] bg-[#1A1A1A]/70 px-4 py-1.5 rounded-full border-1.5 border-[#FFA646] shadow-[2px_2px_0px_#1A1A1A]">
          لعبة الحفلات المصرية الأكثر حماساً وفضايح! 🔥
        </p>
      )}
    </div>
  );
}
