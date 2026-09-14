interface ProgressDotsProps {
  total: number;
  current: number;
  className?: string;
}

export default function ProgressDots({ total, current, className = '' }: ProgressDotsProps) {
  return (
    <div className={`flex items-center gap-2 justify-center ${className}`}>
      {Array.from({ length: total }, (_, i) => {
        const isActive = i < current;
        const isCurrent = i === current - 1;
        return (
          <span
            key={i}
            className={[
              'rounded-full transition-all duration-300',
              isActive
                ? 'bg-heggy-teal w-4 h-4'
                : 'bg-white/20 w-3 h-3',
              isCurrent ? 'glow-teal scale-110' : '',
            ].join(' ')}
          />
        );
      })}
    </div>
  );
}
