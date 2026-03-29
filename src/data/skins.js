export const BLOCK_SKINS = [
  {
    id: 'rainbow',
    name: 'Classic Rainbow',
    price: 0,
    unlocked: true,
    colors: [
      '#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93',
      '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#A66DD4',
    ],
    bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    type: 'simple'
  },
  {
    id: 'marble',
    name: 'Marble',
    price: 150,
    unlocked: false,
    colors: ['#F8FAFC','#E2E8F0','#CBD5E1','#94A3B8','#64748B'],
    bg: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    type: 'simple'
  },
  {
    id: 'wood',
    name: 'Wooden',
    price: 150,
    unlocked: false,
    colors: ['#8B5A2B','#A47148','#B07B4F','#C18C5D','#D2A06C'],
    bg: 'linear-gradient(135deg, #D7CCC8 0%, #BCAAA4 100%)',
    type: 'simple'
  },
  {
    id: 'ice',
    name: 'Ice',
    price: 150,
    unlocked: false,
    colors: ['#E0F7FA','#B2EBF2','#80DEEA','#4DD0E1','#26C6DA'],
    bg: 'linear-gradient(135deg, #E0F7FA 0%, #B3E5FC 100%)',
    type: 'simple'
  },
  {
    id: 'lava',
    name: 'Lava',
    price: 150,
    unlocked: false,
    colors: ['#FF6E40','#FF3D00','#DD2C00','#BF360C','#BF360C'],
    bg: 'linear-gradient(135deg, #FF9A8B 0%, #FF6A88 50%, #FF99AC 100%)',
    type: 'simple'
  },
  {
    id: 'objects',
    name: 'City Builder',
    price: 200,
    unlocked: false,
    bg: 'linear-gradient(135deg, #FFC8A2 0%, #FFAD8C 100%)',
    type: 'objects',
    objects: [
      { shape: 'apartment', color: '#6366F1', accent: '#4F46E5', windows: true },
      { shape: 'tower', color: '#EF4444', accent: '#DC2626', windows: true },
      { shape: 'rocket', color: '#F59E0B', accent: '#D97706', fins: true },
      { shape: 'crate', color: '#8B5CF6', accent: '#7C3AED', bands: true },
      { shape: 'house', color: '#10B981', accent: '#059669', roof: true },
      { shape: 'cylinder', color: '#EC4899', accent: '#DB2777', rings: true },
      { shape: 'castle', color: '#F97316', accent: '#EA580C', turrets: true },
      { shape: 'station', color: '#06B6D4', accent: '#0891B2', antennas: true },
    ]
  },
  {
    id: 'candy',
    name: 'Candy Land',
    price: 200,
    unlocked: false,
    bg: 'linear-gradient(135deg, #FFE5EC 0%, #FFF0F3 100%)',
    type: 'objects',
    objects: [
      { shape: 'lollipop', color: '#FF6B9D', accent: '#C2185B', swirl: true },
      { shape: 'gummy', color: '#FFD166', accent: '#FFB703', dots: true },
      { shape: 'cupcake', color: '#A78BFA', accent: '#8B5CF6', frosting: true },
      { shape: 'donut', color: '#06D6A0', accent: '#05A081', sprinkles: true },
      { shape: 'candy', color: '#118AB2', accent: '#0A6B8C', stripes: true },
      { shape: 'cookie', color: '#8D5524', accent: '#6B4226', chips: true },
    ]
  },
  {
    id: 'tech',
    name: 'Cyber Tech',
    price: 200,
    unlocked: false,
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    type: 'objects',
    objects: [
      { shape: 'server', color: '#00D4FF', accent: '#0096C7', lights: true },
      { shape: 'chip', color: '#A855F7', accent: '#9333EA', circuits: true },
      { shape: 'battery', color: '#10B981', accent: '#059669', charge: true },
      { shape: 'harddrive', color: '#F59E0B', accent: '#D97706', disks: true },
      { shape: 'router', color: '#EF4444', accent: '#DC2626', antennas: true },
    ]
  }
];

