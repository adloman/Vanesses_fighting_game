// abilityBase.js - Abandoned Ward
// AbilitySystem class that manages equipping, cooldowns, activation,
// and active buff/transform effects for the player's three ability slots.

import { getAbilityEffects } from './abilityDefs.js';

export class AbilitySystem {
    constructor() {
        /** Array of 3 ability data objects (or null for empty slots). */
        this.abilities = [null, null, null];

        /** Cooldown timers for each ability slot (seconds remaining). */
        this.cooldownTimers = [0, 0, 0];

        /** List of currently active buff/transform effect objects. */
        this.activeEffects = [];
    }

    /**
     * Populate the three ability slots from character ability data.
     *
     * @param {Array<object>} abilityDataArray - Array of up to 3 ability data objects
     *   (typically from ABILITIES[CHARACTER_KEY], values 1-3).
     */
    setAbilities(abilityDataArray) {
        for (let i = 0; i < 3; i++) {
            this.abilities[i] = abilityDataArray[i] || null;
            this.cooldownTimers[i] = 0;
        }
        this.activeEffects = [];
    }

    /**
     * Check whether the ability at the given index can be used.
     *
     * @param {number} index - Ability slot index (0, 1, or 2).
     * @param {number} currentEnergy - Player's current energy.
     * @returns {boolean}
     */
    canUse(index, currentEnergy = 0) {
        if (index < 0 || index > 2) return false;
        const ability = this.abilities[index];
        if (!ability) return false;

        if (this.cooldownTimers[index] > 0) return false;
        if (currentEnergy < (ability.energyCost || 0)) return false;

        return true;
    }

    /**
     * Activate the ability at the given index.
     *
     * Validates cooldown and energy, deducts energy, sets the cooldown
     * timer, and returns the concrete effect object(s) for the playState
     * to process (spawning projectiles, applying AoE damage, etc.).
     *
     * @param {number} index - Ability slot index (0, 1, or 2).
     * @param {{ x: number, y: number, width: number, height: number, facing: number,
     *           hp: number, maxHp: number, speed: number, damageModifier: number,
     *           specialEnergy: number }} player
     * @param {Array<object>} enemies - Array of enemy objects currently alive.
     * @returns {{ type: string, params: object }|null} The effect to process, or null.
     */
    use(index, player, enemies) {
        if (index < 0 || index > 2) return null;
        const ability = this.abilities[index];
        if (!ability) return null;

        // Check cooldown
        if (this.cooldownTimers[index] > 0) return null;

        // Check energy
        const cost = ability.energyCost || 0;
        if (player.specialEnergy < cost) return null;

        // Deduct energy
        player.specialEnergy -= cost;

        // Set cooldown
        this.cooldownTimers[index] = ability.cooldown || 1;

        // Generate concrete effect via abilityDefs
        const effect = getAbilityEffects(ability, player, enemies);

        // If the effect is a buff or transform, track it as an active effect
        if (effect && (effect.type === 'buff' || effect.type === 'transform')) {
            this.activeEffects.push({
                ...effect,
                slotIndex: index,
                remainingDuration: effect.duration || 0
            });
        }

        return effect;
    }

    /**
     * Per-frame update. Decrements cooldown timers, decrements active
     * effect durations, and returns a list of effects that expired
     * this frame so the playState can clean up.
     *
     * @param {number} dt - Delta time in seconds.
     * @returns {Array<object>} Effects that expired this frame.
     */
    update(dt) {
        // Tick cooldowns
        for (let i = 0; i < 3; i++) {
            if (this.cooldownTimers[i] > 0) {
                this.cooldownTimers[i] -= dt;
                if (this.cooldownTimers[i] < 0) {
                    this.cooldownTimers[i] = 0;
                }
            }
        }

        // Tick active effects and collect expired ones
        const expired = [];
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.remainingDuration -= dt;

            if (effect.remainingDuration <= 0) {
                expired.push(this.activeEffects.splice(i, 1)[0]);
            }
        }

        return expired;
    }

    /**
     * Get the cooldown progress for an ability slot.
     *
     * @param {number} index - Ability slot index (0, 1, or 2).
     * @returns {number} Value from 0 (just used) to 1 (ready).
     */
    getCooldownPercent(index) {
        if (index < 0 || index > 2) return 1;
        const ability = this.abilities[index];
        if (!ability) return 1;

        const cooldown = ability.cooldown || 1;
        const remaining = this.cooldownTimers[index];

        if (remaining <= 0) return 1;
        return 1 - (remaining / cooldown);
    }

    /**
     * Get the list of currently active buff/transform effects.
     *
     * @returns {Array<object>}
     */
    getActiveEffects() {
        return this.activeEffects.slice();
    }

    /**
     * Reset all abilities: clear cooldowns and active effects.
     */
    reset() {
        this.abilities = [null, null, null];
        this.cooldownTimers = [0, 0, 0];
        this.activeEffects = [];
    }
}
