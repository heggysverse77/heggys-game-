/** Returns the public path to an avatar image */
export function avatarPath(avatarId?: string): string {
  if (!avatarId) return '/avatars/avatar_1.svg';
  if (avatarId.startsWith('/') || avatarId.startsWith('http')) return avatarId;

  // Dedicated named avatar aliases for backward compatibility
  const aliasMap: Record<string, string> = {
    avatar_heggy: '/avatars/avatar_1.svg',
    heggy: '/avatars/avatar_1.svg',
    avatar_kaldy: '/avatars/avatar_2.svg',
    kaldy: '/avatars/avatar_2.svg',
    avatar_youssef: '/avatars/avatar_3.svg',
    youssef: '/avatars/avatar_3.svg',
    avatar_farag: '/avatars/avatar_4.svg',
    farag: '/avatars/avatar_4.svg',
    avatar_morsi: '/avatars/avatar_5.svg',
    morsi: '/avatars/avatar_5.svg',
    avatar_salma: '/avatars/avatar_6.svg',
    salma: '/avatars/avatar_6.svg',
    avatar_zizo: '/avatars/avatar_7.svg',
    zizo: '/avatars/avatar_7.svg',
    avatar_nada: '/avatars/avatar_8.svg',
    nada: '/avatars/avatar_8.svg',
    avatar_boss: '/avatars/avatar_9.svg',
    boss: '/avatars/avatar_9.svg',
    avatar_derp: '/avatars/avatar_10.svg',
    derp: '/avatars/avatar_10.svg',
  };

  if (aliasMap[avatarId]) {
    return aliasMap[avatarId];
  }

  const match = avatarId.match(/\d+/);
  const num = match ? parseInt(match[0], 10) : 1;
  const clamped = Math.max(1, Math.min(10, num));
  return `/avatars/avatar_${clamped}.svg`;
}

export interface AvatarMeta {
  id: string;
  name: string;
  category: string;
  emoji: string;
}

export const AVATAR_LIST: AvatarMeta[] = [
  { id: 'avatar_1', name: 'الروقان 🚬', category: 'شخصيات وردود أفعال', emoji: '🚬' },
  { id: 'avatar_2', name: 'النينجا 🥷', category: 'شخصيات وردود أفعال', emoji: '🥷' },
  { id: 'avatar_3', name: 'البرنس 😉', category: 'شخصيات وردود أفعال', emoji: '😉' },
  { id: 'avatar_4', name: 'المصدومة 😱', category: 'شخصيات وردود أفعال', emoji: '😱' },
  { id: 'avatar_5', name: 'السايبر 🎧', category: 'شخصيات وردود أفعال', emoji: '🎧' },
  { id: 'avatar_6', name: 'الشرير 😈', category: 'شخصيات وردود أفعال', emoji: '😈' },
  { id: 'avatar_7', name: 'باد جيرل 🕶️', category: 'شخصيات وردود أفعال', emoji: '🕶️' },
  { id: 'avatar_8', name: 'ميت ضحك 🤣', category: 'شخصيات وردود أفعال', emoji: '🤣' },
  { id: 'avatar_9', name: 'الزعيم 👑', category: 'شخصيات وردود أفعال', emoji: '👑' },
  { id: 'avatar_10', name: 'المتنح 😵‍💫', category: 'شخصيات وردود أفعال', emoji: '😵‍💫' },
];

/** List of all available avatar IDs */
export const AVATAR_IDS = AVATAR_LIST.map((a) => a.id);
