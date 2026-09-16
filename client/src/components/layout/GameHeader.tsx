import { useState } from 'react';
import { ArrowRight, LogOut, Volume2, VolumeX, Copy, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSound } from '../../hooks/useSound';
import { useToast } from '../ui/Toast';
import Avatar from '../ui/Avatar';
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
    width: 40,
    height: 40,
    borderRadius: 8,
    background: 'transparent',
    border: '1px solid #424242',
    color: '#E0E0E0',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  };

  return (
    <>
      <header className="hv-navbar">
        <div className="hv-navbar-inner">
          {/* Logo / title — inline-start */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {onBack && (
              <button type="button" onClick={onBack} style={iconBtn} title={backLabel} aria-label={backLabel}>
                <ArrowRight style={{ width: 18, height: 18 }} />
              </button>
            )}
            {onLeave && (
              <button
                type="button"
                onClick={onLeave}
                className="hv-btn hv-btn-sm"
                style={{ background: 'rgba(244,67,54,0.12)', border: '1px solid rgba(244,67,54,0.4)', color: '#EF9A9A' }}
                title={leaveLabel}
              >
                <LogOut style={{ width: 15, height: 15 }} />
                <span className="hv-hide-mobile">{leaveLabel}</span>
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div className="hv-logo-mark">H</div>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 18,
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title || 'HeggyVerse'}
              </span>
            </div>
          </div>

          {/* Room code chip */}
          {roomCode && (
            <button
              type="button"
              onClick={handleCopyCode}
              title="اضغط لنسخ الكود"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 9999,
                background: 'rgba(51,169,172,0.08)',
                border: '1px solid rgba(51,169,172,0.3)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <span className="hv-hide-mobile" style={{ fontSize: 12, color: '#9E9E9E', fontWeight: 600 }}>كود الغرفة:</span>
              <span className="room-code" style={{ color: '#6FCFD1', fontSize: 14 }}>{roomCode}</span>
              {copied ? (
                <Check style={{ width: 14, height: 14, color: '#4CAF50' }} />
              ) : (
                <Copy style={{ width: 14, height: 14, color: '#9E9E9E' }} />
              )}
            </button>
          )}

          {/* Sound + profile — inline-end */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button type="button" onClick={toggleSound} style={iconBtn} title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'} aria-label="التحكم في الصوت">
              {soundEnabled ? (
                <Volume2 style={{ width: 17, height: 17, color: '#33A9AC' }} />
              ) : (
                <VolumeX style={{ width: 17, height: 17, color: '#9E9E9E' }} />
              )}
            </button>
            {isAuthenticated && user && (
              <button
                type="button"
                onClick={onOpenProfile || (() => setProfileOpen(true))}
                style={{
                  height: 40,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0 12px 0 8px',
                  borderRadius: 8,
                  background: '#1E1E1E',
                  border: '1px solid #424242',
                  cursor: 'pointer',
                }}
                title="الملف الشخصي"
              >
                <Avatar avatarId={user.avatar_id} size="xs" ring="none" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
