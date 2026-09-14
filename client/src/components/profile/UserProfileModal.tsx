import { useState, useEffect } from 'react';
import { Save, LogOut, X, UserRound, Sparkles } from 'lucide-react';
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

  const selectedAvatarMeta = AVATAR_LIST.find((a) => a.id === avatarId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/75 backdrop-blur-sm animate-[fadeIn_0.15s_ease] overflow-y-auto"
      dir="rtl"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-[min(94vw,580px)] max-h-[min(90vh,820px)] my-auto bg-[#FFF6E5] text-[#1A1A1A] border-3 border-[#1A1A1A] rounded-2xl sm:rounded-3xl shadow-[6px_6px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] flex flex-col overflow-hidden text-right select-none animate-[pop_0.2s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b-2.5 border-[#1A1A1A] bg-[#FFF6E5] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#F6BD60] border-2 border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] shrink-0">
              <UserRound className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-display font-black text-[#1A1A1A] truncate">
                الملف الشخصي
              </h2>
              <p className="text-xs sm:text-sm text-[#1A1A1A]/70 font-body font-bold mt-0.5">
                تعديل الاسم واختيار الشخصية الرمزية
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#F28482] hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 2. Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 custom-scrollbar flex flex-col gap-5">
          {/* Avatar Live Preview */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border-2.5 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A]">
            <Avatar
              avatarId={avatarId}
              nickname={username || 'أنت'}
              size="lg"
              ring="none"
              className="border-2.5 border-[#1A1A1A] shrink-0 w-16 h-16 sm:w-18 sm:h-18"
            />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="self-start text-[11px] font-black px-3 py-0.5 rounded-full bg-[#F6BD60] text-[#1A1A1A] border-1.5 border-[#1A1A1A]">
                {selectedAvatarMeta?.name || 'شخصية فرعونية'}
              </span>
              <h3 className="text-lg sm:text-xl font-display font-black text-[#1A1A1A] truncate">
                {username || 'اسم اللاعب'}
              </h3>
              <p className="text-xs text-[#1A1A1A]/70 font-body font-bold">
                {user?.is_guest ? 'حساب ضيف مؤقت' : 'لاعب مسجل'}
              </p>
            </div>
          </div>

          {/* Nickname Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-body font-black text-[#1A1A1A]">
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
              className="w-full h-13 sm:h-14 rounded-xl sm:rounded-2xl bg-white border-2.5 border-[#1A1A1A] text-[#1A1A1A] font-body font-bold text-base sm:text-lg px-4 outline-none shadow-inner text-right focus:ring-3 focus:ring-[#F6BD60]/50 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            {error && <span className="text-xs sm:text-sm text-red-600 font-bold">{error}</span>}
          </div>

          {/* Avatar Selector Grid */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-body font-black text-[#1A1A1A]">
              اختر الشخصية الرمزية:
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 max-h-48 overflow-y-auto p-3 bg-white rounded-2xl border-2.5 border-[#1A1A1A] custom-scrollbar shadow-inner">
              {AVATAR_LIST.map((item) => {
                const isSelected = avatarId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAvatarId(item.id)}
                    className={[
                      'p-2 rounded-xl transition-all cursor-pointer flex flex-col items-center border-2',
                      isSelected
                        ? 'bg-[#F6BD60] border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] scale-105'
                        : 'bg-[#FFF9EE] border-transparent hover:border-[#1A1A1A]/40',
                    ].join(' ')}
                  >
                    <Avatar avatarId={item.id} size="md" ring="none" />
                    <span className="text-[11px] text-[#1A1A1A] font-body font-bold mt-1 truncate max-w-full">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Footer */}
        <div className="px-5 sm:px-7 py-3.5 sm:py-4 border-t-2.5 border-[#1A1A1A] bg-[#FFF6E5] flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleLogoutClick}
            className="h-11 px-4 rounded-xl bg-white hover:bg-red-50 text-red-600 border-2 border-[#1A1A1A] font-body font-black text-xs sm:text-sm shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 rounded-xl bg-white text-[#1A1A1A] hover:bg-neutral-100 border-2 border-[#1A1A1A] font-body font-black text-xs sm:text-sm shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-11 px-6 rounded-xl comic-btn-gold font-body font-black text-sm sm:text-base border-2.5 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
