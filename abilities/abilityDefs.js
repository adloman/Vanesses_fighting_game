// abilityDefs.js - Abandoned Ward
// Ability effect definitions: processes ability activation data into
// concrete effect objects, provides icon drawing helpers, and
// description formatters.

import { ABILITIES } from '../data/characterStats.js';

// Re-export so consumers can import through this module.
export { ABILITIES };

/**
 * Process an ability activation and return a concrete effect object
 * that the playState can immediately use to spawn entities or apply
 * game-state changes.
 *
 * @param {object} abilityData - The ability data object (from ABILITIES).
 * @param {{ x: number, y: number, width: number, height: number, facing: number,
 *           hp: number, maxHp: number, speed: number, damageModifier: number,
 *           specialEnergy: number }} player
 * @param {Array<{ x: number, y: number, width: number, height: number, alive: boolean }>} enemies
 * @returns {{ type: string, name: string, [key: string]: any }}
 */
export function getAbilityEffects(abilityData, player, enemies) {
    if (!abilityData) return null;

    const effectType = abilityData.type;
    const name = abilityData.name || 'Unknown';
    const px = player.x;
    const py = player.y;
    const pw = player.width;
    const ph = player.height;
    const facing = player.facing || 1;

    switch (effectType) {
        // ── Buff: grants a temporary status to the player ──────────
        case 'buff': {
            const effect = abilityData.effect || 'none';
            const duration = abilityData.duration || 0;
            const params = { effect: effect, duration: duration };

            if (effect === 'invulnerable') {
                params.invulnerable = true;
                params.reflectDamage = abilityData.reflectDamage || 0;
                params.comboMultiplier = abilityData.comboMultiplier || 1;
            } else if (effect === 'flight') {
                params.flight = true;
                params.attackSpeedBonus = abilityData.attackSpeedBonus || 0;
                params.featherDamage = abilityData.featherDamage || 0;
                params.featherRange = abilityData.featherRange || 200;
            }

            return {
                type: 'buff',
                name: name,
                duration: duration,
                params: params
            };
        }

        // ── AoE: area-of-effect damage centered on the player ───────
        case 'aoe': {
            const centerX = px + pw * 0.5;
            const centerY = py + ph * 0.5;
            const radius = abilityData.radius || 150;
            const damage = abilityData.damage || 60;
            const stunDuration = abilityData.stunDuration || 0;

            // Determine which enemies are within range
            const affects = [];
            for (const enemy of enemies) {
                if (!enemy || !enemy.alive) continue;
                const ex = enemy.x + (enemy.width || 0) * 0.5;
                const ey = enemy.y + (enemy.height || 0) * 0.5;
                const dx = ex - centerX;
                const dy = ey - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= radius) {
                    affects.push(enemy);
                }
            }

            return {
                type: 'aoe',
                name: name,
                x: centerX,
                y: centerY,
                radius: radius,
                damage: damage,
                stunDuration: stunDuration,
                affects: affects
            };
        }

        // ── Projectile: fires a projectile from the player ───────────
        case 'projectile': {
            const spawnX = px + pw * 0.5 + facing * (pw * 0.5 + 5);
            const spawnY = py + ph * 0.4;
            const angle = facing === 1 ? 0 : Math.PI;
            const speed = 400;
            const damage = abilityData.damage || 50;
            const burnDmgPerSec = abilityData.burnDmgPerSec || 0;
            const burnDuration = abilityData.burnDuration || 0;
            const range = abilityData.range || 300;
            const aoeRadius = abilityData.aoeRadius || 0;

            return {
                type: 'projectile',
                name: name,
                x: spawnX,
                y: spawnY,
                angle: angle,
                speed: speed,
                damage: damage,
                burnDmgPerSec: burnDmgPerSec,
                burnDuration: burnDuration,
                range: range,
                aoeRadius: aoeRadius
            };
        }

        // ── Dash: player lunges forward, damaging and lifestealing ──
        case 'dash': {
            const startX = px + pw * 0.5;
            const startY = py + ph * 0.5;
            const dashDistance = abilityData.dashDistance || 150;
            const endX = startX + facing * dashDistance;
            const endY = startY;
            const damage = abilityData.damage || 35;
            const stealHpPerEnemy = abilityData.stealHpPerEnemy || 15;
            const maxStealTargets = abilityData.maxStealTargets || 3;

            // Identify enemies hit along the dash path
            const affected = [];
            for (const enemy of enemies) {
                if (!enemy || !enemy.alive) continue;
                if (affected.length >= maxStealTargets) break;

                const ex = enemy.x + (enemy.width || 0) * 0.5;
                const ey = enemy.y + (enemy.height || 0) * 0.5;

                // Check if enemy is within the dash corridor
                const minX = facing === 1 ? startX : endX;
                const maxX = facing === 1 ? endX : startX;
                if (ex >= minX && ex <= maxX) {
                    const corridorHalfWidth = 30;
                    if (Math.abs(ey - startY) < corridorHalfHeight(corridorHalfWidth)) {
                        affected.push(enemy);
                    }
                }
            }

            return {
                type: 'dash',
                name: name,
                startX: startX,
                startY: startY,
                endX: endX,
                endY: endY,
                damage: damage,
                stealHpPerEnemy: stealHpPerEnemy,
                maxStealTargets: maxStealTargets,
                affects: affected
            };
        }

        // ── Transform: transforms the player for a duration ──────────
        case 'transform': {
            const duration = abilityData.duration || 5;
            const damageMultiplier = abilityData.damageMultiplier || 1;
            const speedMultiplier = abilityData.speedMultiplier || 1;
            const lifestealDouble = abilityData.lifestealDouble || false;

            return {
                type: 'transform',
                name: name,
                duration: duration,
                damageMultiplier: damageMultiplier,
                speedMultiplier: speedMultiplier,
                lifestealDouble: lifestealDouble
            };
        }

        default:
            console.warn(`abilityDefs: unknown ability type "${effectType}"`);
            return null;
    }
}

