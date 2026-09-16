import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

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
  secondary: 'hv-btn-secondary',
  ghost: 'hv-btn-ghost',
  accent: 'hv-btn-accent',
  danger: 'hv-btn-primary',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'hv-btn-sm',
  md: '',
  lg: 'hv-btn-lg',
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
      : style;

  return (
    <button
      disabled={isDisabled}
      className={['hv-btn', variantClasses[variant], sizeClasses[size], fullWidth ? 'hv-btn-full' : '', className]
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
