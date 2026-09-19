import { useState } from 'react';
import { ArrowRight, LogOut, Volume2, VolumeX, Copy, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
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
  const { soundEnabled, toggleSound } = useSound();
  const { showToast } = useToast();
  const [profileOpen, setProfileOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    showToast({ message: 'تم نسخ كود الغرفة', type: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const iconBtn: React.CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: '#FFF0D4',
    border: '2px solid #1A1A1A',
    color: '#1A1A1A',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '2px 2px 0px #1A1A1A',
    transition: 'all 0.15s ease',
  };

  return (
    <>
      <header className="hv-navbar">
        <div className="hv-navbar-inner">
          {/* Logo / title — inline-start */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: '1 1 auto' }}>
            {onBack && (
              <button type="button" onClick={onBack} style={iconBtn} title={backLabel} aria-label={backLabel}>
                <ArrowRight style={{ width: 17, height: 17 }} />
              </button>
            )}
            {onLeave && (
              <button
                type="button"
                onClick={onLeave}
                className="hv-btn hv-btn-sm"
                style={{ background: '#FFE5E5', border: '2px solid #1A1A1A', color: '#D32F2F', minHeight: 38, padding: '6px 12px', boxShadow: '2px 2px 0px #1A1A1A' }}
                title={leaveLabel}
              >
                <LogOut style={{ width: 15, height: 15 }} />
                <span className="hv-hide-mobile">{leaveLabel}</span>
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <img
                src="/images/logo.png"
                alt="اعرف صاحبك وعلّم عليه"
                className="h-8 sm:h-10 w-auto object-contain shrink-0"
              />
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 'clamp(14px, 3.8vw, 17px)',
                  color: '#1A1A1A',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title || 'اعرف صاحبك'}
              </span>
            </div>
          </div>

          {/* Room code chip — always visible on all devices */}
          {roomCode && (
            <button
              type="button"
              onClick={handleCopyCode}
              title="اضغط لنسخ كود الغرفة"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 9999,
                background: '#FFF0D4',
                border: '2px solid #1A1A1A',
                boxShadow: '2px 2px 0px #1A1A1A',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <span className="hv-hide-mobile" style={{ fontSize: 12, color: '#1A1A1A', fontWeight: 700 }}>كود:</span>
              <span className="room-code" style={{ color: '#33A9AC', fontSize: 'clamp(12px, 3.5vw, 14px)', fontWeight: 900, letterSpacing: '0.05em' }}>
                {roomCode}
              </span>
              {copied ? (
                <Check style={{ width: 13, height: 13, color: '#4CAF50' }} />
              ) : (
                <Copy style={{ width: 13, height: 13, color: '#1A1A1A' }} />
              )}
            </button>
          )}

          {/* Sound + profile — inline-end */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button type="button" onClick={toggleSound} style={iconBtn} title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'} aria-label="التحكم في الصوت">
              {soundEnabled ? (
                <Volume2 style={{ width: 17, height: 17, color: '#33A9AC' }} />
              ) : (
                <VolumeX style={{ width: 17, height: 17, color: '#666666' }} />
              )}
            </button>
            {isAuthenticated && user && (
              <button
                type="button"
                onClick={onOpenProfile || (() => setProfileOpen(true))}
                style={{
                  height: 38,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0 16px',
                  borderRadius: 10,
                  background: '#FFF0D4',
                  border: '2px solid #1A1A1A',
                  boxShadow: '2px 2px 0px #1A1A1A',
                  cursor: 'pointer',
                }}
                title="الملف الشخصي"
              >
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
