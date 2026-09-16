import { useEffect, useState } from 'react';
import { RefreshCw, Swords } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { useSound } from '../../hooks/useSound';
import { emitDareAssign, onDareAnnounced } from '../../socket/dare.events';
import { emitRematch } from '../../socket/lobby.events';
import type { DareAnnouncedPayload } from '../../socket/socket.types';

interface DarePhaseProps {
  gameId: string;
}

export default function DarePhase({ gameId }: DarePhaseProps) {
  const { dareCards, finalResults, myPlayerId, isHost } = useGame();
  const { play } = useSound();
  const [announced, setAnnounced] = useState<DareAnnouncedPayload | null>(null);

  const isWinner =
    myPlayerId === finalResults?.winner?.playerId ||
    myPlayerId === (finalResults?.winner as any)?.userId;

  useEffect(() => {
    const off = onDareAnnounced((payload) => {
      setAnnounced(payload);
      play('dare');
    });
    return off;
  }, [play]);

  const severityLabels: Record<string, { text: string; bg: string }> = {
    MILD:  { text: 'حكم خفيف 🟢', bg: 'bg-[#33A9AC] text-white' },
    SPICY: { text: 'حكم حار ومحرج 🌶️', bg: 'bg-[#FFA646] text-[#1A1A1A]' },
    CHAOS: { text: 'حكم فوضى وتحدي 🔥', bg: 'bg-[#F86041] text-white' },
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 gap-6 select-none" dir="rtl">
      {!announced ? (
        <>
          <div className="text-center animate-[slideUp_0.2s_ease]">
            <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-[#F86041] text-white text-xs sm:text-sm font-black mb-2 border-2 border-[#1A1A1A] shadow-xs leading-none">
              <Swords className="w-4 h-4" />
              <span>مرحلة تنفيذ العقوبة</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-black text-[#FFF6E5] drop-shadow-sm">
              كروت الأحكام والتحديات
            </h1>
            <p className="text-xs sm:text-sm font-body font-bold text-[#FFA646] mt-1">
              {isWinner
                ? `أنت الفائز بالمركز الأول! اختر العقوبة لـ (${finalResults?.loser?.nickname})`
                : `الفائز (${finalResults?.winner?.nickname}) يراجع الكروت لاختيار العقوبة لـ (${finalResults?.loser?.nickname})...`}
            </p>
          </div>

          {isWinner && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 w-full animate-[slideUp_0.3s_ease]">
              {dareCards.map((dare, i) => {
                const badge = severityLabels[dare.severity] || severityLabels.MILD;
                return (
                  <button
                    key={dare.id}
                    type="button"
                    onClick={() => emitDareAssign({ gameId, dareId: dare.id })}
                    className="w-full rounded-2xl p-4 sm:p-5 text-right cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 bg-[#FFF6E5] border-2.5 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[6px_6px_0px_#1A1A1A] hover:-translate-y-1 active:translate-y-0.5"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs sm:text-sm font-black px-3.5 sm:px-4 py-1 rounded-full border-2 border-[#1A1A1A] shadow-xs ${badge.bg}`}>
                        {badge.text}
                      </span>
                    </div>
                    <p className="text-[#1A1A1A] font-body font-black text-sm sm:text-base leading-snug">
                      {dare.text_ar || (dare as any).textAr}
                    </p>
                    <span className="text-xs text-[#33A9AC] font-black self-start mt-1">
                      👈 اضغط لاختيار هذا الحكم
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!isWinner && (
            <div className="w-full max-w-md text-center p-6 rounded-2xl sm:rounded-3xl bg-[#FFF6E5] text-[#1A1A1A] border-3 border-[#1A1A1A] shadow-[5px_5px_0px_#1A1A1A] animate-[pop_0.25s_ease]">
              <p className="text-[#1A1A1A] text-xl font-display font-black">
                العقوبة في الطريق... 🔥
              </p>
              <p className="text-[#1A1A1A]/70 text-xs sm:text-sm font-body font-bold mt-1">
                الفائز ({finalResults?.winner?.nickname}) يراجع كروت الأحكام حالياً!
              </p>
            </div>
          )}
        </>
      ) : (
        /* Dare Announced */
        <div className="flex flex-col items-center gap-4 text-center animate-[pop_0.25s_ease] w-full max-w-lg">
          <h2 className="text-2xl sm:text-4xl font-display font-black text-[#FFF6E5] drop-shadow-sm">
            العقوبة المختارة 🔥
          </h2>
          <p className="text-[#FFF6E5] font-body font-bold text-xs sm:text-sm drop-shadow-xs">
            <span className="text-[#FFA646] font-black">{announced.winnerNickname}</span> اختار لـ{' '}
            <span className="text-[#F86041] font-black">{announced.loserNickname}</span>:
          </p>
          <div className="w-full rounded-2xl sm:rounded-3xl bg-[#FFF6E5] text-[#1A1A1A] border-3 border-[#1A1A1A] p-5 sm:p-7 shadow-[6px_6px_0px_#1A1A1A] flex flex-col items-center gap-2.5">
            <span className={`text-xs sm:text-sm font-black px-4 py-1 rounded-full border-2 border-[#1A1A1A] shadow-xs ${(severityLabels[announced.severity] || severityLabels.MILD).bg}`}>
              {(severityLabels[announced.severity] || severityLabels.MILD).text}
            </span>
            <p className="text-lg sm:text-xl font-display font-black text-[#1A1A1A] leading-relaxed my-2">
              "{announced.dareText || (announced as any).dareTextAr}"
            </p>
          </div>

          {/* Replay action */}
          {isHost && (
            <button
              type="button"
              onClick={() => emitRematch({ gameId })}
              className="w-full max-w-sm h-11 sm:h-12 rounded-xl sm:rounded-2xl comic-btn-teal font-display font-black text-sm sm:text-base border-2.5 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2 mt-1 whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4" />
              <span>العب من جديد (Rematch)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
