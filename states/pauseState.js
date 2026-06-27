// game/states/pauseState.js
// Pause overlay state - Abandoned Ward

export const pauseState = {
    stateMachine: null,
    gameState: null,
    prevState: null,
    time: 0,
    selectedIndex: 0,

    enter(stateMachine, gameState) {
        this.stateMachine = stateMachine;
        this.gameState = gameState || {};
        this.time = 0;
        this.selectedIndex = 0;

        // Get reference to play state so we can resume it
        this.prevState = this.stateMachine.getPreviousState ? this.stateMachine.getPreviousState() : null;

        // Mark play state as paused
        if (this.prevState && typeof this.prevState.paused !== 'undefined') {
            this.prevState.paused = true;
        }
    },

    update(dt) {
        this.time += dt;

        // Check keyboard input for resume
        if (this.gameState._keys && (this.gameState._keys['Escape'] || this.gameState._keys['p'])) {
            this._resume();
        }
    },

    handleTouch(x, y) {
        // Resume button
        const resumeX = 540;
        const resumeY = 380;
        const resumeW = 200;
        const resumeH = 50;
        if (x >= resumeX && x <= resumeX + resumeW &&
            y >= resumeY && y <= resumeY + resumeH) {
            this._resume();
            return;
        }

        // Quit button
        const quitX = 540;
        const quitY = 450;
        const quitW = 200;
        const quitH = 50;
        if (x >= quitX && x <= quitX + quitW &&
            y >= quitY && y <= quitY + quitH) {
            this._quitToMenu();
            return;
        }
    },

    _resume() {
        if (this.prevState && typeof this.prevState.paused !== 'undefined') {
            this.prevState.paused = false;
        }
        this.stateMachine.change('PLAY');
    },

    _quitToMenu() {
        if (this.prevState && typeof this.prevState.paused !== 'undefined') {
            this.prevState.paused = false;
        }
        this.stateMachine.change('MENU');
    },

    render(ctx) {
        // Semi-transparent dark overlay
        ctx.fillStyle = 'rgba(5, 5, 8, 0.75)';
        ctx.fillRect(0, 0, 1280, 720);

        // Pause panel
        const panelX = 390;
        const panelY = 200;
        const panelW = 500;
        const panelH = 340;

        ctx.fillStyle = 'rgba(15, 15, 20, 0.95)';
        ctx.fillRect(panelX, panelY, panelW, panelH);

        // Panel border
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        // Corner decorations
        const cornerLen = 15;
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 3;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(panelX, panelY + cornerLen);
        ctx.lineTo(panelX, panelY);
        ctx.lineTo(panelX + cornerLen, panelY);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(panelX + panelW - cornerLen, panelY);
        ctx.lineTo(panelX + panelW, panelY);
        ctx.lineTo(panelX + panelW, panelY + cornerLen);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(panelX, panelY + panelH - cornerLen);
        ctx.lineTo(panelX, panelY + panelH);
        ctx.lineTo(panelX + cornerLen, panelY + panelH);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(panelX + panelW - cornerLen, panelY + panelH);
        ctx.lineTo(panelX + panelW, panelY + panelH);
        ctx.lineTo(panelX + panelW, panelY + panelH - cornerLen);
        ctx.stroke();

        // "PAUSED" title
        ctx.fillStyle = '#cccccc';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', 640, 270);

        // Divider under title
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(490, 300);
        ctx.lineTo(790, 300);
        ctx.stroke();

        // Subtitle
        ctx.fillStyle = '#666666';
        ctx.font = '14px monospace';
        ctx.fillText('The darkness waits...', 640, 330);

        // Resume button
        this._drawButton(ctx, 540, 380, 200, 50, 'RESUME', '#338833', this.selectedIndex === 0);

        // Quit to menu button
        this._drawButton(ctx, 540, 450, 200, 50, 'QUIT TO MENU', '#883333', this.selectedIndex === 1);

        // Controls hint
        ctx.fillStyle = '#444444';
        ctx.font = '12px monospace';
        ctx.fillText('Press ESC or P to resume', 640, 520);
    },

    _drawButton(ctx, x, y, w, h, label, color, selected) {
        ctx.fillStyle = selected ? 'rgba(30, 25, 20, 0.9)' : 'rgba(20, 15, 15, 0.8)';
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = selected ? color : '#444444';
        ctx.lineWidth = selected ? 2 : 1;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = selected ? '#ffffff' : '#aaaaaa';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + w / 2, y + h / 2);
    },

    exit() {
        // Ensure play state is unpaused on exit
        if (this.prevState && typeof this.prevState.paused !== 'undefined') {
            this.prevState.paused = false;
        }
    }
};
