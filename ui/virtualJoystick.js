// game/ui/virtualJoystick.js
// Virtual joystick for mobile touch input - Abandoned Ward

export class VirtualJoystick {
    constructor(canvas) {
        this.canvas = canvas;
        this.baseX = 130;
        this.baseY = 610;
        this.stickX = this.baseX;
        this.stickY = this.baseY;
        this.touchId = null;
        this.active = false;
        this.dirX = 0;
        this.dirY = 0;
        this.maxRadius = 50;
        this.baseRadius = 60;
        this.opacity = 0.4;
    }

    handleTouchStart(touch) {
        const halfWidth = this.canvas.width / 2;
        if (touch.clientX < halfWidth && this.touchId === null) {
            this.touchId = touch.identifier;
            this.active = true;
            this._updateStick(touch.clientX, touch.clientY);
        }
    }

    handleTouchMove(touch) {
        if (this.touchId !== null && touch.identifier === this.touchId) {
            this._updateStick(touch.clientX, touch.clientY);
        }
    }

    handleTouchEnd(touch) {
        if (this.touchId !== null && touch.identifier === this.touchId) {
            this.reset();
        }
    }

    _updateStick(touchX, touchY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (touchX - rect.left) * scaleX;
        const y = (touchY - rect.top) * scaleY;

        let dx = x - this.baseX;
        let dy = y - this.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > this.maxRadius) {
            dx = (dx / dist) * this.maxRadius;
            dy = (dy / dist) * this.maxRadius;
        }

        this.stickX = this.baseX + dx;
        this.stickY = this.baseY + dy;

        // Calculate normalized direction
        if (dist > 5) {
            this.dirX = dx / this.maxRadius;
            this.dirY = dy / this.maxRadius;
        } else {
            this.dirX = 0;
            this.dirY = 0;
        }
    }

    getDirection() {
        return {
            dx: this.dirX,
            dy: this.dirY,
            active: this.active
        };
    }

    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;

        // Outer ring - dark grey
        ctx.beginPath();
        ctx.arc(this.baseX, this.baseY, this.baseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = 'rgba(40, 40, 40, 0.5)';
        ctx.fill();

        // Inner stick - lighter circle
        ctx.beginPath();
        ctx.arc(this.stickX, this.stickY, this.maxRadius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180, 180, 180, 0.6)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Direction indicator line
        if (this.active && (this.dirX !== 0 || this.dirY !== 0)) {
            ctx.beginPath();
            ctx.moveTo(this.baseX, this.baseY);
            ctx.lineTo(this.stickX, this.stickY);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.restore();
    }

    reset() {
        this.touchId = null;
        this.active = false;
        this.stickX = this.baseX;
        this.stickY = this.baseY;
        this.dirX = 0;
        this.dirY = 0;
    }
}
