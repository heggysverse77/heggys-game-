import type { CSSProperties, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'cream' | 'white' | 'gold' | 'pink' | 'teal' | 'cyan' | 'dark';
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  style?: CSSProperties;
}

const variantClasses: Record<string, string> = {
  cream: '',
  white: '',
  gold: 'hv-card-glow-orange',
  pink: '',
  teal: 'hv-card-glow-teal',
  cyan: 'hv-card-glow-teal',
  dark: '',
};

const pinkStyle = {
  borderColor: 'rgba(255,166,70,0.35)',
  boxShadow: '0 2px 4px rgba(0,0,0,0.3), 0 0 28px rgba(255,166,70,0.12)',
};

export default function Card({
  children,
  className = '',
  variant = 'cream',
  onClick,
  padding = 'lg',
  style,
}: CardProps) {
  const paddingValue =
    padding === 'none' ? 0 : padding === 'sm' ? 16 : padding === 'md' ? 20 : 24;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={['hv-card', onClick ? 'hv-card-clickable' : '', variantClasses[variant], className]
        .filter(Boolean)
        .join(' ')}
      style={{ padding: paddingValue, ...(variant === 'pink' ? pinkStyle : undefined), ...style }}
    >
      {children}
    </div>
  );
}
