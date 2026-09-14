import { useState, useEffect } from 'react';
import {
  Settings2,
  X,
  Swords,
  Timer,
  UsersRound,
  Layers,
  Check,
  Sparkles,
  Flame,
} from 'lucide-react';
import type { CreateGameOptions } from '../../services/game.service';

interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (options: CreateGameOptions) => void | Promise<void>;
  initialSettings?: Partial<CreateGameOptions>;
  title?: string;
  submitLabel?: string;
  isLoading?: boolean;
}

const ANSWERING_TIME_OPTIONS = [
  { value: 15, label: '15 ثانية', tag: 'سريع ⚡' },
  { value: 20, label: '20 ثانية', tag: 'متوسط ⏱️' },
  { value: 30, label: '30 ثانية', tag: 'مثالي ⭐' },
  { value: 45, label: '45 ثانية', tag: 'مريح ☕' },
  { value: 60, label: '60 ثانية', tag: 'طويل 🛋️' },
];

const MATCHING_TIME_OPTIONS = [
  { value: 30, label: '30 ثانية', tag: 'حماسي ⚡' },
  { value: 45, label: '45 ثانية', tag: 'مثالي ⭐' },
  { value: 60, label: '60 ثانية', tag: 'مريح ☕' },
  { value: 90, label: '90 ثانية', tag: 'عميق 🧠' },
];

const ROUNDS_OPTIONS = [
  { value: 3, label: '3 جولات', desc: 'سريعة وموجزة' },
  { value: 5, label: '5 جولات', desc: 'المباراة القياسية' },
  { value: 7, label: '7 جولات', desc: 'تحدي مطول' },
  { value: 10, label: '10 جولات', desc: 'ماراثون كامل' },
];

const PLAYERS_OPTIONS = [
  { value: 4, label: '4 لاعبين', desc: 'جلسة صغيرة' },
  { value: 6, label: '6 لاعبين', desc: 'حجم ممتاز' },
  { value: 8, label: '8 لاعبين', desc: 'حفلة كاملة' },
  { value: 10, label: '10 لاعبين', desc: 'تجمع ضخم' },
];

