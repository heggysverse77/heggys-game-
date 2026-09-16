import type { CSSProperties, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glow-orange' | 'glow-teal' | 'winner' | 'active' | 'gradient-border';
  title?: string;
  subtitle?: string;
  onClick?: () => void;
  padding?: number;
  style?: CSSProperties;
}

const variantClasses: Record<string, string> = {
  default: '',
  'glow-orange': 'hv-card-glow-orange',
  'glow-teal': 'hv-card-glow-teal',
  winner: 'hv-card-winner',
  active: 'hv-card-active',
  'gradient-border': 'hv-gradient-border',
};

export default function Card({
  children,
  className = '',
  variant = 'default',
  title,
  subtitle,
  onClick,
  padding,
  style,
}: CardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={['hv-card', onClick ? 'hv-card-clickable' : '', variantClasses[variant], className]
        .filter(Boolean)
        .join(' ')}
      style={{ ...(padding !== undefined ? { padding } : undefined), ...style }}
    >
      {(title || subtitle) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {title && <h3 className="hv-card-title">{title}</h3>}
          {subtitle && <p className="hv-card-subtitle">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
