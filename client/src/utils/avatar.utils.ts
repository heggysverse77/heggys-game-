/** Returns the public path to an avatar image */
export function avatarPath(avatarId?: string): string {
  if (!avatarId) return '/avatars/avatar_1.jpg';
  if (avatarId.startsWith('/') || avatarId.startsWith('http')) return avatarId;

  const match = avatarId.match(/\d+/);
  const num = match ? match[0] : '1';

  // avatar 1, 2, 3 have real high-res photographic anime images (.jpg)
  if (num === '1' || num === '2' || num === '3') {
    return `/avatars/avatar_${num}.jpg`;
  }
  // avatar 4 through 10 have illustrated anime SVGs (.svg)
  return `/avatars/avatar_${num}.svg`;
}

export interface AvatarMeta {
  id: string;
  name: string;
  category: string;
  emoji: string;
}

export const AVATAR_LIST: AvatarMeta[] = [
  { id: 'avatar_1', name: 'سانجي الأوروبي', category: 'أنمي أوروبي', emoji: '🚬' },
  { id: 'avatar_2', name: 'بطل اللهب الشاب', category: 'أنمي شونين', emoji: '🔥' },
  { id: 'avatar_3', name: 'المقاتل القرمزي', category: 'أنمي فايتر', emoji: '⚡' },
  { id: 'avatar_4', name: 'رابر بالسلاسل', category: 'ستريت وير / راب', emoji: '🕶️' },
  { id: 'avatar_5', name: 'البطل العربي بالشماغ', category: 'أنمي عربي', emoji: '👑' },
  { id: 'avatar_6', name: 'الساموراي الياباني', category: 'أنمي ياباني', emoji: '⚔️' },
  { id: 'avatar_7', name: 'سايبر بانك جيمر', category: 'سايبر بانك', emoji: '🎧' },
  { id: 'avatar_8', name: 'فتاة اللهب', category: 'أنمي أنثوي', emoji: '💥' },
  { id: 'avatar_9', name: 'النينجا الغامض', category: 'نينجا وظلال', emoji: '🥷' },
  { id: 'avatar_10', name: 'ملك اللهب', category: 'ملك الحفلة', emoji: '🃏' },
];

/** List of all available avatar IDs */
export const AVATAR_IDS = AVATAR_LIST.map((a) => a.id);
