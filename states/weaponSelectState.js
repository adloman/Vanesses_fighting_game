// game/states/weaponSelectState.js
// Weapon selection state - Abandoned Ward

import { WEAPONS, WEAPON_UNLOCK_TIERS } from '../data/weaponStats.js';

export const weaponSelectState = {
    stateMachine: null,
    gameState: null,
    selectedWeapon: null,
    hoveredWeapon: null,
    weaponTier: 0,
    showDetails: null,
    time: 0,
    particles: [],
    availableWeapons: [],

    enter(stateMachine, gameState) {
        this.stateMachine = stateMachine;
        this.gameState = gameState || {};
        this.selectedWeapon = null;
        this.hoveredWeapon = null;
        this.showDetails = null;
        this.time = 0;

        // Determine weapon tier based on current level
        const currentLevel = this.gameState.currentLevel || 0;
        this.weaponTier = Math.floor(currentLevel / 2);

        // Find available weapons for this tier
        this.availableWeapons = WEAPONS.filter(w => {
            const unlockTier = WEAPON_UNLOCK_TIERS[w.id] || 0;
            return unlockTier <= this.weaponTier;
        });

        // Default select first weapon
        if (this.availableWeapons.length > 0) {
            this.selectedWeapon = this.availableWeapons[0].id;
        }

        // If a weapon was already equipped, try to keep it selected
        if (this.gameState.equippedWeapon) {
            const prev = this.availableWeapons.find(w => w.id === this.gameState.equippedWeapon);
            if (prev) {
                this.selectedWeapon = prev.id;
            }
        }

        // Particles
        this.particles = [];
        for (let i = 0; i < 25; i++) {
            this.particles.push({
                x: Math.random() * 1280,
                y: Math.random() * 720,
                size: Math.random() * 2 + 0.5,
                speedY: -Math.random() * 0.3 - 0.05,
                alpha: Math.random() * 0.2 + 0.05
            });
        }
    },

    update(dt) {
        this.time += dt;

        for (const p of this.particles) {
            p.y += p.speedY;
            if (p.y < -5) {
                p.y = 725;
                p.x = Math.random() * 1280;
            }
        }
    },

    handleTouch(x, y) {
        const currentLevel = this.gameState.currentLevel || 0;

        // Check equip button
        const equipX = 540;
        const equipY = 640;
        const equipW = 200;
        const equipH = 50;
        if (x >= equipX && x <= equipX + equipW &&
            y >= equipY && y <= equipY + equipH) {
            this._equipWeapon();
            return;
        }

        // Check weapon cards
        const cardW = 220;
        const cardH = 300;
        const startY = 140;
        const gap = 30;
        const totalWidth = this.availableWeapons.length * cardW + (this.availableWeapons.length - 1) * gap;
        const startX = (1280 - totalWidth) / 2;

        for (let i = 0; i < this.availableWeapons.length; i++) {
            const cardX = startX + i * (cardW + gap);
            if (x >= cardX && x <= cardX + cardW &&
                y >= startY && y <= startY + cardH) {
                this.selectedWeapon = this.availableWeapons[i].id;
                this.showDetails = this.availableWeapons[i].id;
                return;
            }
        }
    },

    _equipWeapon() {
        if (this.selectedWeapon) {
            const weapon = this.availableWeapons.find(w => w.id === this.selectedWeapon);
            if (weapon) {
                this.gameState.equippedWeapon = this.selectedWeapon;
                this.gameState.weaponStats = weapon;
                this.stateMachine.change('PLAY');
            }
        }
    },

    render(ctx) {
        const currentLevel = this.gameState.currentLevel || 0;
        const levelNames = [
            'Reception Hall',
            'Patient Ward A',
            'Surgery Room',
            'Basement Morgue',
            'Rooftop Asylum',
            'The Final Ward'
        ];
        const levelName = levelNames[currentLevel] || `Floor ${currentLevel + 1}`;

        // Dark background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, 1280, 720);

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = '#777777';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Title
        ctx.fillStyle = '#cccccc';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SELECT WEAPON', 640, 40);

        // Level subtitle
        ctx.fillStyle = '#888888';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(`Level ${currentLevel + 1}: ${levelName}`, 640, 78);

        // Divider
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(440, 98);
        ctx.lineTo(840, 98);
        ctx.stroke();

        // Tutorial text for first level
        if (currentLevel === 0) {
            ctx.fillStyle = '#aaaa66';
            ctx.font = 'italic 14px monospace';
            ctx.fillText('Choose your weapon for the battle ahead', 640, 118);
        }

        // Weapon cards
        const cardW = 220;
        const cardH = 300;
        const startY = 140;
        const gap = 30;
        const totalWidth = this.availableWeapons.length * cardW + (this.availableWeapons.length - 1) * gap;
        const startX = (1280 - totalWidth) / 2;

        for (let i = 0; i < this.availableWeapons.length; i++) {
            const weapon = this.availableWeapons[i];
            const cardX = startX + i * (cardW + gap);
            const isSelected = this.selectedWeapon === weapon.id;
            this._drawWeaponCard(ctx, cardX, startY, cardW, cardH, weapon, isSelected);
        }

        // Equip button
        if (this.selectedWeapon) {
            const equipX = 540;
            const equipY = 640;
            const equipW = 200;
            const equipH = 50;

            const flashAlpha = 0.7 + Math.sin(this.time * 3) * 0.15;
            ctx.globalAlpha = flashAlpha;

            ctx.fillStyle = 'rgba(20, 35, 20, 0.9)';
            ctx.fillRect(equipX, equipY, equipW, equipH);
            ctx.strokeStyle = '#33aa33';
            ctx.lineWidth = 2;
            ctx.strokeRect(equipX, equipY, equipW, equipH);

            ctx.fillStyle = '#66dd66';
            ctx.font = 'bold 22px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('EQUIP', equipX + equipW / 2, equipY + equipH / 2);
            ctx.globalAlpha = 1;
        }

        // Weapon details panel (when a weapon is selected)
        if (this.showDetails && this.selectedWeapon) {
            const weapon = this.availableWeapons.find(w => w.id === this.selectedWeapon);
            if (weapon) {
                ctx.fillStyle = '#999999';
                ctx.font = 'italic 13px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(weapon.description, 640, 470);
            }
        }
    },

    _drawWeaponCard(ctx, x, y, w, h, weapon, isSelected) {
        ctx.save();

        // Card background
        ctx.fillStyle = isSelected ? 'rgba(30, 30, 20, 0.95)' : 'rgba(15, 15, 18, 0.9)';
        ctx.fillRect(x, y, w, h);

        // Border
        if (isSelected) {
            ctx.strokeStyle = '#ccaa33';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);

            ctx.shadowColor = '#ccaa33';
            ctx.shadowBlur = 10;
            ctx.strokeRect(x, y, w, h);
            ctx.shadowBlur = 0;
        } else {
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
        }

        // Weapon icon (drawn with canvas)
        this._drawWeaponIcon(ctx, x + w / 2, y + 70, weapon);

        // Weapon name
        ctx.fillStyle = isSelected ? '#ffddaa' : '#cccccc';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(weapon.name, x + w / 2, y + 150);

        // Stats
        const stats = [
            { label: 'DMG', value: weapon.damage, color: '#cc4444' },
            { label: 'SPD', value: weapon.speed, color: '#44cc44' },
            { label: 'RNG', value: weapon.range, color: '#4488cc' },
        ];

        const statStartY = y + 180;

        for (let i = 0; i < stats.length; i++) {
            const stat = stats[i];
            const sy = statStartY + i * 30;

            ctx.fillStyle = '#888888';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(stat.label, x + 20, sy);

            // Bar
            const barX = x + 65;
            const barW = 120;
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

            ctx.fillStyle = '#aaaaaa';
            ctx.font = '11px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`${stat.value}`, barX + barW + 8, sy);
        }

        // Special effect
        if (weapon.specialEffect) {
            ctx.fillStyle = '#777777';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('SPECIAL:', x + w / 2, y + h - 50);
            ctx.fillStyle = '#999977';
            ctx.fillText(weapon.specialEffect, x + w / 2, y + h - 35);
        }

        ctx.restore();
    },

    _drawWeaponIcon(ctx, cx, cy, weapon) {
        ctx.save();
        ctx.strokeStyle = '#aaa888';
        ctx.lineWidth = 2;

        switch (weapon.type) {
            case 'sword':
                // Blade
                ctx.beginPath();
                ctx.moveTo(cx, cy - 35);
                ctx.lineTo(cx + 8, cy + 10);
                ctx.lineTo(cx, cy + 20);
                ctx.lineTo(cx - 8, cy + 10);
                ctx.closePath();
                ctx.fillStyle = 'rgba(170, 160, 140, 0.3)';
                ctx.fill();
                ctx.stroke();
                // Guard
                ctx.beginPath();
                ctx.moveTo(cx - 15, cy + 10);
                ctx.lineTo(cx + 15, cy + 10);
                ctx.strokeStyle = '#ccaa55';
                ctx.lineWidth = 3;
                ctx.stroke();
                // Handle
                ctx.beginPath();
                ctx.moveTo(cx - 4, cy + 10);
                ctx.lineTo(cx - 4, cy + 30);
                ctx.lineTo(cx + 4, cy + 30);
                ctx.lineTo(cx + 4, cy + 10);
                ctx.fillStyle = 'rgba(100, 80, 50, 0.5)';
                ctx.fill();
                ctx.strokeStyle = '#aa8844';
                ctx.lineWidth = 1;
                ctx.stroke();
                break;

            case 'axe':
                // Handle
                ctx.beginPath();
                ctx.moveTo(cx - 3, cy - 30);
                ctx.lineTo(cx - 3, cy + 30);
                ctx.lineTo(cx + 3, cy + 30);
                ctx.lineTo(cx + 3, cy - 30);
                ctx.fillStyle = 'rgba(100, 80, 50, 0.5)';
                ctx.fill();
                ctx.strokeStyle = '#aa8844';
                ctx.stroke();
                // Axe head
                ctx.beginPath();
                ctx.moveTo(cx + 3, cy - 25);
                ctx.quadraticCurveTo(cx + 30, cy - 20, cx + 25, cy);
                ctx.quadraticCurveTo(cx + 30, cy + 20, cx + 3, cy + 15);
                ctx.closePath();
                ctx.fillStyle = 'rgba(150, 140, 140, 0.4)';
                ctx.fill();
                ctx.strokeStyle = '#aaa888';
                ctx.stroke();
                break;

            case 'dagger':
                // Short blade
                ctx.beginPath();
                ctx.moveTo(cx, cy - 25);
                ctx.lineTo(cx + 5, cy + 5);
                ctx.lineTo(cx, cy + 10);
                ctx.lineTo(cx - 5, cy + 5);
                ctx.closePath();
                ctx.fillStyle = 'rgba(180, 180, 200, 0.3)';
                ctx.fill();
                ctx.stroke();
                // Guard
                ctx.beginPath();
                ctx.moveTo(cx - 10, cy + 5);
                ctx.lineTo(cx + 10, cy + 5);
                ctx.strokeStyle = '#ccaa55';
                ctx.lineWidth = 2;
                ctx.stroke();
                // Handle
                ctx.fillRect(cx - 3, cy + 5, 6, 20);
                ctx.strokeStyle = '#aa8844';
                ctx.strokeRect(cx - 3, cy + 5, 6, 20);
                break;

            case 'staff':
                // Long shaft
                ctx.beginPath();
                ctx.moveTo(cx, cy - 35);
                ctx.lineTo(cx, cy + 35);
                ctx.strokeStyle = '#887755';
                ctx.lineWidth = 3;
                ctx.stroke();
                // Orb on top
                ctx.beginPath();
                ctx.arc(cx, cy - 40, 8, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
                ctx.fill();
                ctx.strokeStyle = '#6688cc';
                ctx.lineWidth = 2;
                ctx.stroke();
                // Glow
                ctx.beginPath();
                ctx.arc(cx, cy - 40, 14, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(100, 150, 255, 0.2)';
                ctx.stroke();
                break;

            default:
                // Generic weapon shape
                ctx.beginPath();
                ctx.moveTo(cx, cy - 30);
                ctx.lineTo(cx + 10, cy + 10);
                ctx.lineTo(cx, cy + 25);
                ctx.lineTo(cx - 10, cy + 10);
                ctx.closePath();
                ctx.fillStyle = 'rgba(150, 150, 150, 0.3)';
                ctx.fill();
                ctx.stroke();
                break;
        }

        ctx.restore();
    },

    exit() {
        this.particles = [];
        this.availableWeapons = [];
        this.selectedWeapon = null;
    }
};
