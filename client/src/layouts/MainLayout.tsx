import type { ReactNode } from 'react';
import Navbar from '../components/Navbar/Navbar';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  roomCode?: string;
  onCopyRoomCode?: () => void;
  navbarActions?: ReactNode;
  navbarProfile?: ReactNode;
  navbarLeading?: ReactNode;
  showFooter?: boolean;
  className?: string;
}

export default function MainLayout({
  children,
  title,
  roomCode,
  onCopyRoomCode,
  navbarActions,
  navbarProfile,
  navbarLeading,
  showFooter = false,
  className = '',
}: MainLayoutProps) {
  return (
    <div
      style={{ minHeight: '100dvh', width: '100%', display: 'flex', flexDirection: 'column' }}
      dir="rtl"
    >
      <Navbar
        title={title}
        roomCode={roomCode}
        onCopyRoomCode={onCopyRoomCode}
        actions={navbarActions}
        profile={navbarProfile}
        leading={navbarLeading}
      />
      <main
        className={`hv-container ${className}`}
        style={{ flex: 1, width: '100%', paddingTop: 32, paddingBottom: 64 }}
      >
        {children}
      </main>
      {showFooter && (
        <footer
          style={{
            borderTop: '1px solid #2A2A2A',
            padding: '24px 0',
            textAlign: 'center',
            color: '#9E9E9E',
            fontSize: 12,
          }}
        >
          <div className="hv-container">HeggyVerse — العب بصراحة، خمّن بذكاء</div>
        </footer>
      )}
    </div>
  );
}
