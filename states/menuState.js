// game/states/menuState.js
// Main menu state - Abandoned Ward

export const menuState = {
    stateMachine: null,
    gameState: null,
    titleFlicker: 0,
    titleBlinkTimer: 0,
    promptBlink: 0,
    particles: [],
    dripLines: [],
    showControls: false,
    controlsAlpha: 0,
    selectedIndex: 0,
    buttons: [],
    time: 0,
    moonPhase: 0,
    audioInitialized: false,

    enter(stateMachine, gameState) {
        this.stateMachine = stateMachine;
        this.gameState = gameState || {};
        this.titleFlicker = 0;
        this.titleBlinkTimer = 0;
        this.promptBlink = 0;
        this.showControls = false;
        this.controlsAlpha = 0;
        this.selectedIndex = 0;
        this.time = 0;
        this.moonPhase = 0;
        this.audioInitialized = false;

        // Menu buttons
        this.buttons = [
            { label: 'NEW GAME', x: 640, y: 480, w: 260, h: 50, action: 'newgame' },
            { label: 'CONTROLS', x: 640, y: 550, w: 260, h: 50, action: 'controls' },
        ];

        // Dust particles
        this.particles = [];
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * 1280,
                y: Math.random() * 720,
                size: Math.random() * 2.5 + 0.5,
                speedX: (Math.random() - 0.5) * 0.4,
                speedY: -Math.random() * 0.6 - 0.1,
                alpha: Math.random() * 0.4 + 0.1,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: Math.random() * 2 + 1
            });
        }

        // Blood drip lines for title effect
        this.dripLines = [];
        for (let i = 0; i < 12; i++) {
            this.dripLines.push({
                x: 440 + i * 40 + Math.random() * 20,
                y: 310,
                length: Math.random() * 30 + 10,
                speed: Math.random() * 15 + 5,
                maxLength: Math.random() * 60 + 40,
                delay: Math.random() * 4,
                elapsed: 0
            });
        }
    },

    update(dt) {
        this.time += dt;
        this.titleFlicker += dt * 4;
        this.promptBlink += dt * 2.5;
        this.moonPhase += dt * 0.1;

        // Update dust particles
        for (const p of this.particles) {
            p.wobble += p.wobbleSpeed * dt;
            p.x += p.speedX + Math.sin(p.wobble) * 0.2;
            p.y += p.speedY;

            if (p.y < -10) {
                p.y = 730;
                p.x = Math.random() * 1280;
            }
            if (p.x < -10) p.x = 1290;
            if (p.x > 1290) p.x = -10;
        }

        // Update drip lines
        for (const drip of this.dripLines) {
            drip.elapsed += dt;
            if (drip.elapsed > drip.delay) {
                drip.y += drip.speed * dt;
                drip.length = Math.min(drip.length + drip.speed * dt * 0.5, drip.maxLength);
                if (drip.y > 400) {
                    drip.y = 310;
                    drip.length = Math.random() * 15 + 5;
                    drip.elapsed = 0;
                    drip.delay = Math.random() * 4;
                    drip.x = 440 + Math.random() * 480;
                }
            }
        }

        // Controls overlay fade
        if (this.showControls) {
            this.controlsAlpha = Math.min(1, this.controlsAlpha + dt * 4);
        } else {
            this.controlsAlpha = Math.max(0, this.controlsAlpha - dt * 4);
        }

        // Initialize Web Audio on first interaction
        if (!this.audioInitialized) {
            this._initAudio();
        }
    },

    _initAudio() {
        try {
            if (typeof AudioContext !== 'undefined' || typeof window !== 'undefined' && typeof window.webkitAudioContext !== 'undefined') {
                // AudioContext will be created on user interaction
            }
        } catch (e) {
            // Audio not available
        }
        this.audioInitialized = true;
    },

    handleTouch(x, y) {
        // Convert to canvas coordinates (assuming 1280x720)
        const scaleX = 1280 / 1280;
        const scaleY = 720 / 720;

        // If controls overlay is shown, dismiss it
        if (this.showControls) {
            this.showControls = false;
            return;
        }

        // Check button hits
        for (let i = 0; i < this.buttons.length; i++) {
            const btn = this.buttons[i];
            const bx = btn.x - btn.w / 2;
            const by = btn.y - btn.h / 2;
            if (x >= bx && x <= bx + btn.w && y >= by && y <= by + btn.h) {
                switch (btn.action) {
                    case 'newgame':
                        this.stateMachine.change('CHAR_SELECT');
                        return;
                    case 'controls':
                        this.showControls = true;
                        return;
                }
            }
        }
    },

    render(ctx) {
        // Dark background
        ctx.fillStyle = '#080808';
        ctx.fillRect(0, 0, 1280, 720);

        // Draw abandoned hospital silhouette background
        this._drawHospitalBackground(ctx);

        // Draw dust particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = '#999999';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Title with flicker effect
        this._drawTitle(ctx);

        // Draw menu buttons
        for (let i = 0; i < this.buttons.length; i++) {
            this._drawButton(ctx, this.buttons[i], i === this.selectedIndex);
        }

        // "Tap to Start" blinking prompt
        const blinkAlpha = 0.3 + Math.abs(Math.sin(this.promptBlink)) * 0.7;
        ctx.globalAlpha = blinkAlpha;
        ctx.fillStyle = '#888888';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TAP TO SELECT', 640, 620);
        ctx.globalAlpha = 1;

        // Controls overlay
        if (this.controlsAlpha > 0) {
            this._drawControlsOverlay(ctx);
        }

        // Bottom text
        ctx.fillStyle = '#333333';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('v1.0  |  Touch Controls', 640, 705);
    },

    _drawHospitalBackground(ctx) {
        // Dark hospital silhouette
        ctx.fillStyle = '#0d0d0d';

        // Building outline
        ctx.beginPath();
        ctx.moveTo(0, 500);
        ctx.lineTo(0, 250);
        ctx.lineTo(100, 250);
        ctx.lineTo(100, 200);
        ctx.lineTo(200, 200);
        ctx.lineTo(200, 180);
        ctx.lineTo(350, 180);
        ctx.lineTo(350, 160);
        ctx.lineTo(500, 160);
        ctx.lineTo(500, 180);
        ctx.lineTo(600, 180);
        ctx.lineTo(600, 200);
        ctx.lineTo(700, 200);
        ctx.lineTo(700, 180);
        ctx.lineTo(850, 180);
        ctx.lineTo(850, 160);
        ctx.lineTo(1000, 160);
        ctx.lineTo(1000, 200);
        ctx.lineTo(1100, 200);
        ctx.lineTo(1100, 250);
        ctx.lineTo(1200, 250);
        ctx.lineTo(1200, 500);
        ctx.lineTo(1280, 500);
        ctx.lineTo(1280, 720);
        ctx.lineTo(0, 720);
        ctx.closePath();
        ctx.fill();

        // Broken windows (dark rectangles with moonlight glow)
        const windows = [
            { x: 150, y: 220, w: 40, h: 50 },
            { x: 250, y: 210, w: 40, h: 50 },
            { x: 400, y: 190, w: 50, h: 60 },
            { x: 520, y: 200, w: 40, h: 50 },
            { x: 650, y: 220, w: 40, h: 50 },
            { x: 780, y: 200, w: 50, h: 50 },
            { x: 920, y: 210, w: 40, h: 50 },
            { x: 1050, y: 230, w: 40, h: 50 },
        ];

        for (const win of windows) {
            // Dark window interior
            ctx.fillStyle = '#020204';
            ctx.fillRect(win.x, win.y, win.w, win.h);

            // Moonlight from some broken windows
            if (Math.sin(this.moonPhase + win.x) > 0) {
                const glowAlpha = 0.03 + Math.sin(this.time * 0.5 + win.x * 0.01) * 0.02;
                ctx.fillStyle = `rgba(150, 160, 200, ${glowAlpha})`;
                ctx.fillRect(win.x, win.y, win.w, win.h);
            }

            // Window frame
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 1;
            ctx.strokeRect(win.x, win.y, win.w, win.h);
            // Cross frame
            ctx.beginPath();
            ctx.moveTo(win.x + win.w / 2, win.y);
            ctx.lineTo(win.x + win.w / 2, win.y + win.h);
            ctx.moveTo(win.x, win.y + win.h / 2);
            ctx.lineTo(win.x + win.w, win.y + win.h / 2);
            ctx.stroke();
        }

        // Moon through a broken window (upper right area)
        const moonX = 950;
        const moonY = 100;
        const moonGlow = ctx.createRadialGradient(moonX, moonY, 5, moonX, moonY, 80);
        moonGlow.addColorStop(0, 'rgba(180, 190, 220, 0.15)');
        moonGlow.addColorStop(0.3, 'rgba(150, 160, 200, 0.08)');
        moonGlow.addColorStop(1, 'rgba(100, 110, 140, 0)');
        ctx.fillStyle = moonGlow;
        ctx.fillRect(moonX - 80, moonY - 80, 160, 160);

        // Moon disc
        ctx.fillStyle = 'rgba(200, 210, 230, 0.12)';
        ctx.beginPath();
        ctx.arc(moonX, moonY, 20, 0, Math.PI * 2);
        ctx.fill();

        // Ground line
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 500, 1280, 5);

        // Vignette overlay
        const vignette = ctx.createRadialGradient(640, 360, 200, 640, 360, 750);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, 1280, 720);
    },

    _drawTitle(ctx) {
        // Title text with subtle flicker
        const flickerAlpha = 0.85 + Math.sin(this.titleFlicker) * 0.1 + Math.sin(this.titleFlicker * 11.7) * 0.03;
        ctx.globalAlpha = flickerAlpha;

        // Red glow behind title
        ctx.shadowColor = '#cc1111';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#991111';
        ctx.font = 'bold 72px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ABANDONED WARD', 640, 220);
        ctx.shadowBlur = 0;

        // Main title
        ctx.fillStyle = '#ddcccc';
        ctx.font = 'bold 72px monospace';
        ctx.fillText('ABANDONED WARD', 640, 220);

        ctx.globalAlpha = 1;

        // Blood drip lines below title letters
        for (const drip of this.dripLines) {
            if (drip.elapsed > drip.delay) {
                ctx.fillStyle = 'rgba(180, 20, 20, 0.7)';
                ctx.fillRect(drip.x, drip.y - drip.length, 2, drip.length);

                // Drip bulb at bottom
                ctx.beginPath();
                ctx.arc(drip.x + 1, drip.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(200, 30, 30, 0.5)';
                ctx.fill();
            }
        }
    },

    _drawButton(ctx, btn, selected) {
        const bx = btn.x - btn.w / 2;
        const by = btn.y - btn.h / 2;

        // Button background
        ctx.fillStyle = selected ? 'rgba(30, 15, 15, 0.9)' : 'rgba(20, 15, 15, 0.8)';
        ctx.fillRect(bx, by, btn.w, btn.h);

        // Red border
        ctx.strokeStyle = selected ? '#ff4444' : '#aa2222';
        ctx.lineWidth = selected ? 3 : 2;
        ctx.strokeRect(bx, by, btn.w, btn.h);

        // Corner decorations
        const cornerLen = 10;
        ctx.strokeStyle = '#cc3333';
        ctx.lineWidth = 2;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(bx, by + cornerLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + cornerLen, by);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(bx + btn.w - cornerLen, by);
        ctx.lineTo(bx + btn.w, by);
        ctx.lineTo(bx + btn.w, by + cornerLen);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(bx, by + btn.h - cornerLen);
        ctx.lineTo(bx, by + btn.h);
        ctx.lineTo(bx + cornerLen, by + btn.h);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(bx + btn.w - cornerLen, by + btn.h);
        ctx.lineTo(bx + btn.w, by + btn.h);
        ctx.lineTo(bx + btn.w, by + btn.h - cornerLen);
        ctx.stroke();

        // Button label
        ctx.fillStyle = selected ? '#ffffff' : '#cccccc';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btn.label, btn.x, btn.y);
    },

    _drawControlsOverlay(ctx) {
        ctx.save();
        ctx.globalAlpha = this.controlsAlpha * 0.85;

        // Dark overlay
        ctx.fillStyle = 'rgba(5, 5, 5, 0.9)';
        ctx.fillRect(0, 0, 1280, 720);

        // Controls title
        ctx.fillStyle = '#cccccc';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CONTROLS', 640, 80);

        // Divider
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(240, 110);
        ctx.lineTo(1040, 110);
        ctx.stroke();

        // Left side: Virtual joystick diagram
        ctx.fillStyle = '#999999';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('MOVEMENT', 340, 160);

        // Draw joystick representation
        ctx.beginPath();
        ctx.arc(340, 260, 60, 0, Math.PI * 2);
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = 'rgba(40, 40, 40, 0.5)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(340, 260, 22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180, 180, 180, 0.6)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Arrow indicators
        ctx.fillStyle = '#666666';
        ctx.font = '14px monospace';
        ctx.fillText('LEFT SCREEN', 340, 350);
        ctx.fillText('Drag to move', 340, 370);

        // Direction arrows around joystick
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2;
        // Up
        ctx.beginPath();
        ctx.moveTo(340, 190);
        ctx.lineTo(340, 200);
        ctx.moveTo(335, 195);
        ctx.lineTo(340, 190);
        ctx.lineTo(345, 195);
        ctx.stroke();
        // Down
        ctx.beginPath();
        ctx.moveTo(340, 320);
        ctx.lineTo(340, 330);
        ctx.moveTo(335, 325);
        ctx.lineTo(340, 330);
        ctx.lineTo(345, 325);
        ctx.stroke();
        // Left
        ctx.beginPath();
        ctx.moveTo(270, 260);
        ctx.lineTo(260, 260);
        ctx.moveTo(265, 255);
        ctx.lineTo(260, 260);
        ctx.lineTo(265, 265);
        ctx.stroke();
        // Right
        ctx.beginPath();
        ctx.moveTo(410, 260);
        ctx.lineTo(420, 260);
        ctx.moveTo(415, 255);
        ctx.lineTo(420, 260);
        ctx.lineTo(415, 265);
        ctx.stroke();

        // Right side: Action buttons diagram
        ctx.fillStyle = '#999999';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('ACTIONS', 940, 160);

        // Attack button
        ctx.beginPath();
        ctx.arc(940, 240, 35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 30, 30, 0.4)';
        ctx.fill();
        ctx.strokeStyle = '#cc2222';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('ATK', 940, 240);

        // Ability buttons
        const abilityPositions = [
            { x: 860, y: 310, label: '1', color: '#2244aa' },
            { x: 1020, y: 310, label: '2', color: '#2244aa' },
            { x: 940, y: 370, label: '3', color: '#2244aa' },
        ];

        for (const ab of abilityPositions) {
            ctx.beginPath();
            ctx.arc(ab.x, ab.y, 30, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(34, 68, 170, 0.3)`;
            ctx.fill();
            ctx.strokeStyle = ab.color;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(ab.label, ab.x, ab.y);
        }

        // Pause button
        ctx.beginPath();
        ctx.arc(940, 430, 25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.fill();
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('||', 940, 430);

        ctx.fillStyle = '#666666';
        ctx.font = '14px monospace';
        ctx.fillText('RIGHT SCREEN', 940, 480);
        ctx.fillText('Tap to use', 940, 500);

        // Labels
        ctx.fillStyle = '#888888';
        ctx.font = '13px monospace';
        ctx.fillText('ATK = Attack', 940, 240 + 60);
        ctx.fillText('1, 2, 3 = Abilities', 940, 530);
        ctx.fillText('|| = Pause', 940, 550);

        // Tap to dismiss
        ctx.fillStyle = '#666666';
        ctx.font = '18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TAP ANYWHERE TO DISMISS', 640, 650);

        ctx.restore();
    },

    exit() {
        this.particles = [];
        this.dripLines = [];
        this.showControls = false;
        this.controlsAlpha = 0;
    }
};
