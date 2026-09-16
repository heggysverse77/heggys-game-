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
        setError('الغرفة ممتلئة أو اللعبة بدأت بالفعل');
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
      <div className="hv-container" dir="rtl" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBlock: 64, maxWidth: 560 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg,#33A9AC,#23787B)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(51,169,172,0.4)', marginBottom: 24 }}>
          <KeyRound style={{ width: 30, height: 30, color: '#fff' }} />
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 8px', textAlign: 'center' }}>
          انضم لغرفة أصحابك
        </h1>
        <p style={{ fontSize: 16, fontWeight: 500, color: '#9E9E9E', margin: '0 0 32px', textAlign: 'center' }}>
          اكتب كود الغرفة المكون من 6 خانات للدخول مباشرة
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
              style={{ textAlign: 'center', letterSpacing: '0.25em', fontSize: 24, fontWeight: 800, fontFamily: 'Inter, monospace', minHeight: 64 }}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            />

            {!roomInfo ? (
              <Button variant="primary" fullWidth size="lg" loading={checking} disabled={code.length < 4} icon={<Play style={{ width: 18, height: 18 }} />} onClick={handleCheck}>
                {checking ? 'جاري التحقق...' : 'التحقق من الكود'}
              </Button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, borderRadius: 8, background: '#121212', border: '1px solid #2A2A2A' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>
                    الغرفة: <span className="room-code" style={{ color: '#33A9AC' }}>{roomInfo.roomCode}</span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, padding: '6px 14px', borderRadius: 9999, background: 'rgba(51,169,172,0.12)', color: '#6FCFD1', border: '1px solid rgba(51,169,172,0.3)' }}>
                    {roomInfo.currentPlayers} / {roomInfo.maxPlayers} لاعبين
                  </span>
                </div>
                <Button variant="secondary" fullWidth size="lg" icon={<LogIn style={{ width: 18, height: 18 }} />} onClick={handleJoin}>
                  دخول الغرفة الآن!
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
