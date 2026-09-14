import type { ReactNode } from 'react';

type BadgeVariant =
  | 'host'
  | 'ready'
  | 'waiting'
  | 'rank1'
  | 'rank2'
  | 'rank3'
  | 'dare-mild'
  | 'dare-spicy'
  | 'dare-chaos'
  | 'custom';

type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children?: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  host:        'bg-[#F28482] text-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]',
  ready:       'bg-[#38A3A5] text-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]',
  waiting:     'bg-white text-[#1A1A1A]/70 border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]',
  rank1:       'bg-[#F6BD60] text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]',
  rank2:       'bg-[#FFF6E5] text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]',
  rank3:       'bg-[#F5CAC3] text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]',
  'dare-mild':  'bg-[#38A3A5] text-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]',
  'dare-spicy': 'bg-[#F6BD60] text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]',
  'dare-chaos': 'bg-[#F28482] text-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]',
  custom:      'bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-3 py-1 text-xs gap-1.5',
  md: 'px-4 py-1.5 text-sm gap-2',
  lg: 'px-5 py-2 text-base gap-2.5',
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
        'rounded-full font-body font-black inline-flex items-center justify-center shrink-0 select-none leading-none',
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

