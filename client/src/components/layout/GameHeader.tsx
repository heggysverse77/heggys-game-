import { useState } from 'react';
import { ArrowRight, LogOut, Volume2, VolumeX, Copy, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useGame } from '../../hooks/useGame';
import { useSound } from '../../hooks/useSound';
import { useToast } from '../ui/Toast';
import UserProfileModal from '../profile/UserProfileModal';

interface GameHeaderProps {
  title?: string;
  roomCode?: string;
  onBack?: () => void;
  backLabel?: string;
  onLeave?: () => void;
  leaveLabel?: string;
  onLogout?: () => void;
  onOpenProfile?: () => void;
}

export default function GameHeader({
  title,
  roomCode,
  onBack,
  backLabel = 'رجوع',
  onLeave,
  leaveLabel = 'مغادرة الغرفة',
  onLogout,
  onOpenProfile,
}: GameHeaderProps) {
  const { user, isAuthenticated } = useAuth();
  const { game } = useGame();
  const { soundEnabled, toggleSound } = useSound();
  const { showToast } = useToast();
  const [profileOpen, setProfileOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayRoomCode =
    roomCode ||
    game?.room_code ||
    (() => {
      try {
        const saved = localStorage.getItem('heggy_active_room');
        return saved ? JSON.parse(saved).roomCode : '';
      } catch {
        return '';
      }
    })() ||
    (() => {
      try {
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          return params.get('code') || params.get('room') || '';
        }
        return '';
      } catch {
        return '';
      }
    })();

  const handleCopyCode = () => {
    if (!displayRoomCode) return;
    navigator.clipboard.writeText(displayRoomCode);
    setCopied(true);
    showToast({ message: 'تم نسخ كود الغرفة', type: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const iconBtn: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: '#FEF3C7',
    border: '2px solid #1C1917',
    color: '#1C1917',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '2px 2px 0px #1C1917',
    transition: 'all 0.15s ease',
  };

  return (
    <>
      <header className="hv-navbar">
        <div className="hv-navbar-inner">
          {/* Logo / title — inline-start */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: '0 1 auto' }}>
            {onBack && (
              <button type="button" onClick={onBack} style={iconBtn} title={backLabel} aria-label={backLabel}>
                <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            )}
            {onLeave && (
              <button
                type="button"
                onClick={onLeave}
                className="hv-btn hv-btn-sm"
                style={{
                  background: '#FEE2E2',
                  border: '2px solid #1C1917',
                  color: '#B91C1C',
                  height: 36,
                  padding: '4px 8px',
                  boxShadow: '2px 2px 0px #1C1917',
                  flexShrink: 0,
                  fontSize: 12,
                }}
                title={leaveLabel}
              >
                <LogOut style={{ width: 14, height: 14 }} />
                <span className="hv-hide-mobile">{leaveLabel}</span>
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <div className="relative [perspective:600px] cursor-pointer">
                <img
                  src="/images/logo.png?v=20260920b"
                  alt="اعرف صاحبك"
                  className="h-7 sm:h-9 w-auto object-contain shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] [transform-style:preserve-3d] hover:[transform:rotateY(180deg)_scale(1.15)] active:scale-95"
                />
              </div>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 'clamp(12px, 3.2vw, 16px)',
                  color: '#1C1917',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 'clamp(80px, 20vw, 220px)',
                }}
              >
                {title || 'اعرف صاحبك'}
              </span>
            </div>
          </div>

          {/* Room code chip — ALWAYS visible on all devices (mobile & desktop) */}
          {displayRoomCode ? (
            <button
              type="button"
              onClick={handleCopyCode}
              title="اضغط لنسخ كود الغرفة"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 9999,
                background: '#FEF3C7',
                border: '2px solid #1C1917',
                boxShadow: '2px 2px 0px #1C1917',
                cursor: 'pointer',
                flexShrink: 0,
                zIndex: 10,
              }}
            >
              <span style={{ fontSize: 11, color: '#1C1917', fontWeight: 800 }}>كود:</span>
              <span className="room-code" style={{ color: '#0D9488', fontSize: 'clamp(12px, 3.6vw, 15px)', fontWeight: 900, letterSpacing: '0.05em' }}>
                {displayRoomCode}
              </span>
              {copied ? (
                <Check style={{ width: 13, height: 13, color: '#10B981' }} />
              ) : (
                <Copy style={{ width: 13, height: 13, color: '#1C1917' }} />
              )}
            </button>
          ) : null}

          {/* Sound + profile — inline-end */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <button type="button" onClick={toggleSound} style={iconBtn} title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'} aria-label="التحكم في الصوت">
              {soundEnabled ? (
                <Volume2 style={{ width: 16, height: 16, color: '#0D9488' }} />
              ) : (
                <VolumeX style={{ width: 16, height: 16, color: '#78716C' }} />
              )}
            </button>
            {isAuthenticated && user && (
              <button
                type="button"
                onClick={onOpenProfile || (() => setProfileOpen(true))}
                style={{
                  height: 36,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '0 10px',
                  borderRadius: 10,
                  background: '#FEF3C7',
                  border: '2px solid #1C1917',
                  boxShadow: '2px 2px 0px #1C1917',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                title="الملف الشخصي"
              >
                <span style={{ fontSize: 13, fontWeight: 800, color: '#1C1917', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.username}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>


      <UserProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} onLogout={onLogout} />
    </>
  );
}
