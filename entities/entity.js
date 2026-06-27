// entity.js - Abandoned Ward
// Base Entity class for all game objects that occupy space and can take damage.

/**
 * Base Entity class.
 *
 * Provides position, velocity, dimensions, health, facing direction,
 * and a simple hitbox / draw contract that every game object shares.
 *
 * Subclass this for Player, Enemy, Boss, Projectile, pickups, etc.
 */
export class Entity {
    /**
     * @param {number} x  - World-space x position (top-left corner).
     * @param {number} y  - World-space y position (top-left corner).
     * @param {number} w  - Width in pixels.
     * @param {number} h  - Height in pixels.
     */
    constructor(x, y, w, h) {
        // Position (top-left)
        this.x = x;
        this.y = y;

        // Velocity (pixels / second)
        this.vx = 0;
        this.vy = 0;

        // Dimensions
        this.width = w;
        this.height = h;

        // Health
        this.hp = 1;
        this.maxHp = 1;

        // State
        this.alive = true;
        this.facing = 1;        // 1 = right, -1 = left
        this.grounded = false;
        this.type = 'entity';
    }

    /**
     * Per-frame update. Override in subclasses.
     * @param {number} dt - Delta time in seconds.
     */
    update(dt) {
        // Apply velocity
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Gravity placeholder – override per game needs.
        if (!this.grounded) {
            this.vy += 800 * dt; // Default gravity pull (px/s^2)
        }
    }

    /**
     * Returns the axis-aligned bounding box used for collision detection.
     * @returns {{ x: number, y: number, w: number, h: number }}
     */
    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            w: this.width,
            h: this.height
        };
    }

    /**
     * Deal raw damage to this entity (no defense reduction).
     * @param {number} amount - Raw damage amount.
     * @param {*}      source - The entity or object dealing damage (for logging/tracking).
     */
    takeDamage(amount, source) {
        if (!this.alive) return;

        this.hp -= amount;

        if (this.hp <= 0) {
            this.hp = 0;
            this.kill();
        }
    }

    /**
     * Deal damage to this entity with a defense percentage reduction.
     * @param {number} amount          - Raw damage amount before defense.
     * @param {number} defensePercent  - Fraction of damage to negate (0 – 1).
     *                                    e.g. 0.1 means 10% of damage is blocked.
     */
    takeDamageWithDefense(amount, defensePercent) {
        const reduced = amount * (1 - Math.min(defensePercent, 1));
        this.takeDamage(reduced);
    }

    /**
     * Restore HP to this entity. Does not exceed maxHp.
     * @param {number} amount - HP to restore.
     */
    heal(amount) {
        if (!this.alive) return;
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }

    /**
     * Mark this entity as dead.
     */
    kill() {
        this.alive = false;
        this.vx = 0;
        this.vy = 0;
    }

    /**
     * Draw this entity onto the canvas.
     * Default implementation draws a red rectangle as a placeholder.
     *
     * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context.
     * @param {{ x: number, y: number }} cam - Camera offset { x, y } in world space.
     */
    draw(ctx, cam) {
        if (!this.alive) return;

        const drawX = this.x - cam.x;
        const drawY = this.y - cam.y;

        ctx.fillStyle = '#FF0000';
        ctx.fillRect(drawX, drawY, this.width, this.height);
    }

    /**
     * @returns {number} The horizontal center of this entity in world space.
     */
    getCenterX() {
        return this.x + this.width * 0.5;
    }

    /**
     * @returns {number} The vertical center of this entity in world space.
     */
    getCenterY() {
        return this.y + this.height * 0.5;
    }
}
