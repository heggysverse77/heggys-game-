interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'teal' | 'gold' | 'pink' | 'white';
  label?: string;
}

const sizeClasses = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
};

const colorClasses = {
  teal:  'border-heggy-teal/30 border-t-heggy-teal',
  gold:  'border-heggy-gold/30 border-t-heggy-gold',
  pink:  'border-heggy-pink/30 border-t-heggy-pink',
  white: 'border-white/20 border-t-white',
};

export default function Spinner({ size = 'md', color = 'teal', label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
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
        <p className="text-heggy-muted text-sm font-body animate-pulse">{label}</p>
      )}
    </div>
  );
}
