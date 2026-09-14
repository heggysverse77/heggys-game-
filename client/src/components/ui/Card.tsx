import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'cream' | 'white' | 'gold' | 'pink' | 'teal';
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
}

const variantClasses = {
  cream: 'bg-[#FFF6E5] text-[#1A1A1A] border-2.5 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_#1A1A1A]',
  white: 'bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A]',
  gold:  'bg-[#F6BD60] text-[#1A1A1A] border-2.5 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_#1A1A1A]',
  pink:  'bg-[#F28482] text-white border-2.5 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_#1A1A1A]',
  teal:  'bg-[#38A3A5] text-white border-2.5 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] sm:shadow-[6px_6px_0px_#1A1A1A]',
};

const paddingClasses = {
  none: '',
  sm:   'p-4',
  md:   'p-5 sm:p-6',
  lg:   'p-6 sm:p-8 md:p-10',
  xl:   'p-8 sm:p-10 md:p-12',
};

export default function Card({
  children,
  className = '',
  variant = 'cream',
  onClick,
  padding = 'lg',
}: CardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={[
        'rounded-2xl sm:rounded-3xl transition-all duration-150',
        variantClasses[variant],
        paddingClasses[padding],
        onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[8px_8px_0px_#1A1A1A] active:translate-y-0.5' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
