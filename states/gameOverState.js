// game/states/gameOverState.js
// Game over screen - Abandoned Ward

export const gameOverState = {
    stateMachine: null,
    gameState: null,
    time: 0,
    particles: [],
    dripLines: [],
    score: 0,
    highScore: 0,
    deathFade: 1,
    buttons: [],

    enter(stateMachine, gameState) {
        this.stateMachine = stateMachine;
        this.gameState = gameState || {};
        this.time = 0;
        this.deathFade = 1;

        this.score = this.gameState.score || 0;
        this.highScore = this.gameState.highScore || 0;

        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.gameState.highScore = this.highScore;
        }

        // Buttons
        this.buttons = [
            { label: 'RETRY', x: 540, y: 500, w: 200, h: 50, action: 'retry' },
            { label: 'MENU', x: 540, y: 570, w: 200, h: 50, action: 'menu' },
        ];

        // Red particles for atmosphere
        this.particles = [];
        for (let i = 0; i < 40; i++) {
            this.particles.push({
                x: Math.random() * 1280,
                y: Math.random() * 720,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: Math.random() * 0.5 + 0.2,
                alpha: Math.random() * 0.4 + 0.1,
                color: Math.random() > 0.5 ? '#cc2222' : '#881111'
            });
        }

        // Blood drip lines for title
        this.dripLines = [];
        for (let i = 0; i < 8; i++) {
            this.dripLines.push({
                x: 520 + i * 35 + Math.random() * 15,
                y: 230,
                length: Math.random() * 25 + 8,
                speed: Math.random() * 20 + 8,
                maxLength: Math.random() * 50 + 30,
                delay: Math.random() * 3,
                elapsed: 0
            });
        }
    },

    update(dt) {
        this.time += dt;

        // Fade in death screen
        if (this.deathFade > 0) {
            this.deathFade -= dt * 0.8;
            if (this.deathFade < 0) this.deathFade = 0;
        }

        // Update particles
        for (const p of this.particles) {
            p.x += p.speedX;
            p.y += p.speedY;
            if (p.y > 730) {
                p.y = -10;
                p.x = Math.random() * 1280;
            }
        }

        // Update drip lines
        for (const drip of this.dripLines) {
            drip.elapsed += dt;
            if (drip.elapsed > drip.delay) {
                drip.y += drip.speed * dt;
                drip.length = Math.min(drip.length + drip.speed * dt * 0.4, drip.maxLength);
                if (drip.y > 320) {
                    drip.y = 230;
                    drip.length = Math.random() * 12 + 5;
                    drip.elapsed = 0;
                    drip.delay = Math.random() * 3;
                    drip.x = 520 + Math.random() * 280;
                }
            }
        }
    },

    handleTouch(x, y) {
        for (const btn of this.buttons) {
            const bx = btn.x - btn.w / 2;
            const by = btn.y - btn.h / 2;
            if (x >= bx && x <= bx + btn.w && y >= by && y <= by + btn.h) {
                switch (btn.action) {
                    case 'retry':
                        this.gameState.score = 0;
                        this.gameState.currentLevel = 0;
                        this.stateMachine.change('PLAY');
                        return;
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
        // Very dark background with red tint
        ctx.fillStyle = '#0d0505';
        ctx.fillRect(0, 0, 1280, 720);

        // Red vignette
        const vignette = ctx.createRadialGradient(640, 360, 100, 640, 360, 700);
        vignette.addColorStop(0, 'rgba(30, 5, 5, 0)');
        vignette.addColorStop(0.7, 'rgba(20, 2, 2, 0.3)');
        vignette.addColorStop(1, 'rgba(10, 0, 0, 0.8)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, 1280, 720);

        // Red particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Fade overlay (starts dark, fades in)
        if (this.deathFade > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${this.deathFade})`;
            ctx.fillRect(0, 0, 1280, 720);
        }

        // "YOU DIED" title with blood drip
        const titleAlpha = Math.max(0, 1 - this.deathFade);
        ctx.globalAlpha = titleAlpha;

        // Red glow
        ctx.shadowColor = '#cc0000';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#990000';
        ctx.font = 'bold 72px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('YOU DIED', 640, 190);
        ctx.shadowBlur = 0;

        // Main title text
        ctx.fillStyle = '#dd3333';
        ctx.font = 'bold 72px monospace';
        ctx.fillText('YOU DIED', 640, 190);

        // Blood drips below title
        for (const drip of this.dripLines) {
            if (drip.elapsed > drip.delay) {
                ctx.fillStyle = 'rgba(180, 20, 20, 0.7)';
                ctx.fillRect(drip.x, drip.y - drip.length, 2, drip.length);

                // Drip bulb
                ctx.beginPath();
                ctx.arc(drip.x + 1, drip.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(200, 30, 30, 0.5)';
                ctx.fill();
            }
        }

        ctx.globalAlpha = 1;

        // Death message
        ctx.fillStyle = '#666666';
        ctx.font = 'italic 16px monospace';
        ctx.fillText('The abandoned ward claims another soul...', 640, 260);

        // Score panel
        const scorePanelX = 440;
        const scorePanelY = 320;
        const scorePanelW = 400;
        const scorePanelH = 140;

        ctx.fillStyle = 'rgba(15, 10, 10, 0.9)';
        ctx.fillRect(scorePanelX, scorePanelY, scorePanelW, scorePanelH);
        ctx.strokeStyle = '#442222';
        ctx.lineWidth = 1;
        ctx.strokeRect(scorePanelX, scorePanelY, scorePanelW, scorePanelH);

        // Score title
        ctx.fillStyle = '#888888';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FINAL SCORE', 640, scorePanelY + 30);

        // Score value
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px monospace';
        ctx.fillText(this.score.toString(), 640, scorePanelY + 72);

        // High score
        ctx.fillStyle = '#ccaa44';
        ctx.font = '14px monospace';
        ctx.fillText(`HIGH SCORE: ${this.highScore}`, 640, scorePanelY + 105);

        // New high score indicator
        if (this.score >= this.highScore && this.score > 0) {
            const flashAlpha = 0.5 + Math.sin(this.time * 4) * 0.5;
            ctx.globalAlpha = flashAlpha;
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('NEW HIGH SCORE!', 640, scorePanelY + 125);
            ctx.globalAlpha = 1;
        }

        // Buttons
        for (let i = 0; i < this.buttons.length; i++) {
            const btn = this.buttons[i];
            const bx = btn.x - btn.w / 2;
            const by = btn.y - btn.h / 2;

            ctx.fillStyle = 'rgba(30, 15, 15, 0.9)';
            ctx.fillRect(bx, by, btn.w, btn.h);

            ctx.strokeStyle = btn.action === 'retry' ? '#cc3333' : '#666666';
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, by, btn.w, btn.h);

            // Corner accents
            const cLen = 8;
            ctx.strokeStyle = '#cc3333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bx, by + cLen); ctx.lineTo(bx, by); ctx.lineTo(bx + cLen, by);
            ctx.moveTo(bx + btn.w - cLen, by); ctx.lineTo(bx + btn.w, by); ctx.lineTo(bx + btn.w, by + cLen);
            ctx.moveTo(bx, by + btn.h - cLen); ctx.lineTo(bx, by + btn.h); ctx.lineTo(bx + cLen, by + btn.h);
            ctx.moveTo(bx + btn.w - cLen, by + btn.h); ctx.lineTo(bx + btn.w, by + btn.h); ctx.lineTo(bx + btn.w, by + btn.h - cLen);
            ctx.stroke();

            ctx.fillStyle = '#cccccc';
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.label, btn.x, btn.y);
        }

        // Bottom text
        ctx.fillStyle = '#333333';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('The darkness endures', 640, 680);
    },

    exit() {
        this.particles = [];
        this.dripLines = [];
        this.deathFade = 1;
    }
};
