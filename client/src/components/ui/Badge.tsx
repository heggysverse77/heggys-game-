import type { ReactNode } from 'react';

export type BadgeVariant =
  | 'host'
  | 'ready'
  | 'waiting'
  | 'rank1'
  | 'rank2'
  | 'rank3'
  | 'dare-mild'
  | 'dare-spicy'
  | 'dare-chaos'
  | 'cyan'
  | 'gold'
  | 'teal'
  | 'coral'
  | 'custom';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children?: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  host:        'bg-[#F86041] text-white border-2 border-[#1A1A1A] shadow-[2.5px_2.5px_0px_#1A1A1A]',
  ready:       'bg-[#33A9AC] text-white border-2 border-[#1A1A1A] shadow-[2.5px_2.5px_0px_#1A1A1A]',
  waiting:     'bg-white text-[#1A1A1A]/70 border-2 border-[#1A1A1A] shadow-[2.5px_2.5px_0px_#1A1A1A]',
  rank1:       'bg-[#FFA646] text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[2.5px_2.5px_0px_#1A1A1A]',
  rank2:       'bg-[#FFF6E5] text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[2.5px_2.5px_0px_#1A1A1A]',
  rank3:       'bg-[#F5CAC3] text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[2.5px_2.5px_0px_#1A1A1A]',
  'dare-mild':  'bg-[#33A9AC] text-white border-2 border-[#1A1A1A] shadow-[2.5px_2.5px_0px_#1A1A1A]',
  'dare-spicy': 'bg-[#FFA646] text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[2.5px_2.5px_0px_#1A1A1A]',
  'dare-chaos': 'bg-[#F86041] text-white border-2 border-[#1A1A1A] shadow-[2.5px_2.5px_0px_#1A1A1A]',
  cyan:        'bg-[#33A9AC] text-white border-2 border-[#1A1A1A] shadow-[0_0_12px_rgba(51,169,172,0.45)]',
  gold:        'bg-[#FFA646] text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[2.5px_2.5px_0px_#1A1A1A]',
  teal:        'bg-[#33A9AC] text-white border-2 border-[#1A1A1A] shadow-[2.5px_2.5px_0px_#1A1A1A]',
  coral:       'bg-[#F86041] text-white border-2 border-[#1A1A1A] shadow-[2.5px_2.5px_0px_#1A1A1A]',
  custom:      'bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[2.5px_2.5px_0px_#1A1A1A]',
};

// Generous, enlarged chip sizes to prevent text clipping & ensure comfortable hierarchy
const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-4 sm:px-4.5 py-1.5 sm:py-2 text-xs sm:text-sm gap-2 min-h-[32px] sm:min-h-[34px]',
  md: 'px-5 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base gap-2.5 min-h-[38px] sm:min-h-[42px]',
  lg: 'px-6 sm:px-8 py-2.5 sm:py-3.5 text-base sm:text-lg gap-3 min-h-[46px] sm:min-h-[50px]',
};

const variantLabels: Partial<Record<BadgeVariant, string>> = {
  host:        'المضيف',
  ready:       'جاهز',
  waiting:     'ينتظر',
  rank1:       'المركز الأول 🥇',
  rank2:       'المركز الثاني 🥈',
  rank3:       'المركز الثالث 🥉',
  'dare-mild':  'خفيف',
  'dare-spicy': 'حار ومحرج',
  'dare-chaos': 'تحدي فوضى',
};

export default function Badge({
  variant = 'custom',
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  const label = variantLabels[variant];

  return (
    <span
      className={[
        'rounded-full font-body font-black inline-flex items-center justify-center shrink-0 select-none whitespace-nowrap leading-none tracking-wide transition-all',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {label && <span>{label}</span>}
      {children}
    </span>
  );
}
