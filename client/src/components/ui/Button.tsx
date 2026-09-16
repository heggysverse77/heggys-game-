import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant =
  | 'primary'
  | 'pink'
  | 'teal'
  | 'cyan'
  | 'gold'
  | 'white'
  | 'secondary'
  | 'ghost'
  | 'danger';

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
  primary: 'hv-btn-primary',
  pink: 'hv-btn-primary',
  teal: 'hv-btn-secondary',
  cyan: 'hv-btn-secondary',
  gold: 'hv-btn-accent',
  white: 'hv-btn-ghost',
  secondary: 'hv-btn-ghost',
  ghost: 'hv-btn-ghost',
  danger: 'hv-btn-primary',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'hv-btn-sm',
  md: '',
  lg: 'hv-btn-lg',
  xl: 'hv-btn-lg',
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
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const dangerStyle =
    variant === 'danger'
      ? { background: 'linear-gradient(135deg,#F44336,#D32F2F)', color: '#fff', ...style }
      : variant === 'white'
        ? { background: '#E0E0E0', color: '#121212', borderColor: '#E0E0E0', ...style }
        : style;

  return (
    <button
      disabled={isDisabled}
      className={[
        'hv-btn',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'hv-btn-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={dangerStyle}
      {...props}
    >
      {loading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 16,
              height: 16,
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.7s linear infinite',
            }}
          />
          <span>{children}</span>
        </span>
      ) : (
        <>
          {icon && <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
