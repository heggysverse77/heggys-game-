import { useEffect, useState } from 'react';
import { Settings2, UsersRound, Share2, Crown, Play, Copy, Check, LogOut, Bot } from 'lucide-react';
import GameLayout from '../components/layout/GameLayout';
import GameHeader from '../components/layout/GameHeader';
import { Avatar } from '../components/ui';
import Button from '../components/Button/Button';
import Card from '../components/Card/Card';
import RoomSettingsModal from '../components/game/RoomSettingsModal';
import { useGame } from '../hooks/useGame';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../components/ui/Toast';
import { useSound } from '../hooks/useSound';
import {
  emitStartGame,
  onUpdatePlayers,
  emitUpdateSettings,
  onSettingsUpdated,
  emitJoinRoom,
  emitAddBot,
  emitRemoveBot,
} from '../socket/lobby.events';
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

  useEffect(() => {
    if (socket && status === 'connected' && gameId) {
      emitJoinRoom({ gameId });
    }
  }, [socket, status, gameId]);

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

  const shareRoom = async () => {
    const url = `${window.location.origin}?code=${roomCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HeggyVerse — اعرف صاحبك!',
          text: `ادخل معايا نلعب! كود الغرفة: ${roomCode}`,
          url,
        });
        return;
      } catch {
        // fallback
      }
    }
    navigator.clipboard.writeText(url);
    showToast({ message: 'تم نسخ رابط الغرفة', type: 'success' });
  };

  const hasBots = players.some(
    (p: any) =>
      p.nickname?.includes('🤖') ||
      p.nickname?.includes('🦅') ||
      p.nickname?.includes('⚽') ||
      p.nickname?.includes('🌯') ||
      p.nickname?.includes('🍅') ||
      p.nickname?.includes('🧐') ||
      p.nickname?.includes('🕵️') ||
      p.isBot
  );

  const handleAddBot = () => {
    if (players.length >= maxPlayers) {
      showToast({ message: 'الغرفة ممتلئة بالكامل', type: 'warn' });
      return;
    }
    emitAddBot({ gameId });
    showToast({ message: 'تمت إضافة بوت للعبة 🤖', type: 'success' });
  };

  const handleRemoveBot = () => {
    emitRemoveBot({ gameId });
    showToast({ message: 'تم حذف البوت', type: 'info' });
  };

  const handleStart = () => {
    if (!canStart) {
      showToast({ message: `تحتاج ${minPlayers} لاعبين على الأقل للبدء`, type: 'warn' });
      return;
    }
    emitStartGame(gameId);
    onGameStarted();
  };

  return (
    <GameLayout>
      <GameHeader title={`الغرفة ${roomCode}`} roomCode={roomCode} onLeave={onLeave} leaveLabel="مغادرة" />

      <div className="hv-container" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 3vw, 24px)', paddingBlock: 'clamp(16px, 4vw, 32px)', width: '100%', maxWidth: 640 }}>
        {/* Room code banner */}
        <Card variant="glow-teal">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, flex: '1 1 auto' }}>
              <p className="hv-helper" style={{ margin: '0 0 4px', fontSize: 'clamp(12px, 3vw, 14px)' }}>كود الغرفة — شاركه مع أصحابك</p>
              <button
                type="button"
                onClick={copyCode}
                className="room-code"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'clamp(26px, 7vw, 36px)', fontWeight: 900, color: '#1A1A1A', padding: 0, letterSpacing: '0.05em' }}
                title="اضغط للنسخ"
              >
                {roomCode}
              </button>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#555555', fontWeight: 600 }}>
                {players.length} / {maxPlayers} لاعبين • {game?.total_rounds ?? 5} جولات
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                type="button"
                onClick={copyCode}
                title="نسخ الكود"
                style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, #FFA646, #F86041)', border: '2px solid #1A1A1A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '2.5px 2.5px 0px #1A1A1A' }}
              >
                {copied ? <Check style={{ width: 18, height: 18 }} /> : <Copy style={{ width: 18, height: 18 }} />}
              </button>
              <button
                type="button"
                onClick={shareRoom}
                title="مشاركة"
                style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, #33A9AC, #23787B)', border: '2px solid #1A1A1A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '2.5px 2.5px 0px #1A1A1A' }}
              >
                <Share2 style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>
        </Card>

        {/* Player list — each player in a card */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontSize: 'clamp(17px, 4vw, 20px)', fontWeight: 800, color: '#1A1A1A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UsersRound style={{ width: 20, height: 20, color: '#33A9AC' }} />
              اللاعبون ({players.length})
            </h2>
            {isHost && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleAddBot}
                  disabled={players.length >= maxPlayers}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 9999,
                    background: '#FFF0D4', border: '2px solid #1A1A1A',
                    boxShadow: '2px 2px 0px #1A1A1A', color: '#1A1A1A',
                    fontSize: 13, fontWeight: 800, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="إضافة بوت للاختبار"
                >
                  <Bot style={{ width: 16, height: 16, color: '#F86041' }} />
                  + إضافة بوت 🤖
                </button>
                {hasBots && (
                  <button
                    type="button"
                    onClick={handleRemoveBot}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '6px 12px', borderRadius: 9999,
                      background: '#FFE5E5', border: '2px solid #1A1A1A',
                      boxShadow: '2px 2px 0px #1A1A1A', color: '#D32F2F',
                      fontSize: 12, fontWeight: 800, cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title="حذف بوت"
                  >
                    - حذف بوت
                  </button>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {players.map((p: any) => {
              const isHostPlayer = Boolean(p.is_host ?? p.isHost ?? (game?.host_user_id === (p.user_id || p.userId)));
              const isCurrentUser = Boolean(user && ((p.user_id && p.user_id === user.id) || (p.userId && p.userId === user.id) || p.nickname === user.username));
              const avatarId = p.avatar_id || p.avatarId || 'avatar_1';
              return (
                <Card
                  key={p.id || p.userId || p.user_id}
                  variant={isHostPlayer ? 'glow-orange' : undefined}
                  padding={14}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <Avatar avatarId={avatarId} nickname={p.nickname} size="sm" ring="none" />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: 'clamp(14px, 3.5vw, 16px)', color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.nickname}
                        </span>
                        {isHostPlayer && <Crown style={{ width: 15, height: 15, color: '#FFA646', flexShrink: 0 }} />}
                        {isCurrentUser && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: 'rgba(51,169,172,0.15)', color: '#23787B', border: '1px solid #33A9AC' }}>
                            أنت
                          </span>
                        )}
                      </div>
                    </div>
                    {isHostPlayer ? (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 9999, background: 'linear-gradient(135deg,#FFA646,#F86041)', color: '#fff', border: '1.5px solid #1A1A1A', flexShrink: 0, boxShadow: '2px 2px 0px #1A1A1A' }}>
                        المضيف
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 9999, background: '#E8F5E9', color: '#2E7D32', border: '1.5px solid #1A1A1A', flexShrink: 0, boxShadow: '2px 2px 0px #1A1A1A' }}>
                        جاهز
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Primary action */}
        {isHost ? (
          <Button variant="primary" size="lg" fullWidth disabled={!canStart} icon={<Play style={{ width: 20, height: 20 }} />} onClick={handleStart}>
            {canStart ? 'ابدأ اللعبة' : `بانتظار لاعبين (${remaining} متبقي)`}
          </Button>
        ) : (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#1A1A1A', fontWeight: 700, fontSize: 14 }}>
              <span style={{ width: 18, height: 18, border: '2px solid #33A9AC', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              بانتظار المضيف لبدء اللعبة...
            </div>
          </Card>
        )}

        {/* Utility row — responsive flex wrapping */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%' }}>
          <div style={{ flex: '1 1 130px' }}>
            <Button variant="secondary" fullWidth icon={<Share2 style={{ width: 16, height: 16 }} />} onClick={shareRoom}>
              دعوة لاعبين
            </Button>
          </div>
          {isHost && (
            <div style={{ flex: '1 1 130px' }}>
              <Button variant="ghost" fullWidth icon={<Settings2 style={{ width: 16, height: 16 }} />} onClick={() => setEditSettingsModalOpen(true)}>
                إعدادات الغرفة
              </Button>
            </div>
          )}
          {onLeave && (
            <div style={{ flex: '1 1 90px' }}>
              <Button variant="ghost" fullWidth icon={<LogOut style={{ width: 16, height: 16 }} />} onClick={onLeave}>
                مغادرة
              </Button>
            </div>
          )}
        </div>
      </div>

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
        title="إعدادات الغرفة"
        submitLabel="حفظ التعديلات"
        isLoading={isUpdatingSettings}
      />
    </GameLayout>
  );
}
