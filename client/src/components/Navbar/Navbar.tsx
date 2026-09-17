import type { ReactNode } from 'react';

interface NavbarProps {
  logo?: ReactNode;
  title?: string;
  roomCode?: string;
  onCopyRoomCode?: () => void;
  actions?: ReactNode;
  profile?: ReactNode;
  leading?: ReactNode;
}

export default function Navbar({
  logo,
  title = 'HeggyVerse',
  roomCode,
  onCopyRoomCode,
  actions,
  profile,
  leading,
}: NavbarProps) {
  return (
    <header className="hv-navbar">
      <div className="hv-navbar-inner">
        {/* Logo — inline-start (right in RTL, left in LTR) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          {leading}
          {logo ?? (
            <img
              src="/images/logo.png"
              alt="اعرف صاحبك وعلّم عليه"
              style={{
                height: 38,
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
              }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="hv-logo" style={{ fontSize: 20, lineHeight: 1.2 }}>
              {title === 'HeggyVerse' ? 'اعرف صاحبك' : title}
            </span>
            <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#33A9AC' }}>
              a3raf-sa7bak.heggyverse.online
            </span>
          </div>
          {roomCode && (
            <button
              type="button"
              onClick={onCopyRoomCode}
              title="نسخ كود الغرفة"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 9999,
                background: 'rgba(51,169,172,0.1)',
                border: '1px solid rgba(51,169,172,0.35)',
                color: '#6FCFD1',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span className="room-code">{roomCode}</span>
            </button>
          )}
        </div>

        {/* Actions + Profile — inline-end */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {actions}
          {profile}
        </div>
      </div>
    </header>
  );
}
