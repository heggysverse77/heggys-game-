import { useState } from 'react';
import {
  Play,
  Plus,
  KeyRound,
  UserRound,
  LogIn,
  LogOut,
  MessageSquareText,
  Users,
  Gavel,
} from 'lucide-react';
import GameLayout from '../components/layout/GameLayout';
import GameHeader from '../components/layout/GameHeader';
import Avatar from '../components/ui/Avatar';
import Button from '../components/Button/Button';
import Card from '../components/Card/Card';
import Input from '../components/Input/Input';
import StepIndicator from '../components/StepIndicator/StepIndicator';
import UserProfileModal from '../components/profile/UserProfileModal';
import RoomSettingsModal from '../components/game/RoomSettingsModal';
import { AVATAR_LIST } from '../utils/avatar.utils';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import ComicLogo from '../components/ui/ComicLogo';
import type { CreateGameOptions } from '../services/game.service';

type HomeTab = 'guest' | 'login';

interface HomePageProps {
  onEnterLobby: (opts: CreateGameOptions) => void;
  onJoinRoom: () => void;
  onPreviewDuel?: () => void;
}

export default function HomePage({ onEnterLobby, onJoinRoom, onPreviewDuel }: HomePageProps) {
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

  return (
    <GameLayout>
      <GameHeader
        title="HeggyVerse"
        onOpenProfile={isAuthenticated ? () => setProfileModalOpen(true) : undefined}
        onLogout={isAuthenticated ? logout : undefined}
      />

      <main className="hv-container" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* ── HERO ── */}
        <section className="hv-hero">
          <ComicLogo size="hero" animate={true} />

          {isAuthenticated ? (
            <div className="hv-hero-ctas">
              <Button variant="primary" size="lg" icon={<Plus style={{ width: 18, height: 18 }} />} onClick={() => setCreateRoomModalOpen(true)}>
                إنشاء غرفة جديدة
              </Button>
              <Button variant="secondary" size="lg" icon={<KeyRound style={{ width: 18, height: 18 }} />} onClick={onJoinRoom}>
                الانضمام بكود
              </Button>
            </div>
          ) : (
            <div className="hv-hero-ctas">
              <Button variant="secondary" size="lg" icon={<KeyRound style={{ width: 18, height: 18 }} />} onClick={onJoinRoom}>
                معاك كود غرفة؟ اضغط للانضمام فوراً 🔑
              </Button>
            </div>
          )}

          {/* Quick Duel Animation Test Preview */}
          {onPreviewDuel && (
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={onPreviewDuel}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1C1917] text-[#FDE047] text-xs font-display font-black border-2 border-[#F59E0B] shadow-[2.5px_2.5px_0px_#F59E0B] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span>تجربة حركة سرقة الصدارة والمبارزة</span>
              </button>
            </div>
          )}
        </section>

        {/* ── AUTH / ACTION AREA ── */}
        <section style={{ paddingBottom: 64 }}>
          {!isAuthenticated ? (
            <Card style={{ maxWidth: 560, marginInline: 'auto' }}>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 8, padding: 4, borderRadius: 12, background: '#FEF3C7', border: '2px solid #1C1917', boxShadow: '2px 2px 0px #1C1917', marginBottom: 24 }}>
                <button
                  type="button"
                  onClick={() => setTab('guest')}
                  style={{
                    flex: 1, minHeight: 44, borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: 'pointer',
                    border: tab === 'guest' ? '2px solid #1C1917' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: tab === 'guest' ? 'linear-gradient(135deg,#F59E0B,#EA580C)' : 'transparent',
                    color: tab === 'guest' ? '#fff' : '#1C1917',
                    boxShadow: tab === 'guest' ? '2px 2px 0px #1C1917' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <UserRound style={{ width: 16, height: 16 }} />
                  دخول سريع (ضيف)
                </button>
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  style={{
                    flex: 1, minHeight: 44, borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: 'pointer',
                    border: tab === 'login' ? '2px solid #1C1917' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: tab === 'login' ? 'linear-gradient(135deg,#0D9488,#115E59)' : 'transparent',
                    color: tab === 'login' ? '#fff' : '#1C1917',
                    boxShadow: tab === 'login' ? '2px 2px 0px #1C1917' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <LogIn style={{ width: 16, height: 16 }} />
                  تسجيل الدخول
                </button>
              </div>

              {tab === 'guest' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <p className="hv-label" style={{ marginBottom: 12 }}>اختر شخصيتك الرمزية (Wild West)</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, padding: 12, background: '#FEF3C7', borderRadius: 12, border: '2px solid #1C1917' }}>
                      {AVATAR_LIST.map((item) => {
                        const isSelected = avatarId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setAvatarId(item.id)}
                            title={item.name}
                            style={{
                              padding: 6, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: isSelected ? 'rgba(245,158,11,0.4)' : 'transparent',
                              border: isSelected ? '2px solid #1C1917' : '2px solid transparent',
                              boxShadow: isSelected ? '2px 2px 0px #1C1917' : 'none',
                              transform: isSelected ? 'scale(1.08)' : 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Avatar avatarId={item.id} size="md" ring="none" />
                          </button>
                        );
                      })}
                    </div>
                  </div>


                  <Input
                    label="اسم اللاعب"
                    placeholder="اكتب اسمك هنا..."
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setErrors({}); }}
                    maxLength={20}
                    error={errors.username}
                    onKeyDown={(e) => e.key === 'Enter' && handleGuestLogin()}
                  />

                  <Button variant="primary" fullWidth size="lg" loading={isLoading} icon={<Play style={{ width: 18, height: 18 }} />} onClick={handleGuestLogin}>
                    {isLoading ? 'جاري الدخول...' : 'ابدأ اللعب الآن'}
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <Input
                    label="البريد الإلكتروني"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    dir="ltr"
                    style={{ textAlign: 'left' }}
                  />
                  <Input
                    label="كلمة المرور"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    dir="ltr"
                    style={{ textAlign: 'left' }}
                  />
                  <Button variant="secondary" fullWidth size="lg" loading={isLoading} icon={<LogIn style={{ width: 18, height: 18 }} />} onClick={handleLogin}>
                    {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960, marginInline: 'auto' }}>
              {/* Greeting bar */}
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <Avatar avatarId={user?.avatar_id} size="md" ring="none" />
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1A1A1A' }}>
                        أهلاً بك، <span style={{ color: '#F86041' }}>{user?.username}</span>
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: 14, color: '#4A4A4A', fontWeight: 600 }}>
                        اختر إنشاء غرفة جديدة أو انضم لأصحابك فوراً
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Button variant="ghost" size="sm" icon={<UserRound style={{ width: 15, height: 15 }} />} onClick={() => setProfileModalOpen(true)}>
                      تعديل الملف
                    </Button>
                    <Button variant="ghost" size="sm" icon={<LogOut style={{ width: 15, height: 15 }} />} onClick={logout}>
                      خروج
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Two action cards — 24px gutters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
                <Card variant="glow-orange" onClick={() => setCreateRoomModalOpen(true)}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, paddingBlock: 12 }}>
                    <div style={{ width: 60, height: 60, borderRadius: 9999, background: 'linear-gradient(135deg,#FFA646,#F86041)', border: '2px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2.5px 2.5px 0px #1A1A1A' }}>
                      <Plus style={{ width: 28, height: 28, color: '#fff' }} />
                    </div>
                    <h3 className="hv-card-title">إنشاء غرفة جديدة</h3>
                    <p className="hv-card-subtitle">اضبط غرفتك وادعُ أصحابك للتحدي</p>
                  </div>
                </Card>
                <Card variant="glow-teal" onClick={onJoinRoom}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, paddingBlock: 12 }}>
                    <div style={{ width: 60, height: 60, borderRadius: 9999, background: 'linear-gradient(135deg,#33A9AC,#23787B)', border: '2px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2.5px 2.5px 0px #1A1A1A' }}>
                      <KeyRound style={{ width: 26, height: 26, color: '#fff' }} />
                    </div>
                    <h3 className="hv-card-title">الانضمام بكود</h3>
                    <p className="hv-card-subtitle">اكتب كود الغرفة للدخول فوراً في لعبة قائمة</p>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </section>

        {/* ── INSTRUCTIONS — 3 equal cards, 64px section spacing ── */}
        <section style={{ paddingBottom: 64 }}>
          <h2 style={{ textAlign: 'center', fontSize: 24, fontWeight: 800, color: '#1A1A1A', margin: '0 0 24px' }}>
            طريقة اللعب في 3 خطوات بسيطة
          </h2>
          <StepIndicator
            steps={[
              { title: 'جاوب بصراحة', description: 'أسئلة غير متوقعة وممتعة عن شخصيتك', icon: <MessageSquareText style={{ width: 24, height: 24 }} /> },
              { title: 'خمّن أصحابك', description: 'اربط كل إجابة مجهولة بصاحبها الحقيقي', icon: <Users style={{ width: 24, height: 24 }} /> },
              { title: 'نفّذ العقوبة', description: 'أحكام حماسية ومضحكة للخاسرين', icon: <Gavel style={{ width: 24, height: 24 }} /> },
            ]}
          />
        </section>
      </main>

      <UserProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} onLogout={logout} />
      <RoomSettingsModal
        isOpen={createRoomModalOpen}
        onClose={() => setCreateRoomModalOpen(false)}
        onSave={(options) => { setCreateRoomModalOpen(false); onEnterLobby(options); }}
        title="إعدادات الغرفة"
        submitLabel="إنشاء الغرفة"
      />
    </GameLayout>
  );
}
