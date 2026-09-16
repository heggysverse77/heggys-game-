import type { ReactNode } from 'react';

interface GameLayoutProps {
  children: ReactNode;
  className?: string;
  hideBg?: boolean;
}

export default function GameLayout({ children, className = '' }: GameLayoutProps) {
  return (
    <div
      style={{ minHeight: '100dvh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      dir="rtl"
    >
      {/* Futuristic ambient glows — orange / teal / accent on #121212 */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(1000px 480px at 50% -8%, rgba(52,55,121,0.22), transparent 62%), radial-gradient(900px 420px at 85% -5%, rgba(255,166,70,0.10), transparent 60%), radial-gradient(800px 420px at 10% 0%, rgba(51,169,172,0.10), transparent 60%)',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingTop: 0, paddingBottom: 48 }} className={className}>
        {children}
      </div>
    </div>
  );
}
