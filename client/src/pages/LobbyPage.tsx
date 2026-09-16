import { useEffect, useState } from 'react';
import { Settings2, UsersRound, Share2, Crown, Play, Copy, Check, LogOut } from 'lucide-react';
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

      <div className="hv-container" dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBlock: 32, maxWidth: 720 }}>
        {/* Room code banner */}
        <Card variant="glow-teal">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <p className="hv-helper" style={{ margin: '0 0 4px' }}>كود الغرفة — شاركه مع أصحابك</p>
              <button
                type="button"
                onClick={copyCode}
                className="room-code"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 32, fontWeight: 800, color: '#fff', padding: 0 }}
                title="اضغط للنسخ"
              >
                {roomCode}
              </button>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9E9E9E' }}>
                {players.length} / {maxPlayers} لاعبين • {game?.total_rounds ?? 5} جولات
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={copyCode}
                title="نسخ الكود"
                style={{ width: 48, height: 48, borderRadius: 8, background: '#FFA646', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
              >
                {copied ? <Check style={{ width: 20, height: 20 }} /> : <Copy style={{ width: 20, height: 20 }} />}
              </button>
              <button
                type="button"
                onClick={shareRoom}
                title="مشاركة"
                style={{ width: 48, height: 48, borderRadius: 8, background: '#33A9AC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
              >
                <Share2 style={{ width: 20, height: 20 }} />
              </button>
            </div>
          </div>
        </Card>

        {/* Player list — each player in a card */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <UsersRound style={{ width: 20, height: 20, color: '#33A9AC' }} />
            اللاعبون ({players.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {players.map((p: any) => {
              const isHostPlayer = Boolean(p.is_host ?? p.isHost ?? (game?.host_user_id === (p.user_id || p.userId)));
              const isCurrentUser = Boolean(user && ((p.user_id && p.user_id === user.id) || (p.userId && p.userId === user.id) || p.nickname === user.username));
              const avatarId = p.avatar_id || p.avatarId || 'avatar_1';
              return (
                <Card
                  key={p.id || p.userId || p.user_id}
                  variant={isHostPlayer ? 'glow-orange' : undefined}
                  padding={16}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <Avatar avatarId={avatarId} nickname={p.nickname} size="sm" ring="none" />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: 16, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.nickname}
                        </span>
                        {isHostPlayer && <Crown style={{ width: 16, height: 16, color: '#FFA646', flexShrink: 0 }} />}
                        {isCurrentUser && (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999, background: 'rgba(51,169,172,0.12)', color: '#6FCFD1', border: '1px solid rgba(51,169,172,0.3)' }}>
                            أنت
                          </span>
                        )}
                      </div>
                    </div>
                    {isHostPlayer ? (
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 9999, background: 'linear-gradient(135deg,#FFA646,#F86041)', color: '#fff', flexShrink: 0 }}>
                        المضيف
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 9999, background: 'rgba(76,175,80,0.12)', color: '#81C784', border: '1px solid rgba(76,175,80,0.35)', flexShrink: 0 }}>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#E0E0E0', fontWeight: 600 }}>
              <span style={{ width: 20, height: 20, border: '2px solid #33A9AC', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              بانتظار المضيف لبدء اللعبة...
            </div>
          </Card>
        )}

        {/* Utility row */}
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" icon={<Share2 style={{ width: 16, height: 16 }} />} onClick={shareRoom}>
            دعوة لاعبين
          </Button>
          {isHost && (
            <Button variant="ghost" icon={<Settings2 style={{ width: 16, height: 16 }} />} onClick={() => setEditSettingsModalOpen(true)}>
              إعدادات الغرفة
            </Button>
          )}
          {onLeave && (
            <Button variant="ghost" icon={<LogOut style={{ width: 16, height: 16 }} />} onClick={onLeave}>
              مغادرة
            </Button>
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
