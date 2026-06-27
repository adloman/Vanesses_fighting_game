// ============================================================================
// core/inputManager.js - Unified Keyboard + Touch Input Manager
// ============================================================================

import { GAME_WIDTH, GAME_HEIGHT, TOUCH_CONTROLS } from '../game.config.js';

export class InputManager {
    /**
     * @param {HTMLCanvasElement} canvas - The game canvas element.
     */
    constructor(canvas) {
        this.canvas = canvas;

        // Keyboard state
        this._keysDown = {};
        this._keysJustPressed = {};

        // Touch state
        this._touches = {};       // active touches by identifier
        this._touchPoints = [];   // normalized touch positions for polling

        // Pause consume flag
        this._pauseConsumed = false;

        // Virtual button state (set by touch processing)
        this._virtualAttack = false;
        this._virtualAbility1 = false;
        this._virtualAbility2 = false;
        this._virtualAbility3 = false;
        this._virtualPause = false;

        // Joystick
        this._joystickActive = false;
        this._joystickDx = 0;
        this._joystickDy = 0;

        // Scale factors (set on resize)
        this._scaleX = 1;
        this._scaleY = 1;

        // Bind keyboard events
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);

        // Bind touch events
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
        this._onTouchCancel = this._onTouchCancel.bind(this);

        canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
        canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
        canvas.addEventListener('touchcancel', this._onTouchCancel, { passive: false });

        // Prevent context menu on canvas
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Update the scale factors based on current canvas display size.
     * @param {number} scaleX
     * @param {number} scaleY
     */
    updateScale(scaleX, scaleY) {
        this._scaleX = scaleX;
        this._scaleY = scaleY;
    }

    // =========================================================================
    // Keyboard
    // =========================================================================

    _onKeyDown(e) {
        if (!this._keysDown[e.code]) {
            this._keysJustPressed[e.code] = true;
        }
        this._keysDown[e.code] = true;

        // Prevent default for game keys
        const gameKeys = [
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'KeyW', 'KeyA', 'KeyS', 'KeyD',
            'KeyJ', 'KeyK', 'KeyL', 'KeyI',
            'Enter', 'Escape', 'Space',
        ];
        if (gameKeys.includes(e.code)) {
            e.preventDefault();
        }
    }

    _onKeyUp(e) {
        this._keysDown[e.code] = false;
    }

    /**
     * Check if a key is currently held down.
     * @param {string} code - KeyboardEvent.code (e.g., 'KeyA', 'ArrowLeft').
     * @returns {boolean}
     */
    isKeyDown(code) {
        return !!this._keysDown[code];
    }

    /**
     * Check if a key was just pressed this frame.
     * @param {string} code
     * @returns {boolean}
     */
    isKeyJustPressed(code) {
        return !!this._keysJustPressed[code];
    }

    // =========================================================================
    // Touch
    // =========================================================================

