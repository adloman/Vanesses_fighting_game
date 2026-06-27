// weaponBase.js - Abandoned Ward
// WeaponSystem class that manages weapon equipping, attack generation, and hit resolution.

import { WEAPONS } from '../data/weaponStats.js';

export class WeaponSystem {
    constructor() {
        /** Currently equipped weapon data object (from WEAPONS), or null. */
        this.currentWeapon = null;

        /** Timer counting down to the next allowed attack (seconds). */
        this.attackTimer = 0;

        /** Number of consecutive hits landed without dropping the combo. */
        this.comboHitCount = 0;
    }

    /**
     * Equip a weapon by its key constant (e.g. BAT, KATANA).
     * Resets the attack timer to the new weapon's attack speed.
     *
     * @param {string} weaponKey - One of the weapon key constants from weaponStats.js.
     * @returns {boolean} true if the weapon was found and equipped.
     */
    equip(weaponKey) {
        const weaponData = WEAPONS[weaponKey];
        if (!weaponData) {
            console.warn(`WeaponSystem: unknown weapon key "${weaponKey}"`);
            return false;
        }

        this.currentWeapon = { ...weaponData, key: weaponKey };
        // attackSpeed in data is attacks-per-second; convert to cooldown in seconds.
        this.attackTimer = 0;
        this.comboHitCount = 0;
        return true;
    }

    /**
     * Whether the player can initiate a new attack right now.
     * @returns {boolean}
     */
    canAttack() {
        return this.attackTimer <= 0 && this.currentWeapon !== null;
    }

    /**
     * Per-frame update. Decrements the attack timer.
     * @param {number} dt - Delta time in seconds.
     */
    update(dt) {
        if (this.attackTimer > 0) {
            this.attackTimer -= dt;
            if (this.attackTimer < 0) {
                this.attackTimer = 0;
            }
        }
    }

    /**
     * Generate attack data for the current weapon based on player state.
     *
     * The returned object describes a hitbox (for melee) or projectile
     * spawn points (for ranged) so that the playState can resolve
     * collisions and create entities.
     *
     * @param {{ x: number, y: number, width: number, height: number, facing: number }} player
     * @returns {{ hitbox: object|null, projectileSpawns: Array|null, damage: number, knockback: number, specialEffect: string, specialParams: object }}
     */
    getAttackData(player) {
        if (!this.currentWeapon) {
            return this._emptyAttackData();
        }

        const wep = this.currentWeapon;
        const px = player.x;
        const py = player.y;
        const pw = player.width;
        const ph = player.height;
        const facing = player.facing || 1;

        let hitbox = null;
        let projectileSpawns = null;
        let specialEffect = wep.specialEffect || 'none';
        let specialParams = {};

        switch (wep.attackType) {
            case 'melee': {
                // Rectangle hitbox positioned in front of the player.
                const hbW = wep.hitboxW || 50;
                const hbH = wep.hitboxH || 30;
                const hbX = facing === 1
                    ? px + pw
                    : px - hbW;
                const hbY = py + ph * 0.25;
                hitbox = { x: hbX, y: hbY, w: hbW, h: hbH };

                if (specialEffect === 'stun') {
                    specialParams.stunDuration = wep.stunDuration || 0.3;
                } else if (specialEffect === 'lifesteal') {
                    specialParams.lifestealPercent = wep.lifestealPercent || 0.05;
                }
                break;
            }

            case 'melee_continuous': {
                // Smaller hitbox for continuous rapid attacks (chainsaw).
                const hbW = (wep.hitboxW || 40) * 0.7;
                const hbH = (wep.hitboxH || 25) * 0.8;
                const hbX = facing === 1
                    ? px + pw
                    : px - hbW;
                const hbY = py + ph * 0.3;
                hitbox = { x: hbX, y: hbY, w: hbW, h: hbH };

                if (specialEffect === 'bleed') {
                    specialParams.bleedDmgPerSec = wep.bleedDmgPerSec || 3;
                    specialParams.bleedDuration = wep.bleedDuration || 3;
                }
                break;
            }

            case 'ranged_spread': {
                // Shotgun-style: creates 5 projectile spawn points with spread angles.
                const pellets = wep.pellets || 5;
                const spreadAngleDeg = 25;
                const baseAngle = facing === 1 ? 0 : Math.PI;
                const spawnX = px + pw * 0.5 + facing * (pw * 0.5);
                const spawnY = py + ph * 0.4;

                projectileSpawns = [];
                const halfSpread = (spreadAngleDeg * (Math.PI / 180)) / 2;
                for (let i = 0; i < pellets; i++) {
                    const t = pellets === 1 ? 0 : (i / (pellets - 1)) * 2 - 1; // -1 to 1
                    const angle = baseAngle + t * halfSpread;
                    projectileSpawns.push({
                        x: spawnX,
                        y: spawnY,
                        angle: angle,
                        speed: 500,
                        damage: wep.damageBase,
                        type: 'bullet'
                    });
                }

                if (specialEffect === 'knockback_all') {
                    specialParams.knockbackAll = true;
                }
                break;
            }

            case 'ranged_pierce': {
                // Crossbow-style: single precision projectile that pierces multiple enemies.
                const spawnX = px + pw * 0.5 + facing * (pw * 0.5);
                const spawnY = py + ph * 0.35;
                const baseAngle = facing === 1 ? 0 : Math.PI;

                projectileSpawns = [
                    {
                        x: spawnX,
                        y: spawnY,
                        angle: baseAngle,
                        speed: 600,
                        damage: wep.damageBase,
                        type: 'arrow',
                        pierceCount: wep.pierceCount || 3
                    }
                ];

                if (specialEffect === 'pierce') {
                    specialParams.pierceCount = wep.pierceCount || 3;
                }
                break;
            }

            case 'ranged_spray': {
                // Flamethrower-style: cone of flame particles.
                const coneAngleDeg = 20;
                const particleCount = 8;
                const baseAngle = facing === 1 ? 0 : Math.PI;
                const spawnX = px + pw * 0.5 + facing * (pw * 0.5);
                const spawnY = py + ph * 0.4;
                const halfCone = (coneAngleDeg * (Math.PI / 180)) / 2;

                projectileSpawns = [];
                for (let i = 0; i < particleCount; i++) {
                    const t = particleCount === 1 ? 0 : (i / (particleCount - 1)) * 2 - 1;
                    const angle = baseAngle + t * halfCone;
                    const speedVariation = 250 + Math.random() * 100;
                    projectileSpawns.push({
                        x: spawnX + Math.random() * 10 * facing,
                        y: spawnY + (Math.random() - 0.5) * 10,
                        angle: angle,
                        speed: speedVariation,
                        damage: wep.damageBase,
                        type: 'flame',
                        lifetime: 0.3 + Math.random() * 0.2
                    });
                }

                if (specialEffect === 'burn') {
                    specialParams.burnDmgPerSec = wep.burnDmgPerSec || 5;
                    specialParams.burnDuration = wep.burnDuration || 4;
                }
                break;
            }

            default:
                break;
        }

        return {
            hitbox: hitbox,
            projectileSpawns: projectileSpawns,
            damage: wep.damageBase || 10,
            knockback: wep.knockback || 50,
            specialEffect: specialEffect,
            specialParams: specialParams
        };
    }

