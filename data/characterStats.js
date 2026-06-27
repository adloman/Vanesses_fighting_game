// characterStats.js - Abandoned Ward
// Playable character definitions and special ability data.

// ── Character keys ──────────────────────────────────────────────────────────

export const ANGEL = 'ANGEL';
export const DEVIL = 'DEVIL';

/**
 * Playable character definitions keyed by character constant.
 * Each character has unique base stats and a passive ability.
 */
export const CHARACTERS = {
    [ANGEL]: {
        name: 'Angel',
        maxHp: 120,
        speed: 160,
        damageModifier: 0.9,
        defense: 0.1,
        energyRegen: 12,
        maxEnergy: 100,
        color: '#FFD700',
        passiveName: 'Divine Aura',
        passiveDesc: 'Heals 2 HP/sec passively',
        passiveHealRate: 2,
        combatHealRate: 1
    },

    [DEVIL]: {
        name: 'Devil',
        maxHp: 100,
        speed: 180,
        damageModifier: 1.15,
        defense: 0.05,
        energyRegen: 8,
        maxEnergy: 100,
        color: '#FF4444',
        passiveName: 'Blood Thirst',
        passiveDesc: '10% lifesteal on all damage',
        lifestealPercent: 0.10,
        killHealBonus: 5
    }
};

/**
 * Ability definitions keyed by character constant.
 * Each character has 3 abilities, accessible via numeric index 1-3.
 */
export const ABILITIES = {
    [ANGEL]: {
        1: {
            name: 'Divine Shield',
            energyCost: 25,
            cooldown: 8,
            duration: 3,
            type: 'buff',
            effect: 'invulnerable',
            reflectDamage: 0.5,
            comboMultiplier: 2.0
        },
        2: {
            name: 'Holy Nova',
            energyCost: 40,
            cooldown: 12,
            duration: 0,
            type: 'aoe',
            radius: 150,
            damage: 60,
            stunDuration: 1.0
        },
        3: {
            name: "Seraph's Wings",
            energyCost: 60,
            cooldown: 20,
            duration: 5,
            type: 'buff',
            effect: 'flight',
            attackSpeedBonus: 0.5,
            featherDamage: 10,
            featherRange: 200
        }
    },

    [DEVIL]: {
        1: {
            name: 'Hellfire Burst',
            energyCost: 25,
            cooldown: 8,
            duration: 0,
            type: 'projectile',
            damage: 50,
            burnDmgPerSec: 8,
            burnDuration: 3,
            range: 300,
            aoeRadius: 80
        },
        2: {
            name: 'Soul Rend',
            energyCost: 40,
            cooldown: 12,
            duration: 0,
            type: 'dash',
            dashDistance: 150,
            damage: 35,
            stealHpPerEnemy: 15,
            maxStealTargets: 3
        },
        3: {
            name: 'Demon Form',
            energyCost: 60,
            cooldown: 20,
            duration: 6,
            type: 'transform',
            damageMultiplier: 1.5,
            speedMultiplier: 1.3,
            lifestealDouble: true
        }
    }
};
