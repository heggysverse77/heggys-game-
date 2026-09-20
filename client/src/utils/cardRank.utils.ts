export interface CardRankInfo {
  rank: string;
  suit: string;
  suitSymbol: string;
  suitColor: string;
  title: string;
  shortLabel: string;
  bgGradient: string;
  borderColor: string;
}

export const WESTERN_CARD_RANKS: CardRankInfo[] = [
  {
    rank: 'A',
    suit: '♠',
    suitSymbol: '♠',
    suitColor: '#1C1917',
    title: 'الآس (بطل الصدارة والمركز الأول)',
    shortLabel: 'المركز 1 • الآس ♠',
    bgGradient: 'linear-gradient(135deg, #FFFDF8 0%, #FEF3C7 100%)',
    borderColor: '#1C1917',
  },
  {
    rank: 'K',
    suit: '♦',
    suitSymbol: '♦',
    suitColor: '#DC2626',
    title: 'الملك (المركز الثاني)',
    shortLabel: 'المركز 2 • الملك ♦',
    bgGradient: 'linear-gradient(180deg, #FFFDF8 0%, #FFF8EB 100%)',
    borderColor: '#1C1917',
  },
  {
    rank: 'Q',
    suit: '♥',
    suitSymbol: '♥',
    suitColor: '#DC2626',
    title: 'الملكة (المركز الثالث)',
    shortLabel: 'المركز 3 • الملكة ♥',
    bgGradient: 'linear-gradient(180deg, #FFFDF8 0%, #FFF8EB 100%)',
    borderColor: '#1C1917',
  },
  {
    rank: 'J',
    suit: '♣',
    suitSymbol: '♣',
    suitColor: '#1C1917',
    title: 'الولد (المركز الرابع)',
    shortLabel: 'المركز 4 • الولد ♣',
    bgGradient: 'linear-gradient(180deg, #FFFDF8 0%, #FFF8EB 100%)',
    borderColor: '#1C1917',
  },
  {
    rank: '10',
    suit: '♠',
    suitSymbol: '♠',
    suitColor: '#1C1917',
    title: 'المركز الخامس',
    shortLabel: 'المركز 5 • 10 ♠',
    bgGradient: 'linear-gradient(180deg, #FFFDF8 0%, #FFF8EB 100%)',
    borderColor: '#1C1917',
  },
  {
    rank: '9',
    suit: '♦',
    suitSymbol: '♦',
    suitColor: '#DC2626',
    title: 'المركز السادس',
    shortLabel: 'المركز 6 • 9 ♦',
    bgGradient: 'linear-gradient(180deg, #FFFDF8 0%, #FFF8EB 100%)',
    borderColor: '#1C1917',
  },
  {
    rank: '8',
    suit: '♥',
    suitSymbol: '♥',
    suitColor: '#DC2626',
    title: 'المركز السابع',
    shortLabel: 'المركز 7 • 8 ♥',
    bgGradient: 'linear-gradient(180deg, #FFFDF8 0%, #FFF8EB 100%)',
    borderColor: '#1C1917',
  },
  {
    rank: '7',
    suit: '♣',
    suitSymbol: '♣',
    suitColor: '#1C1917',
    title: 'المركز الثامن',
    shortLabel: 'المركز 8 • 7 ♣',
    bgGradient: 'linear-gradient(180deg, #FFFDF8 0%, #FFF8EB 100%)',
    borderColor: '#1C1917',
  },
  {
    rank: '6',
    suit: '♠',
    suitSymbol: '♠',
    suitColor: '#1C1917',
    title: 'المركز التاسع',
    shortLabel: 'المركز 9 • 6 ♠',
    bgGradient: 'linear-gradient(180deg, #FFFDF8 0%, #FFF8EB 100%)',
    borderColor: '#1C1917',
  },
  {
    rank: '5',
    suit: '♦',
    suitSymbol: '♦',
    suitColor: '#DC2626',
    title: 'المركز العاشر',
    shortLabel: 'المركز 10 • 5 ♦',
    bgGradient: 'linear-gradient(180deg, #FFFDF8 0%, #FFF8EB 100%)',
    borderColor: '#1C1917',
  },
  {
    rank: '4',
    suit: '♥',
    suitSymbol: '♥',
    suitColor: '#DC2626',
    title: 'المركز الحادي عشر',
    shortLabel: 'المركز 11 • 4 ♥',
    bgGradient: 'linear-gradient(180deg, #FFFDF8 0%, #FFF8EB 100%)',
    borderColor: '#1C1917',
  },
  {
    rank: '3',
    suit: '♣',
    suitSymbol: '♣',
    suitColor: '#1C1917',
    title: 'المركز الثاني عشر',
    shortLabel: 'المركز 12 • 3 ♣',
    bgGradient: 'linear-gradient(180deg, #FFFDF8 0%, #FFF8EB 100%)',
    borderColor: '#1C1917',
  },
  {
    rank: '2',
    suit: '♠',
    suitSymbol: '♠',
    suitColor: '#1C1917',
    title: 'المركز الثالث عشر',
    shortLabel: 'المركز 13 • 2 ♠',
    bgGradient: 'linear-gradient(180deg, #FFFDF8 0%, #FFF8EB 100%)',
    borderColor: '#1C1917',
  },
];

export function getCardRank(rankPosition: number): CardRankInfo {
  // rankPosition is 1-indexed (1 = 1st place / Ace, 2 = 2nd place / King, 3 = Queen, 4 = Jack, 5 = 10, 6 = 9, ...)
  if (rankPosition >= 1 && rankPosition <= WESTERN_CARD_RANKS.length) {
    return WESTERN_CARD_RANKS[rankPosition - 1];
  }
  return {
    rank: `${rankPosition}`,
    suit: '♠',
    suitSymbol: '♠',
    suitColor: '#1C1917',
    title: `المركز ${rankPosition}`,
    shortLabel: `المركز ${rankPosition}`,
    bgGradient: 'linear-gradient(180deg, #FFFDF8 0%, #FFF8EB 100%)',
    borderColor: '#1C1917',
  };
}
