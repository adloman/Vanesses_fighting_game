// ============================================================================
// core/camera.js - Camera with Follow, Shake, and World-Screen Conversion
// ============================================================================

import { GAME_WIDTH, GAME_HEIGHT } from '../game.config.js';
import { lerp, clamp } from '../utils/math.js';

export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = GAME_WIDTH;
        this.height = GAME_HEIGHT;

        // Follow target
        this._target = null;
        this._followSpeed = 5.0; // lerp factor

        // Shake
        this._shakeIntensity = 0;
        this._shakeDuration = 0;
        this._shakeTimer = 0;
        this._shakeOffsetX = 0;
        this._shakeOffsetY = 0;

        // Bounds
        this._boundsMinX = -Infinity;
        this._boundsMaxX = Infinity;
        this._boundsMinY = -Infinity;
        this._boundsMaxY = Infinity;
    }

    /**
     * Set the target entity to follow. Target must have x, y properties.
     * @param {Object} target - Entity with x, y properties.
     */
    follow(target) {
        this._target = target;
    }

    /**
     * Set how aggressively the camera follows (higher = snappier).
     * @param {number} speed - Lerp speed factor.
     */
    setFollowSpeed(speed) {
        this._followSpeed = speed;
    }

    /**
     * Trigger a screen shake effect.
     * @param {number} intensity - Maximum pixel displacement.
     * @param {number} duration - Duration in seconds.
     */
    shake(intensity, duration) {
        this._shakeIntensity = intensity;
        this._shakeDuration = duration;
        this._shakeTimer = duration;
    }

    /**
     * Set camera bounds to clamp its position.
     * @param {number} minX
     * @param {number} maxX
     * @param {number} minY
     * @param {number} maxY
     */
    setBounds(minX, maxX, minY, maxY) {
        this._boundsMinX = minX;
        this._boundsMaxX = maxX;
        this._boundsMinY = minY;
        this._boundsMaxY = maxY;
    }

    /**
     * Update camera position. Follows target and processes shake.
     * @param {number} dt - Delta time in seconds.
     */
    update(dt) {
        // Follow target
        if (this._target) {
            const targetX = this._target.x - this.width / 2;
            const targetY = this._target.y - this.height / 2;

            const lerpFactor = 1 - Math.exp(-this._followSpeed * dt);
            this.x = lerp(this.x, targetX, lerpFactor);
            this.y = lerp(this.y, targetY, lerpFactor);
        }

        // Apply bounds
        this.x = clamp(this._boundsMinX, this.x, this._boundsMaxX);
        this.y = clamp(this._boundsMinY, this.y, this._boundsMaxY);

        // Update shake
        if (this._shakeTimer > 0) {
            this._shakeTimer -= dt;
            if (this._shakeTimer <= 0) {
                this._shakeTimer = 0;
                this._shakeOffsetX = 0;
                this._shakeOffsetY = 0;
            } else {
                // Shake intensity fades out over duration
                const progress = this._shakeTimer / this._shakeDuration;
                const currentIntensity = this._shakeIntensity * progress;
                this._shakeOffsetX = (Math.random() * 2 - 1) * currentIntensity;
                this._shakeOffsetY = (Math.random() * 2 - 1) * currentIntensity;
            }
        } else {
            this._shakeOffsetX = 0;
            this._shakeOffsetY = 0;
        }
    }

    /**
     * Get the horizontal camera offset (includes shake).
     * @returns {number}
     */
    getOffsetX() {
        return this.x + this._shakeOffsetX;
    }

    /**
     * Get the vertical camera offset (includes shake).
     * @returns {number}
     */
    getOffsetY() {
        return this.y + this._shakeOffsetY;
    }

    /**
     * Convert world coordinates to screen coordinates.
     * @param {number} wx - World X.
     * @param {number} wy - World Y.
     * @returns {{x: number, y: number}}
     */
    worldToScreen(wx, wy) {
        return {
            x: wx - this.getOffsetX(),
            y: wy - this.getOffsetY(),
        };
    }

    /**
     * Convert screen coordinates to world coordinates.
     * @param {number} sx - Screen X.
     * @param {number} sy - Screen Y.
     * @returns {{x: number, y: number}}
     */
    screenToWorld(sx, sy) {
        return {
            x: sx + this.getOffsetX(),
            y: sy + this.getOffsetY(),
        };
    }

    /**
     * Check if a world-space rectangle is visible on screen.
     * @param {number} wx - World X of the rect.
     * @param {number} wy - World Y of the rect.
     * @param {number} ww - Width of the rect.
     * @param {number} wh - Height of the rect.
     * @returns {boolean}
     */
    isVisible(wx, wy, ww, wh) {
        const ox = this.getOffsetX();
        const oy = this.getOffsetY();
        return (
            wx + ww > ox &&
            wx < ox + this.width &&
            wy + wh > oy &&
            wy < oy + this.height
        );
    }

    /**
     * Stop following any target.
     */
    unfollow() {
        this._target = null;
    }

    /**
     * Immediately snap camera to a world position.
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y) {
        this.x = x - this.width / 2;
        this.y = y - this.height / 2;
    }
}
