/**
 * Level data definitions for Abandoned Ward.
 * Each level contains metadata about the environment, enemy spawns,
 * hazards, arena configuration, and visual parameters.
 */

export const LEVELS = [
  {
    index: 0,
    name: 'Lobby',
    worldWidth: 3200,
    worldHeight: 720,
    groundY: 600,
    arenaCount: 3,
    arenaWidth: 800,
    fogDensity: 0.6,
    bgColors: {
      sky: ['#1a1a2e', '#16213e', '#0f3460'],
      wall: ['#2c2c3e', '#3a3a4e', '#252535'],
      floor: ['#1a1a1a', '#222222', '#181818'],
      accent: '#4a4a6a'
    },
    hazards: [
      { type: 'broken_glass', x: 250, y: 590, w: 80, h: 10, damage: 5 },
      { type: 'broken_glass', x: 1050, y: 590, w: 60, h: 10, damage: 5 },
      { type: 'tripwire', x: 600, y: 540, x2: 720, y2: 540, damage: 8 },
      { type: 'acid_drip', x: 1800, y: 0, interval: 1.5, damage: 10 }
    ],
    enemies: [
      { type: 'zombie', count: 3, arena: 0 },
      { type: 'zombie', count: 4, arena: 1 },
      { type: 'zombie_runner', count: 2, arena: 1 },
      { type: 'zombie', count: 5, arena: 2 },
      { type: 'zombie_brute', count: 1, arena: 2 }
    ],
    lightPositions: [
      { x: 200, y: 80, radius: 180, intensity: 0.7, flicker: true },
      { x: 600, y: 80, radius: 150, intensity: 0.5, flicker: true },
      { x: 1100, y: 80, radius: 170, intensity: 0.6, flicker: true },
      { x: 1600, y: 80, radius: 160, intensity: 0.5, flicker: true },
      { x: 2100, y: 80, radius: 180, intensity: 0.7, flicker: true },
      { x: 2600, y: 80, radius: 140, intensity: 0.4, flicker: true }
    ]
  },
  {
    index: 1,
    name: 'Maternity Ward',
    worldWidth: 3600,
    worldHeight: 720,
    groundY: 600,
    arenaCount: 3,
    arenaWidth: 900,
    fogDensity: 0.7,
    bgColors: {
      sky: ['#1e1e3a', '#2a1a3a', '#3a1a4a'],
      wall: ['#d4c5b0', '#c4b5a0', '#b4a590'],
      floor: ['#3a2a2a', '#2a1a1a', '#1a0a0a'],
      accent: '#8a6a8a'
    },
    hazards: [
      { type: 'biohazard_puddle', x: 350, y: 580, radius: 30, damage: 3 },
      { type: 'biohazard_puddle', x: 1200, y: 585, radius: 25, damage: 3 },
      { type: 'broken_glass', x: 2000, y: 590, w: 100, h: 10, damage: 5 },
      { type: 'toxic_gas', x: 2500, y: 400, w: 200, h: 200, damage: 2 }
    ],
    enemies: [
      { type: 'zombie', count: 4, arena: 0 },
      { type: 'zombie_nurse', count: 2, arena: 0 },
      { type: 'zombie_runner', count: 3, arena: 1 },
      { type: 'zombie_nurse', count: 2, arena: 1 },
      { type: 'zombie_brute', count: 1, arena: 2 },
      { type: 'zombie', count: 4, arena: 2 }
    ],
    lightPositions: [
      { x: 250, y: 60, radius: 200, intensity: 0.5, flicker: true, color: '#ff88aa' },
      { x: 800, y: 60, radius: 150, intensity: 0.3, flicker: false, color: '#ff88aa' },
      { x: 1300, y: 60, radius: 180, intensity: 0.4, flicker: true, color: '#ff88aa' },
      { x: 1900, y: 60, radius: 160, intensity: 0.3, flicker: true, color: '#ff88aa' },
      { x: 2500, y: 60, radius: 140, intensity: 0.5, flicker: true, color: '#ff88aa' },
      { x: 3100, y: 60, radius: 170, intensity: 0.4, flicker: false, color: '#ff88aa' }
    ]
  },
  {
    index: 2,
    name: 'Security',
    worldWidth: 3800,
    worldHeight: 720,
    groundY: 600,
    arenaCount: 3,
    arenaWidth: 950,
    fogDensity: 0.75,
    bgColors: {
      sky: ['#0a0a1a', '#1a1a2a', '#0a0a2a'],
      wall: ['#4a4a4a', '#5a5a5a', '#3a3a3a'],
      floor: ['#2a2a2a', '#1a1a1a', '#2a2a2a'],
      accent: '#6a8aaa'
    },
    hazards: [
      { type: 'tripwire', x: 300, y: 530, x2: 500, y2: 530, damage: 10 },
      { type: 'broken_glass', x: 900, y: 590, w: 70, h: 10, damage: 5 },
      { type: 'lightning', x: 1500, y: 0, interval: 3.0, damage: 15 },
      { type: 'acid_drip', x: 2200, y: 0, interval: 2.0, damage: 10 },
      { type: 'tripwire', x: 2800, y: 520, x2: 3000, y2: 520, damage: 10 }
    ],
    enemies: [
      { type: 'zombie_guard', count: 3, arena: 0 },
      { type: 'zombie_runner', count: 2, arena: 0 },
      { type: 'zombie_guard', count: 3, arena: 1 },
      { type: 'zombie_brute', count: 2, arena: 1 },
      { type: 'zombie_guard', count: 4, arena: 2 },
      { type: 'zombie_runner', count: 3, arena: 2 }
    ],
    lightPositions: [
      { x: 300, y: 50, radius: 200, intensity: 0.8, flicker: false, color: '#aaccff' },
      { x: 900, y: 50, radius: 180, intensity: 0.6, flicker: true, color: '#aaccff' },
      { x: 1600, y: 50, radius: 220, intensity: 0.7, flicker: false, color: '#aaccff' },
      { x: 2300, y: 50, radius: 170, intensity: 0.5, flicker: true, color: '#aaccff' },
      { x: 3000, y: 50, radius: 190, intensity: 0.6, flicker: false, color: '#aaccff' },
      { x: 3500, y: 50, radius: 160, intensity: 0.4, flicker: true, color: '#aaccff' }
    ]
  },
  {
    index: 3,
    name: 'Laboratory',
    worldWidth: 4000,
    worldHeight: 720,
    groundY: 600,
    arenaCount: 4,
    arenaWidth: 800,
    fogDensity: 0.8,
    bgColors: {
      sky: ['#0a1a0a', '#0a2a1a', '#0a1a2a'],
      wall: ['#3a4a3a', '#2a3a2a', '#1a2a1a'],
      floor: ['#1a2a1a', '#0a1a0a', '#1a1a0a'],
      accent: '#4aff8a'
    },
    hazards: [
      { type: 'biohazard_puddle', x: 400, y: 580, radius: 35, damage: 5 },
      { type: 'acid_drip', x: 800, y: 0, interval: 1.0, damage: 12 },
      { type: 'toxic_gas', x: 1400, y: 350, w: 250, h: 250, damage: 4 },
      { type: 'broken_glass', x: 2000, y: 590, w: 120, h: 10, damage: 5 },
      { type: 'biohazard_puddle', x: 2600, y: 575, radius: 40, damage: 6 },
      { type: 'acid_drip', x: 3200, y: 0, interval: 0.8, damage: 15 },
      { type: 'lightning', x: 3500, y: 0, interval: 4.0, damage: 18 }
    ],
    enemies: [
      { type: 'zombie_scientist', count: 3, arena: 0 },
      { type: 'zombie_runner', count: 2, arena: 0 },
      { type: 'zombie_scientist', count: 4, arena: 1 },
      { type: 'zombie_brute', count: 1, arena: 1 },
      { type: 'zombie_runner', count: 3, arena: 2 },
      { type: 'zombie_scientist', count: 3, arena: 2 },
      { type: 'zombie_brute', count: 2, arena: 3 },
      { type: 'zombie_scientist', count: 4, arena: 3 }
    ],
    lightPositions: [
      { x: 200, y: 40, radius: 220, intensity: 0.6, flicker: false, color: '#88ffaa' },
      { x: 800, y: 40, radius: 200, intensity: 0.5, flicker: true, color: '#88ffaa' },
      { x: 1500, y: 40, radius: 180, intensity: 0.4, flicker: true, color: '#88ffaa' },
      { x: 2200, y: 40, radius: 210, intensity: 0.5, flicker: false, color: '#88ffaa' },
      { x: 2900, y: 40, radius: 190, intensity: 0.6, flicker: true, color: '#88ffaa' },
      { x: 3600, y: 40, radius: 170, intensity: 0.4, flicker: false, color: '#88ffaa' }
    ]
  },
  {
    index: 4,
    name: 'Pharmacy',
    worldWidth: 3400,
    worldHeight: 720,
    groundY: 600,
    arenaCount: 3,
    arenaWidth: 850,
    fogDensity: 0.65,
    bgColors: {
      sky: ['#1a1a2e', '#1a2a3e', '#0a1a2e'],
      wall: ['#3a4a5a', '#4a5a6a', '#2a3a4a'],
      floor: ['#2a2a3a', '#1a1a2a', '#2a2a3a'],
      accent: '#6a8acc'
    },
    hazards: [
      { type: 'biohazard_puddle', x: 300, y: 580, radius: 30, damage: 4 },
      { type: 'toxic_gas', x: 900, y: 380, w: 180, h: 220, damage: 3 },
      { type: 'acid_drip', x: 1500, y: 0, interval: 1.2, damage: 10 },
      { type: 'broken_glass', x: 2100, y: 590, w: 90, h: 10, damage: 5 },
      { type: 'tripwire', x: 2600, y: 540, x2: 2750, y2: 540, damage: 8 }
    ],
    enemies: [
      { type: 'zombie_pharmacist', count: 3, arena: 0 },
      { type: 'zombie', count: 3, arena: 0 },
      { type: 'zombie_pharmacist', count: 3, arena: 1 },
      { type: 'zombie_runner', count: 2, arena: 1 },
      { type: 'zombie_brute', count: 1, arena: 2 },
      { type: 'zombie_pharmacist', count: 4, arena: 2 }
    ],
    lightPositions: [
      { x: 250, y: 60, radius: 180, intensity: 0.6, flicker: true, color: '#aabbff' },
      { x: 850, y: 60, radius: 160, intensity: 0.5, flicker: false, color: '#aabbff' },
      { x: 1500, y: 60, radius: 200, intensity: 0.7, flicker: true, color: '#aabbff' },
      { x: 2200, y: 60, radius: 170, intensity: 0.5, flicker: true, color: '#aabbff' },
      { x: 2900, y: 60, radius: 190, intensity: 0.6, flicker: false, color: '#aabbff' }
    ]
  },
  {
    index: 5,
    name: 'Director\'s Office',
    worldWidth: 4000,
    worldHeight: 720,
    groundY: 600,
    arenaCount: 3,
    arenaWidth: 1000,
    fogDensity: 0.85,
    bgColors: {
      sky: ['#0a0a1a', '#1a0a2a', '#0a1a2a'],
      wall: ['#3a2a3a', '#4a3a4a', '#2a1a2a'],
      floor: ['#1a1a2a', '#0a0a1a', '#1a0a1a'],
      accent: '#aa4a8a'
    },
    hazards: [
      { type: 'lightning', x: 500, y: 0, interval: 5.0, damage: 20 },
      { type: 'broken_glass', x: 1000, y: 590, w: 100, h: 10, damage: 5 },
      { type: 'biohazard_puddle', x: 1800, y: 580, radius: 35, damage: 6 },
      { type: 'toxic_gas', x: 2400, y: 350, w: 200, h: 250, damage: 5 },
      { type: 'acid_drip', x: 3000, y: 0, interval: 1.0, damage: 15 },
      { type: 'tripwire', x: 3400, y: 530, x2: 3600, y2: 530, damage: 12 }
    ],
    enemies: [
      { type: 'zombie_brute', count: 2, arena: 0 },
      { type: 'zombie_runner', count: 3, arena: 0 },
      { type: 'zombie_guard', count: 2, arena: 1 },
      { type: 'zombie_brute', count: 1, arena: 1 },
      { type: 'zombie_runner', count: 2, arena: 1 },
      { type: 'zombie_brute', count: 2, arena: 2 },
      { type: 'zombie_runner', count: 4, arena: 2 },
      { type: 'zombie_guard', count: 2, arena: 2 }
    ],
    lightPositions: [
      { x: 300, y: 40, radius: 250, intensity: 0.8, flicker: true, color: '#cc88ff' },
      { x: 1000, y: 40, radius: 220, intensity: 0.6, flicker: true, color: '#cc88ff' },
      { x: 1800, y: 40, radius: 200, intensity: 0.5, flicker: false, color: '#cc88ff' },
      { x: 2500, y: 40, radius: 230, intensity: 0.7, flicker: true, color: '#cc88ff' },
      { x: 3200, y: 40, radius: 210, intensity: 0.6, flicker: true, color: '#cc88ff' },
      { x: 3800, y: 40, radius: 180, intensity: 0.4, flicker: false, color: '#cc88ff' }
    ],
    boss: {
      type: 'director',
      arena: 2,
      health: 500,
      damage: 25
    }
  }
];

