import { useEffect } from 'react';
import { Trophy, RefreshCw, LogOut, Flame } from 'lucide-react';
import { Avatar } from '../ui';
import { useGame } from '../../hooks/useGame';
import { useConfetti } from '../../hooks/useConfetti';
import { useSound } from '../../hooks/useSound';
import { emitRematch } from '../../socket/lobby.events';

interface FinalPhaseProps {
  _gameId?: string;
  gameId?: string;
}

export default function FinalPhase(props: FinalPhaseProps) {
  const { leaderboard, game, isHost, finalResults, dispatch } = useGame();
  const { celebrate } = useConfetti();
  const { play } = useSound();

  const activeGameId = props.gameId || props._gameId || game?.id || '';

  useEffect(() => {
    celebrate();
    play('win');
  }, [celebrate, play]);

  const handleRematch = () => {
    if (!activeGameId) return;
    emitRematch({ gameId: activeGameId });
  };

  const isDareEnabled = Boolean(
    finalResults?.dareEnabled ??
      game?.dare_enabled ??
      (finalResults?.dareCards && finalResults.dareCards.length > 0)
  );

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 gap-6 sm:gap-8 select-none" dir="rtl">
      
      {/* Title Header */}
      <div className="text-center animate-[pop_0.3s_ease]">
        <h1 className="text-3xl sm:text-5xl font-display font-black text-[#FFF6E5] drop-shadow-sm">
          النتيجة النهائية وتتويج الفائزين 🏆
        </h1>
        <p className="text-xs sm:text-base font-body font-bold text-[#F6BD60] mt-1.5 drop-shadow-xs">
          نهاية المباراة — الترتيب النهائي وجوائز الشرف!
        </p>
      </div>

      {/* Main Podium Layout: Trophy Card & Final Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 w-full items-center animate-[slideUp_0.3s_ease]">
        
        {/* Left Side: Golden Trophy Illustration */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-48 sm:w-60 md:w-68 aspect-square rounded-2xl sm:rounded-3xl overflow-hidden border-3 border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] bg-[#1E2826]">
            <img
              src="/images/comic_gold_trophy.jpg"
              alt="كأس التتويج"
              className="w-full h-full object-cover animate-[float_3.5s_ease-in-out_infinite]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Right Side: Final Rankings Card */}
        <div className="md:col-span-7 flex flex-col gap-2.5">
          <div className="rounded-2xl sm:rounded-3xl bg-[#FFF6E5] border-3 border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] p-4 sm:p-6 flex flex-col gap-2.5">
            {leaderboard.map((entry, idx) => {
              const rankNum = idx + 1;
              const isFirst = rankNum === 1;

              return (
                <div
                  key={entry.playerId || idx}
                  className={[
                    'flex items-center justify-between p-3 rounded-xl sm:rounded-2xl border-2 transition-all shadow-xs gap-3',
                    isFirst ? 'bg-[#F6BD60] text-[#1A1A1A] border-[#1A1A1A]' : 'bg-white text-[#1A1A1A] border-[#1A1A1A]',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {isFirst ? (
                      <Trophy className="w-6 h-6 text-[#1A1A1A] fill-[#1A1A1A] shrink-0" />
                    ) : (
                      <span className="font-display font-black text-base sm:text-lg w-6 text-center text-[#1A1A1A] shrink-0">
                        {rankNum}
                      </span>
                    )}

                    <Avatar
                      avatarId={entry.avatarId}
                      size="md"
                      ring="none"
                      className="border-2 border-[#1A1A1A] shrink-0 w-11 h-11 sm:w-12 sm:h-12"
                    />

                    <span className="font-display font-black text-sm sm:text-base text-[#1A1A1A] truncate min-w-0 flex-1">
                      {entry.nickname}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-display font-black text-base sm:text-lg text-[#1A1A1A]">
                      {entry.totalScore}
                    </span>
                    <span className="text-xs font-body font-bold text-[#1A1A1A]/70">
                      نقطة
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dare Challenge Button if enabled */}
      {isDareEnabled && (
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_PHASE', phase: 'DARE' })}
          className="px-6 py-3 rounded-xl sm:rounded-2xl bg-[#F28482] hover:bg-[#E86A68] text-white font-body font-black text-base sm:text-lg border-2.5 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] hover:scale-102 active:translate-y-0.5 transition-all cursor-pointer animate-pulse flex items-center gap-2"
        >
          <Flame className="w-5 h-5 fill-white" />
          <span>تنفيذ كروت الأحكام والعقوبات على المركز الأخير</span>
        </button>
      )}

      {/* Bottom Rematch Action Button */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md mt-1 animate-[slideUp_0.35s_ease]">
        {isHost ? (
          <button
            type="button"
            onClick={handleRematch}
            className="flex-1 w-full h-13 sm:h-14 rounded-xl sm:rounded-2xl font-body font-black text-base sm:text-lg border-2.5 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] comic-btn-teal active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>العب من جديد (Rematch)</span>
          </button>
        ) : (
          <div className="w-full p-4 rounded-xl sm:rounded-2xl bg-[#FFF6E5] text-[#1A1A1A] border-2.5 border-[#1A1A1A] shadow-xs text-center font-body font-black text-sm sm:text-base">
            في انتظار المضيف لبدء مباراة جديدة...
          </div>
        )}
      </div>
    </div>
  );
}
