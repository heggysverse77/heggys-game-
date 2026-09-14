import { useGameContext } from '../contexts/GameContext';
import { useAuth } from './useAuth';

export function useGame() {
  const { state, dispatch } = useGameContext();
  const { user } = useAuth();

  const me = state.players.find((p: any) => 
    (state.myPlayerId && p.id === state.myPlayerId) ||
    (user && ((p.userId && p.userId === user.id) || (p.user_id && p.user_id === user.id) || p.nickname === user.username))
  ) ?? null;

  const isHost = Boolean(
    (me as any)?.is_host ??
    (me as any)?.isHost ??
    (state.game?.host_user_id === user?.id)
  );

  return {
    ...state,
    me,
    myPlayerId: me?.id ?? state.myPlayerId,
    isHost,
    dispatch,
  };
}
