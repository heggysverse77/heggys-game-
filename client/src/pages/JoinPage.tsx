import { useState } from 'react';
import { LogIn, Sparkles, ArrowRight } from 'lucide-react';
import GameLayout from '../components/layout/GameLayout';
import GameHeader from '../components/layout/GameHeader';
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
      <GameHeader
        title="الانضمام لغرفة"
        onBack={onBack}
        backLabel="الرئيسية"
      />

      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12 select-none" dir="rtl">
        <div className="w-full bg-[#FFF6E5] text-[#1A1A1A] border-3 border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] p-6 sm:p-8 rounded-2xl sm:rounded-3xl animate-[pop_0.25s_ease]">
          
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-display font-black text-[#1A1A1A]">
              انضم لغرفة أصحابك
            </h2>
            <p className="text-xs sm:text-sm font-body font-bold text-[#1A1A1A]/70 mt-1">
              اكتب كود الغرفة المكون من 6 خانات للدخول مباشرة
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-sm font-body font-black text-[#1A1A1A]">
                كود الغرفة
              </label>
              <input
                type="text"
                placeholder="X7Q2L"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                  setError('');
                }}
                maxLength={8}
                className="w-full h-15 sm:h-16 rounded-xl sm:rounded-2xl bg-white border-2.5 border-[#1A1A1A] text-center tracking-[0.25em] text-3xl sm:text-4xl font-mono font-black uppercase text-[#1A1A1A] outline-none shadow-inner focus:ring-3 focus:ring-[#F6BD60]/50 transition-all placeholder:text-[#1A1A1A]/30"
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                autoFocus
              />
              {error && (
                <span className="text-xs sm:text-sm text-red-600 font-body font-bold mt-1 text-center block">
                  {error}
                </span>
              )}
            </div>

            {!roomInfo ? (
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={checking}
                  onClick={handleCheck}
                  className="flex-1 h-13 sm:h-14 rounded-xl comic-btn-pink font-body font-black text-base sm:text-lg border-2.5 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  <span>{checking ? 'جاري التحقق...' : 'تحقق من الغرفة'}</span>
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="sm:w-28 h-13 sm:h-14 rounded-xl bg-white hover:bg-neutral-100 text-[#1A1A1A] border-2 border-[#1A1A1A] font-body font-black text-sm shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center"
                >
                  رجوع
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 animate-[pop_0.2s_ease] pt-1">
                {/* Room preview banner */}
                <div className="bg-white border-2.5 border-[#1A1A1A] rounded-2xl p-4 text-center flex flex-col items-center gap-2 shadow-[3px_3px_0px_#1A1A1A]">
                  <span className="text-[#38A3A5] font-black font-body text-sm sm:text-base flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#38A3A5] animate-ping" />
                    الغرفة متاحة وجاهزة!
                  </span>
                  <p className="text-[#1A1A1A] text-sm sm:text-base font-body font-bold">
                    كود الغرفة: <span className="font-mono font-black text-[#F28482] tracking-widest text-xl sm:text-2xl">{roomInfo.roomCode}</span>
                  </p>
                  <div className="px-3.5 py-1 rounded-full bg-[#FFF6E5] text-xs font-black text-[#1A1A1A] border-1.5 border-[#1A1A1A]">
                    {roomInfo.currentPlayers} من أصل {roomInfo.maxPlayers} لاعبين
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={handleJoin}
                    className="flex-1 h-13 sm:h-14 rounded-xl comic-btn-teal font-body font-black text-base sm:text-lg border-2.5 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>ادخل اللعبة الآن</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomInfo(null)}
                    className="sm:w-28 h-13 sm:h-14 rounded-xl bg-white hover:bg-neutral-100 text-[#1A1A1A] border-2 border-[#1A1A1A] font-body font-black text-xs sm:text-sm shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center"
                  >
                    تغيير الكود
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </GameLayout>
  );
}
