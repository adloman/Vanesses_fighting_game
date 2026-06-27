// game/states/victoryState.js
// Victory screen - Abandoned Ward

export const victoryState = {
    stateMachine: null,
    gameState: null,
    time: 0,
    particles: [],
    score: 0,
    highScore: 0,
    fadeIn: 0,
    buttons: [],
    levelBeat: 0,
    starBurst: false,

    enter(stateMachine, gameState) {
        this.stateMachine = stateMachine;
        this.gameState = gameState || {};
        this.time = 0;
        this.fadeIn = 0;
        this.starBurst = false;

        this.score = this.gameState.score || 0;
        this.highScore = this.gameState.highScore || 0;
        this.levelBeat = (this.gameState.currentLevel || 0);

        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.gameState.highScore = this.highScore;
        }

        // Victory bonus
        this.score += 1000;
        this.gameState.score = this.score;

        // Buttons
        this.buttons = [
            { label: 'MAIN MENU', x: 540, y: 580, w: 200, h: 50, action: 'menu' },
        ];

        // Golden particles
        this.particles = [];
        for (let i = 0; i < 60; i++) {
            this.particles.push({
                x: Math.random() * 1280,
                y: Math.random() * 720,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 1.0,
                speedY: -Math.random() * 1.5 - 0.3,
                alpha: Math.random() * 0.5 + 0.2,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: Math.random() * 3 + 1,
                color: this._randomGoldColor()
            });
        }
    },

    _randomGoldColor() {
        const goldColors = ['#ffdd44', '#ffcc22', '#ffee88', '#ffaa00', '#ddaa33', '#ffeecc'];
        return goldColors[Math.floor(Math.random() * goldColors.length)];
    },

    update(dt) {
        this.time += dt;

        // Fade in
        if (this.fadeIn < 1) {
            this.fadeIn += dt * 0.5;
            if (this.fadeIn > 1) this.fadeIn = 1;
        }

        // Star burst after a moment
        if (this.time > 0.5 && !this.starBurst) {
            this.starBurst = true;
            // Add extra burst particles
            for (let i = 0; i < 30; i++) {
                this.particles.push({
                    x: 640,
                    y: 200,
                    size: Math.random() * 4 + 2,
                    speedX: (Math.random() - 0.5) * 8,
                    speedY: (Math.random() - 0.5) * 8,
                    alpha: 0.8,
                    wobble: Math.random() * Math.PI * 2,
                    wobbleSpeed: Math.random() * 5 + 2,
                    color: this._randomGoldColor()
                });
            }
        }

        // Update particles
        for (const p of this.particles) {
            p.wobble += p.wobbleSpeed * dt;
            p.x += p.speedX + Math.sin(p.wobble) * 0.3;
            p.y += p.speedY;
            p.alpha -= dt * 0.05;

            // Wrap around
            if (p.y < -20) {
                p.y = 740;
                p.x = Math.random() * 1280;
                p.alpha = Math.random() * 0.5 + 0.2;
            }
            if (p.x < -20) p.x = 1300;
            if (p.x > 1300) p.x = -20;
        }

        // Remove dead particles
        this.particles = this.particles.filter(p => p.alpha > 0.01);
    },

    handleTouch(x, y) {
        for (const btn of this.buttons) {
            const bx = btn.x - btn.w / 2;
            const by = btn.y - btn.h / 2;
            if (x >= bx && x <= bx + btn.w && y >= by && y <= by + btn.h) {
                switch (btn.action) {
                    case 'menu':
                        this.gameState.score = 0;
                        this.gameState.currentLevel = 0;
                        this.stateMachine.change('MENU');
                        return;
                }
            }
        }
    },

    render(ctx) {
        // Dark background with warm tint
        ctx.fillStyle = '#0d0a05';
        ctx.fillRect(0, 0, 1280, 720);

        // Warm vignette
        const vignette = ctx.createRadialGradient(640, 300, 100, 640, 400, 750);
        vignette.addColorStop(0, 'rgba(40, 30, 10, 0)');
        vignette.addColorStop(0.5, 'rgba(30, 20, 5, 0.2)');
        vignette.addColorStop(1, 'rgba(10, 5, 0, 0.7)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, 1280, 720);

        // Golden particles
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;

            // Draw as a small cross/star shape
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - p.size);
            ctx.lineTo(p.x + p.size * 0.3, p.y);
            ctx.lineTo(p.x, p.y + p.size);
            ctx.lineTo(p.x - p.size * 0.3, p.y);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(p.x - p.size, p.y);
            ctx.lineTo(p.x, p.y + p.size * 0.3);
            ctx.lineTo(p.x + p.size, p.y);
            ctx.lineTo(p.x, p.y - p.size * 0.3);
            ctx.closePath();
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Apply fade-in
        ctx.globalAlpha = this.fadeIn;

        // "VICTORY" title
        // Golden glow
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#cc8800';
        ctx.font = 'bold 80px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('VICTORY', 640, 160);
        ctx.shadowBlur = 0;

        // Main title
        ctx.fillStyle = '#ffdd66';
        ctx.font = 'bold 80px monospace';
        ctx.fillText('VICTORY', 640, 160);

        // Subtitle glow
        ctx.shadowColor = '#ffcc44';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ccaa44';
        ctx.font = 'italic 20px monospace';
        ctx.fillText('You survived the Abandoned Ward', 640, 220);
        ctx.shadowBlur = 0;

        // Congratulatory text
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '16px monospace';
        ctx.fillText('The darkness has been driven back... for now.', 640, 260);

        // Score panel
        const panelX = 390;
        const panelY = 300;
        const panelW = 500;
        const panelH = 220;

        ctx.fillStyle = 'rgba(15, 12, 8, 0.95)';
        ctx.fillRect(panelX, panelY, panelW, panelH);

        // Golden border
        ctx.strokeStyle = '#aa8833';
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        // Corner decorations
        const cLen = 20;
        ctx.strokeStyle = '#ddaa44';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(panelX, panelY + cLen); ctx.lineTo(panelX, panelY); ctx.lineTo(panelX + cLen, panelY);
        ctx.moveTo(panelX + panelW - cLen, panelY); ctx.lineTo(panelX + panelW, panelY); ctx.lineTo(panelX + panelW, panelY + cLen);
        ctx.moveTo(panelX, panelY + panelH - cLen); ctx.lineTo(panelX, panelY + panelH); ctx.lineTo(panelX + cLen, panelY + panelH);
        ctx.moveTo(panelX + panelW - cLen, panelY + panelH); ctx.lineTo(panelX + panelW, panelY + panelH); ctx.lineTo(panelX + panelW, panelY + panelH - cLen);
        ctx.stroke();

        // Level beaten
        ctx.fillStyle = '#888888';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('LEVELS CLEARED', 640, panelY + 35);

        ctx.fillStyle = '#ddcc88';
        ctx.font = 'bold 28px monospace';
        ctx.fillText(`${this.levelBeat + 1} / ${6}`, 640, panelY + 68);

        // Divider
        ctx.strokeStyle = '#443322';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(panelX + 50, panelY + 90);
        ctx.lineTo(panelX + panelW - 50, panelY + 90);
        ctx.stroke();

        // Score label
        ctx.fillStyle = '#888888';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('FINAL SCORE', 640, panelY + 115);

        // Score value
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px monospace';
        ctx.fillText(this.score.toString(), 640, panelY + 158);

        // High score
        ctx.fillStyle = '#ccaa44';
        ctx.font = '14px monospace';
        ctx.fillText(`HIGH SCORE: ${this.highScore}`, 640, panelY + 190);

        // New high score indicator
        if (this.score >= this.highScore && this.score > 0) {
            const flashAlpha = 0.5 + Math.sin(this.time * 4) * 0.5;
            ctx.globalAlpha = flashAlpha * this.fadeIn;
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('NEW HIGH SCORE!', 640, panelY + 210);
            ctx.globalAlpha = this.fadeIn;
        }

        // Victory bonus text
        ctx.fillStyle = '#88aa44';
        ctx.font = '14px monospace';
        ctx.fillText('(Includes +1000 Victory Bonus)', 640, panelY + 210);

        // Main Menu button
        for (const btn of this.buttons) {
            const bx = btn.x - btn.w / 2;
            const by = btn.y - btn.h / 2;

            ctx.fillStyle = 'rgba(30, 25, 15, 0.9)';
            ctx.fillRect(bx, by, btn.w, btn.h);

            ctx.strokeStyle = '#aa8833';
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, by, btn.w, btn.h);

            // Button glow pulse
            const pulseAlpha = 0.3 + Math.sin(this.time * 2) * 0.15;
            ctx.strokeStyle = `rgba(255, 200, 100, ${pulseAlpha})`;
            ctx.strokeRect(bx - 2, by - 2, btn.w + 4, btn.h + 4);

            ctx.fillStyle = '#ffddaa';
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.label, btn.x, btn.y);
        }

        // Bottom quote
        ctx.fillStyle = '#555544';
        ctx.font = 'italic 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('"Not all who wander in darkness are lost."', 640, 670);

        ctx.globalAlpha = 1;
    },

    exit() {
        this.particles = [];
        this.fadeIn = 0;
        this.starBurst = false;
    }
};
