import { useState } from 'react';
import { LogIn, ArrowRight, KeyRound, Play } from 'lucide-react';
import GameLayout from '../components/layout/GameLayout';
import Card from '../components/Card/Card';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import { getRoomByCode } from '../services/game.service';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { emitJoinRoom } from '../socket/lobby.events';

interface JoinPageProps {
  onJoined: (gameId: string, roomCode: string) => void;
  onBack: () => void;
}

export default function JoinPage({ onJoined, onBack }: JoinPageProps) {
  const { connect, status } = useSocket();
  const { token } = useAuth();

  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
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

  const handleCheck = async () => {
    const normalized = code.toUpperCase().trim();
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
    } finally {
      setChecking(false);
    }
  };

  const handleJoin = () => {
    if (!roomInfo || !token) return;
    if (status !== 'connected') connect(token);
    emitJoinRoom({ gameId: roomInfo.gameId });
    onJoined(roomInfo.gameId, roomInfo.roomCode);
  };

  return (
    <GameLayout>
      <div className="hv-container" dir="rtl" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBlock: 'clamp(24px, 5vw, 48px)', maxWidth: 540, width: '100%' }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#33A9AC,#23787B)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(51,169,172,0.4)', marginBottom: 20 }}>
          <KeyRound style={{ width: 30, height: 30, color: '#fff' }} />
        </div>
        <h1 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, color: '#fff', margin: '0 0 8px', textAlign: 'center' }}>
          انضم لغرفة أصحابك
        </h1>
        <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', fontWeight: 500, color: '#8F94B8', margin: '0 0 24px', textAlign: 'center' }}>
          اكتب كود الغرفة المكون من 6 خانات للدخول أو استئناف اللعب
        </p>

        <Card style={{ width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Input
              label="كود الغرفة"
              placeholder="X7Q2L9"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setError(''); }}
              maxLength={8}
              error={error}
              dir="ltr"
              style={{ textAlign: 'center', letterSpacing: '0.25em', fontSize: 'clamp(20px, 6vw, 24px)', fontWeight: 800, fontFamily: 'Inter, monospace', minHeight: 56 }}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            />

            {!roomInfo ? (
              <Button variant="primary" fullWidth size="lg" loading={checking} disabled={code.length < 4} icon={<Play style={{ width: 18, height: 18 }} />} onClick={handleCheck}>
                {checking ? 'جاري التحقق...' : 'التحقق من الكود'}
              </Button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, borderRadius: 12, background: '#FFF0D4', border: '2px solid #1A1A1A', boxShadow: '2px 2px 0px #1A1A1A' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#1A1A1A' }}>
                    الغرفة: <span className="room-code" style={{ color: '#33A9AC' }}>{roomInfo.roomCode}</span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, padding: '6px 14px', borderRadius: 9999, background: roomInfo.status === 'IN_PROGRESS' ? '#FFF3E0' : '#E0F7FA', color: roomInfo.status === 'IN_PROGRESS' ? '#E65100' : '#23787B', border: '1.5px solid #1A1A1A', boxShadow: '1.5px 1.5px 0px #1A1A1A' }}>
                    {roomInfo.status === 'IN_PROGRESS' ? '🎮 اللعبة جارية الآن' : `${roomInfo.currentPlayers} / ${roomInfo.maxPlayers} لاعبين`}
                  </span>
                </div>

                {roomInfo.status === 'IN_PROGRESS' && (
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#D97706', background: 'rgba(217,119,6,0.1)', padding: '8px 12px', borderRadius: 8, border: '1px dashed #D97706' }}>
                    ⚡ اللعبة بدأت بالفعل! يمكنك الدخول فوراً ومتابعة اللعب مع أصحابك.
                  </div>
                )}

                <Button variant={roomInfo.status === 'IN_PROGRESS' ? 'primary' : 'secondary'} fullWidth size="lg" icon={<LogIn style={{ width: 18, height: 18 }} />} onClick={handleJoin}>
                  {roomInfo.status === 'IN_PROGRESS' ? 'دخول واستئناف اللعبة ⚡' : 'دخول الغرفة الآن!'}
                </Button>
              </div>
            )}

            <Button variant="ghost" fullWidth icon={<ArrowRight style={{ width: 16, height: 16 }} />} onClick={onBack}>
              العودة للرئيسية
            </Button>
          </div>
        </Card>
      </div>
    </GameLayout>
  );
}
