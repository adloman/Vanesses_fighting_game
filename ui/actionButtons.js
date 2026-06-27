// game/ui/actionButtons.js
// Action buttons for mobile touch input - Abandoned Ward

class ActionButton {
    constructor(x, y, radius, label, color, icon) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.label = label;
        this.touchId = null;
        this.pressed = false;
        this.pressedThisFrame = false;
        this.cooldownPercent = 0;
        this.color = color;
        this.icon = icon || label;
    }

    containsPoint(px, py) {
        const dx = px - this.x;
        const dy = py - this.y;
        return (dx * dx + dy * dy) <= (this.radius * this.radius);
    }
}

export class ActionButtons {
    constructor(canvas) {
        this.canvas = canvas;

        this.buttons = [
            new ActionButton(1180, 610, 35, 'ATK', '#cc2222', 'ATK'),     // ATTACK
            new ActionButton(1100, 560, 35, '1', '#2244aa', '1'),         // ABILITY1
            new ActionButton(1220, 560, 35, '2', '#2244aa', '2'),         // ABILITY2
            new ActionButton(1160, 500, 35, '3', '#2244aa', '3'),         // ABILITY3
            new ActionButton(40, 40, 35, 'PAUSE', '#666666', '||'),      // PAUSE
        ];

        this.pauseConsumed = false;
    }

    _screenToCanvas(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    handleTouchStart(touch) {
        const halfWidth = this.canvas.width / 2;
        if (touch.clientX < halfWidth) return; // Left half is for joystick

        const pos = this._screenToCanvas(touch.clientX, touch.clientY);

        for (const btn of this.buttons) {
            if (btn.touchId === null && btn.containsPoint(pos.x, pos.y)) {
                btn.touchId = touch.identifier;
                btn.pressed = true;
                btn.pressedThisFrame = true;
                break;
            }
        }
    }

    handleTouchMove(touch) {
        const pos = this._screenToCanvas(touch.clientX, touch.clientY);

        for (const btn of this.buttons) {
            if (btn.touchId !== null && touch.identifier === btn.touchId) {
                // Check if finger moved outside button
                if (!btn.containsPoint(pos.x, pos.y)) {
                    btn.touchId = null;
                    btn.pressed = false;
                }
            }
        }
    }

    handleTouchEnd(touch) {
        for (const btn of this.buttons) {
            if (btn.touchId !== null && touch.identifier === btn.touchId) {
                btn.touchId = null;
                btn.pressed = false;
                break;
            }
        }
    }

    setCooldown(index, percent) {
        if (index >= 1 && index <= 3 && this.buttons[index]) {
            this.buttons[index].cooldownPercent = Math.max(0, Math.min(1, percent));
        }
    }

    isAttackPressed() {
        return this.buttons[0].pressedThisFrame;
    }

    isAbilityPressed(index) {
        if (index >= 1 && index <= 3) {
            return this.buttons[index].pressedThisFrame;
        }
        return false;
    }

    isPausePressed() {
        if (!this.pauseConsumed && this.buttons[4].pressedThisFrame) {
            this.pauseConsumed = true;
            return true;
        }
        return false;
    }

    endFrame() {
        for (const btn of this.buttons) {
            btn.pressedThisFrame = false;
        }
        this.pauseConsumed = false;
    }

    render(ctx) {
        ctx.save();

        for (let i = 0; i < this.buttons.length; i++) {
            const btn = this.buttons[i];

            // Draw button circle
            ctx.beginPath();
            ctx.arc(btn.x, btn.y, btn.radius, 0, Math.PI * 2);

            // Fill with semi-transparent color
            if (btn.pressed) {
                ctx.fillStyle = this._lightenColor(btn.color, 0.6);
            } else {
                ctx.fillStyle = this._lightenColor(btn.color, 0.3);
            }
            ctx.fill();

            // Border
            ctx.strokeStyle = btn.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Cooldown sweep overlay for ability buttons (indices 1-3)
            if (i >= 1 && i <= 3 && btn.cooldownPercent > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(btn.x, btn.y, btn.radius, 0, Math.PI * 2);
                ctx.clip();

                // Draw sweep from top going clockwise
                const startAngle = -Math.PI / 2;
                const endAngle = startAngle + (Math.PI * 2 * btn.cooldownPercent);

                ctx.beginPath();
                ctx.moveTo(btn.x, btn.y);
                ctx.arc(btn.x, btn.y, btn.radius, startAngle, endAngle);
                ctx.closePath();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fill();

                // Cooldown percentage text
                const cdText = Math.ceil(btn.cooldownPercent * 100) + '%';
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(cdText, btn.x, btn.y);

                ctx.restore();
                continue; // Skip normal label drawing for cooldown buttons
            }

            // Draw label/icon
            ctx.fillStyle = '#ffffff';
            ctx.font = i === 4
                ? 'bold 18px monospace'
                : 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.icon, btn.x, btn.y);
        }

        ctx.restore();
    }

    _lightenColor(hexColor, alpha) {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
