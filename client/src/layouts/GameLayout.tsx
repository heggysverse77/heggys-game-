import type { ReactNode } from 'react';
import MainLayout from './MainLayout';

interface GameLayoutProps {
  children: ReactNode;
  title?: string;
  roomCode?: string;
  onCopyRoomCode?: () => void;
  navbarActions?: ReactNode;
  navbarProfile?: ReactNode;
  navbarLeading?: ReactNode;
  timerPercent?: number;
  timerState?: 'safe' | 'warn' | 'danger';
  className?: string;
}

export default function GameLayout({
  children,
  timerPercent,
  timerState = 'safe',
  ...rest
}: GameLayoutProps) {
  const fillClass =
    timerState === 'danger'
      ? 'hv-timer-fill hv-timer-fill-danger'
      : timerState === 'warn'
        ? 'hv-timer-fill hv-timer-fill-warn'
        : 'hv-timer-fill';

  return (
    <MainLayout {...rest}>
      {timerPercent !== undefined && (
        <div style={{ marginBottom: 24 }} role="progressbar" aria-valuenow={Math.round(timerPercent)}>
          <div className="hv-timer-track">
            <div className={fillClass} style={{ width: `${Math.max(0, Math.min(100, timerPercent))}%` }} />
          </div>
        </div>
      )}
      <div className={rest.className}>{children}</div>
    </MainLayout>
  );
}
