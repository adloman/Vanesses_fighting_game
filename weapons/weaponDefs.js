// weaponDefs.js - Abandoned Ward
// Re-exports weapon data from weaponStats and provides drawing helpers
// and description formatters for each weapon type.

import { WEAPONS, BAT, CHAINSAW, KATANA, SHOTGUN, CROSSBOW, FLAMETHROWER } from '../data/weaponStats.js';

// Re-export so consumers can import weapon data through this module.
export { WEAPONS, BAT, CHAINSAW, KATANA, SHOTGUN, CROSSBOW, FLAMETHROWER };

/**
 * Draw a simple icon for the given weapon using canvas primitives.
 *
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
 * @param {string} weaponKey  - One of BAT, CHAINSAW, KATANA, SHOTGUN, CROSSBOW, FLAMETHROWER.
 * @param {number} x          - Center x of the icon.
 * @param {number} y          - Center y of the icon.
 * @param {number} size       - Icon size (width and height in pixels).
 */
export function drawWeaponIcon(ctx, weaponKey, x, y, size) {
    ctx.save();

    const half = size / 2;
    const left = x - half;
    const top = y - half;

    switch (weaponKey) {
        // ── Bat: brown rectangle with tape wrapping ─────────────────────
        case BAT: {
            // Handle
            ctx.fillStyle = '#5C3A1E';
            ctx.fillRect(left + half * 0.4, top + half * 0.2, size * 0.2, size * 0.65);

            // Bat head
            ctx.fillStyle = '#8B7355';
            const batW = size * 0.55;
            const batH = size * 0.18;
            ctx.fillRect(left + half * 0.25, top + half * 0.15, batW, batH);

            // Tape wrapping
            ctx.strokeStyle = '#AAAAAA';
            ctx.lineWidth = 2;
            const tapeX = left + half * 0.5;
            ctx.beginPath();
            ctx.moveTo(tapeX, top + half * 0.22);
            ctx.lineTo(tapeX + size * 0.06, top + half * 0.35);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(tapeX + size * 0.08, top + half * 0.25);
            ctx.lineTo(tapeX + size * 0.02, top + half * 0.40);
            ctx.stroke();
            break;
        }

        // ── Chainsaw: grey rectangle with teeth line ──────────────────
        case CHAINSAW: {
            // Body
            ctx.fillStyle = '#555555';
            ctx.fillRect(left + half * 0.25, top + half * 0.15, size * 0.55, size * 0.45);

            // Handle (bottom)
            ctx.fillStyle = '#333333';
            ctx.fillRect(left + half * 0.45, top + half * 0.55, size * 0.2, size * 0.35);

            // Blade / chain teeth along the top edge
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 2;
            const teethY = top + half * 0.15;
            const teethStart = left + half * 0.25;
            const teethEnd = teethStart + size * 0.55;
            ctx.beginPath();
            ctx.moveTo(teethStart, teethY);
            for (let tx = teethStart; tx <= teethEnd; tx += 4) {
                ctx.lineTo(tx + 2, teethY - 4);
                ctx.lineTo(tx + 4, teethY);
            }
            ctx.stroke();

            // Chain detail line
            ctx.strokeStyle = '#999999';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(teethStart + 2, teethY + 3);
            ctx.lineTo(teethEnd - 2, teethY + 3);
            ctx.stroke();
            break;
        }

        // ── Katana: silver curved line ────────────────────────────────
        case KATANA: {
            // Blade (curved silver line)
            ctx.strokeStyle = '#C0C0C0';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(left + half * 0.3, top + half * 0.75);
            ctx.quadraticCurveTo(
                x + size * 0.05, top + half * 0.4,
                left + half * 0.7, top + half * 0.15
            );
            ctx.stroke();

            // Edge highlight
            ctx.strokeStyle = '#E0E0E0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(left + half * 0.32, top + half * 0.72);
            ctx.quadraticCurveTo(
                x + size * 0.06, top + half * 0.38,
                left + half * 0.68, top + half * 0.18
            );
            ctx.stroke();

            // Guard (tsuba)
            ctx.fillStyle = '#444444';
            ctx.fillRect(left + half * 0.35, top + half * 0.68, size * 0.15, size * 0.04);

            // Handle
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(left + half * 0.4, top + half * 0.72);
            ctx.lineTo(left + half * 0.2, top + half * 0.92);
            ctx.stroke();

            // Handle wrap
            ctx.strokeStyle = '#5555AA';
            ctx.lineWidth = 1;
            for (let wy = top + half * 0.74; wy < top + half * 0.92; wy += 4) {
                ctx.beginPath();
                ctx.moveTo(left + half * 0.38, wy);
                ctx.lineTo(left + half * 0.28, wy + 2);
                ctx.stroke();
            }
            break;
        }

        // ── Shotgun: brown rectangle with barrel ──────────────────────
        case SHOTGUN: {
            // Stock (wooden part)
            ctx.fillStyle = '#5C4033';
            ctx.fillRect(left + half * 0.1, top + half * 0.55, size * 0.35, size * 0.18);

            // Stock grip
            ctx.fillStyle = '#4A3025';
            ctx.fillRect(left + half * 0.15, top + half * 0.72, size * 0.12, size * 0.22);

            // Body / receiver
            ctx.fillStyle = '#333333';
            ctx.fillRect(left + half * 0.4, top + half * 0.5, size * 0.3, size * 0.22);

            // Barrel
            ctx.fillStyle = '#666666';
            ctx.fillRect(left + half * 0.65, top + half * 0.52, size * 0.3, size * 0.1);

            // Barrel tip highlight
            ctx.fillStyle = '#888888';
            ctx.fillRect(left + half * 0.88, top + half * 0.52, size * 0.08, size * 0.1);

            // Pump
            ctx.fillStyle = '#5C4033';
            ctx.fillRect(left + half * 0.55, top + half * 0.65, size * 0.18, size * 0.08);

            // Trigger guard
            ctx.strokeStyle = '#444444';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(left + half * 0.52, top + half * 0.74, size * 0.05, 0, Math.PI);
            ctx.stroke();
            break;
        }

        // ── Crossbow: brown T-shape ───────────────────────────────────
        case CROSSBOW: {
            // Stock (horizontal body)
            ctx.fillStyle = '#4A3728';
            ctx.fillRect(left + half * 0.15, top + half * 0.55, size * 0.6, size * 0.12);

            // Stock grip (below)
            ctx.fillStyle = '#3A2A1A';
            ctx.fillRect(left + half * 0.3, top + half * 0.67, size * 0.1, size * 0.2);

            // Body / riser
            ctx.fillStyle = '#555555';
            ctx.fillRect(left + half * 0.5, top + half * 0.45, size * 0.15, size * 0.15);

            // Arms (T-shape, top)
            ctx.strokeStyle = '#5C4033';
            ctx.lineWidth = 3;
            // Left arm
            ctx.beginPath();
            ctx.moveTo(left + half * 0.15, top + half * 0.35);
            ctx.lineTo(left + half * 0.9, top + half * 0.35);
            ctx.stroke();

            // Bowstring
            ctx.strokeStyle = '#AAAAAA';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(left + half * 0.15, top + half * 0.35);
            ctx.lineTo(x, top + half * 0.58);
            ctx.lineTo(left + half * 0.9, top + half * 0.35);
            ctx.stroke();

            // Arrow loaded
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, top + half * 0.58);
            ctx.lineTo(x, top + half * 0.15);
            ctx.stroke();

            // Arrow tip
            ctx.fillStyle = '#C0C0C0';
            ctx.beginPath();
            ctx.moveTo(x, top + half * 0.12);
            ctx.lineTo(x - 3, top + half * 0.18);
            ctx.lineTo(x + 3, top + half * 0.18);
            ctx.closePath();
            ctx.fill();
            break;
        }

        // ── Flamethrower: orange tube with nozzle ─────────────────────
        case FLAMETHROWER: {
            // Tank (back cylinder)
            ctx.fillStyle = '#666666';
            ctx.beginPath();
            ctx.ellipse(left + half * 0.3, y, size * 0.12, size * 0.28, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Body tube
            ctx.fillStyle = '#333333';
            ctx.fillRect(left + half * 0.4, top + half * 0.55, size * 0.5, size * 0.12);

            // Nozzle
            ctx.fillStyle = '#555555';
            ctx.fillRect(left + half * 0.85, top + half * 0.48, size * 0.15, size * 0.2);

            // Nozzle tip
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.arc(left + half * 0.95, top + half * 0.58, size * 0.04, 0, Math.PI * 2);
            ctx.fill();

            // Grip
            ctx.fillStyle = '#222222';
            ctx.fillRect(left + half * 0.55, top + half * 0.67, size * 0.15, size * 0.18);

            // Flame glow at tip
            const gradient = ctx.createRadialGradient(
                left + half * 0.98, top + half * 0.58, 0,
                left + half * 0.98, top + half * 0.58, size * 0.1
            );
            gradient.addColorStop(0, 'rgba(255, 150, 0, 0.6)');
            gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(left + half * 0.98, top + half * 0.58, size * 0.1, 0, Math.PI * 2);
            ctx.fill();
            break;
        }

        default: {
            // Unknown weapon: draw a grey square placeholder.
            ctx.fillStyle = '#555555';
            ctx.fillRect(left, top, size, size);
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 1;
            ctx.strokeRect(left, top, size, size);
            ctx.fillStyle = '#CCCCCC';
            ctx.font = `${Math.floor(size * 0.25)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', x, y);
            break;
        }
    }

    ctx.restore();
}

/**
 * Return a formatted description string for the given weapon.
 *
 * @param {string} weaponKey - One of BAT, CHAINSAW, KATANA, SHOTGUN, CROSSBOW, FLAMETHROWER.
 * @returns {string} Multi-line description with name and stats.
 */
export function getWeaponDescription(weaponKey) {
    const wep = WEAPONS[weaponKey];
    if (!wep) return `Unknown weapon: ${weaponKey}`;

    const lines = [];
    lines.push(`-- ${wep.name} --`);

    const typeNames = {
        melee: 'Melee',
        melee_continuous: 'Continuous Melee',
        ranged_spread: 'Spread Shot',
        ranged_pierce: 'Pierce Shot',
        ranged_spray: 'Spray'
    };
    const typeName = typeNames[wep.attackType] || wep.attackType;
    lines.push(`Type: ${typeName}`);
    lines.push(`Damage: ${wep.damageBase}`);
    lines.push(`Attack Speed: ${wep.attackSpeed.toFixed(1)}/sec`);
    lines.push(`Range: ${wep.range}px`);
    lines.push(`Knockback: ${wep.knockback}`);

    if (wep.energyCost > 0) {
        lines.push(`Energy Cost: ${wep.energyCost}/hit`);
    }

    if (wep.specialEffect && wep.specialEffect !== 'none') {
        switch (wep.specialEffect) {
            case 'stun':
                lines.push(`Effect: Stun (${wep.stunDuration.toFixed(1)}s)`);
                break;
            case 'bleed':
                lines.push(`Effect: Bleed (${wep.bleedDmgPerSec} dmg/s for ${wep.bleedDuration}s)`);
                break;
            case 'lifesteal':
                lines.push(`Effect: Lifesteal (${(wep.lifestealPercent * 100).toFixed(0)}%)`);
                break;
            case 'burn':
                lines.push(`Effect: Burn (${wep.burnDmgPerSec} dmg/s for ${wep.burnDuration}s)`);
                break;
            case 'knockback_all':
                lines.push(`Effect: Knockback All`);
                break;
            case 'pierce':
                lines.push(`Effect: Pierce (${wep.pierceCount} targets)`);
                break;
            default:
                lines.push(`Effect: ${wep.specialEffect}`);
                break;
        }
    }

    if (wep.pellets) {
        lines.push(`Pellets: ${wep.pellets}`);
    }
    if (wep.pierceCount) {
        lines.push(`Pierce: ${wep.pierceCount} targets`);
    }

    return lines.join('\n');
}
