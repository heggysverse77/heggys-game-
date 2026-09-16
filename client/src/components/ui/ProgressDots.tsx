interface ProgressDotsProps {
  total: number;
  current: number;
  className?: string;
}

export default function ProgressDots({ total, current, className = '' }: ProgressDotsProps) {
  return (
    <div className={`flex items-center gap-2.5 justify-center select-none ${className}`}>
      {Array.from({ length: total }, (_, i) => {
        const isActive = i < current;
        const isCurrent = i === current - 1;
        return (
          <span
            key={i}
            className={[
              'rounded-full transition-all duration-200 border-2 border-[#1A1A1A]',
              isActive
                ? 'bg-[#33A9AC] w-4.5 h-4.5 shadow-[1.5px_1.5px_0px_#1A1A1A]'
                : 'bg-white/40 w-3.5 h-3.5 opacity-60',
              isCurrent ? 'scale-125 !bg-[#FFA646] !w-5 !h-5 shadow-[2px_2px_0px_#1A1A1A] animate-pulse' : '',
            ].join(' ')}
          />
        );
      })}
    </div>
  );
}
