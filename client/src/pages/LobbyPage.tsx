import { useEffect, useState } from 'react';
import {
  Settings2,
  Sparkles,
  UsersRound,
  Copy,
  Check,
  Link,
  Plus,
} from 'lucide-react';
import GameLayout from '../components/layout/GameLayout';
import GameHeader from '../components/layout/GameHeader';
import { Avatar, Spinner } from '../components/ui';
import RoomSettingsModal from '../components/game/RoomSettingsModal';
import { useGame } from '../hooks/useGame';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../components/ui/Toast';
import { useSound } from '../hooks/useSound';
import { emitStartGame, onUpdatePlayers, emitUpdateSettings, onSettingsUpdated, emitJoinRoom } from '../socket/lobby.events';
import { onRoundStart } from '../socket/round.events';
import { updateGameSettings, getRoomById, type CreateGameOptions } from '../services/game.service';

interface LobbyPageProps {
  gameId: string;
  roomCode: string;
  onGameStarted: () => void;
  onLeave?: () => void;
}

export default function LobbyPage({ gameId, roomCode, onGameStarted, onLeave }: LobbyPageProps) {
  const { players, game, isHost, dispatch } = useGame();
  const { user } = useAuth();
  const { socket, status } = useSocket();
  const { showToast } = useToast();
  const { play } = useSound();
  const [copied, setCopied] = useState(false);
  const [editSettingsModalOpen, setEditSettingsModalOpen] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // Ensure socket joins room channel on LobbyPage mount / reconnect
  useEffect(() => {
    if (socket && status === 'connected' && gameId) {
      emitJoinRoom({ gameId });
    }
  }, [socket, status, gameId]);

  // If game is null, fetch it
  useEffect(() => {
    if (!game && gameId) {
      getRoomById(gameId)
        .then((data) => {
          if (data?.game) {
            dispatch({
              type: 'GAME_JOINED',
              game: data.game,
              players: data.players || [],
              myPlayerId: user?.id || '',
            });
          }
        })
        .catch(console.error);
    }
  }, [game, gameId, dispatch, user]);

  const minPlayers = 2;
  const maxPlayers = game?.max_players ?? 8;
  const canStart = players.length >= minPlayers;
  const remaining = Math.max(0, minPlayers - players.length);

  // Listen to socket events
  useEffect(() => {
    const offPlayers = onUpdatePlayers((payload) => {
      dispatch({ type: 'PLAYERS_UPDATED', players: payload.players });
      play('join');
    });

    const offRoundStart = onRoundStart(() => {
      onGameStarted();
    });

    const offSettings = onSettingsUpdated((payload) => {
      dispatch({ type: 'GAME_SETTINGS_UPDATED', game: payload.game });
      showToast({ message: 'تم تحديث إعدادات الغرفة من قبل المضيف', type: 'info' });
    });

    return () => {
      offPlayers();
      offRoundStart();
      offSettings();
    };
  }, [dispatch, play, onGameStarted, showToast]);

  const handleSaveSettings = async (opts: CreateGameOptions) => {
    setIsUpdatingSettings(true);
    try {
      const updated = await updateGameSettings(gameId, opts);
      emitUpdateSettings({ gameId, settings: opts });
      dispatch({ type: 'GAME_SETTINGS_UPDATED', game: updated });
      showToast({ message: 'تم تحديث إعدادات الغرفة بنجاح', type: 'success' });
      setEditSettingsModalOpen(false);
    } catch (err: any) {
      showToast({ message: err.message || 'فشل تحديث الإعدادات', type: 'error' });
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    showToast({ message: 'تم نسخ كود الغرفة', type: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}?code=${roomCode}`;
    navigator.clipboard.writeText(url);
    showToast({ message: 'تم نسخ رابط الدعوة', type: 'success' });
  };

  const handleStart = () => {
    if (!canStart) {
      showToast({ message: `تحتاج ${minPlayers} لاعبين على الأقل للبدء`, type: 'warn' });
      return;
    }
    emitStartGame(gameId);
    onGameStarted();
  };

  const emptySlotsCount = Math.max(0, maxPlayers - players.length);
  const emptySlots = Array.from({ length: emptySlotsCount }, (_, i) => i);

  return (
    <GameLayout>
      <GameHeader
        title="غرفة الانتظار"
        roomCode={roomCode}
        onLeave={onLeave}
        leaveLabel="مغادرة الغرفة"
        onLogout={onLeave}
      />

      <div className="max-w-4xl lg:max-w-5xl w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 flex flex-col gap-6 sm:gap-8 select-none" dir="rtl">
        
        {/* ── 1. Room Code Header Card ── */}
        <div className="w-full bg-[#FFF6E5] text-[#1A1A1A] border-3 border-[#1A1A1A] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[6px_6px_0px_#1A1A1A] flex flex-col md:flex-row items-center justify-between gap-5 overflow-hidden animate-[slideUp_0.25s_ease]">
          <div className="flex flex-col gap-1.5 text-center md:text-right min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 justify-center md:justify-start">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F28482] animate-pulse" />
              <span className="text-xs sm:text-sm font-black text-[#F28482] uppercase tracking-wider">
                كود الغرفة للدخول السريع
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-[#1A1A1A] leading-tight">
              شارك الكود مع أصحابك
            </h1>
            <p className="text-xs sm:text-sm text-[#1A1A1A]/70 font-body font-bold">
              اطلب من أصحابك كتابة الكود أو الضغط على رابط الدعوة المباشر
            </p>
          </div>

          {/* Room Code & Action Buttons Box */}
          <div className="flex items-center gap-2.5 bg-white border-2 border-[#1A1A1A] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-[3px_3px_0px_#1A1A1A] shrink-0 flex-wrap sm:flex-nowrap justify-center">
            <button
              type="button"
              onClick={copyCode}
              className="text-3xl sm:text-4xl md:text-5xl font-mono font-black text-[#1A1A1A] tracking-[0.2em] px-3 py-0.5 cursor-pointer hover:scale-105 active:scale-95 transition-transform select-all"
              title="اضغط للنسخ"
            >
              {roomCode}
            </button>

            <button
              type="button"
              onClick={copyCode}
              className="h-11 sm:h-12 px-4 rounded-xl comic-btn-pink text-xs sm:text-sm font-black flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#1A1A1A] shrink-0 active:translate-y-0.5"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
            </button>

            <button
              type="button"
              onClick={copyShareLink}
              className="h-11 sm:h-12 px-3 rounded-xl bg-white hover:bg-neutral-100 border-2 border-[#1A1A1A] text-[#1A1A1A] text-xs sm:text-sm font-black flex items-center gap-1 cursor-pointer shadow-[2px_2px_0px_#1A1A1A] shrink-0 active:translate-y-0.5"
              title="نسخ رابط مباشر"
            >
              <Link className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── 2. Room Settings Summary Strip ── */}
        <div className="w-full bg-[#FFF6E5] text-[#1A1A1A] border-2.5 sm:border-3 border-[#1A1A1A] rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#1A1A1A] flex flex-wrap items-center justify-between gap-3 sm:gap-4 overflow-hidden animate-[slideUp_0.3s_ease]">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="text-xs sm:text-sm font-black px-3 py-1 rounded-full bg-[#F28482] text-white border-1.5 border-[#1A1A1A] shadow-xs shrink-0">
              {game?.dare_enabled ? 'أحكام التحدي: مفعّلة 🔥' : 'بدون أحكام (ودي)'}
            </span>
            <span className="text-xs sm:text-sm font-black px-3 py-1 rounded-full bg-[#F6BD60] text-[#1A1A1A] border-1.5 border-[#1A1A1A] shadow-xs shrink-0">
              إجابة: {game?.answering_timer_sec ?? 30}ث
            </span>
            <span className="text-xs sm:text-sm font-black px-3 py-1 rounded-full bg-[#38A3A5] text-white border-1.5 border-[#1A1A1A] shadow-xs shrink-0">
              تخمين: {game?.matching_timer_sec ?? 45}ث
            </span>
            <span className="text-xs sm:text-sm font-black px-3 py-1 rounded-full bg-white text-[#1A1A1A] border-1.5 border-[#1A1A1A] shadow-xs shrink-0">
              {game?.total_rounds ?? 5} جولات
            </span>
          </div>

          {isHost && (
            <button
              type="button"
              onClick={() => setEditSettingsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 border-2 border-[#1A1A1A] text-xs sm:text-sm font-black text-[#1A1A1A] flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#1A1A1A] active:translate-y-0.5 shrink-0"
            >
              <Settings2 className="w-4 h-4" />
              <span>تعديل الإعدادات</span>
            </button>
          )}
        </div>

        {/* ── 3. Players List Card ── */}
        <div className="w-full bg-[#FFF6E5] text-[#1A1A1A] border-3 border-[#1A1A1A] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[6px_6px_0px_#1A1A1A] flex flex-col gap-4 sm:gap-5 overflow-hidden animate-[slideUp_0.35s_ease]">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b-2 border-[#1A1A1A] gap-4 flex-wrap">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <UsersRound className="w-5 h-5 sm:w-6 sm:h-6 text-[#1A1A1A]" />
              <h2 className="text-xl sm:text-2xl font-display font-black text-[#1A1A1A]">
                اللاعبون في الغرفة
              </h2>
            </div>
            <span className="text-xs sm:text-sm font-black px-3 py-1 rounded-full bg-[#F6BD60] text-[#1A1A1A] border-1.5 border-[#1A1A1A] shadow-xs shrink-0">
              {players.length} من {maxPlayers} لاعبين
            </span>
          </div>

          {/* Connected Player Rows */}
          <div className="flex flex-col gap-3">
            {players.map((p: any) => {
              const isHostPlayer = Boolean(p.is_host ?? p.isHost ?? (game?.host_user_id === (p.user_id || p.userId)));
              const isCurrentUser = Boolean(user && ((p.user_id && p.user_id === user.id) || (p.userId && p.userId === user.id) || p.nickname === user.username));
              const avatarId = p.avatar_id || p.avatarId || 'avatar_1';

              return (
                <div
                  key={p.id || p.userId || p.user_id}
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border-2.5 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] transition-all hover:scale-[1.005] gap-3"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <Avatar
                      avatarId={avatarId}
                      nickname={p.nickname}
                      size="md"
                      ring="none"
                      className="border-2 border-[#1A1A1A] shrink-0 w-12 h-12 sm:w-14 sm:h-14"
                    />
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-display font-black text-base sm:text-xl text-[#1A1A1A] truncate">
                        {p.nickname}
                      </span>
                      {isHostPlayer && <span className="text-xl shrink-0" title="مضيف الغرفة">👑</span>}
                      {isCurrentUser && (
                        <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#FFF6E5] text-[#1A1A1A] border-1.5 border-[#1A1A1A] shrink-0">
                          أنت
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isHostPlayer ? (
                      <span className="text-xs sm:text-sm font-black px-3.5 py-1 rounded-full bg-[#F28482] text-white border-1.5 border-[#1A1A1A] shadow-xs">
                        المضيف
                      </span>
                    ) : (
                      <span className="text-xs sm:text-sm font-black px-3.5 py-1 rounded-full bg-[#38A3A5] text-white border-1.5 border-[#1A1A1A] shadow-xs">
                        جاهز
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty Slots */}
          {emptySlotsCount > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {emptySlots.map((slotIndex) => (
                <div
                  key={`empty-${slotIndex}`}
                  className="flex items-center justify-center p-3 rounded-xl border-2 border-dashed border-[#1A1A1A]/30 bg-white/40 text-center gap-2 h-12 sm:h-14"
                >
                  <Plus className="w-4 h-4 text-[#1A1A1A]/40 stroke-[2.5]" />
                  <span className="text-xs sm:text-sm font-body font-bold text-[#1A1A1A]/55">
                    في انتظار لاعب إضافي...
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 4. Start Game Button ── */}
        <div className="w-full animate-[slideUp_0.4s_ease]">
          {isHost ? (
            <button
              type="button"
              onClick={handleStart}
              disabled={!canStart}
              className={[
                'w-full h-15 sm:h-17 rounded-2xl font-display font-black text-xl sm:text-2xl border-3 border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] transition-all cursor-pointer flex items-center justify-center gap-2.5 select-none',
                canStart
                  ? 'comic-btn-pink active:translate-y-0.5'
                  : 'bg-[#FFF6E5] text-[#1A1A1A]/50 border-[#1A1A1A]/50 cursor-not-allowed shadow-[3px_3px_0px_#1A1A1A]',
              ].join(' ')}
            >
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
              <span>{canStart ? 'ابدأ اللعبة الآن!' : `في انتظار ${remaining} لاعبين للبدء (${players.length}/${minPlayers})`}</span>
            </button>
          ) : (
            <div className="w-full p-5 rounded-2xl bg-[#FFF6E5] border-3 border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] text-center font-body font-black text-base sm:text-lg text-[#1A1A1A] flex items-center justify-center gap-3">
              <Spinner size="md" />
              <span>في انتظار المضيف لبدء اللعبة...</span>
            </div>
          )}
        </div>
      </div>

      {/* Host Edit Settings Modal */}
      {isHost && (
        <RoomSettingsModal
          isOpen={editSettingsModalOpen}
          onClose={() => setEditSettingsModalOpen(false)}
          onSave={handleSaveSettings}
          initialSettings={{
            dareEnabled: game?.dare_enabled,
            answeringTimerSec: game?.answering_timer_sec,
            matchingTimerSec: game?.matching_timer_sec,
            totalRounds: game?.total_rounds,
            maxPlayers: game?.max_players,
          }}
          title="تعديل إعدادات الغرفة"
          submitLabel="حفظ التعديلات وتطبيقها"
          isLoading={isUpdatingSettings}
        />
      )}
    </GameLayout>
  );
}
