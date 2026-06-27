// enemyStats.js - Abandoned Ward
// Enemy type definitions and boss stats.

export const WALKER = 'WALKER';
export const RUNNER = 'RUNNER';
export const SPITTER = 'SPITTER';
export const BRUTE = 'BRUTE';
export const EXPLODER = 'EXPLODER';

/**
 * Regular enemy type definitions keyed by type constant.
 * These are the standard enemies that spawn during waves.
 */
export const ENEMY_TYPES = {
    [WALKER]: {
        name: 'Walker',
        hp: 40,
        speed: 50,
        damage: 10,
        attackRange: 40,
        aggroRange: 200,
        attackCooldown: 1.5,
        score: 10,
        color: '#4A6B4A',
        width: 30,
        height: 50,
        behavior: 'walk'
    },

    [RUNNER]: {
        name: 'Runner',
        hp: 20,
        speed: 150,
        damage: 8,
        attackRange: 35,
        aggroRange: 300,
        attackCooldown: 0.8,
        score: 15,
        color: '#5A3A3A',
        width: 25,
        height: 45,
        behavior: 'run'
    },

    [SPITTER]: {
        name: 'Spitter',
        hp: 30,
        speed: 40,
        damage: 6,
        aggroRange: 350,
        attackRange: 250,
        attackCooldown: 2.0,
        projectileDamage: 12,
        projectileSpeed: 200,
        score: 20,
        color: '#3A5A3A',
        width: 28,
        height: 48,
        behavior: 'spit'
    },

    [BRUTE]: {
        name: 'Brute',
        hp: 100,
        speed: 30,
        damage: 25,
        attackRange: 55,
        aggroRange: 180,
        attackCooldown: 2.5,
        armor: 0.5,
        score: 30,
        color: '#3A3A4A',
        width: 45,
        height: 60,
        behavior: 'brute'
    },

    [EXPLODER]: {
        name: 'Exploder',
        hp: 15,
        speed: 80,
        damage: 35,
        attackRange: 80,
        aggroRange: 250,
        attackCooldown: 0,
        explosionRadius: 80,
        score: 25,
        color: '#5A5A2A',
        width: 35,
        height: 55,
        behavior: 'explode'
    }
};

// ── Boss keys ──────────────────────────────────────────────────────────────

export const DR_ROT = 'DR_ROT';
export const THE_MOTHER = 'THE_MOTHER';
export const ORDERLY_ZERO = 'ORDERLY_ZERO';
export const PATIENT_X43 = 'PATIENT_X43';
export const DR_MORBUS = 'DR_MORBUS';
export const THE_WARDEN = 'THE_WARDEN';

/**
 * Boss enemy definitions keyed by boss constant.
 * Bosses have additional fields such as level, phases, and are
 * substantially tougher than regular enemies.
 */
export const BOSSES = {
    [DR_ROT]: {
        name: 'Dr. Rot',
        hp: 300,
        speed: 60,
        damage: 20,
        level: 1,
        phases: 2,
        color: '#8B0000',
        width: 50,
        height: 70
    },

    [THE_MOTHER]: {
        name: 'The Mother',
        hp: 450,
        speed: 35,
        damage: 25,
        level: 2,
        phases: 2,
        color: '#6B3A5A',
        width: 55,
        height: 75
    },

    [ORDERLY_ZERO]: {
        name: 'Orderly Zero',
        hp: 350,
        speed: 90,
        damage: 22,
        level: 3,
        phases: 3,
        color: '#2A3A4A',
        width: 40,
        height: 65
    },

    [PATIENT_X43]: {
        name: 'Patient X-43',
        hp: 600,
        speed: 45,
        damage: 30,
        level: 4,
        phases: 3,
        color: '#3A4A3A',
        width: 60,
        height: 80
    },

    [DR_MORBUS]: {
        name: 'Dr. Morbus',
        hp: 500,
        speed: 35,
        damage: 28,
        level: 5,
        phases: 3,
        color: '#4A3A2A',
        width: 45,
        height: 70
    },

    [THE_WARDEN]: {
        name: 'The Warden',
        hp: 800,
        speed: 70,
        damage: 35,
        level: 6,
        phases: 4,
        color: '#1A1A2A',
        width: 65,
        height: 85
    }
};