export const HAZARD_TYPES = {
  BROKEN_GLASS: 'broken_glass',
  BIOHAZARD_PUDDLE: 'biohazard_puddle',
  TRIPWIRE: 'tripwire',
  TOXIC_GAS: 'toxic_gas',
  ACID_DRIP: 'acid_drip',
  LIGHTNING: 'lightning'
};

// ---------------------------------------------------------------------------
// WAVE_COMPOSITIONS: derived from LEVELS enemy data for use by WaveManager.
// Each entry is an array of waves. Each wave is a flat array of
// [enemyTypeKey, count, enemyTypeKey, count, ...] pairs. The final wave is
// the boss sentinel ['boss'].
// ---------------------------------------------------------------------------

/** Maps descriptive enemy names used in LEVELS to ENEMY_TYPES constant keys. */
const _ENEMY_TYPE_MAP = {
  'zombie': 'WALKER',
  'zombie_runner': 'RUNNER',
  'zombie_nurse': 'SPITTER',
  'zombie_brute': 'BRUTE',
  'zombie_guard': 'WALKER',
  'zombie_scientist': 'SPITTER',
  'zombie_pharmacist': 'SPITTER',
  'zombie_exploder': 'EXPLODER',
};

/** Boss key assigned to each level (matches BOSSES keys in enemyStats.js). */
const _LEVEL_BOSS_KEYS = [
  'DR_ROT',       // Level 0 - Lobby
  'THE_MOTHER',    // Level 1 - Maternity Ward
  'ORDERLY_ZERO',  // Level 2 - Security
  'PATIENT_X43',   // Level 3 - Laboratory
  'DR_MORBUS',     // Level 4 - Pharmacy
  'THE_WARDEN',    // Level 5 - Director's Office
];

// Add bossKey to each level entry
for (let i = 0; i < LEVELS.length; i++) {
  LEVELS[i].bossKey = _LEVEL_BOSS_KEYS[i] || null;
}

/**
 * Build WAVE_COMPOSITIONS array from LEVELS data.
 * Groups enemies by arena, producing one wave per arena, followed by a boss wave.
 */
export const WAVE_COMPOSITIONS = LEVELS.map((level) => {
  // Group enemies by arena
  const wavesByArena = {};
  for (const entry of level.enemies || []) {
    const arena = entry.arena || 0;
    if (!wavesByArena[arena]) {
      wavesByArena[arena] = [];
    }
    const typeKey = _ENEMY_TYPE_MAP[entry.type] || 'WALKER';
    wavesByArena[arena].push(typeKey, entry.count || 1);
  }

  // Sort by arena index, then add boss wave
  const sortedArenas = Object.keys(wavesByArena).sort((a, b) => Number(a) - Number(b));
  const waveList = sortedArenas.map(a => wavesByArena[a]);
  waveList.push(['boss']);

  return waveList;
});
