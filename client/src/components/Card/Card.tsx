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
  suit?: 'spade' | 'heart' | 'club' | 'diamond' | 'none';
  rank?: string;
}

const variantClasses: Record<string, string> = {
  default: '',
  'glow-orange': 'hv-card-glow-orange',
  'glow-teal': 'hv-card-glow-teal',
  winner: 'hv-card-winner',
  active: 'hv-card-active',
  'gradient-border': 'hv-gradient-border',
};

const suitSymbols: Record<string, { icon: string; color: string }> = {
  spade: { icon: '♠', color: '#1C1917' },
  heart: { icon: '♥', color: '#DC2626' },
  club: { icon: '♣', color: '#1C1917' },
  diamond: { icon: '♦', color: '#DC2626' },
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
  suit = 'spade',
  rank = 'A',
}: CardProps) {
  const suitInfo = suit !== 'none' ? suitSymbols[suit] || suitSymbols.spade : null;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={['hv-card hv-playing-card relative overflow-hidden', onClick ? 'hv-card-clickable' : '', variantClasses[variant], className]
        .filter(Boolean)
        .join(' ')}
      style={{ ...(padding !== undefined ? { padding } : undefined), ...style }}
    >
      {/* ── Western Playing Card Inner Inset Double Border ── */}
      <div className="hv-card-inner-frame pointer-events-none absolute inset-2 sm:inset-2.5 rounded-xl border border-[#1C1917]/20 border-dashed" />

      {/* ── Top-Right Playing Card Suit & Rank (RTL Top-Leading) ── */}
      {suitInfo && (
        <div 
          className="pointer-events-none absolute top-2 right-2.5 flex flex-col items-center leading-none select-none opacity-60 sm:opacity-75 z-0"
          style={{ color: suitInfo.color }}
        >
          <span className="font-mono text-xs sm:text-sm font-black tracking-tighter">{rank}</span>
          <span className="text-xs sm:text-sm">{suitInfo.icon}</span>
        </div>
      )}

      {/* ── Bottom-Left Playing Card Suit & Rank (Upside-Down Diagonal) ── */}
      {suitInfo && (
        <div 
          className="pointer-events-none absolute bottom-2 left-2.5 flex flex-col items-center leading-none select-none opacity-60 sm:opacity-75 z-0 rotate-180"
          style={{ color: suitInfo.color }}
        >
          <span className="font-mono text-xs sm:text-sm font-black tracking-tighter">{rank}</span>
          <span className="text-xs sm:text-sm">{suitInfo.icon}</span>
        </div>
      )}

      {/* ── Card Content ── */}
      <div className="relative z-10 w-full">
        {(title || subtitle) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {title && <h3 className="hv-card-title">{title}</h3>}
            {subtitle && <p className="hv-card-subtitle">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
