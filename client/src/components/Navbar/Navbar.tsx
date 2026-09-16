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
          {logo ?? <div className="hv-logo-mark">H</div>}
          <span className="hv-logo" style={{ fontSize: 20 }}>
            {title}
          </span>
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
