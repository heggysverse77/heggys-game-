const fs = require('fs');
const path = require('path');

const avatarsDir = path.join(__dirname, '..', 'public', 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Check if avatar_1, avatar_2, avatar_3 already have real JPG/PNG files
// For avatar_4 through avatar_10, create rich, beautiful SVG anime avatars with dark fiery orange vibes
const animeCharacters = [
  {
    id: 'avatar_4',
    name: 'الرابر (سلاسل ودخان)',
    tag: 'Rapper Black Anime',
    bg: ['#1c0c05', '#ff4500'],
    skin: '#8d5524',
    hair: '#111',
    chains: true,
    glasses: true,
    cigar: true,
    headwear: 'cap',
    accent: '#ffd700',
  },
  {
    id: 'avatar_5',
    name: 'البطل العربي (شماغ ملكي)',
    tag: 'Arab Anime Hero',
    bg: ['#2b0d00', '#ff6b00'],
    skin: '#d19d75',
    hair: '#1f1f1f',
    shemagh: true,
    eyes: '#f59e0b',
    accent: '#f59e0b',
  },
  {
    id: 'avatar_6',
    name: 'الساموراي الياباني',
    tag: 'Japanese Shinobi',
    bg: ['#1a0500', '#e63946'],
    skin: '#f8d7b8',
    hair: '#0d1117',
    katana: true,
    mask: true,
    accent: '#ff3366',
  },
  {
    id: 'avatar_7',
    name: 'سايبر بانك جيمر',
    tag: 'Cyberpunk Gamer',
    bg: ['#0f172a', '#ff7700'],
    skin: '#fbd38d',
    hair: '#00f2fe',
    headset: true,
    visor: true,
    accent: '#ff8800',
  },
  {
    id: 'avatar_8',
    name: 'فتاة اللهب',
    tag: 'Flame Anime Girl',
    bg: ['#200800', '#ff5500'],
    skin: '#ffe0bd',
    hair: '#ff6f61',
    headphones: true,
    accent: '#ffaa00',
  },
  {
    id: 'avatar_9',
    name: 'النينجا الغامض',
    tag: 'Shadow Ninja',
    bg: ['#120800', '#ff3700'],
    skin: '#e2b388',
    hair: '#1a202c',
    ninjaHood: true,
    accent: '#ff2200',
  },
  {
    id: 'avatar_10',
    name: 'ملك اللهب الشاب',
    tag: 'Flame King',
    bg: ['#2d1000', '#ff9900'],
    skin: '#f0c69d',
    hair: '#ffb703',
    crown: true,
    accent: '#ffd700',
  },
];

animeCharacters.forEach((char) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="bg_${char.id}" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${char.bg[1]}" />
      <stop offset="100%" stop-color="${char.bg[0]}" />
    </radialGradient>
    <linearGradient id="goldChain" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF" />
      <stop offset="30%" stop-color="#FFD700" />
      <stop offset="70%" stop-color="#FFA500" />
      <stop offset="100%" stop-color="#FF8C00" />
    </linearGradient>
    <linearGradient id="shemaghPattern" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d90429" />
      <stop offset="50%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#d90429" />
    </linearGradient>
    <filter id="glow_${char.id}">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background Circle with Neon Border -->
  <circle cx="100" cy="100" r="95" fill="url(#bg_${char.id})" stroke="${char.accent}" stroke-width="4" filter="url(#glow_${char.id})" />

  <!-- Fire / Spark Particles -->
  <circle cx="45" cy="40" r="2.5" fill="#FFF" opacity="0.8"/>
  <circle cx="155" cy="35" r="3" fill="#FFA500" opacity="0.9"/>
  <circle cx="170" cy="80" r="2" fill="#FF4500" opacity="0.7"/>
  <circle cx="30" cy="120" r="3.5" fill="#FFD700" opacity="0.85"/>

  <!-- Character Torso / Outfit -->
  <path d="M 40 200 C 40 145, 160 145, 160 200 Z" fill="#141416" stroke="#2a2a2e" stroke-width="2" />
  <path d="M 75 155 L 100 185 L 125 155 Z" fill="${char.skin}" />

  <!-- Neck -->
  <rect x="86" y="125" width="28" height="35" fill="${char.skin}" />
  <path d="M 86 135 L 100 150 L 114 135 Z" fill="#000" opacity="0.15" />

  <!-- Head / Face Base -->
  <path d="M 65 80 C 65 130, 100 145, 100 145 C 100 145, 135 130, 135 80 C 135 50, 65 50, 65 80 Z" fill="${char.skin}" stroke="#000" stroke-width="1.5" />

  <!-- Ears -->
  <circle cx="63" cy="88" r="8" fill="${char.skin}" />
  <circle cx="137" cy="88" r="8" fill="${char.skin}" />
  ${char.chains ? '<circle cx="60" cy="92" r="3" fill="#FFD700" stroke="#000" stroke-width="1"/>' : ''}

  ${
    char.shemagh
      ? `
    <!-- Arab Shemagh Headwear (Red/White Keffiyeh) -->
    <path d="M 50 60 C 50 20, 150 20, 150 60 C 165 95, 155 165, 150 190 L 135 190 C 140 150, 140 85, 125 80 C 120 70, 80 70, 75 80 C 60 85, 60 150, 65 190 L 50 190 C 45 165, 35 95, 50 60 Z" fill="#ffffff" stroke="#c9184a" stroke-width="2.5" stroke-dasharray="6,3" />
    <!-- Agal (Black Crown Ring) -->
    <ellipse cx="100" cy="48" rx="42" ry="9" fill="#111" stroke="#333" stroke-width="4" />
    <ellipse cx="100" cy="54" rx="40" ry="8" fill="#111" stroke="#444" stroke-width="3" />
    <!-- Bangs under Shemagh -->
    <path d="M 80 58 Q 100 70 120 58 Q 105 78 80 58 Z" fill="${char.hair}" />
  `
      : `
    <!-- Anime Hair Base -->
    <path d="M 55 75 C 50 35, 150 35, 145 75 C 155 40, 115 15, 95 18 C 70 20, 45 45, 55 75 Z" fill="${char.hair}" />
    <!-- Dynamic Spiky Bangs -->
    <path d="M 58 70 L 72 90 L 80 68 L 95 96 L 105 68 L 120 92 L 132 68 L 142 80 L 135 55 L 65 55 Z" fill="${char.hair}" />
  `
  }

  <!-- Eyes & Eyebrows -->
  ${
    char.glasses
      ? `
    <!-- Dark Rapper Sunglasses -->
    <rect x="68" y="76" width="30" height="18" rx="4" fill="#111" stroke="#FFD700" stroke-width="2" />
    <rect x="102" y="76" width="30" height="18" rx="4" fill="#111" stroke="#FFD700" stroke-width="2" />
    <line x1="98" y1="84" x2="102" y2="84" stroke="#FFD700" stroke-width="3" />
    <!-- Lens Glare -->
    <line x1="72" y1="80" x2="82" y2="90" stroke="#FFF" stroke-width="2" opacity="0.8" />
    <line x1="106" y1="80" x2="116" y2="90" stroke="#FFF" stroke-width="2" opacity="0.8" />
  `
      : `
    <!-- Fierce Anime Eyes -->
    <path d="M 72 78 Q 85 72 94 80 Q 85 86 72 78 Z" fill="#FFF" stroke="#000" stroke-width="2" />
    <circle cx="84" cy="80" r="4.5" fill="${char.eyes || '#ff6b00'}" />
    <circle cx="85" cy="79" r="1.5" fill="#FFF" />

    <path d="M 106 80 Q 115 72 128 78 Q 115 86 106 80 Z" fill="#FFF" stroke="#000" stroke-width="2" />
    <circle cx="116" cy="80" r="4.5" fill="${char.eyes || '#ff6b00'}" />
    <circle cx="117" cy="79" r="1.5" fill="#FFF" />

    <!-- Sharp Eyebrows -->
    <path d="M 70 72 L 95 76" stroke="#000" stroke-width="3.5" stroke-linecap="round" />
    <path d="M 130 72 L 105 76" stroke="#000" stroke-width="3.5" stroke-linecap="round" />
  `
  }

  <!-- Nose -->
  <path d="M 98 94 L 102 99 L 97 101" stroke="#000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.8" />

  <!-- Mouth -->
  <path d="M 90 115 Q 100 120 112 114" stroke="#000" stroke-width="2.5" stroke-linecap="round" fill="none" />

  ${
    char.cigar
      ? `
    <!-- Cigarette with Smoke -->
    <rect x="108" y="112" width="22" height="4" rx="1.5" fill="#FFF" stroke="#333" stroke-width="0.5" transform="rotate(-12 108 112)" />
    <rect x="127" y="108" width="4" height="4" rx="1" fill="#FF4500" filter="url(#glow_${char.id})" transform="rotate(-12 108 112)" />
    <path d="M 134 105 Q 142 95 138 85 Q 148 75 142 60" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" fill="none" stroke-linecap="round" />
  `
      : ''
  }

  ${
    char.chains
      ? `
    <!-- Heavy Gold Diamond Cuban Link Chain -->
    <path d="M 68 150 Q 100 195 132 150" stroke="url(#goldChain)" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="3,1" filter="url(#glow_${char.id})" />
    <path d="M 76 160 Q 100 198 124 160" stroke="url(#goldChain)" stroke-width="5" fill="none" stroke-linecap="round" />
    <!-- Big Medallion -->
    <circle cx="100" cy="188" r="10" fill="url(#goldChain)" stroke="#FFF" stroke-width="1.5" />
    <text x="100" y="192" font-size="10" font-weight="900" fill="#000" text-anchor="middle">👑</text>
  `
      : ''
  }

  ${
    char.headset
      ? `
    <!-- Cyberpunk Glowing Headset -->
    <path d="M 52 80 C 52 25, 148 25, 148 80" stroke="#00f2fe" stroke-width="6" fill="none" />
    <rect x="46" y="75" width="14" height="26" rx="6" fill="#111" stroke="#00f2fe" stroke-width="2" />
    <rect x="140" y="75" width="14" height="26" rx="6" fill="#111" stroke="#00f2fe" stroke-width="2" />
    <path d="M 52 95 Q 70 120 85 116" stroke="#ff7700" stroke-width="3" fill="none" />
    <circle cx="86" cy="116" r="3.5" fill="#ff7700" />
  `
      : ''
  }

  <!-- Outer Ring Badge Style -->
  <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
</svg>`;

  const svgPath = path.join(avatarsDir, `${char.id}.svg`);
  const pngPath = path.join(avatarsDir, `${char.id}.png`);
  fs.writeFileSync(svgPath, svg, 'utf-8');
  if (!fs.existsSync(pngPath)) {
    fs.writeFileSync(pngPath, svg, 'utf-8');
  }
});

console.log('Successfully generated anime avatars including Rapper with chains, Arab with Shemagh, and Japanese Samurai!');
