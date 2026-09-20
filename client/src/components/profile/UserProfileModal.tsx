import { useState, useEffect } from 'react';
import { Save, LogOut, X, UserRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ui/Toast';
import { AVATAR_LIST } from '../../utils/avatar.utils';
import Avatar from '../ui/Avatar';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  gameId?: string;
}

export default function UserProfileModal({ isOpen, onClose, onLogout, gameId }: UserProfileModalProps) {
  const { user, updateProfile, logout } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState(user?.username ?? '');
  const [avatarId, setAvatarId] = useState(user?.avatar_id ?? 'avatar_1');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setAvatarId(user.avatar_id ?? 'avatar_1');
      setError('');
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const trimmed = username.trim();
    if (!trimmed || trimmed.length < 2) {
      setError('الاسم يجب أن يكون حرفين على الأقل');
      return;
    }
    if (trimmed.length > 20) {
      setError('الاسم لا يمكن أن يتجاوز 20 حرف');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(trimmed, avatarId, gameId);
      showToast({ message: 'تم حفظ تعديلات شخصيتك بنجاح', type: 'success' });
      onClose();
    } catch {
      showToast({ message: 'حدث خطأ أثناء حفظ التعديلات', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutClick = () => {
    logout();
    if (onLogout) onLogout();
    onClose();
    showToast({ message: 'تم تسجيل الخروج', type: 'info' });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/75 backdrop-blur-sm animate-[fadeIn_0.15s_ease] overflow-y-auto"
      dir="rtl"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-[min(94vw,580px)] max-h-[min(90vh,820px)] my-auto bg-[#FFF8EB] text-[#1C1917] border-3 border-[#1C1917] rounded-2xl sm:rounded-3xl shadow-[6px_6px_0px_#1C1917] sm:shadow-[8px_8px_0px_#1C1917] flex flex-col overflow-hidden text-right select-none animate-[pop_0.2s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b-2.5 border-[#1C1917] bg-[#FEF3C7] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#F59E0B] border-2 border-[#1C1917] flex items-center justify-center text-[#1C1917] shadow-[2px_2px_0px_#1C1917] shrink-0">
              <UserRound className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-display font-black text-[#1C1917] truncate">
                الملف الشخصي
              </h2>
              <p className="text-xs sm:text-sm text-[#1C1917]/70 font-body font-bold mt-0.5">
                تعديل الاسم واختيار شخصية الغرب الأمريكي
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border-2 border-[#1C1917] text-[#1C1917] hover:bg-[#EA580C] hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-[2px_2px_0px_#1C1917] active:translate-y-0.5"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 2. Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 custom-scrollbar flex flex-col gap-5">
          {/* Avatar Live Preview */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border-2.5 border-[#1C1917] shadow-[3px_3px_0px_#1C1917]">
            <Avatar
              avatarId={avatarId}
              nickname={username || 'أنت'}
              size="lg"
              ring="none"
              className="border-2.5 border-[#1C1917] shrink-0 w-16 h-16 sm:w-18 sm:h-18"
            />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="self-start text-xs sm:text-sm font-black px-4 py-1 rounded-full bg-[#F59E0B] text-[#1C1917] border-2 border-[#1C1917] shadow-xs">
                الشخصية الرمزية المختارة
              </span>
              <h3 className="text-lg sm:text-xl font-display font-black text-[#1C1917] truncate">
                {username || 'اسم اللاعب'}
              </h3>
              <p className="text-xs text-[#1C1917]/70 font-body font-bold">
                {user?.is_guest ? 'حساب ضيف مؤقت' : 'لاعب مسجل'}
              </p>
            </div>
          </div>

          {/* Nickname Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-body font-black text-[#1C1917]">
              اسم اللاعب في اللعبة
            </label>
            <input
              type="text"
              placeholder="اكتب اسمك هنا..."
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              maxLength={20}
              className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-white border-2.5 border-[#1C1917] text-[#1C1917] font-body font-bold text-sm sm:text-base px-4 outline-none shadow-inner text-right focus:ring-3 focus:ring-[#F59E0B]/50 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            {error && <span className="text-xs text-red-600 font-bold">{error}</span>}
          </div>

          {/* Avatar Selector Grid */}
          <div className="flex flex-col gap-2">
            <label className="text-xs sm:text-sm font-body font-black text-[#1C1917]">
              اختر شخصيتك الرمزية (Wild West):
            </label>
            <div className="grid grid-cols-5 gap-2.5 p-3 bg-white rounded-2xl border-2.5 border-[#1C1917] shadow-inner">
              {AVATAR_LIST.map((item) => {
                const isSelected = avatarId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAvatarId(item.id)}
                    className={[
                      'p-2 rounded-2xl transition-all cursor-pointer flex items-center justify-center border-2.5',
                      isSelected
                        ? 'bg-[#F59E0B] border-[#1C1917] shadow-[2.5px_2.5px_0px_#1C1917] scale-110'
                        : 'bg-[#FFF8EB] border-transparent hover:border-[#1C1917]/40 hover:scale-105',
                    ].join(' ')}
                    title={item.name}
                  >
                    <Avatar avatarId={item.id} size="md" ring="none" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Footer */}
        <div className="px-5 sm:px-7 py-3 sm:py-3.5 border-t-2.5 border-[#1C1917] bg-[#FEF3C7] flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleLogoutClick}
            className="h-10 sm:h-10.5 px-3.5 rounded-xl bg-white hover:bg-red-50 text-red-600 border-2 border-[#1C1917] font-body font-black text-xs shadow-[2px_2px_0px_#1C1917] active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 sm:h-10.5 px-3.5 rounded-xl bg-white text-[#1C1917] hover:bg-amber-50 border-2 border-[#1C1917] font-body font-black text-xs shadow-[2px_2px_0px_#1C1917] active:translate-y-0.5 transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-10 sm:h-10.5 px-5 rounded-xl comic-btn-gold font-body font-black text-xs sm:text-sm border-2 border-[#1C1917] shadow-[2.5px_2.5px_0px_#1C1917] active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
