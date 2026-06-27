// projectile.js - Abandoned Ward
// Projectile entity class for ranged attacks (player and enemy).

/**
 * Projectile class.
 *
 * Handles movement, lifetime tracking, and type-specific rendering for
 * all projectile types in the game: bullets, arrows, spit blobs,
 * fireballs, and flame particles.
 */
export class Projectile {
    /**
     * Create a new projectile.
     *
     * @param {number} x       - Spawn x position (world space).
     * @param {number} y       - Spawn y position (world space).
     * @param {number} angle   - Movement angle in radians (0 = right, PI/2 = down).
     * @param {number} speed   - Travel speed in pixels per second.
     * @param {number} damage  - Damage dealt on hit.
     * @param {'player'|'enemy'} owner - Who fired this projectile.
     * @param {'bullet'|'arrow'|'spit'|'fireball'|'flame'} type - Visual / gameplay type.
     * @param {object}  [config={}] - Optional overrides:
     *   @param {number} [config.lifetime]    - Max lifetime in seconds (default 3).
     *   @param {number} [config.pierceCount] - How many enemies it can pass through (default 0).
     *   @param {number} [config.width]      - Hitbox width (default 10).
     *   @param {number} [config.height]     - Hitbox height (default 10).
     *   @param {string} [config.color]      - Draw colour (defaults by type).
     */
    constructor(x, y, angle, speed, damage, owner, type, config = {}) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.damage = damage;

        this.owner = owner;       // 'player' or 'enemy'
        this.type = type;        // 'bullet' | 'arrow' | 'spit' | 'fireball' | 'flame'

        // Lifetime
        this.maxLifetime = config.lifetime !== undefined ? config.lifetime : 3;
        this.lifetime = this.maxLifetime;

        // Piercing
        this.piercing = (config.pierceCount || 0) > 0;
        this.pierceCount = config.pierceCount || 0;
        this.hitEnemies = [];    // Track already-hit enemies to avoid double hits

        // Dimensions
        this.width = config.width || 10;
        this.height = config.height || 10;

        // Alive flag
        this.alive = true;

