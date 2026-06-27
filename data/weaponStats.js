// weaponStats.js - Abandoned Ward
// Weapon definitions for all equippable weapons in the game.

export const BAT = 'BAT';
export const CHAINSAW = 'CHAINSAW';
export const KATANA = 'KATANA';
export const SHOTGUN = 'SHOTGUN';
export const CROSSBOW = 'CROSSBOW';
export const FLAMETHROWER = 'FLAMETHROWER';

/**
 * Master weapon stats object keyed by weapon constant.
 * Each entry contains all data the combat system needs to resolve attacks.
 */
export const WEAPONS = {
    [BAT]: {
        name: 'Rusted Bat',
        damageBase: 18,
        attackSpeed: 2.0,
        range: 60,
        hitboxW: 50,
        hitboxH: 30,
        attackType: 'melee',
        specialEffect: 'stun',
        stunDuration: 0.3,
        knockback: 80,
        energyCost: 0,
        color: '#8B7355'
    },

    [CHAINSAW]: {
        name: 'Bloody Chainsaw',
        damageBase: 12,
        attackSpeed: 4.5,
        range: 45,
        hitboxW: 40,
        hitboxH: 25,
        attackType: 'melee_continuous',
        specialEffect: 'bleed',
        bleedDmgPerSec: 3,
        bleedDuration: 3,
        knockback: 30,
        energyCost: 1,
        color: '#666'
    },

    [KATANA]: {
        name: "Surgeon's Katana",
        damageBase: 30,
        attackSpeed: 1.5,
        range: 70,
        hitboxW: 65,
        hitboxH: 20,
        attackType: 'melee',
        specialEffect: 'lifesteal',
        lifestealPercent: 0.05,
        knockback: 120,
        energyCost: 2,
        color: '#C0C0C0'
    },

    [SHOTGUN]: {
        name: 'Police Shotgun',
        damageBase: 8,
        attackSpeed: 0.8,
        range: 180,
        hitboxW: 120,
        hitboxH: 80,
        attackType: 'ranged_spread',
        pellets: 5,
        specialEffect: 'knockback_all',
        knockback: 200,
        energyCost: 5,
        color: '#5C4033'
    },

    [CROSSBOW]: {
        name: 'Makeshift Crossbow',
        damageBase: 25,
        attackSpeed: 1.2,
        range: 350,
        hitboxW: 10,
        hitboxH: 10,
        attackType: 'ranged_pierce',
        pierceCount: 3,
        specialEffect: 'pierce',
        knockback: 20,
        energyCost: 3,
        color: '#4A3728'
    },

    [FLAMETHROWER]: {
        name: 'Medical Flamethrower',
        damageBase: 8,
        attackSpeed: 10,
        range: 120,
        hitboxW: 80,
        hitboxH: 40,
        attackType: 'ranged_spray',
        specialEffect: 'burn',
        burnDmgPerSec: 5,
        burnDuration: 4,
        knockback: 60,
        energyCost: 3,
        color: '#FF4500'
    }
};

/**
 * Weapon unlock tiers. Each tier is an array of weapon keys that become
 * available when the player reaches that tier (e.g. completing a level).
 * Tier 0 (index 0) is available from the start.
 */
export const WEAPON_UNLOCK_TIERS = [
    [BAT, CHAINSAW],
    [KATANA, SHOTGUN],
    [CROSSBOW, FLAMETHROWER]
];

/**
 * Flat array of every weapon key in definition order.
 */
export const WEAPON_LIST = [
    BAT,
    CHAINSAW,
    KATANA,
    SHOTGUN,
    CROSSBOW,
    FLAMETHROWER
];
