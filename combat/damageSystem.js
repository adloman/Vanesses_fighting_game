// damageSystem.js - Abandoned Ward
// Damage calculation module providing the core damage formula,
// special effect application, and critical hit logic.

/**
 * Calculate final damage using the standard combat formula.
 *
 * Formula:
 *   finalDamage = baseDamage * comboMultiplier * damageModifier * abilityBonus * variance
 *   Then floor the result, minimum 1.
 *
 * @param {number} baseDamage     - Raw damage from the weapon or ability.
 * @param {number} comboMultiplier - Current combo multiplier (e.g. from ComboSystem).
 * @param {number} damageModifier  - Player's damage modifier (from character stats).
 * @param {number} abilityBonus    - Additional multiplier from active abilities (default 1).
 * @param {number} variance        - Variance factor (default random 0.9 - 1.1).
 * @returns {number} Final damage after all calculations.
 */
export function calculateDamage(
    baseDamage,
    comboMultiplier = 1,
    damageModifier = 1,
    abilityBonus = 1,
    variance = -1
) {
    // If variance is not provided, generate a random one in [0.9, 1.1].
    if (variance < 0) {
        variance = 0.9 + Math.random() * 0.2;
    }

    // Check for critical hit
    const critical = isCriticalHit();
    const critMultiplier = getDamageMultiplier(critical);

    let finalDamage = baseDamage * comboMultiplier * damageModifier * abilityBonus * variance * critMultiplier;

    // Floor to integer
    finalDamage = Math.floor(finalDamage);

    // Minimum 1 damage
    if (finalDamage < 1) finalDamage = 1;

    return finalDamage;
}

/**
 * Apply a special effect to an enemy entity.
 *
 * Handles stun, bleed, burn, lifesteal, and other status effects by
 * directly modifying enemy properties.
 *
 * @param {object} enemy  - The enemy entity to apply the effect to.
 * @param {{ type: string, params: object }} effect - The effect object.
 *   params vary by type:
 *     stun:     { duration: number }
 *     bleed:    { damagePerSec: number, duration: number }
 *     burn:     { damagePerSec: number, duration: number }
 *     lifesteal:{ percent: number, amountHealed: number }
 *     critical: {} (no extra application beyond visual flash)
 * @param {number} damage - The damage that triggered this effect.
 * @returns {object} Summary of what was applied, including any lifesteal amount.
 */
export function applySpecialEffect(enemy, effect, damage) {
    if (!enemy || !effect) return { applied: false };

    const summary = {
        applied: true,
        effectType: effect.type,
        lifestealAmount: 0,
        healAmount: 0
    };

    switch (effect.type) {
        case 'stun': {
            const duration = effect.params.duration || 0.3;
            // Extend stun if already stunned, or set fresh.
            enemy.stunTimer = Math.max(enemy.stunTimer || 0, duration);
            // Force AI into stunned state if possible.
            if (enemy.aiState && enemy.aiState !== 'dying') {
                enemy.aiState = 'stunned';
            }
            summary.stunDuration = duration;
            break;
        }

        case 'bleed': {
            const dmgPerSec = effect.params.damagePerSec || 3;
            const duration = effect.params.duration || 3;
            // Set bleed properties on the enemy.
            enemy.bleedTimer = Math.max(enemy.bleedTimer || 0, duration);
            enemy.bleedDmg = Math.max(enemy.bleedDmg || 0, dmgPerSec);
            summary.bleedDmgPerSec = dmgPerSec;
            summary.bleedDuration = duration;
            break;
        }

        case 'burn': {
            const dmgPerSec = effect.params.damagePerSec || 5;
            const duration = effect.params.duration || 4;
            // Set burn properties on the enemy.
            enemy.burnTimer = Math.max(enemy.burnTimer || 0, duration);
            enemy.burnDmg = Math.max(enemy.burnDmg || 0, dmgPerSec);
            summary.burnDmgPerSec = dmgPerSec;
            summary.burnDuration = duration;
            break;
        }

        case 'lifesteal': {
            const percent = effect.params.percent || 0.05;
            const amountHealed = effect.params.amountHealed || (damage * percent);
            summary.lifestealAmount = amountHealed;
            summary.healAmount = amountHealed;
            break;
        }

        case 'critical': {
            // Critical hits are handled in damage calculation; no extra enemy effect.
            // The visual flash is handled by the renderer.
            summary.isCritical = true;
            break;
        }

        case 'knockback_all': {
            // Knockback is handled at the hit resolution level.
            summary.knockback = true;
            break;
        }

        default: {
            summary.applied = false;
            break;
        }
    }

    return summary;
}

/**
 * Determine whether the current hit is a critical hit.
 * 10% chance.
 *
 * @returns {boolean} true if critical.
 */
export function isCriticalHit() {
    return Math.random() < 0.1;
}

/**
 * Get the damage multiplier for a critical hit.
 *
 * @param {boolean} critical - Whether the hit is critical.
 * @returns {number} 1.5 if critical, 1.0 otherwise.
 */
export function getDamageMultiplier(critical) {
    return critical ? 1.5 : 1.0;
}