        // Color (fallback based on type)
        this.color = config.color || this._defaultColor();
    }

    /**
     * Returns the default color for a given projectile type.
     * @private
     */
    _defaultColor() {
        switch (this.type) {
            case 'bullet':    return '#FFD700';
            case 'arrow':     return '#8B4513';
            case 'spit':      return '#00FF00';
            case 'fireball':  return '#FF4500';
            case 'flame':     return '#FF6600';
            default:          return '#FFFFFF';
        }
    }

    /**
     * Per-frame update.
     * Moves the projectile, decrements lifetime, and checks whether it
     * should be destroyed.
     *
     * @param {number} dt - Delta time in seconds.
     * @returns {boolean} `true` if still alive, `false` if it should be removed.
     */
    update(dt) {
        if (!this.alive) return false;

        // Move
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Tick lifetime
        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.alive = false;
            return false;
        }

        return true;
    }

    /**
     * Register that this projectile has already hit a given enemy.
     * Used for piercing projectiles so each enemy is only hit once.
     *
     * @param {*} enemy - The enemy entity reference.
     */
    registerHit(enemy) {
        this.hitEnemies.push(enemy);

        if (this.piercing) {
            this.pierceCount--;
            if (this.pierceCount <= 0) {
                this.alive = false;
            }
        } else {
            // Non-piercing projectiles are destroyed on first hit
            this.alive = false;
        }
    }

    /**
     * Check whether this projectile has already hit the given enemy.
     *
     * @param {*} enemy - The enemy entity reference.
     * @returns {boolean}
     */
    hasHit(enemy) {
        return this.hitEnemies.indexOf(enemy) !== -1;
    }

    /**
     * Get the axis-aligned bounding box for collision detection.
     * @returns {{ x: number, y: number, w: number, h: number }}
     */
    getHitbox() {
        return {
            x: this.x - this.width * 0.5,
            y: this.y - this.height * 0.5,
            w: this.width,
            h: this.height
        };
    }

    /**
     * Draw the projectile onto the canvas.
     * Visual style varies by projectile type.
     *
     * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context.
     * @param {{ x: number, y: number }} cam - Camera offset { x, y } in world space.
     */
    draw(ctx, cam) {
        if (!this.alive) return;

        const drawX = this.x - cam.x;
        const drawY = this.y - cam.y;

        ctx.save();

        switch (this.type) {
            // ── Bullet: small glowing circle ───────────────────────────
            case 'bullet': {
                // Outer glow
                ctx.beginPath();
                ctx.arc(drawX, drawY, this.width * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                ctx.fill();

                // Core
                ctx.beginPath();
                ctx.arc(drawX, drawY, this.width * 0.35, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                break;
            }

            // ── Arrow: angled line with tip ────────────────────────────
            case 'arrow': {
                const len = this.height * 1.5;
                const halfW = this.width * 0.3;

                ctx.translate(drawX, drawY);
                ctx.rotate(this.angle);

                // Shaft
                ctx.beginPath();
                ctx.moveTo(-len * 0.5, 0);
                ctx.lineTo(len * 0.5, 0);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.stroke();

                // Arrowhead
                ctx.beginPath();
                ctx.moveTo(len * 0.5, 0);
                ctx.lineTo(len * 0.3, -halfW);
                ctx.lineTo(len * 0.3, halfW);
                ctx.closePath();
                ctx.fillStyle = '#C0C0C0';
                ctx.fill();

                // Fletching
                ctx.beginPath();
                ctx.moveTo(-len * 0.5, 0);
                ctx.lineTo(-len * 0.35, -halfW * 0.7);
                ctx.moveTo(-len * 0.5, 0);
                ctx.lineTo(-len * 0.35, halfW * 0.7);
                ctx.strokeStyle = '#8B0000';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
                break;
            }

            // ── Spit: organic blob ──────────────────────────────────────
            case 'spit': {
                // Glow
                ctx.beginPath();
                ctx.arc(drawX, drawY, this.width * 0.8, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
                ctx.fill();

                // Main blob
                ctx.beginPath();
                ctx.arc(drawX, drawY, this.width * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();

                // Highlight (glossy)
                ctx.beginPath();
                ctx.arc(drawX - this.width * 0.15, drawY - this.width * 0.15,
                    this.width * 0.15, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(200, 255, 200, 0.6)';
                ctx.fill();
                break;
            }

            // ── Fireball: glowing orb with trailing particles ──────────
            case 'fireball': {
                // Outer glow
                const gradient = ctx.createRadialGradient(
                    drawX, drawY, 0,
                    drawX, drawY, this.width * 1.2
                );
                gradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
                gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.3)');
                gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                ctx.beginPath();
                ctx.arc(drawX, drawY, this.width * 1.2, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                // Core
                ctx.beginPath();
                ctx.arc(drawX, drawY, this.width * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();

                // Bright center
                ctx.beginPath();
                ctx.arc(drawX, drawY, this.width * 0.2, 0, Math.PI * 2);
                ctx.fillStyle = '#FFFF00';
                ctx.fill();
                break;
            }

            // ── Flame: small flickering circle ──────────────────────────
            case 'flame': {
                // Flicker size by using sin wave on lifetime
                const flicker = 0.8 + Math.sin(this.lifetime * 20) * 0.2;
                const radius = this.width * 0.4 * flicker;

                // Glow
                ctx.beginPath();
                ctx.arc(drawX, drawY, radius * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 100, 0, 0.25)';
                ctx.fill();

                // Main flame body
                ctx.beginPath();
                ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();

                // Hot center
                ctx.beginPath();
                ctx.arc(drawX, drawY, radius * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = '#FFFF00';
                ctx.fill();
                break;
            }

            // ── Fallback: simple colored circle ────────────────────────
            default: {
                ctx.beginPath();
                ctx.arc(drawX, drawY, this.width * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                break;
            }
        }

        ctx.restore();
    }
}
