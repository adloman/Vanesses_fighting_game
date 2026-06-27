// game/states/bootState.js
// Boot/loading state - Abandoned Ward

export const bootState = {
    loadProgress: 0,
    loadSpeed: 1.0,
    titleFlicker: 0,
    particles: [],
    initialized: false,

    enter(stateMachine, gameState) {
        this.stateMachine = stateMachine;
        this.gameState = gameState || {};
        this.loadProgress = 0;
        this.titleFlicker = 0;
        this.particles = [];

        // Generate some ambient dust particles
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: Math.random() * 1280,
                y: Math.random() * 720,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: -Math.random() * 0.5 - 0.1,
                alpha: Math.random() * 0.3 + 0.1
            });
        }
    },

    update(dt) {
        // Advance loading progress
        this.loadProgress += dt * this.loadSpeed;

        // Update title flicker
        this.titleFlicker += dt * 3;

        // Update particles
        for (const p of this.particles) {
            p.x += p.speedX;
            p.y += p.speedY;
            if (p.y < -10) {
                p.y = 730;
                p.x = Math.random() * 1280;
            }
            if (p.x < -10) p.x = 1290;
            if (p.x > 1290) p.x = -10;
        }

        // Transition to menu when loaded
        if (this.loadProgress >= 1.0) {
            this.loadProgress = 1.0;
            this.stateMachine.change('MENU');
        }
    },

    render(ctx) {
        // Dark background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, 1280, 720);

        // Subtle radial vignette
        const vignette = ctx.createRadialGradient(640, 360, 100, 640, 360, 700);
        vignette.addColorStop(0, 'rgba(20, 10, 10, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, 1280, 720);

        // Draw dust particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = '#888888';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Title with subtle flicker
        const flickerAlpha = 0.7 + Math.sin(this.titleFlicker) * 0.15 + Math.sin(this.titleFlicker * 7.3) * 0.05;
        ctx.globalAlpha = flickerAlpha;

        // Title glow
        ctx.shadowColor = '#cc2222';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#cc2222';
        ctx.font = 'bold 64px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ABANDONED WARD', 640, 280);
        ctx.shadowBlur = 0;

        // Title text on top
        ctx.fillStyle = '#dddddd';
        ctx.fillText('ABANDONED WARD', 640, 280);

        ctx.globalAlpha = 1;

        // Subtitle
        ctx.fillStyle = '#666666';
        ctx.font = '16px monospace';
        ctx.fillText('A darkness awaits in the halls of the forgotten...', 640, 340);

        // Loading bar background
        const barX = 390;
        const barY = 420;
        const barWidth = 500;
        const barHeight = 12;

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Loading bar fill with gradient
        const fillWidth = (barWidth - 2) * this.loadProgress;
        if (fillWidth > 0) {
            const barGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
            barGradient.addColorStop(0, '#cc2222');
            barGradient.addColorStop(0.5, '#ff4444');
            barGradient.addColorStop(1, '#cc2222');
            ctx.fillStyle = barGradient;
            ctx.fillRect(barX + 1, barY + 1, fillWidth, barHeight - 2);

            // Shine on bar
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fillRect(barX + 1, barY + 1, fillWidth, barHeight / 2 - 1);
        }

        // Loading text
        ctx.fillStyle = '#888888';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        const dots = '.'.repeat(Math.floor(this.titleFlicker) % 4);
        ctx.fillText(`Loading${dots}`, 640, 455);

        // Loading percentage
        ctx.fillStyle = '#666666';
        ctx.font = '12px monospace';
        ctx.fillText(`${Math.floor(this.loadProgress * 100)}%`, 640, 480);
    },

    exit() {
        this.particles = [];
        this.loadProgress = 0;
    }
};