/**
 * Helper to compute corridor half-height based on half-width.
 * For a dash corridor, the enemy vertical distance must be less than
 * the corridor's vertical extent (player height + some margin).
 *
 * @param {number} _corridorHalfWidth
 * @returns {number}
 */
function corridorHalfHeight(_corridorHalfWidth) {
    return 50;
}

/**
 * Draw an icon for the given ability data using canvas primitives.
 *
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
 * @param {object} abilityData - The ability data object (must have .name).
 * @param {number} x     - Center x of the icon.
 * @param {number} y     - Center y of the icon.
 * @param {number} size  - Icon size (width and height in pixels).
 */
export function drawAbilityIcon(ctx, abilityData, x, y, size) {
    if (!abilityData || !abilityData.name) return;

    ctx.save();
    const half = size / 2;
    const name = abilityData.name;

    switch (name) {
        // ── Divine Shield: golden circle ────────────────────────────
        case 'Divine Shield': {
            // Outer golden circle
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, half * 0.7, 0, Math.PI * 2);
            ctx.stroke();

            // Inner glow
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, half * 0.7);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, half * 0.7, 0, Math.PI * 2);
            ctx.fill();

            // Shield cross
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y - half * 0.4);
            ctx.lineTo(x, y + half * 0.4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x - half * 0.4, y);
            ctx.lineTo(x + half * 0.4, y);
            ctx.stroke();
            break;
        }

        // ── Holy Nova: expanding rings ────────────────────────────────
        case 'Holy Nova': {
            // Outer ring
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, half * 0.75, 0, Math.PI * 2);
            ctx.stroke();

            // Middle ring
            ctx.strokeStyle = 'rgba(255, 255, 200, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, half * 0.5, 0, Math.PI * 2);
            ctx.stroke();

            // Inner ring
            ctx.strokeStyle = 'rgba(255, 255, 150, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, half * 0.25, 0, Math.PI * 2);
            ctx.stroke();

            // Center burst
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x, y, half * 0.12, 0, Math.PI * 2);
            ctx.fill();

            // Radiant lines
            ctx.strokeStyle = 'rgba(255, 255, 200, 0.5)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(
                    x + Math.cos(angle) * half * 0.15,
                    y + Math.sin(angle) * half * 0.15
                );
                ctx.lineTo(
                    x + Math.cos(angle) * half * 0.7,
                    y + Math.sin(angle) * half * 0.7
                );
                ctx.stroke();
            }
            break;
        }

        // ── Seraph's Wings: wing shape ──────────────────────────────
        case "Seraph's Wings": {
            ctx.strokeStyle = '#FFFFFF';
            ctx.fillStyle = 'rgba(200, 200, 255, 0.3)';
            ctx.lineWidth = 1.5;

            // Left wing
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x - half * 0.6, y - half * 0.6, x - half * 0.8, y - half * 0.2);
            ctx.quadraticCurveTo(x - half * 0.4, y - half * 0.1, x, y);
            ctx.fill();
            ctx.stroke();

            // Right wing
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + half * 0.6, y - half * 0.6, x + half * 0.8, y - half * 0.2);
            ctx.quadraticCurveTo(x + half * 0.4, y - half * 0.1, x, y);
            ctx.fill();
            ctx.stroke();

            // Feather detail lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const offset = (i + 1) * half * 0.2;
                // Left feather
                ctx.beginPath();
                ctx.moveTo(x, y - half * 0.05);
                ctx.quadraticCurveTo(x - half * 0.3 - offset * 0.3, y - half * 0.3 - offset, x - half * 0.5 - offset * 0.3, y - half * 0.15);
                ctx.stroke();
                // Right feather
                ctx.beginPath();
                ctx.moveTo(x, y - half * 0.05);
                ctx.quadraticCurveTo(x + half * 0.3 + offset * 0.3, y - half * 0.3 - offset, x + half * 0.5 + offset * 0.3, y - half * 0.15);
                ctx.stroke();
            }

            // Body glow
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(x, y - half * 0.05, half * 0.08, 0, Math.PI * 2);
            ctx.fill();
            break;
        }

        // ── Hellfire Burst: fireball ─────────────────────────────────
        case 'Hellfire Burst': {
            // Outer glow
            const outerGrad = ctx.createRadialGradient(x, y, 0, x, y, half * 0.8);
            outerGrad.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
            outerGrad.addColorStop(0.5, 'rgba(255, 50, 0, 0.4)');
            outerGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = outerGrad;
            ctx.beginPath();
            ctx.arc(x, y, half * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.arc(x, y, half * 0.35, 0, Math.PI * 2);
            ctx.fill();

            // Bright center
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(x, y, half * 0.15, 0, Math.PI * 2);
            ctx.fill();

            // Flame tendrils
            ctx.strokeStyle = '#FF6600';
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 + Math.PI * 0.3;
                ctx.beginPath();
                ctx.moveTo(
                    x + Math.cos(angle) * half * 0.2,
                    y + Math.sin(angle) * half * 0.2
                );
                ctx.quadraticCurveTo(
                    x + Math.cos(angle + 0.2) * half * 0.5,
                    y + Math.sin(angle + 0.2) * half * 0.5,
                    x + Math.cos(angle) * half * 0.7,
                    y + Math.sin(angle) * half * 0.7
                );
                ctx.stroke();
            }
            break;
        }

        // ── Soul Rend: red slash ────────────────────────────────────
        case 'Soul Rend': {
            // Main slash stroke
            ctx.strokeStyle = '#CC0000';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - half * 0.5, y - half * 0.4);
            ctx.lineTo(x + half * 0.5, y + half * 0.3);
            ctx.stroke();

            // Secondary slash (parallel)
            ctx.strokeStyle = '#880000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - half * 0.4, y - half * 0.15);
            ctx.lineTo(x + half * 0.55, y + half * 0.45);
            ctx.stroke();

            // Blood splatter dots
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(x + half * 0.3, y - half * 0.2, half * 0.06, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x - half * 0.2, y + half * 0.35, half * 0.05, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + half * 0.5, y + half * 0.15, half * 0.04, 0, Math.PI * 2);
            ctx.fill();

            // Dark energy aura
            ctx.strokeStyle = 'rgba(150, 0, 0, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, half * 0.7, 0, Math.PI * 2);
            ctx.stroke();
            break;
        }

        // ── Demon Form: horned skull ────────────────────────────────
        case 'Demon Form': {
            // Skull outline
            ctx.strokeStyle = '#FF4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y - half * 0.05, half * 0.35, 0, Math.PI * 2);
            ctx.stroke();

            // Skull fill (dark)
            ctx.fillStyle = '#1A0000';
            ctx.beginPath();
            ctx.arc(x, y - half * 0.05, half * 0.33, 0, Math.PI * 2);
            ctx.fill();

            // Left horn
            ctx.fillStyle = '#CC0000';
            ctx.beginPath();
            ctx.moveTo(x - half * 0.25, y - half * 0.3);
            ctx.lineTo(x - half * 0.5, y - half * 0.7);
            ctx.lineTo(x - half * 0.1, y - half * 0.35);
            ctx.closePath();
            ctx.fill();

            // Right horn
            ctx.beginPath();
            ctx.moveTo(x + half * 0.25, y - half * 0.3);
            ctx.lineTo(x + half * 0.5, y - half * 0.7);
            ctx.lineTo(x + half * 0.1, y - half * 0.35);
            ctx.closePath();
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(x - half * 0.12, y - half * 0.1, half * 0.06, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + half * 0.12, y - half * 0.1, half * 0.06, 0, Math.PI * 2);
            ctx.fill();

            // Eye glow
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(x - half * 0.12, y - half * 0.1, half * 0.025, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + half * 0.12, y - half * 0.1, half * 0.025, 0, Math.PI * 2);
            ctx.fill();

            // Jaw / teeth
            ctx.strokeStyle = '#FF4444';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - half * 0.15, y + half * 0.15);
            ctx.lineTo(x - half * 0.2, y + half * 0.25);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y + half * 0.18);
            ctx.lineTo(x, y + half * 0.28);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + half * 0.15, y + half * 0.15);
            ctx.lineTo(x + half * 0.2, y + half * 0.25);
            ctx.stroke();

            // Dark aura
            ctx.strokeStyle = 'rgba(100, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, half * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            break;
        }

        default: {
            // Unknown ability: placeholder
            ctx.fillStyle = '#444444';
            ctx.fillRect(x - half, y - half, size, size);
            ctx.strokeStyle = '#777777';
            ctx.lineWidth = 1;
            ctx.strokeRect(x - half, y - half, size, size);
            ctx.fillStyle = '#CCCCCC';
            ctx.font = `${Math.floor(size * 0.3)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', x, y);
            break;
        }
    }

    ctx.restore();
}

/**
 * Return a formatted description string for the given ability.
 *
 * @param {object} abilityData - The ability data object from ABILITIES.
 * @returns {string} Multi-line description with name and stats.
 */
export function getAbilityDescription(abilityData) {
    if (!abilityData) return 'Unknown ability';

    const lines = [];
    lines.push(`-- ${abilityData.name} --`);

    const typeNames = {
        buff: 'Buff',
        aoe: 'Area of Effect',
        projectile: 'Projectile',
        dash: 'Dash',
        transform: 'Transformation'
    };
    lines.push(`Type: ${typeNames[abilityData.type] || abilityData.type}`);
    lines.push(`Energy Cost: ${abilityData.energyCost || 0}`);
    lines.push(`Cooldown: ${abilityData.cooldown || 0}s`);

    switch (abilityData.type) {
        case 'buff': {
            lines.push(`Duration: ${abilityData.duration || 0}s`);
            const effect = abilityData.effect || 'none';
            if (effect === 'invulnerable') {
                lines.push('Grants invulnerability');
                if (abilityData.reflectDamage) {
                    lines.push(`Reflects ${(abilityData.reflectDamage * 100).toFixed(0)}% damage`);
                }
                if (abilityData.comboMultiplier) {
                    lines.push(`Combo multiplier: ${abilityData.comboMultiplier}x`);
                }
            } else if (effect === 'flight') {
                lines.push('Enables flight');
                if (abilityData.attackSpeedBonus) {
                    lines.push(`Attack speed bonus: +${(abilityData.attackSpeedBonus * 100).toFixed(0)}%`);
                }
                if (abilityData.featherDamage) {
                    lines.push(`Feather damage: ${abilityData.featherDamage}`);
                }
            }
            break;
        }
        case 'aoe': {
            lines.push(`Damage: ${abilityData.damage || 0}`);
            lines.push(`Radius: ${abilityData.radius || 0}px`);
            if (abilityData.stunDuration) {
                lines.push(`Stun: ${abilityData.stunDuration.toFixed(1)}s`);
            }
            break;
        }
        case 'projectile': {
            lines.push(`Damage: ${abilityData.damage || 0}`);
            lines.push(`Range: ${abilityData.range || 0}px`);
            if (abilityData.burnDmgPerSec) {
                lines.push(`Burn: ${abilityData.burnDmgPerSec} dmg/s for ${abilityData.burnDuration}s`);
            }
            if (abilityData.aoeRadius) {
                lines.push(`AoE Radius on impact: ${abilityData.aoeRadius}px`);
            }
            break;
        }
        case 'dash': {
            lines.push(`Damage: ${abilityData.damage || 0}`);
            lines.push(`Distance: ${abilityData.dashDistance || 0}px`);
            if (abilityData.stealHpPerEnemy) {
                lines.push(`HP Steal: ${abilityData.stealHpPerEnemy} per enemy (max ${abilityData.maxStealTargets})`);
            }
            break;
        }
        case 'transform': {
            lines.push(`Duration: ${abilityData.duration || 0}s`);
            if (abilityData.damageMultiplier) {
                lines.push(`Damage: x${abilityData.damageMultiplier}`);
            }
            if (abilityData.speedMultiplier) {
                lines.push(`Speed: x${abilityData.speedMultiplier}`);
            }
            if (abilityData.lifestealDouble) {
                lines.push('Lifesteal doubled');
            }
            break;
        }
        default:
            break;
    }

    return lines.join('\n');
}