export default function RoomSettingsModal({
  isOpen,
  onClose,
  onSave,
  initialSettings,
  title = 'تجهيز إعدادات الغرفة',
  submitLabel = 'إنشاء الغرفة والدخول',
  isLoading = false,
}: RoomSettingsModalProps) {
  const [dareEnabled, setDareEnabled] = useState<boolean>(initialSettings?.dareEnabled ?? true);
  const [answeringTimerSec, setAnsweringTimerSec] = useState<number>(
    initialSettings?.answeringTimerSec ?? 30
  );
  const [matchingTimerSec, setMatchingTimerSec] = useState<number>(
    initialSettings?.matchingTimerSec ?? 45
  );
  const [totalRounds, setTotalRounds] = useState<number>(initialSettings?.totalRounds ?? 5);
  const [maxPlayers, setMaxPlayers] = useState<number>(initialSettings?.maxPlayers ?? 8);

  useEffect(() => {
    if (initialSettings && isOpen) {
      if (initialSettings.dareEnabled !== undefined) setDareEnabled(initialSettings.dareEnabled);
      if (initialSettings.answeringTimerSec !== undefined)
        setAnsweringTimerSec(initialSettings.answeringTimerSec);
      if (initialSettings.matchingTimerSec !== undefined)
        setMatchingTimerSec(initialSettings.matchingTimerSec);
      if (initialSettings.totalRounds !== undefined) setTotalRounds(initialSettings.totalRounds);
      if (initialSettings.maxPlayers !== undefined) setMaxPlayers(initialSettings.maxPlayers);
    }
  }, [initialSettings, isOpen]);

  // Lock scroll and handle Escape
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      dareEnabled,
      answeringTimerSec,
      matchingTimerSec,
      totalRounds,
      maxPlayers,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/75 backdrop-blur-sm animate-[fadeIn_0.15s_ease] overflow-y-auto"
      dir="rtl"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* ── 3-Part Modal Shell ── */}
      <div
        className="relative w-[min(94vw,720px)] max-h-[min(90vh,840px)] my-auto bg-[#FFF6E5] text-[#1A1A1A] border-3 border-[#1A1A1A] rounded-2xl sm:rounded-3xl shadow-[6px_6px_0px_#1A1A1A] sm:shadow-[8px_8px_0px_#1A1A1A] text-right flex flex-col overflow-hidden animate-[pop_0.2s_ease] select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 1. FIXED HEADER ── */}
        <div className="flex-shrink-0 px-5 sm:px-7 py-4 sm:py-5 border-b-2.5 border-[#1A1A1A] bg-[#FFF6E5] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#F6BD60] border-2 border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] shrink-0">
              <Settings2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-display font-black text-[#1A1A1A] leading-tight truncate">
                {title}
              </h2>
              <p className="text-xs sm:text-sm text-[#1A1A1A]/70 font-body font-bold mt-0.5">
                خصّص قواعد الجولة والمواقيت ونظام التحديات
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

        {/* ── 2. SCROLLABLE BODY ── */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 sm:py-6 flex flex-col gap-6 custom-scrollbar">
          
          {/* ── SECTION A: DARE MODE TOGGLE ── */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-display font-black text-[#1A1A1A] flex items-center gap-2">
                <Swords className="w-4 h-4 text-[#F28482] stroke-[2.5]" />
                <span>نظام التحديات والأحكام (Dare Mode)</span>
              </span>
              <span
                className={[
                  'text-xs font-black px-3 py-0.5 rounded-full border-2 border-[#1A1A1A] shrink-0 transition-colors',
                  dareEnabled ? 'bg-[#F28482] text-white' : 'bg-white text-[#1A1A1A]/60',
                ].join(' ')}
              >
                {dareEnabled ? 'مفعّلة 🔥' : 'معطّلة'}
              </span>
            </div>

            <div
              className={[
                'rounded-2xl p-4 sm:p-5 transition-all duration-200 flex flex-col gap-3 border-2.5 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A]',
                dareEnabled ? 'bg-[#FFF2EE]' : 'bg-white',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={[
                      'w-10 h-10 sm:w-11 sm:h-11 rounded-xl border-2 border-[#1A1A1A] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#1A1A1A] transition-colors',
                      dareEnabled ? 'bg-[#F28482] text-white' : 'bg-neutral-100 text-[#1A1A1A]/50',
                    ].join(' ')}
                  >
                    <Flame className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-display font-black text-[#1A1A1A]">
                      أحكام الخاسر في نهاية اللعبة
                    </h3>
                    <p className="text-xs sm:text-sm text-[#1A1A1A]/75 font-body font-bold mt-0.5 leading-relaxed">
                      {dareEnabled
                        ? 'الفائز يختار كارت حكم طريف ومحرج للمركز الأخير!'
                        : 'لعب ودي للتسلية بدون كروت عقوبات أو أحكام.'}
                    </p>
                  </div>
                </div>

                {/* Switch Button */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={dareEnabled}
                  onClick={() => setDareEnabled(!dareEnabled)}
                  className={[
                    'w-14 h-8 rounded-full transition-all duration-200 relative cursor-pointer p-0.5 shrink-0 border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]',
                    dareEnabled ? 'bg-[#F28482]' : 'bg-neutral-200',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'w-6 h-6 rounded-full bg-white border-2 border-[#1A1A1A] transition-transform duration-200 flex items-center justify-center text-xs font-black shadow-xs',
                      dareEnabled ? '-translate-x-6' : 'translate-x-0',
                    ].join(' ')}
                  >
                    {dareEnabled ? (
                      <Check className="w-3.5 h-3.5 text-[#F28482] stroke-[3]" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-neutral-400 stroke-[3]" />
                    )}
                  </div>
                </button>
              </div>

              {dareEnabled && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-[#1A1A1A]/90 font-body font-bold bg-[#F6BD60]/25 p-2.5 rounded-xl border-1.5 border-[#1A1A1A]/40">
                  <span className="text-base">💡</span>
                  <span>
                    <strong>أمثلة للأحكام:</strong> فويس نوت بصوت كرتوني، تغيير صورة الواتساب 24 ساعة، بوست اعتراف طريف!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION B: ANSWER TIME ── */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-display font-black text-[#1A1A1A] flex items-center gap-2">
                <Timer className="w-4 h-4 text-[#F6BD60] stroke-[2.5]" />
                <span>وقت كتابة الإجابة على السؤال:</span>
              </span>
              <span className="text-xs font-black px-3 py-0.5 rounded-full bg-[#F6BD60] text-[#1A1A1A] border-2 border-[#1A1A1A]">
                {answeringTimerSec} ثانية
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
              {ANSWERING_TIME_OPTIONS.map((opt) => {
                const isSelected = answeringTimerSec === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAnsweringTimerSec(opt.value)}
                    className={[
                      'h-16 py-2 px-3 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border-2.5 text-center select-none',
                      isSelected
                        ? 'bg-[#F6BD60] text-[#1A1A1A] border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] scale-[1.02] font-black'
                        : 'bg-white text-[#1A1A1A] border-[#1A1A1A]/70 hover:bg-[#FFF9EE] hover:border-[#1A1A1A] shadow-xs',
                    ].join(' ')}
                  >
                    <span className="text-sm sm:text-base font-display font-black leading-tight">
                      {opt.label}
                    </span>
                    <span className="text-[11px] font-body font-bold text-[#1A1A1A]/70 mt-0.5">
                      {opt.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── SECTION C: MATCHING / CHALLENGE TIME ── */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-display font-black text-[#1A1A1A] flex items-center gap-2">
                <Timer className="w-4 h-4 text-[#38A3A5] stroke-[2.5]" />
                <span>وقت التخمين وتوصيل الإجابات:</span>
              </span>
              <span className="text-xs font-black px-3 py-0.5 rounded-full bg-[#38A3A5] text-white border-2 border-[#1A1A1A]">
                {matchingTimerSec} ثانية
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              {MATCHING_TIME_OPTIONS.map((opt) => {
                const isSelected = matchingTimerSec === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMatchingTimerSec(opt.value)}
                    className={[
                      'h-16 py-2 px-3 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border-2.5 text-center select-none',
                      isSelected
                        ? 'bg-[#38A3A5] text-white border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] scale-[1.02] font-black'
                        : 'bg-white text-[#1A1A1A] border-[#1A1A1A]/70 hover:bg-[#FFF9EE] hover:border-[#1A1A1A] shadow-xs',
                    ].join(' ')}
                  >
                    <span className="text-sm sm:text-base font-display font-black leading-tight">
                      {opt.label}
                    </span>
                    <span className={`text-[11px] font-body font-bold mt-0.5 ${isSelected ? 'text-white/90' : 'text-[#1A1A1A]/70'}`}>
                      {opt.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── SECTION D: GAME LIMITS (ROUNDS & PLAYERS) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Rounds Card */}
            <div className="flex flex-col gap-2.5 bg-white border-2.5 border-[#1A1A1A] p-4 rounded-2xl shadow-[3px_3px_0px_#1A1A1A]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-display font-black text-[#1A1A1A] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#F6BD60] stroke-[2.5]" />
                  <span>عدد الجولات:</span>
                </span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#FFF6E5] text-[#1A1A1A] border-1.5 border-[#1A1A1A]">
                  {totalRounds} جولات
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {ROUNDS_OPTIONS.map((r) => {
                  const isSelected = totalRounds === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setTotalRounds(r.value)}
                      className={[
                        'min-h-[46px] py-1.5 px-2 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer border-2',
                        isSelected
                          ? 'bg-[#F6BD60] text-[#1A1A1A] border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] font-black'
                          : 'bg-[#FFF9EE] text-[#1A1A1A]/80 border-[#1A1A1A]/40 hover:bg-white hover:border-[#1A1A1A]',
                      ].join(' ')}
                    >
                      <span className="text-xs sm:text-sm font-black">{r.label}</span>
                      <span className="text-[10px] font-bold text-[#1A1A1A]/60">{r.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Max Players Card */}
            <div className="flex flex-col gap-2.5 bg-white border-2.5 border-[#1A1A1A] p-4 rounded-2xl shadow-[3px_3px_0px_#1A1A1A]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-display font-black text-[#1A1A1A] flex items-center gap-1.5">
                  <UsersRound className="w-4 h-4 text-[#38A3A5] stroke-[2.5]" />
                  <span>سعة الغرفة:</span>
                </span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#FFF6E5] text-[#1A1A1A] border-1.5 border-[#1A1A1A]">
                  {maxPlayers} لاعبين
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {PLAYERS_OPTIONS.map((p) => {
                  const isSelected = maxPlayers === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setMaxPlayers(p.value)}
                      className={[
                        'min-h-[46px] py-1.5 px-2 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer border-2',
                        isSelected
                          ? 'bg-[#38A3A5] text-white border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] font-black'
                          : 'bg-[#FFF9EE] text-[#1A1A1A]/80 border-[#1A1A1A]/40 hover:bg-white hover:border-[#1A1A1A]',
                      ].join(' ')}
                    >
                      <span className="text-xs sm:text-sm font-black">{p.label}</span>
                      <span className={`text-[10px] font-bold ${isSelected ? 'text-white/80' : 'text-[#1A1A1A]/60'}`}>
                        {p.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. FIXED FOOTER ── */}
        <div className="flex-shrink-0 px-5 sm:px-7 py-3.5 sm:py-4 border-t-2.5 border-[#1A1A1A] bg-[#FFF6E5] flex items-center justify-end gap-3 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[46px] px-5 rounded-xl bg-white text-[#1A1A1A] hover:bg-neutral-100 border-2 border-[#1A1A1A] font-body font-black text-sm transition-all cursor-pointer shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="min-h-[46px] px-7 rounded-xl comic-btn-pink font-body font-black text-base border-2.5 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>{isLoading ? 'جاري الحفظ...' : submitLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
