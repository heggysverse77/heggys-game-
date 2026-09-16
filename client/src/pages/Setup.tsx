/* HeggyVerse — Setup page (spec: pages/Setup)
   Grouped game settings: time / rounds / team size.
   32px vertical spacing between groups, labels inline-start, options inline-end. */
import { useState } from 'react';
import GameLayout from '../components/layout/GameLayout';
import GameHeader from '../components/layout/GameHeader';
import Card from '../components/Card/Card';
import Button from '../components/Button/Button';
import RoomSettingsModal from '../components/game/RoomSettingsModal';
import type { CreateGameOptions } from '../services/game.service';

interface SetupProps {
  initialSettings?: Partial<CreateGameOptions>;
  onSave: (opts: CreateGameOptions) => void | Promise<void>;
  onBack?: () => void;
  isLoading?: boolean;
}

export default function Setup({ initialSettings, onSave, onBack, isLoading }: SetupProps) {
  const [open, setOpen] = useState(true);

  return (
    <GameLayout>
      <GameHeader title="إعدادات اللعبة" onBack={onBack} backLabel="رجوع" />
      <div className="hv-container" style={{ maxWidth: 720, paddingBlock: 32 }}>
        <Card>
          <h2 className="hv-card-title" style={{ marginBottom: 8 }}>تجهيز الغرفة</h2>
          <p className="hv-card-subtitle" style={{ marginBottom: 24 }}>
            اضبط الوقت والجولات وحجم الفريق قبل بدء التحدي
          </p>
          <Button variant="primary" fullWidth size="lg" onClick={() => setOpen(true)}>
            فتح إعدادات الغرفة
          </Button>
        </Card>
      </div>
      <RoomSettingsModal
        isOpen={open}
        onClose={() => (onBack ? onBack() : setOpen(false))}
        onSave={onSave}
        initialSettings={initialSettings}
        title="إعدادات الغرفة"
        submitLabel="تأكيد الإعدادات"
        isLoading={isLoading}
      />
    </GameLayout>
  );
}
