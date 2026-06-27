// game/ui/hud.js
// In-game HUD - Abandoned Ward

export class HUD {
    constructor() {
        this.playerHP = 100;
        this.maxHP = 100;
        this.specialEnergy = 0;
        this.maxSpecial = 100;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboMaxTime = 2.0;
        this.currentWave = 1;
        this.totalWaves = 3;
        this.bossName = '';
        this.bossHP = 0;
        this.bossMaxHP = 0;
        this.showBossBar = false;
        this.score = 0;
        this.levelName = '';
        this.levelNameTimer = 0;
        this.levelNameDuration = 3.0;
        this.screenShakeAmount = 0;
    }

    update(player, waveManager, gameState) {
        if (player) {
            this.playerHP = player.hp;
            this.maxHP = player.maxHP;
            this.specialEnergy = player.specialEnergy || 0;
            this.maxSpecial = player.maxSpecial || 100;
        }

        if (waveManager) {
            this.currentWave = waveManager.currentWave || 1;
            this.totalWaves = waveManager.totalWaves || 3;
        }

        if (gameState) {
            this.score = gameState.score || 0;
        }

        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= 1 / 60; // Approximate dt
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
                this.comboTimer = 0;
            }
        }

        // Update level name timer
        if (this.levelNameTimer > 0) {
            this.levelNameTimer -= 1 / 60;
            if (this.levelNameTimer < 0) {
                this.levelNameTimer = 0;
            }
        }
    }

    updateCombo(count) {
        if (count > this.comboCount) {
            this.comboCount = count;
            this.comboTimer = this.comboMaxTime;
        }
    }

    addScore(points) {
        this.score += points;
    }

    render(ctx) {
        ctx.save();

        // Player health bar - top left
        this._drawBar(ctx, 20, 20, 200, 20, this.playerHP, this.maxHP, '#cc2222', '#331111');

        // HP text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`HP ${Math.max(0, Math.ceil(this.playerHP))}/${this.maxHP}`, 25, 30);

        // Special energy bar - below health
        this._drawBar(ctx, 20, 48, 150, 14, this.specialEnergy, this.maxSpecial, '#2244aa', '#111133');

        // Energy text
        ctx.fillStyle = '#aaccff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`EN ${Math.floor(this.specialEnergy)}/${this.maxSpecial}`, 25, 55);

        // Wave indicator - top right
        ctx.fillStyle = '#aaaaaa';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`WAVE ${this.currentWave}/${this.totalWaves}`, 1260, 30);

        // Score counter - below wave
        ctx.fillStyle = '#cccccc';
        ctx.font = '14px monospace';
        ctx.fillText(`SCORE: ${this.score}`, 1260, 52);

        // Combo counter - top center
        if (this.comboCount > 1 && this.comboTimer > 0) {
            const comboAlpha = Math.min(1, this.comboTimer);
            ctx.globalAlpha = comboAlpha;

            const multiplier = Math.floor(this.comboCount / 3) + 1;
            ctx.fillStyle = multiplier > 2 ? '#ffaa22' : '#ffffff';
            ctx.font = 'bold 36px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            // Combo count
            ctx.fillText(`${this.comboCount} HIT`, 640, 70);

            // Multiplier
            if (multiplier > 1) {
                ctx.fillStyle = '#ff4444';
                ctx.font = 'bold 20px monospace';
                ctx.fillText(`x${multiplier} MULTIPLIER`, 640, 110);
            }

            ctx.globalAlpha = 1;
        }

        // Boss health bar - top center when boss is active
        if (this.showBossBar && this.bossMaxHP > 0) {
            const bossBarWidth = 400;
            const bossBarX = (1280 - bossBarWidth) / 2;

            // Boss name
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.bossName, 640, 16);

            // Boss health bar
            this._drawBar(ctx, bossBarX, 26, bossBarWidth, 18, this.bossHP, this.bossMaxHP, '#cc0000', '#330000');

            // Boss HP text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`${Math.max(0, Math.ceil(this.bossHP))}/${this.bossMaxHP}`, 640, 36);
        }

        // Level name - fades in at start
        if (this.levelNameTimer > 0) {
            let alpha;
            const elapsed = this.levelNameDuration - this.levelNameTimer;
            if (elapsed < 0.5) {
                alpha = elapsed / 0.5; // Fade in
            } else if (this.levelNameTimer < 1.0) {
                alpha = this.levelNameTimer; // Fade out
            } else {
                alpha = 1;
            }

            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 28px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.levelName, 640, 360);
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    _drawBar(ctx, x, y, w, h, current, max, color, bgColor) {
        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, w, h);

        // Border
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);

        // Fill
        const pct = Math.max(0, Math.min(1, max > 0 ? current / max : 0));
        if (pct > 0) {
            ctx.fillStyle = color;
            ctx.fillRect(x + 1, y + 1, (w - 2) * pct, h - 2);
        }

        // Shine effect on bar
        if (pct > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(x + 1, y + 1, (w - 2) * pct, h / 2 - 1);
        }
    }

    showBossHP(name, maxHP) {
        this.bossName = name;
        this.bossHP = maxHP;
        this.bossMaxHP = maxHP;
        this.showBossBar = true;
    }

    updateBossHP(hp) {
        this.bossHP = hp;
        if (hp <= 0) {
            this.showBossBar = false;
        }
    }

    hideBossHP() {
        this.showBossBar = false;
        this.bossName = '';
        this.bossHP = 0;
        this.bossMaxHP = 0;
    }

    showLevelName(name) {
        this.levelName = name;
        this.levelNameTimer = this.levelNameDuration;
    }

    triggerScreenShake(amount) {
        this.screenShakeAmount = Math.max(this.screenShakeAmount, amount);
    }

    getScreenShake() {
        if (this.screenShakeAmount > 0.5) {
            const shakeX = (Math.random() - 0.5) * this.screenShakeAmount * 2;
            const shakeY = (Math.random() - 0.5) * this.screenShakeAmount * 2;
            this.screenShakeAmount *= 0.9;
            if (this.screenShakeAmount < 0.5) {
                this.screenShakeAmount = 0;
            }
            return { x: shakeX, y: shakeY };
        }
        this.screenShakeAmount = 0;
        return { x: 0, y: 0 };
    }
}