    _onTouchStart(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            this._touches[touch.identifier] = touch;
        }
        this._processTouches();
    }

    _onTouchMove(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            if (this._touches[touch.identifier] !== undefined) {
                this._touches[touch.identifier] = touch;
            }
        }
        this._processTouches();
    }

    _onTouchEnd(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            delete this._touches[touch.identifier];
        }
        this._processTouches();
    }

    _onTouchCancel(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            delete this._touches[touch.identifier];
        }
        this._processTouches();
    }

    /**
     * Convert a touch's clientX/clientY to game coordinates.
     * @param {Touch} touch
     * @returns {{x: number, y: number}}
     */
    _touchToGameCoords(touch) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left) * (GAME_WIDTH / rect.width);
        const y = (touch.clientY - rect.top) * (GAME_HEIGHT / rect.height);
        return { x, y };
    }

    /**
     * Check if a point is within a circular button area.
     * @param {number} px
     * @param {number} py
     * @param {number} bx
     * @param {number} by
     * @param {number} br
     * @returns {boolean}
     */
    _inButton(px, py, bx, by, br) {
        const dx = px - bx;
        const dy = py - by;
        return (dx * dx + dy * dy) <= (br * br);
    }

    /**
     * Process all active touches and set virtual button states.
     * @private
     */
    _processTouches() {
        this._virtualAttack = false;
        this._virtualAbility1 = false;
        this._virtualAbility2 = false;
        this._virtualAbility3 = false;
        this._virtualPause = false;
        this._joystickActive = false;
        this._joystickDx = 0;
        this._joystickDy = 0;

        const touchIds = Object.keys(this._touches);

        for (const id of touchIds) {
            const touch = this._touches[id];
            const pos = this._touchToGameCoords(touch);

            // Check pause button
            if (this._inButton(pos.x, pos.y, TOUCH_CONTROLS.PAUSE_BTN_X,
                TOUCH_CONTROLS.PAUSE_BTN_Y, TOUCH_CONTROLS.PAUSE_BTN_RADIUS)) {
                this._virtualPause = true;
                continue;
            }

            // Check attack button
            if (this._inButton(pos.x, pos.y, TOUCH_CONTROLS.ATTACK_BTN_X,
                TOUCH_CONTROLS.ATTACK_BTN_Y, TOUCH_CONTROLS.ATTACK_BTN_RADIUS)) {
                this._virtualAttack = true;
                continue;
            }

            // Check ability buttons
            if (this._inButton(pos.x, pos.y, TOUCH_CONTROLS.ABILITY1_BTN_X,
                TOUCH_CONTROLS.ABILITY1_BTN_Y, TOUCH_CONTROLS.ABILITY1_BTN_RADIUS)) {
                this._virtualAbility1 = true;
                continue;
            }

            if (this._inButton(pos.x, pos.y, TOUCH_CONTROLS.ABILITY2_BTN_X,
                TOUCH_CONTROLS.ABILITY2_BTN_Y, TOUCH_CONTROLS.ABILITY2_BTN_RADIUS)) {
                this._virtualAbility2 = true;
                continue;
            }

            if (this._inButton(pos.x, pos.y, TOUCH_CONTROLS.ABILITY3_BTN_X,
                TOUCH_CONTROLS.ABILITY3_BTN_Y, TOUCH_CONTROLS.ABILITY3_BTN_RADIUS)) {
                this._virtualAbility3 = true;
                continue;
            }

            // Check joystick area (lower-left quadrant)
            if (pos.x < GAME_WIDTH / 2 && pos.y > GAME_HEIGHT / 2) {
                this._joystickActive = true;
                const dx = pos.x - TOUCH_CONTROLS.JOYSTICK_CENTER_X;
                const dy = pos.y - TOUCH_CONTROLS.JOYSTICK_CENTER_Y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 0) {
                    const clampedDist = Math.min(dist, TOUCH_CONTROLS.JOYSTICK_RADIUS);
                    this._joystickDx = (dx / dist) * (clampedDist / TOUCH_CONTROLS.JOYSTICK_RADIUS);
                    this._joystickDy = (dy / dist) * (clampedDist / TOUCH_CONTROLS.JOYSTICK_RADIUS);
                }
            }
        }
    }

    // =========================================================================
    // Unified API
    // =========================================================================

    /**
     * Get movement direction from keyboard or touch joystick.
     * Returns normalized {dx, dy} where each is in [-1, 1].
     * @returns {{dx: number, dy: number}}
     */
    getDirection() {
        let dx = 0;
        let dy = 0;

        // Keyboard input
        if (this._keysDown['ArrowLeft'] || this._keysDown['KeyA']) dx -= 1;
        if (this._keysDown['ArrowRight'] || this._keysDown['KeyD']) dx += 1;
        if (this._keysDown['ArrowUp'] || this._keysDown['KeyW']) dy -= 1;
        if (this._keysDown['ArrowDown'] || this._keysDown['KeyS']) dy += 1;

        // Touch joystick overrides if active
        if (this._joystickActive) {
            dx = this._joystickDx;
            dy = this._joystickDy;
        }

        // Normalize diagonal movement for keyboard
        if (!this._joystickActive) {
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 1) {
                dx /= len;
                dy /= len;
            }
        }

        return { dx, dy };
    }

    /**
     * Check if attack is requested (keyboard J or touch attack button).
     * @returns {boolean}
     */
    isAttacking() {
        return this._keysDown['KeyJ'] || this._virtualAttack;
    }

    /**
     * Check if attack was just pressed this frame.
     * @returns {boolean}
     */
    isAttackJustPressed() {
        return this._keysJustPressed['KeyJ'];
    }

    /**
     * Check if ability 1 is requested (keyboard K or touch button).
     * @returns {boolean}
     */
    isAbility1() {
        return this._keysDown['KeyK'] || this._virtualAbility1;
    }

    /**
     * Check if ability 1 was just pressed this frame.
     * @returns {boolean}
     */
    isAbility1JustPressed() {
        return this._keysJustPressed['KeyK'];
    }

    /**
     * Check if ability 2 is requested (keyboard L or touch button).
     * @returns {boolean}
     */
    isAbility2() {
        return this._keysDown['KeyL'] || this._virtualAbility2;
    }

    /**
     * Check if ability 2 was just pressed this frame.
     * @returns {boolean}
     */
    isAbility2JustPressed() {
        return this._keysJustPressed['KeyL'];
    }

    /**
     * Check if ability 3 is requested (keyboard I or touch button).
     * @returns {boolean}
     */
    isAbility3() {
        return this._keysDown['KeyI'] || this._virtualAbility3;
    }

    /**
     * Check if ability 3 was just pressed this frame.
     * @returns {boolean}
     */
    isAbility3JustPressed() {
        return this._keysJustPressed['KeyI'];
    }

    /**
     * Check if pause was requested (Enter, Escape, or touch pause button).
     * This consumes the pause press so it only fires once.
     * @returns {boolean}
     */
    isPausePressed() {
        if (this._pauseConsumed) return false;

        const pauseRequested =
            this._keysJustPressed['Enter'] ||
            this._keysJustPressed['Escape'] ||
            this._virtualPause;

        if (pauseRequested) {
            this._pauseConsumed = true;
            return true;
        }
        return false;
    }

    /**
     * Call this at the end of each frame to clear "just pressed" states.
     */
    endFrame() {
        this._keysJustPressed = {};
        this._pauseConsumed = false;
    }

    /**
     * Get joystick info for rendering the touch joystick overlay.
     * @returns {{active: boolean, knobX: number, knobY: number, baseX: number, baseY: number, radius: number}}
     */
    getJoystickInfo() {
        return {
            active: this._joystickActive,
            knobX: TOUCH_CONTROLS.JOYSTICK_CENTER_X + this._joystickDx * TOUCH_CONTROLS.JOYSTICK_RADIUS,
            knobY: TOUCH_CONTROLS.JOYSTICK_CENTER_Y + this._joystickDy * TOUCH_CONTROLS.JOYSTICK_RADIUS,
            baseX: TOUCH_CONTROLS.JOYSTICK_CENTER_X,
            baseY: TOUCH_CONTROLS.JOYSTICK_CENTER_Y,
            radius: TOUCH_CONTROLS.JOYSTICK_RADIUS,
        };
    }

    /**
     * Get active touch count.
     * @returns {number}
     */
    getTouchCount() {
        return Object.keys(this._touches).length;
    }

    /**
     * Check if any touch input is active.
     * @returns {boolean}
     */
    isTouchActive() {
        return Object.keys(this._touches).length > 0;
    }

    /**
     * Clean up event listeners. Call when shutting down.
     */
    destroy() {
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        this.canvas.removeEventListener('touchstart', this._onTouchStart);
        this.canvas.removeEventListener('touchmove', this._onTouchMove);
        this.canvas.removeEventListener('touchend', this._onTouchEnd);
        this.canvas.removeEventListener('touchcancel', this._onTouchCancel);
    }
}
