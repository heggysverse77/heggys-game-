import { useState } from 'react';
import {
  ArrowRight,
  LogOut,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Flame,
} from 'lucide-react';
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

  return (
    <>
      <header className="w-full bg-[#FFF6E5] border-b-2.5 border-[#1A1A1A] sticky top-0 z-40 shadow-sm select-none">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-4">
          
          {/* Right: Back / Leave button & Brand Title */}
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="h-10 px-3.5 rounded-xl bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] font-body font-black text-xs sm:text-sm transition-all hover:bg-neutral-50 active:translate-y-0.5 cursor-pointer shadow-[2px_2px_0px_#1A1A1A] flex items-center gap-1.5"
                title={backLabel}
              >
                <ArrowRight className="w-4 h-4" />
                <span>{backLabel}</span>
              </button>
            )}

            {onLeave && (
              <button
                type="button"
                onClick={onLeave}
                className="h-10 px-3.5 rounded-xl bg-[#F28482] text-white border-2 border-[#1A1A1A] font-body font-black text-xs sm:text-sm transition-all hover:bg-[#E86A68] active:translate-y-0.5 cursor-pointer shadow-[2px_2px_0px_#1A1A1A] flex items-center gap-1.5"
                title={leaveLabel}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{leaveLabel}</span>
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#F6BD60] border-2 border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] shadow-xs shrink-0">
                <Flame className="w-5 h-5 fill-[#1A1A1A]" />
              </div>
              <span className="font-display font-black text-base sm:text-lg text-[#1A1A1A] leading-tight truncate">
                {title || 'اعرف صاحبك'}
              </span>
            </div>
          </div>

          {/* Center: Room Code Chip (if in room) */}
          {roomCode && (
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border-2 border-[#1A1A1A] transition-all cursor-pointer shadow-[2px_2px_0px_#1A1A1A] hover:bg-neutral-50 active:translate-y-0.5 shrink-0"
              title="اضغط لنسخ الكود"
            >
              <span className="text-xs text-[#1A1A1A]/70 font-bold hidden sm:inline">كود الغرفة:</span>
              <span className="room-code text-sm sm:text-base text-[#F28482]">{roomCode}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-[#1A1A1A]" />}
            </button>
          )}

          {/* Left: Sound toggle & User profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={toggleSound}
              className="w-10 h-10 rounded-xl bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] flex items-center justify-center hover:bg-neutral-50 active:translate-y-0.5 transition-all cursor-pointer shadow-[2px_2px_0px_#1A1A1A]"
              title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
              aria-label="التحكم في الصوت"
            >
              {soundEnabled ? (
                <Volume2 className="w-4.5 h-4.5 text-[#38A3A5]" />
              ) : (
                <VolumeX className="w-4.5 h-4.5 text-neutral-400" />
              )}
            </button>

            {isAuthenticated && user && (
              <button
                type="button"
                onClick={onOpenProfile || (() => setProfileOpen(true))}
                className="h-10 flex items-center gap-2 px-2.5 sm:px-3 rounded-xl bg-white border-2 border-[#1A1A1A] hover:bg-neutral-50 active:translate-y-0.5 transition-all cursor-pointer shadow-[2px_2px_0px_#1A1A1A]"
                title="الملف الشخصي"
              >
                <Avatar avatarId={user.avatar_id} size="sm" ring="none" />
                <span className="text-xs sm:text-sm font-display font-black text-[#1A1A1A] max-w-[90px] truncate hidden sm:inline">
                  {user.username}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Embedded profile modal if opened from header */}
      <UserProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        onLogout={onLogout}
      />
    </>
  );
}