    /**
     * Process a successful hit on an enemy. Calculates final damage using
     * the standard damage formula and builds a list of status effects to
     * apply.
     *
     * Formula:
     *   finalDamage = baseDamage * comboMultiplier * damageModifier * (variance 0.9 - 1.1)
     *   Critical: 10% chance, 1.5x multiplier applied to the above.
     *
     * @param {object} enemy       - The enemy that was hit.
     * @param {number} comboMultiplier - Current combo multiplier from ComboSystem.
     * @param {number} damageModifier  - Player's damage modifier (from character stats).
     * @returns {{ damage: number, effects: Array<{ type: string, params: object }> }}
     */
    onHit(enemy, comboMultiplier = 1, damageModifier = 1) {
        if (!this.currentWeapon) {
            return { damage: 0, effects: [] };
        }

        const wep = this.currentWeapon;

        // Base damage
        let baseDamage = wep.damageBase || 10;

        // Variance roll (0.9 - 1.1)
        const variance = 0.9 + Math.random() * 0.2;

        // Critical hit check (10% chance)
        const isCrit = Math.random() < 0.1;
        const critMultiplier = isCrit ? 1.5 : 1.0;

        // Final damage formula
        let finalDamage = baseDamage * comboMultiplier * damageModifier * variance * critMultiplier;
        finalDamage = Math.floor(finalDamage);

        // Minimum 1 damage
        if (finalDamage < 1) finalDamage = 1;

        // Build effects list from special params
        const effects = [];

        if (isCrit) {
            effects.push({ type: 'critical', params: {} });
        }

        switch (wep.specialEffect) {
            case 'stun': {
                const dur = wep.stunDuration || 0.3;
                effects.push({ type: 'stun', params: { duration: dur } });
                break;
            }
            case 'bleed': {
                const dmgPerSec = wep.bleedDmgPerSec || 3;
                const dur = wep.bleedDuration || 3;
                effects.push({ type: 'bleed', params: { damagePerSec: dmgPerSec, duration: dur } });
                break;
            }
            case 'lifesteal': {
                const pct = wep.lifestealPercent || 0.05;
                effects.push({ type: 'lifesteal', params: { percent: pct, amountHealed: finalDamage * pct } });
                break;
            }
            case 'burn': {
                const dmgPerSec = wep.burnDmgPerSec || 5;
                const dur = wep.burnDuration || 4;
                effects.push({ type: 'burn', params: { damagePerSec: dmgPerSec, duration: dur } });
                break;
            }
            case 'knockback_all': {
                // Knockback is handled via the knockback value; no extra effect needed.
                break;
            }
            case 'pierce': {
                // Pierce is handled at the projectile level; no extra effect needed.
                break;
            }
            default:
                break;
        }

        // Increment combo hit count
        this.comboHitCount++;

        // Set attack timer based on weapon's attack speed (attacks-per-second -> cooldown)
        const cooldownSeconds = 1.0 / (wep.attackSpeed || 1);
        this.attackTimer = cooldownSeconds;

        return { damage: finalDamage, effects: effects };
    }

    /**
     * Returns display-ready information about the currently equipped weapon.
     * @returns {{ name: string, attackType: string, damageBase: number, color: string, range: number, energyCost: number }|null}
     */
    getWeaponInfo() {
        if (!this.currentWeapon) return null;

        return {
            name: this.currentWeapon.name,
            attackType: this.currentWeapon.attackType,
            damageBase: this.currentWeapon.damageBase,
            color: this.currentWeapon.color,
            range: this.currentWeapon.range,
            energyCost: this.currentWeapon.energyCost || 0
        };
    }

    /**
     * Helper that returns an empty/zeroed attack data object.
     * @private
     */
    _emptyAttackData() {
        return {
            hitbox: null,
            projectileSpawns: null,
            damage: 0,
            knockback: 0,
            specialEffect: 'none',
            specialParams: {}
        };
    }
}