export const BACKGROUNDS = [
  {
    id: 'city',
    name: 'City Skyline',
    price: 0,
    unlocked: true,
    style: `
      radial-gradient(60% 40% at 50% 20%, rgba(255,209,102,.25) 0%, transparent 60%),
      linear-gradient(180deg, #0D1B2A 0%, #1B263B 35%, #415A77 70%, #778DA9 100%)
    `,
    animated: true
  },
  {
    id: 'jungle',
    name: 'Jungle',
    price: 100,
    unlocked: false,
    style: `
      radial-gradient(50% 30% at 20% 20%, rgba(143,188,143,.25) 0%, transparent 60%),
      linear-gradient(180deg, #0B3D0B 0%, #145214 35%, #2E8B57 100%)
    `,
    animated: true
  },
  {
    id: 'space',
    name: 'Space',
    price: 100,
    unlocked: false,
    style: `
      radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,.8) 50%, transparent 51%),
      radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,.6) 50%, transparent 51%),
      radial-gradient(1px 1px at 90% 40%, rgba(255,255,255,.7) 50%, transparent 51%),
      radial-gradient(2px 2px at 70% 20%, rgba(255,255,255,.9) 50%, transparent 51%),
      linear-gradient(180deg, #000000 0%, #0a0a1a 100%)
    `,
    animated: true
  },
  {
    id: 'underwater',
    name: 'Underwater',
    price: 100,
    unlocked: false,
    style: `
      radial-gradient(60% 40% at 50% 10%, rgba(173,216,230,.25) 0%, transparent 60%),
      linear-gradient(180deg, #0369A1 0%, #075985 35%, #0C4A6E 100%)
    `,
    animated: true
  },
  {
    id: 'casino',
    name: 'Casino Floor',
    price: 100,
    unlocked: false,
    style: `
      repeating-linear-gradient(45deg, #8B0000 0 20px, #B22222 20px 40px),
      linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 100%)
    `,
    animated: false
  },
  {
    id: 'sunset',
    name: 'Neon Sunset',
    price: 120,
    unlocked: false,
    style: `
      radial-gradient(ellipse at 50% 100%, rgba(255, 107, 157, 0.4) 0%, transparent 50%),
      linear-gradient(180deg, #1A1A2E 0%, #16213E 30%, #0F3460 60%, #533483 100%)
    `,
    animated: true
  },
  {
    id: 'desert',
    name: 'Desert Mirage',
    price: 120,
    unlocked: false,
    style: `
      radial-gradient(60% 40% at 80% 20%, rgba(255,215,0,.2) 0%, transparent 60%),
      linear-gradient(180deg, #FF9A76 0%, #FF7E5F 35%, #DB6848 100%)
    `,
    animated: true
  }
];

export const POWER_UPS = [
  { id: 'slowmo', name: 'Slow Motion', price: 100, icon: '🐌', description: 'Blocks move 50% slower for 10 seconds' },
  { id: 'freeze', name: 'Freeze', price: 80, icon: '❄️', description: 'Freezes sliding block for 3 seconds' },
  { id: 'autoperfect', name: 'Auto Perfect', price: 150, icon: '🎯', description: 'Next 3 drops are automatically perfect' },
  { id: 'shield', name: 'Shield', price: 120, icon: '🛡️', description: 'Ignores next 2 wobbles' },
];

export const ACHIEVEMENTS = [
  { id: 'first_heist', name: 'First Blood', desc: 'Complete your first heist', icon: '🩸', condition: (stats) => stats.heistsCompleted >= 1 },
  { id: 'perfectionist', name: 'Perfectionist', desc: 'Get 20 perfects in one game', icon: '💎', condition: (stats) => stats.maxPerfectStreak >= 20 },
  { id: 'tall_tower', name: 'Sky High', desc: 'Stack 50 blocks in one game', icon: '🏗️', condition: (stats) => stats.maxHeight >= 50 },
  { id: 'coin_collector', name: 'Tycoon', desc: 'Earn 1000 coins total', icon: '💰', condition: (stats) => stats.totalCoins >= 1000 },
  { id: 'bomb_disposal', name: 'Demolition Expert', desc: 'Remove 10 bomb blocks safely', icon: '💣', condition: (stats) => stats.bombsRemoved >= 10 },
  { id: 'speed_demon', name: 'Speed Demon', desc: 'Score 5000 points in under 60 seconds', icon: '⚡', condition: (stats) => stats.fastRunCompleted },
  { id: 'unstoppable', name: 'Unstoppable', desc: 'Complete 5 heists in a row', icon: '🔥', condition: (stats) => stats.consecutiveHeists >= 5 },
  { id: 'ghost_hunter', name: 'Ghost Hunter', desc: 'Stack 10 ghost blocks', icon: '👻', condition: (stats) => stats.ghostBlocksStacked >= 10 },
];
