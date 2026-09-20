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
            <div className="relative [perspective:600px] cursor-pointer">
              <img
                src="/images/logo.png?v=20260920b"
                alt="اعرف صاحبك وعلّم عليه"
                className="transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] [transform-style:preserve-3d] hover:[transform:rotateY(180deg)_scale(1.15)] active:scale-95"
                style={{
                  height: 38,
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
                }}
              />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="hv-logo" style={{ fontSize: 20, lineHeight: 1.2 }}>
              {title === 'HeggyVerse' ? 'اعرف صاحبك' : title}
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
