import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'pink' | 'teal' | 'gold' | 'white' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'comic-btn-pink text-white font-display font-black',
  pink:      'comic-btn-pink text-white font-display font-black',
  teal:      'comic-btn-teal text-white font-display font-black',
  gold:      'comic-btn-gold text-[#1A1A1A] font-display font-black',
  white:     'comic-btn-white text-[#1A1A1A] font-display font-black',
  secondary: 'comic-btn-secondary text-[#1A1A1A] font-body font-black',
  ghost:     'bg-transparent hover:bg-[#1A1A1A]/10 text-[#1A1A1A] border-2 border-[#1A1A1A]/30 font-bold',
  danger:    'bg-red-500 hover:bg-red-600 text-white border-2.5 border-[#1A1A1A] font-black shadow-[3px_3px_0px_#1A1A1A]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-[40px] px-3.5 py-1.5 text-xs sm:text-sm gap-2 rounded-xl',
  md: 'min-h-[48px] px-5 py-2.5 text-sm sm:text-base gap-2.5 rounded-2xl',
  lg: 'min-h-[56px] px-7 py-3 text-base sm:text-lg gap-3 rounded-2xl',
  xl: 'min-h-[64px] px-9 py-3.5 text-lg sm:text-xl gap-3.5 rounded-3xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={[
        'font-body cursor-pointer leading-normal select-none transition-all duration-150',
        'inline-flex items-center justify-center min-w-fit shrink-0',
        'active:translate-y-0.5',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full !min-w-0' : '',
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2.5">
          <span className="w-5 h-5 border-2.5 border-current border-t-transparent rounded-full animate-spin" />
          <span>{children}</span>
        </span>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
