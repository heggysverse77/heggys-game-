import { useState, useEffect, useCallback } from 'react';
import { LogIn, ArrowRight, KeyRound, Play, Sparkles } from 'lucide-react';
import GameLayout from '../components/layout/GameLayout';
import Card from '../components/Card/Card';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import Avatar from '../components/ui/Avatar';
import { AVATAR_LIST } from '../utils/avatar.utils';
import { getRoomByCode } from '../services/game.service';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { emitJoinRoom } from '../socket/lobby.events';
import { useToast } from '../components/ui/Toast';

interface JoinPageProps {
  onJoined: (gameId: string, roomCode: string) => void;
  onBack: () => void;
}

export default function JoinPage({ onJoined, onBack }: JoinPageProps) {
  const { connect, status } = useSocket();
  const { user, token, isAuthenticated, loginAsGuest } = useAuth();
  const { showToast } = useToast();

  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [joining, setJoining] = useState(false);
  const [roomInfo, setRoomInfo] = useState<{
    gameId: string;
    roomCode: string;
    currentPlayers: number;
    maxPlayers: number;
    canJoin: boolean;
    status?: string;
    isInProgress?: boolean;
  } | null>(null);
  const [error, setError] = useState('');

  // Guest registration state if user is not authenticated
  const [guestName, setGuestName] = useState('');
  const [guestAvatarId, setGuestAvatarId] = useState('avatar_1');
  const [guestError, setGuestError] = useState('');

  const handleCheckCode = useCallback(async (targetCode: string) => {
    const normalized = targetCode.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
    if (normalized.length < 4) {
      setError('أدخل كود الغرفة المكون من 6 أحرف');
      return;
    }
    setError('');
    setChecking(true);
    try {
      const info = await getRoomByCode(normalized);
      if (!info.canJoin) {
        if (info.status === 'FINISHED' || info.status === 'ABANDONED') {
          setError('هذه اللعبة قد انتهت بالفعل');
        } else {
          setError('الغرفة ممتلئة بالكامل');
        }
      } else {
        setRoomInfo(info);
      }
    } catch {
      setError('الغرفة غير موجودة، تأكد من صحة الكود');
      setRoomInfo(null);
    } finally {
      setChecking(false);
    }
  }, []);

  // Auto-detect room code from URL params on load (?code=... or ?room=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('code') || params.get('room');
      if (urlCode) {
        const clean = urlCode.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
        setCode(clean);
        handleCheckCode(clean);
      }
    } catch (err) {
      console.warn('Failed to parse URL code param:', err);
    }
  }, [handleCheckCode]);

  // Handle joining when user already has a token
  const handleJoinAuthenticated = () => {
    if (!roomInfo || !token) return;
    try {
      if (status !== 'connected') connect(token);
      emitJoinRoom({ gameId: roomInfo.gameId, nickname: user?.username });
      onJoined(roomInfo.gameId, roomInfo.roomCode);
    } catch (err: any) {
      setError('تعذر الانضمام للغرفة، حاول مرة أخرى');
    }
  };

  // Handle joining for non-authenticated players (iOS / new guest visitors)
  const handleJoinAsGuest = async () => {
    if (!roomInfo) return;
    const cleanName = guestName.trim();
    if (!cleanName || cleanName.length < 2) {
      setGuestError('الاسم يجب أن يكون حرفين على الأقل');
      return;
    }
    if (cleanName.length > 20) {
      setGuestError('الاسم لا يتجاوز 20 حرف');
      return;
    }

    setGuestError('');
    setJoining(true);

    try {
      await loginAsGuest(cleanName, guestAvatarId);

      // Grab newly persisted token
      const freshToken = localStorage.getItem('heggy_token');
      if (freshToken) {
        connect(freshToken);
        emitJoinRoom({ gameId: roomInfo.gameId, nickname: cleanName });
        showToast({ message: `أهلاً بك ${cleanName}! تم الانضمام للغرفة`, type: 'success' });
        onJoined(roomInfo.gameId, roomInfo.roomCode);
      } else {
        setError('فشل تسجيل الدخول كضيف، يرجى إعادة المحاولة');
      }
    } catch (err: any) {
      console.error('Guest join failed:', err);
      setError('حدث خطأ أثناء الانضمام للغرفة');
    } finally {
      setJoining(false);
    }
  };

  return (
    <GameLayout>
      <div
        className="hv-container"
        dir="rtl"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingBlock: 'clamp(20px, 4vw, 40px)',
          maxWidth: 540,
          width: '100%',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'linear-gradient(135deg,#33A9AC,#23787B)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 32px rgba(51,169,172,0.4)',
            marginBottom: 16,
          }}
        >
          <KeyRound style={{ width: 32, height: 32, color: '#fff' }} />
        </div>

        <h1
          style={{
            fontSize: 'clamp(22px, 5vw, 30px)',
            fontWeight: 800,
            color: '#1C1917',
            margin: '0 0 6px',
            textAlign: 'center',
          }}
        >
          الانضمام لغرفة اللعب
        </h1>
        <p
          style={{
            fontSize: 'clamp(13px, 3.5vw, 15px)',
            fontWeight: 600,
            color: '#555555',
            margin: '0 0 20px',
            textAlign: 'center',
          }}
        >
          اكتب كود الغرفة للدخول والتحدي فوراً مع أصحابك
        </p>

        <Card style={{ width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Room Code Input */}
            <Input
              label="كود الغرفة"
              placeholder="X7Q2L9"
              value={code}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setCode(val);
                setError('');
                if (roomInfo && roomInfo.roomCode !== val) {
                  setRoomInfo(null);
                }
              }}
              maxLength={8}
              error={error}
              dir="ltr"
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              inputMode="text"
              style={{
                textAlign: 'center',
                letterSpacing: '0.25em',
                fontSize: 'clamp(20px, 6vw, 24px)',
                fontWeight: 800,
                fontFamily: 'Inter, monospace',
                minHeight: 52,
                touchAction: 'manipulation',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleCheckCode(code)}
            />

            {!roomInfo ? (
              <Button
                variant="primary"
                fullWidth
                size="lg"
                loading={checking}
                disabled={code.length < 4}
                icon={<Play style={{ width: 18, height: 18 }} />}
                onClick={() => handleCheckCode(code)}
              >
                {checking ? 'جاري التحقق من الغرفة...' : 'التحقق من الكود 🔍'}
              </Button>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  padding: 16,
                  borderRadius: 14,
                  background: '#FFF8EB',
                  border: '2px solid #1C1917',
                  boxShadow: '2.5px 2.5px 0px #1C1917',
                }}
              >
                {/* Room Info Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#1C1917' }}>
                    الغرفة: <span className="room-code" style={{ color: '#F59E0B' }}>{roomInfo.roomCode}</span>
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: 9999,
                      background: roomInfo.status === 'IN_PROGRESS' ? '#FFF3E0' : '#E0F7FA',
                      color: roomInfo.status === 'IN_PROGRESS' ? '#E65100' : '#0D9488',
                      border: '1.5px solid #1C1917',
                      boxShadow: '1.5px 1.5px 0px #1C1917',
                    }}
                  >
                    {roomInfo.status === 'IN_PROGRESS' ? '🎮 اللعبة جارية الآن' : `${roomInfo.currentPlayers} / ${roomInfo.maxPlayers} لاعبين`}
                  </span>
                </div>

                {roomInfo.status === 'IN_PROGRESS' && (
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#B45309',
                      background: 'rgba(245,158,11,0.15)',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px dashed #B45309',
                    }}
                  >
                    ⚡ اللعبة بدأت بالفعل! يمكنك الانضمام ومتابعة اللعب مع أصحابك.
                  </div>
                )}

                {/* If user is ALREADY authenticated */}
                {isAuthenticated && user ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        background: '#FEF3C7',
                        borderRadius: 10,
                        border: '1.5px solid #1C1917',
                      }}
                    >
                      <Avatar avatarId={user.avatar_id} size="sm" ring="none" />
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1917' }}>
                        تسجيل الدخول باسم: <span style={{ color: '#F86041' }}>{user.username}</span>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      fullWidth
                      size="lg"
                      icon={<LogIn style={{ width: 18, height: 18 }} />}
                      onClick={handleJoinAuthenticated}
                    >
                      {roomInfo.status === 'IN_PROGRESS' ? 'دخول واستئناف اللعبة ⚡' : 'دخول الغرفة الآن! 🎮'}
                    </Button>
                  </div>
                ) : (
                  /* If user is NOT authenticated (e.g. mobile Safari visitor) */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles style={{ width: 16, height: 16, color: '#F59E0B' }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#1C1917' }}>
                        اختر شخصيتك واكتب اسمك للانضمام فوراً:
                      </span>
                    </div>

                    {/* Avatar picker */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: 6,
                        padding: 8,
                        background: '#FEF3C7',
                        borderRadius: 10,
                        border: '1.5px solid #1C1917',
                      }}
                    >
                      {AVATAR_LIST.map((item) => {
                        const isSelected = guestAvatarId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setGuestAvatarId(item.id)}
                            title={item.name}
                            style={{
                              padding: 4,
                              borderRadius: 8,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: isSelected ? 'rgba(245,158,11,0.4)' : 'transparent',
                              border: isSelected ? '2px solid #1C1917' : '2px solid transparent',
                              boxShadow: isSelected ? '2px 2px 0px #1C1917' : 'none',
                              transform: isSelected ? 'scale(1.08)' : 'none',
                              transition: 'all 0.15s ease',
                              touchAction: 'manipulation',
                            }}
                          >
                            <Avatar avatarId={item.id} size="sm" ring="none" />
                          </button>
                        );
                      })}
                    </div>

                    {/* Nickname input */}
                    <Input
                      label="اسم اللاعب"
                      placeholder="اكتب اسمك هنا..."
                      value={guestName}
                      onChange={(e) => {
                        setGuestName(e.target.value);
                        setGuestError('');
                      }}
                      maxLength={20}
                      error={guestError}
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      style={{ fontSize: '16px', touchAction: 'manipulation' }}
                      onKeyDown={(e) => e.key === 'Enter' && handleJoinAsGuest()}
                    />

                    <Button
                      variant="primary"
                      fullWidth
                      size="lg"
                      loading={joining}
                      icon={<LogIn style={{ width: 18, height: 18 }} />}
                      onClick={handleJoinAsGuest}
                    >
                      {joining ? 'جاري الدخول...' : 'الانضمام للغرفة والبدء 🚀'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Button
              variant="ghost"
              fullWidth
              icon={<ArrowRight style={{ width: 16, height: 16 }} />}
              onClick={onBack}
            >
              العودة للرئيسية
            </Button>
          </div>
        </Card>
      </div>
    </GameLayout>
  );
}
