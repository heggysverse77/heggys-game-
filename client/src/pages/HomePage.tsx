import { useState } from 'react';
import {
  Sparkles,
  Flame,
  Plus,
  KeyRound,
  UserRound,
  LogIn,
  LogOut,
  HelpCircle,
  MessageSquare,
  Users,
  Swords,
} from 'lucide-react';
import GameLayout from '../components/layout/GameLayout';
import GameHeader from '../components/layout/GameHeader';
import Avatar from '../components/ui/Avatar';
import TypewriterLogo from '../components/ui/TypewriterLogo';
import UserProfileModal from '../components/profile/UserProfileModal';
import RoomSettingsModal from '../components/game/RoomSettingsModal';
import { AVATAR_LIST } from '../utils/avatar.utils';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import type { CreateGameOptions } from '../services/game.service';

type HomeTab = 'guest' | 'login';

interface HomePageProps {
  onEnterLobby: (opts: CreateGameOptions) => void;
  onJoinRoom: () => void;
}

export default function HomePage({ onEnterLobby, onJoinRoom }: HomePageProps) {
  const { user, loginAsGuest, loginWithCredentials, isLoading, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState<HomeTab>('guest');
  const [username, setUsername] = useState('');
  const [avatarId, setAvatarId] = useState('avatar_1');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);

  const validateGuest = () => {
    const e: Record<string, string> = {};
    const trimmed = username.trim();
    if (!trimmed || trimmed.length < 2) e.username = 'الاسم يجب أن يكون حرفين على الأقل';
    if (trimmed.length > 20) e.username = 'الاسم لا يتجاوز 20 حرف';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGuestLogin = async () => {
    if (!validateGuest()) return;
    try {
      await loginAsGuest(username.trim(), avatarId);
      showToast({ message: `أهلاً بك ${username.trim()}! جاهز للعب`, type: 'success' });
    } catch {
      showToast({ message: 'حدث خطأ، يرجى المحاولة مرة أخرى', type: 'error' });
    }
  };

  const handleLogin = async () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = 'البريد الإلكتروني مطلوب';
    if (!password) e.password = 'كلمة المرور مطلوبة';
    setErrors(e);
    if (Object.keys(e).length) return;

    try {
      await loginWithCredentials(email.trim(), password);
      showToast({ message: 'أهلاً بعودتك!', type: 'success' });
    } catch {
      showToast({ message: 'البريد أو كلمة المرور غير صحيحة', type: 'error' });
    }
  };

  const selectedAvatar = AVATAR_LIST.find((a) => a.id === avatarId);

  return (
    <GameLayout>
      {/* Top Navigation Header */}
      <GameHeader
        title="اعرف صاحبك"
        onOpenProfile={isAuthenticated ? () => setProfileModalOpen(true) : undefined}
        onLogout={isAuthenticated ? logout : undefined}
      />

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 flex flex-col gap-8 sm:gap-10 items-center text-center select-none" dir="rtl">
        
        {/* ── 1. HERO TITLE & INTRO ── */}
        <div className="flex flex-col items-center gap-4 max-w-3xl mx-auto animate-[slideUp_0.2s_ease]">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF6E5] border-2 border-[#1A1A1A] text-[#1A1A1A] text-xs sm:text-sm font-body font-black shadow-[2px_2px_0px_#1A1A1A]">
            <Flame className="w-4 h-4 text-[#F28482] shrink-0 fill-[#F28482]" />
            <span>لعبة التحديات والتخمين الجماعية للأصدقاء</span>
          </div>

          <TypewriterLogo size="hero" showBadge={false} />

          <p className="text-[#FFF6E5] font-body font-bold text-base sm:text-xl max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            جاوب على أسئلة حماسية.. خمّن إجابات أصحابك.. ونفّذ أحكام التحدي على الخاسرين!
          </p>
        </div>

        {/* ── 2. MAIN INTERACTIVE AREA ── */}
        <div className="w-full animate-[slideUp_0.3s_ease]">
          {!isAuthenticated ? (
            /* ── Unauthenticated State: Guest & Login Card ── */
            <div className="max-w-xl mx-auto bg-[#FFF6E5] text-[#1A1A1A] border-3 border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] p-6 sm:p-8 rounded-2xl sm:rounded-3xl text-right">
              {/* Tab Switcher */}
              <div className="flex rounded-xl bg-white p-1.5 mb-6 gap-2 border-2 border-[#1A1A1A] shadow-xs">
                <button
                  type="button"
                  onClick={() => setTab('guest')}
                  className={[
                    'flex-1 h-12 rounded-lg text-sm sm:text-base font-body font-black transition-all cursor-pointer flex items-center justify-center gap-2 select-none',
                    tab === 'guest'
                      ? 'comic-btn-gold !min-h-0 !p-0 shadow-[2px_2px_0px_#1A1A1A]'
                      : 'text-[#1A1A1A]/70 hover:text-[#1A1A1A]',
                  ].join(' ')}
                >
                  <UserRound className="w-4 h-4" />
                  <span>دخول سريع (ضيف)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className={[
                    'flex-1 h-12 rounded-lg text-sm sm:text-base font-body font-black transition-all cursor-pointer flex items-center justify-center gap-2 select-none',
                    tab === 'login'
                      ? 'comic-btn-pink !min-h-0 !p-0 shadow-[2px_2px_0px_#1A1A1A]'
                      : 'text-[#1A1A1A]/70 hover:text-[#1A1A1A]',
                  ].join(' ')}
                >
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </button>
              </div>

              {tab === 'guest' ? (
                <div className="flex flex-col gap-5 text-right">
                  {/* Avatar Picker Grid */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-0.5">
                      <label className="text-[#1A1A1A] font-body font-black text-sm sm:text-base">
                        اختر شخصيتك الرمزية:
                      </label>
                      <span className="text-xs font-black text-[#1A1A1A] bg-[#F6BD60] px-3 py-0.5 rounded-full border-1.5 border-[#1A1A1A]">
                        {selectedAvatar?.name}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-2 max-h-44 overflow-y-auto p-2.5 bg-white rounded-xl border-2 border-[#1A1A1A] custom-scrollbar shadow-inner">
                      {AVATAR_LIST.map((item) => {
                        const isSelected = avatarId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setAvatarId(item.id)}
                            className={[
                              'p-1.5 rounded-xl transition-all cursor-pointer flex flex-col items-center border-2',
                              isSelected
                                ? 'bg-[#F6BD60] border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] scale-105'
                                : 'bg-[#FFF9EE] border-transparent hover:border-[#1A1A1A]/30',
                            ].join(' ')}
                          >
                            <Avatar avatarId={item.id} size="md" ring="none" />
                            <span className="text-[10px] text-[#1A1A1A] font-body font-bold mt-1 truncate max-w-full">
                              {item.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nickname Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#1A1A1A] font-body font-black text-sm sm:text-base">
                      اسم اللاعب
                    </label>
                    <input
                      type="text"
                      placeholder="اكتب اسمك هنا..."
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setErrors({});
                      }}
                      maxLength={20}
                      className="w-full h-13 sm:h-14 rounded-xl bg-white border-2.5 border-[#1A1A1A] text-[#1A1A1A] font-body font-bold text-base sm:text-lg px-4 outline-none shadow-inner text-right focus:ring-3 focus:ring-[#F6BD60]/50 transition-all"
                      onKeyDown={(e) => e.key === 'Enter' && handleGuestLogin()}
                    />
                    {errors.username && <span className="text-xs text-red-600 font-bold">{errors.username}</span>}
                  </div>

                  {/* Start Button */}
                  <button
                    type="button"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                    className="w-full h-14 rounded-xl comic-btn-pink font-display font-black text-lg sm:text-xl border-2.5 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2.5 mt-1"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>{isLoading ? 'جاري الدخول...' : 'ابدأ اللعب الآن'}</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 text-right">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#1A1A1A] font-body font-black text-sm sm:text-base">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-13 sm:h-14 rounded-xl bg-white border-2.5 border-[#1A1A1A] text-[#1A1A1A] font-body font-bold text-base px-4 outline-none shadow-inner text-right"
                    />
                    {errors.email && <span className="text-xs text-red-600 font-bold">{errors.email}</span>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#1A1A1A] font-body font-black text-sm sm:text-base">
                      كلمة المرور
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-13 sm:h-14 rounded-xl bg-white border-2.5 border-[#1A1A1A] text-[#1A1A1A] font-body font-bold text-base px-4 outline-none shadow-inner text-right"
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    {errors.password && <span className="text-xs text-red-600 font-bold">{errors.password}</span>}
                  </div>

                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full h-14 rounded-xl comic-btn-teal font-display font-black text-lg border-2.5 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2.5 mt-1"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>{isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Authenticated User State ── */
            <div className="flex flex-col gap-6 sm:gap-8 text-right w-full">
              
              {/* User Greeting Card */}
              <div className="w-full p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#FFF6E5] border-3 border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] flex flex-col sm:flex-row items-center justify-between gap-5 overflow-hidden">
                <div className="flex items-center gap-4 text-right min-w-0">
                  <div className="shrink-0">
                    <Avatar
                      avatarId={user?.avatar_id}
                      nickname={user?.username}
                      size="lg"
                      ring="none"
                      className="border-2.5 border-[#1A1A1A] shadow-sm w-16 h-16 sm:w-18 sm:h-18"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-display font-black text-[#1A1A1A] truncate">
                      أهلاً بك، <span className="text-[#F28482]">{user?.username}</span> 👋
                    </h3>
                    <p className="text-xs sm:text-sm text-[#1A1A1A]/70 font-body font-bold">
                      اختر إنشاء غرفة جديدة أو انضم لأصحابك فوراً
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => setProfileModalOpen(true)}
                    className="h-11 px-4 sm:px-5 rounded-xl comic-btn-gold font-body font-black text-xs sm:text-sm border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <UserRound className="w-4 h-4" />
                    <span>تعديل الملف</span>
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="h-11 px-4 rounded-xl bg-white hover:bg-neutral-100 text-[#1A1A1A] border-2 border-[#1A1A1A] font-body font-black text-xs sm:text-sm shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>خروج</span>
                  </button>
                </div>
              </div>

              {/* Primary Game Action Cards (Create Room / Join Room) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 w-full">
                {/* Create Room Card */}
                <button
                  type="button"
                  onClick={() => setCreateRoomModalOpen(true)}
                  className="flex flex-col items-center justify-center min-h-[220px] p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#FFF6E5] border-3 border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] hover:shadow-[8px_8px_0px_#1A1A1A] hover:-translate-y-1 active:translate-y-0.5 transition-all cursor-pointer group text-center select-none gap-3"
                >
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#F6BD60] border-2.5 border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] group-hover:scale-105 transition-transform shadow-[3px_3px_0px_#1A1A1A]">
                    <Plus className="w-9 h-9 stroke-[3]" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-display font-black text-[#1A1A1A]">
                    إنشاء غرفة جديدة
                  </span>
                  <span className="text-xs sm:text-sm text-[#1A1A1A]/70 font-body font-bold max-w-xs">
                    ابدأ غرفة بصفتك المضيف وادعُ أصحابك للتحدي
                  </span>
                </button>

                {/* Join Room Card */}
                <button
                  type="button"
                  onClick={onJoinRoom}
                  className="flex flex-col items-center justify-center min-h-[220px] p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#FFF6E5] border-3 border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] hover:shadow-[8px_8px_0px_#1A1A1A] hover:-translate-y-1 active:translate-y-0.5 transition-all cursor-pointer group text-center select-none gap-3"
                >
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#38A3A5] border-2.5 border-[#1A1A1A] flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-[3px_3px_0px_#1A1A1A]">
                    <KeyRound className="w-9 h-9 stroke-[2.5]" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-display font-black text-[#1A1A1A]">
                    الانضمام بكود
                  </span>
                  <span className="text-xs sm:text-sm text-[#1A1A1A]/70 font-body font-bold max-w-xs">
                    اكتب كود الغرفة للدخول فوراً في لعبة قائمة
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── 3. HOW TO PLAY (3-Step Guide) ── */}
        <div className="w-full flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#F6BD60]" />
            <span className="text-base sm:text-lg font-display font-black text-[#FFF6E5] uppercase tracking-wide drop-shadow-sm">
              طريقة اللعب في 3 خطوات بسيطة
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <div className="p-5 rounded-2xl bg-[#FFF6E5] border-2.5 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] flex items-center gap-4 text-right">
              <div className="w-12 h-12 rounded-xl bg-[#F6BD60] border-2 border-[#1A1A1A] text-[#1A1A1A] flex items-center justify-center font-bold shrink-0 shadow-[2px_2px_0px_#1A1A1A]">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[#1A1A1A] font-body font-black text-base sm:text-lg">01 — جاوب بصراحة</h4>
                <p className="text-[#1A1A1A]/70 text-xs sm:text-sm font-body font-bold mt-0.5">أسئلة غير متوقعة وممتعة عن شخصيتك</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFF6E5] border-2.5 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] flex items-center gap-4 text-right">
              <div className="w-12 h-12 rounded-xl bg-[#38A3A5] border-2 border-[#1A1A1A] text-white flex items-center justify-center font-bold shrink-0 shadow-[2px_2px_0px_#1A1A1A]">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[#1A1A1A] font-body font-black text-base sm:text-lg">02 — خمّن أصحابك</h4>
                <p className="text-[#1A1A1A]/70 text-xs sm:text-sm font-body font-bold mt-0.5">اربط كل إجابة مجهولة بصاحبها الحقيقي</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFF6E5] border-2.5 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] flex items-center gap-4 text-right">
              <div className="w-12 h-12 rounded-xl bg-[#F28482] border-2 border-[#1A1A1A] text-white flex items-center justify-center font-bold shrink-0 shadow-[2px_2px_0px_#1A1A1A]">
                <Swords className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[#1A1A1A] font-body font-black text-base sm:text-lg">03 — نفّذ العقوبة</h4>
                <p className="text-[#1A1A1A]/70 text-xs sm:text-sm font-body font-bold mt-0.5">كروت أحكام حماسية ومضحكة للخاسرين</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onLogout={logout}
      />

      {/* Room Creation Settings Modal */}
      <RoomSettingsModal
        isOpen={createRoomModalOpen}
        onClose={() => setCreateRoomModalOpen(false)}
        onSave={(options) => {
          setCreateRoomModalOpen(false);
          onEnterLobby(options);
        }}
        title="تجهيز إعدادات الغرفة"
        submitLabel="إنشاء الغرفة والدخول"
      />
    </GameLayout>
  );
}
