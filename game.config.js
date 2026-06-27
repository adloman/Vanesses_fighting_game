// ============================================================================
// game.config.js - Game Constants & Configuration for "Abandoned Ward"
// ============================================================================

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const GRAVITY = 980;
export const GROUND_Y = GAME_HEIGHT - 120;
export const MAX_FALL_SPEED = 600;
export const PLAYER_INVINCIBLE_TIME = 0.5;
export const MAX_PARTICLES = 300;
export const MAX_ENEMIES_ON_SCREEN = 15;

// Difficulty scaling multipliers (per level)
export const ENEMY_HP_SCALE = 1.30;
export const ENEMY_DMG_SCALE = 1.15;
export const ENEMY_COUNT_SCALE = 1.15;
export const ENEMY_SPEED_SCALE = 1.05;
export const WAVE_COUNT_BASE = 4;
export const BOSS_HP_SCALE = 1.35;
export const HAZARD_DMG_SCALE = 1.20;
export const SPECIAL_ENERGY_REGEN_BASE = 12;

// ============================================================================
// Color Palette - Dark Gritty Hospital Theme
// ============================================================================
export const COLORS = {
    // Backgrounds
    BG_DARK:        '#0a0a0c',
    BG_HALLWAY:     '#1a1618',
    BG_WALL:        '#2a2225',
    BG_FLOOR:       '#1e1a1c',
    BG_SHADOW:      '#0d0b0c',

    // Lighting
    LIGHT_FLICKER:  '#c8a84e',
    LIGHT_STEADY:   '#e8d088',
    LIGHT_DIM:      '#5a4a28',
    LIGHT_EMERGENCY:'#cc3333',

    // Blood / Gore
    BLOOD_FRESH:    '#8b0000',
    BLOOD_DARK:     '#4a0000',
    BLOOD_DRIED:    '#3a1010',
    BLOOD_SPLATTER: '#6b0a0a',

    // UI
    UI_TEXT:        '#d4c8b8',
    UI_TEXT_DIM:    '#7a7068',
    UI_HIGHLIGHT:   '#e8d088',
    UI_ACCENT:      '#cc4433',
    UI_BG:          '#1a1618',
    UI_BG_DARK:     '#0f0e10',
    UI_BORDER:      '#3a3030',
    UI_BUTTON:      '#2a2020',
    UI_BUTTON_HOVER:'#3a2828',

    // Health / Energy
    HP_FULL:        '#44bb44',
    HP_MID:         '#bbaa22',
    HP_LOW:         '#cc3333',
    HP_BG:          '#2a1010',
    ENERGY_FULL:    '#4488cc',
    ENERGY_BG:      '#102030',
    COMBO_COLOR:    '#ffaa22',

    // Character
    PLAYER_BODY:    '#5a6878',
    PLAYER_ACCENT:  '#8899aa',
    PLAYER_SKIN:    '#c8a888',
    ENEMY_BODY:     '#5a3838',
    ENEMY_DARK:     '#3a2020',
    BOSS_BODY:      '#4a2028',
    BOSS_GLOW:      '#882244',

    // Effects
    PARTICLE_FIRE:  '#ff6622',
    PARTICLE_SPARK: '#ffee88',
    PARTICLE_SMOKE: '#555544',
    PARTICLE_POISON:'#44cc44',
    PARTICLE_HEAL:  '#88ffaa',
    FLASH_WHITE:    '#ffffff',
    FLASH_DAMAGE:   '#ff2222',
    SHADOW_COLOR:   'rgba(0, 0, 0, 0.4)',

    // Weapons
    WEAPON_BLADE:   '#aabbcc',
    WEAPON_BLOOD:   '#8b0000',
    WEAPON_PIPE:    '#6a6a6a',
    WEAPON_SYRINGE: '#44cc88',
    WEAPON_GLOW:    '#88aaff',

    // Environment
    DOOR_METAL:     '#4a4a50',
    DOOR_RUST:      '#6a3a2a',
    TILE_FLOOR:     '#3a3535',
    TILE_WALL:      '#4a4040',
    GLASS_SHARD:    '#aaccdd',
    WIRE_CABLE:     '#333333',
};

// Touch control layout positions (relative to canvas)
export const TOUCH_CONTROLS = {
    JOYSTICK_CENTER_X: 160,
    JOYSTICK_CENTER_Y: 400,
    JOYSTICK_RADIUS: 80,

    ATTACK_BTN_X: 1120,
    ATTACK_BTN_Y: 480,
    ATTACK_BTN_RADIUS: 50,

    ABILITY1_BTN_X: 1020,
    ABILITY1_BTN_Y: 560,
    ABILITY1_BTN_RADIUS: 38,

    ABILITY2_BTN_X: 1120,
    ABILITY2_BTN_Y: 620,
    ABILITY2_BTN_RADIUS: 38,

    ABILITY3_BTN_X: 1200,
    ABILITY3_BTN_Y: 560,
    ABILITY3_BTN_RADIUS: 38,

    PAUSE_BTN_X: 1220,
    PAUSE_BTN_Y: 40,
    PAUSE_BTN_RADIUS: 25,
};

// Animation timing
export const ANIM = {
    ATTACK_DURATION: 0.3,
    ABILITY_DURATION: 0.5,
    HIT_STUN_DURATION: 0.2,
    DEATH_FADE_DURATION: 1.0,
    DAMAGE_FLASH_DURATION: 0.1,
    INVULN_DURATION: 0.5,
    COMBO_DISPLAY_DURATION: 2.0,
    WAVE_ANNOUNCE_DURATION: 2.0,
    BOSS_INTRO_DURATION: 3.0,
};

// Player defaults
export const PLAYER_DEFAULTS = {
    HP: 100,
    MAX_HP: 100,
    SPECIAL_ENERGY: 0,
    MAX_SPECIAL_ENERGY: 100,
    MOVE_SPEED: 280,
    JUMP_FORCE: -480,
    ATTACK_DAMAGE: 15,
    ATTACK_RANGE: 70,
    ATTACK_COOLDOWN: 0.35,
};
