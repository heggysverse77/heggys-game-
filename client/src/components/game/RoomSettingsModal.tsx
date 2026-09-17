import { useState, useEffect } from 'react';
import { SlidersHorizontal, Timer, UsersRound, Layers, Flame, Check, Play } from 'lucide-react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
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
  { value: 15, label: '15 ثانية', tag: 'سريع' },
  { value: 20, label: '20 ثانية', tag: 'متوسط' },
  { value: 30, label: '30 ثانية', tag: 'مثالي' },
  { value: 45, label: '45 ثانية', tag: 'مريح' },
  { value: 60, label: '60 ثانية', tag: 'طويل' },
];

const MATCHING_TIME_OPTIONS = [
  { value: 30, label: '30 ثانية', tag: 'حماسي' },
  { value: 45, label: '45 ثانية', tag: 'مثالي' },
  { value: 60, label: '60 ثانية', tag: 'مريح' },
  { value: 90, label: '90 ثانية', tag: 'عميق' },
];

const ROUNDS_OPTIONS = [
  { value: 3, label: '3 جولات', desc: 'سريعة' },
  { value: 5, label: '5 جولات', desc: 'القياسية' },
  { value: 7, label: '7 جولات', desc: 'تحدي' },
  { value: 10, label: '10 جولات', desc: 'ماراثون' },
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
  title = 'إعدادات الغرفة',
  submitLabel = 'إنشاء الغرفة',
  isLoading = false,
}: RoomSettingsModalProps) {
  const [dareEnabled, setDareEnabled] = useState<boolean>(initialSettings?.dareEnabled ?? true);
  const [answeringTimerSec, setAnsweringTimerSec] = useState<number>(initialSettings?.answeringTimerSec ?? 30);
  const [matchingTimerSec, setMatchingTimerSec] = useState<number>(initialSettings?.matchingTimerSec ?? 45);
  const [totalRounds, setTotalRounds] = useState<number>(initialSettings?.totalRounds ?? 5);
  const [maxPlayers, setMaxPlayers] = useState<number>(initialSettings?.maxPlayers ?? 8);

  useEffect(() => {
    if (initialSettings && isOpen) {
      if (initialSettings.dareEnabled !== undefined) setDareEnabled(initialSettings.dareEnabled);
      if (initialSettings.answeringTimerSec !== undefined) setAnsweringTimerSec(initialSettings.answeringTimerSec);
      if (initialSettings.matchingTimerSec !== undefined) setMatchingTimerSec(initialSettings.matchingTimerSec);
      if (initialSettings.totalRounds !== undefined) setTotalRounds(initialSettings.totalRounds);
      if (initialSettings.maxPlayers !== undefined) setMaxPlayers(initialSettings.maxPlayers);
    }
  }, [initialSettings, isOpen]);

  const handleSubmit = async () => {
    await onSave({ dareEnabled, answeringTimerSec, matchingTimerSec, totalRounds, maxPlayers });
  };

  const groupLabel = (icon: React.ReactNode, text: string, value: string) => (
    <div className="hv-settings-row">
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: '#1A1A1A' }}>
        {icon}
        {text}
      </span>
      <span style={{ fontSize: 13, fontWeight: 800, padding: '6px 16px', borderRadius: 9999, background: 'linear-gradient(135deg,#33A9AC,#23787B)', color: '#fff', border: '1.5px solid #1A1A1A', boxShadow: '2px 2px 0px #1A1A1A' }}>
        {value}
      </span>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="خصّص قواعد الجولة والمواقيت ونظام التحديات"
      icon={<SlidersHorizontal style={{ width: 22, height: 22 }} />}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="primary" loading={isLoading} icon={<Play style={{ width: 16, height: 16 }} />} onClick={handleSubmit}>
            {isLoading ? 'جاري الحفظ...' : submitLabel}
          </Button>
        </>
      }
    >
      {/* Dare toggle */}
      <div className="hv-settings-group">
        <div className="hv-settings-row">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, background: dareEnabled ? 'linear-gradient(135deg,#FFA646,#F86041)' : '#E0E0E0', border: '2px solid #1A1A1A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: dareEnabled ? '#fff' : '#666', boxShadow: '2px 2px 0px #1A1A1A' }}>
              <Flame style={{ width: 20, height: 20 }} />
            </span>
            <span>
              <span style={{ display: 'block', fontSize: 16, fontWeight: 800, color: '#1A1A1A' }}>نظام التحديات والأحكام</span>
              <span style={{ display: 'block', fontSize: 13, color: '#555555', fontWeight: 600 }}>
                {dareEnabled ? 'الفائز يختار حكماً طريفاً للمركز الأخير' : 'لعب ودي بدون عقوبات'}
              </span>
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={dareEnabled}
            onClick={() => setDareEnabled(!dareEnabled)}
            style={{
              width: 56, height: 32, borderRadius: 9999, cursor: 'pointer', border: '2px solid #1A1A1A',
              background: dareEnabled ? '#FFA646' : '#E0E0E0', position: 'relative', transition: 'background 0.2s',
              boxShadow: '2px 2px 0px #1A1A1A',
            }}
          >
            <span
              style={{
                position: 'absolute', top: 2, width: 24, height: 24, borderRadius: 9999, background: '#fff', border: '1.5px solid #1A1A1A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                insetInlineStart: dareEnabled ? 26 : 2, transition: 'inset-inline-start 0.2s',
              }}
            >
              {dareEnabled && <Check style={{ width: 14, height: 14, color: '#FFA646' }} />}
            </span>
          </button>
        </div>
      </div>

      {/* Answer time */}
      <div className="hv-settings-group">
        {groupLabel(<Timer style={{ width: 18, height: 18, color: '#33A9AC' }} />, 'وقت كتابة الإجابة', `${answeringTimerSec} ثانية`)}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 12 }}>
          {ANSWERING_TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAnsweringTimerSec(opt.value)}
              className={`hv-option ${answeringTimerSec === opt.value ? 'hv-option-selected-teal' : ''}`}
            >
              <span style={{ fontWeight: 700, fontSize: 15 }}>{opt.label}</span>
              <span style={{ fontSize: 12, opacity: 0.8 }}>{opt.tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Matching time */}
      <div className="hv-settings-group">
        {groupLabel(<Timer style={{ width: 18, height: 18, color: '#33A9AC' }} />, 'وقت التخمين وتوصيل الإجابات', `${matchingTimerSec} ثانية`)}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 12 }}>
          {MATCHING_TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMatchingTimerSec(opt.value)}
              className={`hv-option ${matchingTimerSec === opt.value ? 'hv-option-selected-teal' : ''}`}
            >
              <span style={{ fontWeight: 700, fontSize: 15 }}>{opt.label}</span>
              <span style={{ fontSize: 12, opacity: 0.8 }}>{opt.tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Rounds + players */}
      <div className="hv-settings-group">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {groupLabel(<Layers style={{ width: 18, height: 18, color: '#FFA646' }} />, 'عدد الجولات', `${totalRounds}`)}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {ROUNDS_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setTotalRounds(r.value)}
                  className={`hv-option ${totalRounds === r.value ? 'hv-option-selected-orange' : ''}`}
                >
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{r.label}</span>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>{r.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {groupLabel(<UsersRound style={{ width: 18, height: 18, color: '#33A9AC' }} />, 'سعة الغرفة', `${maxPlayers}`)}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {PLAYERS_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setMaxPlayers(p.value)}
                  className={`hv-option ${maxPlayers === p.value ? 'hv-option-selected-orange' : ''}`}
                >
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{p.label}</span>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>{p.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
