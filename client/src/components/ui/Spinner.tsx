interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'teal' | 'gold' | 'pink' | 'white' | 'cyan';
  label?: string;
}

const sizeClasses = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
};

const colorClasses = {
  teal:  'border-[#33A9AC]/30 border-t-[#33A9AC]',
  cyan:  'border-[#33A9AC]/30 border-t-[#33A9AC]',
  gold:  'border-[#FFA646]/30 border-t-[#FFA646]',
  pink:  'border-[#F86041]/30 border-t-[#F86041]',
  white: 'border-white/30 border-t-white',
};

export default function Spinner({ size = 'md', color = 'gold', label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 select-none" dir="rtl">
      <div
        className={[
          'rounded-full animate-spin',
          sizeClasses[size],
          colorClasses[color],
        ].join(' ')}
        role="status"
        aria-label={label ?? 'جاري التحميل...'}
      />
      {label && (
        <p className="text-[#1A1A1A]/80 dark:text-slate-300 text-xs sm:text-sm font-body font-black animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}
