// game/states/charSelectState.js
// Character selection state - Abandoned Ward

import { CHARACTERS, ABILITIES } from '../data/characterStats.js';

export const charSelectState = {
    stateMachine: null,
    gameState: null,
    selectedChar: null,
    hoveredChar: null,
    confirmTimer: 0,
    particles: [],
    time: 0,
    showConfirm: false,
    confirmFlash: 0,

    // Character panel positions
    panels: [
        { key: 'ANGEL', x: 160, y: 120, w: 420, h: 480 },
        { key: 'DEVIL', x: 700, y: 120, w: 420, h: 480 },
    ],

    enter(stateMachine, gameState) {
        this.stateMachine = stateMachine;
        this.gameState = gameState || {};
        this.selectedChar = null;
        this.hoveredChar = null;
        this.confirmTimer = 0;
        this.showConfirm = false;
        this.confirmFlash = 0;
        this.time = 0;

        // Ambient particles
        this.particles = [];
        for (let i = 0; i < 40; i++) {
            this.particles.push({
                x: Math.random() * 1280,
                y: Math.random() * 720,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: -Math.random() * 0.4 - 0.1,
                alpha: Math.random() * 0.3 + 0.05
            });
        }
    },

    update(dt) {
        this.time += dt;
        this.confirmFlash += dt * 3;

        // Update particles
        for (const p of this.particles) {
            p.x += p.speedX;
            p.y += p.speedY;
            if (p.y < -10) {
                p.y = 730;
                p.x = Math.random() * 1280;
            }
        }

        // Confirm timer for visual feedback
        if (this.showConfirm) {
            this.confirmTimer += dt;
        }
    },

    handleTouch(x, y) {
        // Check confirm button
        if (this.showConfirm) {
            const confirmX = 540;
            const confirmY = 660;
            const confirmW = 200;
            const confirmH = 50;
            if (x >= confirmX && x <= confirmX + confirmW &&
                y >= confirmY && y <= confirmY + confirmH) {
                this._confirmSelection();
                return;
            }
        }

        // Check character panels
        for (const panel of this.panels) {
            if (x >= panel.x && x <= panel.x + panel.w &&
                y >= panel.y && y <= panel.y + panel.h) {
                if (this.selectedChar === panel.key) {
                    // Already selected, show confirm
                    this.showConfirm = true;
                    this.confirmTimer = 0;
                } else {
                    this.selectedChar = panel.key;
                    this.showConfirm = true;
                    this.confirmTimer = 0;
                }
                return;
            }
        }

        // Tapped outside panels - deselect
        this.selectedChar = null;
        this.showConfirm = false;
    },

    _confirmSelection() {
        if (this.selectedChar && CHARACTERS[this.selectedChar]) {
            this.gameState.selectedCharacter = this.selectedChar;
            this.gameState.characterStats = CHARACTERS[this.selectedChar];
            this.gameState.characterAbilities = ABILITIES[this.selectedChar];
            this.stateMachine.change('WEAPON_SELECT');
        }
    },

    render(ctx) {
        // Dark background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, 1280, 720);

        // Draw particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = '#888888';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Vignette
        const vignette = ctx.createRadialGradient(640, 360, 200, 640, 360, 750);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, 1280, 720);

        // Title
        ctx.fillStyle = '#cccccc';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CHOOSE YOUR CHARACTER', 640, 50);

        // Divider under title
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(390, 72);
        ctx.lineTo(890, 72);
        ctx.stroke();

        // Draw character panels
        for (const panel of this.panels) {
            const charData = CHARACTERS[panel.key];
            const abilities = ABILITIES[panel.key];
            const isSelected = this.selectedChar === panel.key;

            this._drawCharacterPanel(ctx, panel, charData, abilities, isSelected);
        }

        // VS divider between panels
        ctx.fillStyle = '#555555';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('VS', 640, 350);

        // Confirm button
        if (this.showConfirm && this.selectedChar) {
            const confirmX = 540;
            const confirmY = 660;
            const confirmW = 200;
            const confirmH = 50;

            const flashAlpha = 0.7 + Math.sin(this.confirmFlash) * 0.2;
            ctx.globalAlpha = flashAlpha;

            ctx.fillStyle = 'rgba(40, 20, 10, 0.9)';
            ctx.fillRect(confirmX, confirmY, confirmW, confirmH);
            ctx.strokeStyle = '#cc8833';
            ctx.lineWidth = 2;
            ctx.strokeRect(confirmX, confirmY, confirmW, confirmH);

            ctx.fillStyle = '#ffcc66';
            ctx.font = 'bold 22px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('CONFIRM', confirmX + confirmW / 2, confirmY + confirmH / 2);
            ctx.globalAlpha = 1;
        }
    },

    _drawCharacterPanel(ctx, panel, charData, abilities, isSelected) {
        ctx.save();

        // Panel background
        ctx.fillStyle = isSelected ? 'rgba(40, 25, 15, 0.9)' : 'rgba(15, 15, 20, 0.9)';
        ctx.fillRect(panel.x, panel.y, panel.w, panel.h);

        // Border
        if (isSelected) {
            ctx.strokeStyle = '#cc8833';
            ctx.lineWidth = 3;
            ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

            // Glow effect
            ctx.shadowColor = '#cc8833';
            ctx.shadowBlur = 15;
            ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
            ctx.shadowBlur = 0;
        } else {
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
        }

        // Character silhouette
        const silhouetteX = panel.x + panel.w / 2;
        const silhouetteY = panel.y + 130;

        if (panel.key === 'ANGEL') {
            this._drawAngelSilhouette(ctx, silhouetteX, silhouetteY);
        } else {
            this._drawDevilSilhouette(ctx, silhouetteX, silhouetteY);
        }

        // Character name
        ctx.fillStyle = panel.key === 'ANGEL' ? '#aaddff' : '#ffaaaa';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(charData.name, panel.x + panel.w / 2, panel.y + 220);

        // Stats
        const stats = [
            { label: 'HP', value: charData.stats.hp, color: '#cc2222' },
            { label: 'SPD', value: charData.stats.speed, color: '#22cc44' },
            { label: 'DMG', value: charData.stats.damage, color: '#ffaa22' },
            { label: 'DEF', value: charData.stats.defense, color: '#4488cc' },
            { label: 'EN', value: charData.stats.energy, color: '#6644cc' },
        ];

        const statY = panel.y + 260;
        const barMaxW = 120;

        for (let i = 0; i < stats.length; i++) {
            const stat = stats[i];
            const sy = statY + i * 24;

            // Label
            ctx.fillStyle = '#888888';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(stat.label, panel.x + 30, sy);

            // Stat bar
            const barX = panel.x + 80;
            const barW = barMaxW;
            const barH = 10;
            const pct = stat.value / 100;

            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(barX, sy - barH / 2, barW, barH);

            if (pct > 0) {
                ctx.fillStyle = stat.color;
                ctx.fillRect(barX, sy - barH / 2, barW * pct, barH);
            }

            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, sy - barH / 2, barW, barH);

            // Value
            ctx.fillStyle = '#aaaaaa';
            ctx.font = '11px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`${stat.value}`, barX + barW + 8, sy);
        }

        // Passive ability
        const passive = charData.passive;
        const passiveY = panel.y + 395;

        ctx.fillStyle = '#777777';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PASSIVE', panel.x + panel.w / 2, passiveY);

        ctx.fillStyle = '#999999';
        ctx.font = '10px monospace';
        ctx.fillText(passive.name, panel.x + panel.w / 2, passiveY + 16);
        ctx.fillText(passive.description, panel.x + panel.w / 2, passiveY + 30);

        // Ability cards (3 below the panel)
        if (abilities) {
            const cardW = 120;
            const cardH = 80;
            const cardY = panel.y + panel.h + 10;
            const startX = panel.x + (panel.w - (3 * cardW + 20)) / 2;

            for (let i = 0; i < abilities.length; i++) {
                const ability = abilities[i];
                const cardX = startX + i * (cardW + 10);

                ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
                ctx.fillRect(cardX, cardY, cardW, cardH);
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 1;
                ctx.strokeRect(cardX, cardY, cardW, cardH);

                // Ability name
                ctx.fillStyle = '#aaaacc';
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(ability.name, cardX + cardW / 2, cardY + 18);

                // Cost
                ctx.fillStyle = '#6688cc';
                ctx.font = '10px monospace';
                ctx.fillText(`EN:${ability.energyCost}`, cardX + cardW / 2, cardY + 34);

                // Cooldown
                ctx.fillStyle = '#888888';
                ctx.fillText(`CD:${ability.cooldown}s`, cardX + cardW / 2, cardY + 48);

                // Brief description
                ctx.fillStyle = '#777777';
                ctx.font = '9px monospace';
                const desc = ability.description.length > 20 ? ability.description.substring(0, 20) + '...' : ability.description;
                ctx.fillText(desc, cardX + cardW / 2, cardY + 65);
            }
        }

        ctx.restore();
    },

    _drawAngelSilhouette(ctx, cx, cy) {
        ctx.save();
        ctx.strokeStyle = '#5588aa';
        ctx.fillStyle = 'rgba(85, 136, 170, 0.1)';
        ctx.lineWidth = 2;

        // Head
        ctx.beginPath();
        ctx.arc(cx, cy - 50, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Halo
        ctx.beginPath();
        ctx.ellipse(cx, cy - 75, 22, 8, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#aaddff';
        ctx.stroke();

        // Body
        ctx.beginPath();
        ctx.moveTo(cx - 20, cy - 32);
        ctx.lineTo(cx - 25, cy + 20);
        ctx.lineTo(cx + 25, cy + 20);
        ctx.lineTo(cx + 20, cy - 32);
        ctx.closePath();
        ctx.fillStyle = 'rgba(85, 136, 170, 0.1)';
        ctx.fill();
        ctx.strokeStyle = '#5588aa';
        ctx.stroke();

        // Left wing
        ctx.beginPath();
        ctx.moveTo(cx - 20, cy - 25);
        ctx.quadraticCurveTo(cx - 70, cy - 60, cx - 80, cy - 20);
        ctx.quadraticCurveTo(cx - 65, cy - 10, cx - 50, cy - 15);
        ctx.quadraticCurveTo(cx - 55, cy + 5, cx - 20, cy - 5);
        ctx.closePath();
        ctx.fillStyle = 'rgba(85, 136, 170, 0.08)';
        ctx.fill();
        ctx.strokeStyle = '#5588aa';
        ctx.stroke();

        // Right wing
        ctx.beginPath();
        ctx.moveTo(cx + 20, cy - 25);
        ctx.quadraticCurveTo(cx + 70, cy - 60, cx + 80, cy - 20);
        ctx.quadraticCurveTo(cx + 65, cy - 10, cx + 50, cy - 15);
        ctx.quadraticCurveTo(cx + 55, cy + 5, cx + 20, cy - 5);
        ctx.closePath();
        ctx.fillStyle = 'rgba(85, 136, 170, 0.08)';
        ctx.fill();
        ctx.strokeStyle = '#5588aa';
        ctx.stroke();

        // Legs
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy + 20);
        ctx.lineTo(cx - 15, cy + 55);
        ctx.moveTo(cx + 10, cy + 20);
        ctx.lineTo(cx + 15, cy + 55);
        ctx.strokeStyle = '#5588aa';
        ctx.stroke();

        ctx.restore();
    },

    _drawDevilSilhouette(ctx, cx, cy) {
        ctx.save();
        ctx.strokeStyle = '#aa5555';
        ctx.fillStyle = 'rgba(170, 85, 85, 0.1)';
        ctx.lineWidth = 2;

        // Head
        ctx.beginPath();
        ctx.arc(cx, cy - 50, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Left horn
        ctx.beginPath();
        ctx.moveTo(cx - 12, cy - 60);
        ctx.quadraticCurveTo(cx - 25, cy - 85, cx - 15, cy - 90);
        ctx.strokeStyle = '#cc5555';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Right horn
        ctx.beginPath();
        ctx.moveTo(cx + 12, cy - 60);
        ctx.quadraticCurveTo(cx + 25, cy - 85, cx + 15, cy - 90);
        ctx.stroke();

        ctx.strokeStyle = '#aa5555';
        ctx.lineWidth = 2;

        // Body
        ctx.beginPath();
        ctx.moveTo(cx - 20, cy - 32);
        ctx.lineTo(cx - 25, cy + 20);
        ctx.lineTo(cx + 25, cy + 20);
        ctx.lineTo(cx + 20, cy - 32);
        ctx.closePath();
        ctx.fillStyle = 'rgba(170, 85, 85, 0.1)';
        ctx.fill();
        ctx.strokeStyle = '#aa5555';
        ctx.stroke();

        // Left wing (bat-like, jagged)
        ctx.beginPath();
        ctx.moveTo(cx - 20, cy - 25);
        ctx.lineTo(cx - 55, cy - 50);
        ctx.lineTo(cx - 50, cy - 35);
        ctx.lineTo(cx - 75, cy - 30);
        ctx.lineTo(cx - 55, cy - 15);
        ctx.lineTo(cx - 60, cy + 5);
        ctx.lineTo(cx - 20, cy - 5);
        ctx.closePath();
        ctx.fillStyle = 'rgba(170, 85, 85, 0.08)';
        ctx.fill();
        ctx.strokeStyle = '#aa5555';
        ctx.stroke();

        // Right wing (bat-like, jagged)
        ctx.beginPath();
        ctx.moveTo(cx + 20, cy - 25);
        ctx.lineTo(cx + 55, cy - 50);
        ctx.lineTo(cx + 50, cy - 35);
        ctx.lineTo(cx + 75, cy - 30);
        ctx.lineTo(cx + 55, cy - 15);
        ctx.lineTo(cx + 60, cy + 5);
        ctx.lineTo(cx + 20, cy - 5);
        ctx.closePath();
        ctx.fillStyle = 'rgba(170, 85, 85, 0.08)';
        ctx.fill();
        ctx.strokeStyle = '#aa5555';
        ctx.stroke();

        // Legs
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy + 20);
        ctx.lineTo(cx - 15, cy + 55);
        ctx.moveTo(cx + 10, cy + 20);
        ctx.lineTo(cx + 15, cy + 55);
        ctx.strokeStyle = '#aa5555';
        ctx.stroke();

        // Tail
        ctx.beginPath();
        ctx.moveTo(cx, cy + 20);
        ctx.quadraticCurveTo(cx - 10, cy + 40, cx - 5, cy + 55);
        ctx.strokeStyle = '#cc5555';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Tail tip (arrow)
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy + 55);
        ctx.lineTo(cx - 12, cy + 48);
        ctx.lineTo(cx - 2, cy + 50);
        ctx.closePath();
        ctx.fillStyle = '#cc5555';
        ctx.fill();

        ctx.restore();
    },

    exit() {
        this.particles = [];
        this.selectedChar = null;
        this.showConfirm = false;
    }
};
