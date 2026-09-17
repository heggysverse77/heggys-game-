import type { ReactNode } from 'react';

interface GameLayoutProps {
  children: ReactNode;
  className?: string;
  hideBg?: boolean;
}

export default function GameLayout({ children, className = '' }: GameLayoutProps) {
  return (
    <div
      style={{ minHeight: '100dvh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
      dir="rtl"
    >
      {/* Retro Comic City Background Wallpaper */}
      <div aria-hidden="true" className="hv-bg-wallpaper" />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingTop: 0, paddingBottom: 48 }} className={className}>
        {children}
      </div>
    </div>
  );
}
