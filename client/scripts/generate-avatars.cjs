const fs = require('fs');
const path = require('path');

const avatarsDir = path.join(__dirname, '..', 'public', 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const characters = [
  {
    id: 'avatar_1',
    name: 'Lion King',
    bg1: '#FF9900', bg2: '#FF5E36',
    emoji: '🦁',
    border: '#FFD700',
    accessory: '👑'
  },
  {
    id: 'avatar_2',
    name: 'Cyber Fox',
    bg1: '#FF512F', bg2: '#DD2476',
    emoji: '🦊',
    border: '#FF007F',
    accessory: '🎧'
  },
  {
    id: 'avatar_3',
    name: 'Chill Panda',
    bg1: '#00B4DB', bg2: '#0083B0',
    emoji: '🐼',
    border: '#00F2FE',
    accessory: '🕶️'
  },
  {
    id: 'avatar_4',
    name: 'Party Tiger',
    bg1: '#F857A6', bg2: '#FF5858',
    emoji: '🐯',
    border: '#FF416C',
    accessory: '🎉'
  },
  {
    id: 'avatar_5',
    name: 'Astronaut',
    bg1: '#8E2DE2', bg2: '#4A00E0',
    emoji: '👨‍🚀',
    border: '#B224EF',
    accessory: '🚀'
  },
  {
    id: 'avatar_6',
    name: 'Cyber Bot',
    bg1: '#00F260', bg2: '#0575E6',
    emoji: '🤖',
    border: '#00FFCC',
    accessory: '⚡'
  },
  {
    id: 'avatar_7',
    name: 'Shadow Ninja',
    bg1: '#232526', bg2: '#414345',
    emoji: '🥷',
    border: '#FF3366',
    accessory: '⚔️'
  },
  {
    id: 'avatar_8',
    name: 'Wizard Owl',
    bg1: '#654ea3', bg2: '#eaafc8',
    emoji: '🦉',
    border: '#D946EF',
    accessory: '✨'
  },
  {
    id: 'avatar_9',
    name: 'Alien Gamer',
    bg1: '#11998e', bg2: '#38ef7d',
    emoji: '👾',
    border: '#00FF88',
    accessory: '🎮'
  },
  {
    id: 'avatar_10',
    name: 'Funny Joker',
    bg1: '#F7971E', bg2: '#FFD200',
    emoji: '🃏',
    border: '#FFA000',
    accessory: '🔥'
  }
];

characters.forEach(char => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="grad_${char.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${char.bg1}" />
      <stop offset="100%" stop-color="${char.bg2}" />
    </linearGradient>
    <filter id="glow_${char.id}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  
  <!-- Outer Glow Circle -->
  <circle cx="60" cy="60" r="56" fill="url(#grad_${char.id})" stroke="${char.border}" stroke-width="4" />
  
  <!-- Inner Subtle Ring -->
  <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2" stroke-dasharray="4,4" />
  
  <!-- Main Emoji / Character -->
  <text x="60" y="68" font-size="52" text-anchor="middle" dominant-baseline="central" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));">${char.emoji}</text>
  
  <!-- Accessory Badge (Bottom Right) -->
  <circle cx="92" cy="92" r="16" fill="#1C1033" stroke="${char.border}" stroke-width="2" />
  <text x="92" y="94" font-size="16" text-anchor="middle" dominant-baseline="central">${char.accessory}</text>
</svg>`;

  fs.writeFileSync(path.join(avatarsDir, `${char.id}.svg`), svg, 'utf-8');
  fs.writeFileSync(path.join(avatarsDir, `${char.id}.png`), svg, 'utf-8'); // SVG content for direct svg/png tag compatibility
});

console.log(`Successfully generated ${characters.length} avatars!`);
