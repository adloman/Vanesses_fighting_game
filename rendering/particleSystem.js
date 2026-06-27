/**
 * Particle system with object pooling for Abandoned Ward.
 * Handles particle creation, update, rendering, and recycling.
 */
import { Pool } from '../utils/pool.js';
import { randomRange, randomInt, randomSign, clamp } from '../utils/math.js';

/* ============================================================
   Particle class
   ============================================================ */

class Particle {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 1;
    this.size = 4;
    this.startSize = 4;
    this.endSize = 0;
    this.color = '#ffffff';
    this.alpha = 1;
    this.gravity = 0;
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.shrink = true;
    this.fadeOut = true;
    this.shape = 'circle'; // 'circle' or 'rectangle'
  }

  init(config) {
    this.active = true;
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.vx = config.vx || 0;
    this.vy = config.vy || 0;
    this.life = config.life || 1;
    this.maxLife = this.life;
    this.size = config.size || 4;
    this.startSize = config.startSize !== undefined ? config.startSize : this.size;
    this.endSize = config.endSize !== undefined ? config.endSize : 0;
    this.color = config.color || '#ffffff';
    this.alpha = config.alpha !== undefined ? config.alpha : 1;
    this.gravity = config.gravity || 0;
    this.rotation = config.rotation || 0;
    this.rotationSpeed = config.rotationSpeed || 0;
    this.shrink = config.shrink !== undefined ? config.shrink : true;
    this.fadeOut = config.fadeOut !== undefined ? config.fadeOut : true;
    this.shape = config.shape || 'circle';
  }

  update(dt) {
    if (!this.active) return;

    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      return;
    }

    // Apply gravity
    this.vy += this.gravity * dt;

    // Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Update rotation
    this.rotation += this.rotationSpeed * dt;

    // Update size
    if (this.shrink) {
      const t = 1 - this.life / this.maxLife;
      this.size = this.startSize + (this.endSize - this.startSize) * t;
    }

    // Update alpha
    if (this.fadeOut) {
      const t = this.life / this.maxLife;
      this.alpha = t;
    }
  }

  reset() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 1;
    this.size = 4;
    this.startSize = 4;
    this.endSize = 0;
    this.color = '#ffffff';
    this.alpha = 1;
    this.gravity = 0;
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.shrink = true;
    this.fadeOut = true;
    this.shape = 'circle';
  }
}

/* ============================================================
   ParticleEmitter class
   ============================================================ */

class ParticleEmitter {
  constructor(config) {
    this.presetName = config.presetName || 'default';
    this.config = config;
  }

  /**
   * Emit particles from this emitter configuration.
   * @param {number} x - world x position
   * @param {number} y - world y position
   * @param {number} count - number of particles to emit
   * @param {object} overrides - optional overrides for particle config
   * @returns {Array<object>} array of particle init configs
   */
  emit(x, y, count, overrides = {}) {
    const configs = [];
    const cfg = this.config;

    for (let i = 0; i < count; i++) {
      const pConfig = {
        x: x + (cfg.spreadX ? randomRange(-cfg.spreadX, cfg.spreadX) : 0),
        y: y + (cfg.spreadY ? randomRange(-cfg.spreadY, cfg.spreadY) : 0),
        vx: typeof cfg.minVx === 'number' ? randomRange(cfg.minVx, cfg.maxVx) :
            cfg.vx !== undefined ? cfg.vx + randomRange(-cfg.vxVariation || 0, cfg.vxVariation || 0) : 0,
        vy: typeof cfg.minVy === 'number' ? randomRange(cfg.minVy, cfg.maxVy) :
            cfg.vy !== undefined ? cfg.vy + randomRange(-cfg.vyVariation || 0, cfg.vyVariation || 0) : 0,
        life: cfg.life !== undefined ? cfg.life + randomRange(-(cfg.lifeVariation || 0), cfg.lifeVariation || 0) : 1,
        size: cfg.size !== undefined ? randomRange(cfg.minSize || cfg.size * 0.8, cfg.maxSize || cfg.size * 1.2) : 4,
        startSize: cfg.startSize || cfg.size || 4,
        endSize: cfg.endSize !== undefined ? cfg.endSize : 0,
        color: cfg.colors ? cfg.colors[randomInt(0, cfg.colors.length - 1)] : cfg.color || '#ffffff',
        alpha: cfg.alpha || 1,
        gravity: cfg.gravity || 0,
        rotation: cfg.rotation || 0,
        rotationSpeed: cfg.rotationSpeed ? randomRange(-cfg.rotationSpeed, cfg.rotationSpeed) : 0,
        shrink: cfg.shrink !== undefined ? cfg.shrink : true,
        fadeOut: cfg.fadeOut !== undefined ? cfg.fadeOut : true,
        shape: cfg.shape || 'circle'
      };

      // Apply overrides
      if (overrides) {
        for (const key in overrides) {
          if (overrides.hasOwnProperty(key)) {
            pConfig[key] = overrides[key];
          }
        }
      }

      configs.push(pConfig);
    }

    return configs;
  }
}

/* ============================================================
   ParticleSystem class
   ============================================================ */

export class ParticleSystem {
  constructor(maxParticles = 300) {
    this.maxParticles = maxParticles;
    this.pool = new Pool(
      () => new Particle(),
      (p) => p.reset(),
      maxParticles
    );
    this.emitters = {};
    this.presets = {};
    this._activeParticles = [];
  }

  /**
   * Register a named particle preset.
   * @param {string} name
   * @param {object} config - particle configuration template
   */
  registerPreset(name, config) {
    this.presets[name] = config;
    this.emitters[name] = new ParticleEmitter({ presetName: name, ...config });
  }

  /**
   * Emit particles using a registered preset.
   * @param {string} name - preset name
   * @param {number} x - world x
   * @param {number} y - world y
   * @param {number} count - number of particles
   */
  emit(name, x, y, count) {
    const emitter = this.emitters[name];
    if (!emitter) {
      console.warn(`Particle preset "${name}" not registered`);
      return;
    }

    const configs = emitter.emit(x, y, count);
    for (const cfg of configs) {
      this._spawnParticle(cfg);
    }
  }

  /**
   * Emit particles with a custom configuration (no preset needed).
   * @param {number} x
   * @param {number} y
   * @param {number} count
   * @param {object} config
   */
  emitCustom(x, y, count, config) {
    for (let i = 0; i < count; i++) {
      const pConfig = {
        x: x + (config.spreadX ? randomRange(-config.spreadX, config.spreadX) : 0),
        y: y + (config.spreadY ? randomRange(-config.spreadY, config.spreadY) : 0),
        vx: typeof config.minVx === 'number' ? randomRange(config.minVx, config.maxVx) : 0,
        vy: typeof config.minVy === 'number' ? randomRange(config.minVy, config.maxVy) : 0,
        life: config.life || 1,
        size: config.size || 4,
        startSize: config.startSize || config.size || 4,
        endSize: config.endSize !== undefined ? config.endSize : 0,
        color: config.colors ? config.colors[randomInt(0, config.colors.length - 1)] : config.color || '#ffffff',
        alpha: config.alpha !== undefined ? config.alpha : 1,
        gravity: config.gravity || 0,
        rotation: config.rotation || 0,
        rotationSpeed: config.rotationSpeed || 0,
        shrink: config.shrink !== undefined ? config.shrink : true,
        fadeOut: config.fadeOut !== undefined ? config.fadeOut : true,
        shape: config.shape || 'circle'
      };
      this._spawnParticle(pConfig);
    }
  }

  /**
   * Spawn a single particle from a config.
   */
  _spawnParticle(config) {
    // Reuse from pool if available, check active count
    if (this.pool.activeCount >= this.maxParticles) {
      // Remove oldest particle
      const oldest = this.pool.getActive()[0];
      if (oldest) {
        oldest.active = false;
        this.pool.release(oldest);
      }
    }

    const particle = this.pool.acquire();
    particle.init(config);
  }

  /**
   * Update all active particles.
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    const active = this.pool.getActive();
    for (let i = active.length - 1; i >= 0; i--) {
      active[i].update(dt);
      if (!active[i].active) {
        this.pool.release(active[i]);
      }
    }
  }

  /**
   * Render all active particles.
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} camera - {x, y} camera position
   */
  render(ctx, camera) {
    const active = this.pool.getActive();
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < active.length; i++) {
      const p = active[i];
      if (!p.active) continue;

      const screenX = p.x - camX;
      const screenY = p.y - camY;

      // Culling
      if (screenX < -50 || screenX > canvasWidth + 50 ||
          screenY < -50 || screenY > canvasHeight + 50) {
        continue;
      }

      const size = Math.max(0.5, p.size);
      const alpha = clamp(p.alpha, 0, 1);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(screenX, screenY);
      ctx.rotate(p.rotation);

      ctx.fillStyle = p.color;

      if (p.shape === 'rectangle') {
        ctx.fillRect(-size / 2, -size / 2, size, size);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  /**
   * Clear all particles.
   */
  clear() {
    this.pool.releaseAll();
  }

  /**
   * Get the number of currently active particles.
   * @returns {number}
   */
  get activeCount() {
    return this.pool.activeCount;
  }

  /**
   * Register all built-in presets.
   */
  registerDefaults() {
    // blood_splatter: red, high speed random, 0.3s life, gravity, size 3-6
    this.registerPreset('blood_splatter', {
      minVx: -200,
      maxVx: 200,
      minVy: -250,
      maxVy: -50,
      life: 0.3,
      lifeVariation: 0.15,
      minSize: 3,
      maxSize: 6,
      size: 4,
      gravity: 500,
      colors: ['#cc0000', '#aa0000', '#ee2222', '#880000', '#dd1111'],
      fadeOut: true,
      shrink: true,
      endSize: 0,
      spreadX: 10,
      spreadY: 10
    });

    // fire_trail: orange->yellow, low speed, upward drift, 0.5s, size 4-8
    this.registerPreset('fire_trail', {
      minVx: -30,
      maxVx: 30,
      minVy: -80,
      maxVy: -30,
      life: 0.5,
      lifeVariation: 0.2,
      minSize: 4,
      maxSize: 8,
      size: 6,
      gravity: -60,
      colors: ['#ff6600', '#ff8800', '#ffaa00', '#ffcc00', '#ffee00'],
      fadeOut: true,
      shrink: true,
      endSize: 1,
      spreadX: 8,
      spreadY: 5
    });

    // spark: white/yellow, high speed random angles, 0.2s, tiny size 2-3
    this.registerPreset('spark', {
      minVx: -300,
      maxVx: 300,
      minVy: -300,
      maxVy: 100,
      life: 0.2,
      lifeVariation: 0.1,
      minSize: 2,
      maxSize: 3,
      size: 2.5,
      gravity: 400,
      colors: ['#ffffff', '#ffffaa', '#ffff66', '#ffffcc', '#ffeeaa'],
      fadeOut: true,
      shrink: true,
      endSize: 0,
      spreadX: 5,
      spreadY: 5
    });

    // smoke: grey, slow, expand, 1.0s, size 8-20
    this.registerPreset('smoke', {
      minVx: -15,
      maxVx: 15,
      minVy: -40,
      maxVy: -10,
      life: 1.0,
      lifeVariation: 0.4,
      minSize: 8,
      maxSize: 20,
      size: 14,
      startSize: 6,
      endSize: 22,
      gravity: -20,
      colors: ['#666666', '#777777', '#555555', '#888888', '#5a5a5a'],
      fadeOut: true,
      shrink: false,
      spreadX: 10,
      spreadY: 5
    });

    // holy_glow: gold, orbit pattern, 0.8s, size 4-6
    this.registerPreset('holy_glow', {
      minVx: -100,
      maxVx: 100,
      minVy: -100,
      maxVy: -40,
      life: 0.8,
      lifeVariation: 0.2,
      minSize: 4,
      maxSize: 6,
      size: 5,
      gravity: -30,
      colors: ['#ffdd44', '#ffcc00', '#ffaa22', '#ffe066', '#fff088'],
      fadeOut: true,
      shrink: true,
      endSize: 1,
      spreadX: 15,
      spreadY: 15
    });

    // acid_splash: green, splat, 0.4s, size 3-5
    this.registerPreset('acid_splash', {
      minVx: -150,
      maxVx: 150,
      minVy: -200,
      maxVy: -50,
      life: 0.4,
      lifeVariation: 0.15,
      minSize: 3,
      maxSize: 5,
      size: 4,
      gravity: 600,
      colors: ['#44ff44', '#66ff22', '#88ff00', '#33ee33', '#55ff11'],
      fadeOut: true,
      shrink: true,
      endSize: 0,
      spreadX: 8,
      spreadY: 8
    });

    // dust: brown, settle down, 0.6s, size 3-8
    this.registerPreset('dust', {
      minVx: -60,
      maxVx: 60,
      minVy: -80,
      maxVy: -20,
      life: 0.6,
      lifeVariation: 0.2,
      minSize: 3,
      maxSize: 8,
      size: 5,
      gravity: 150,
      colors: ['#aa8855', '#997744', '#bb9966', '#886633', '#ccaa77'],
      fadeOut: true,
      shrink: true,
      endSize: 0,
      spreadX: 12,
      spreadY: 8
    });

    // debris: grey rectangles, gravity, tumble, 0.5s, size 4-10
    this.registerPreset('debris', {
      minVx: -180,
      maxVx: 180,
      minVy: -250,
      maxVy: -80,
      life: 0.5,
      lifeVariation: 0.2,
      minSize: 4,
      maxSize: 10,
      size: 7,
      gravity: 500,
      rotationSpeed: 10,
      shape: 'rectangle',
      colors: ['#777777', '#888888', '#666666', '#999999', '#555555'],
      fadeOut: true,
      shrink: true,
      endSize: 0,
      spreadX: 10,
      spreadY: 10
    });

    // muzzle_flash: white/yellow, instant, 0.15s, size 10-20
    this.registerPreset('muzzle_flash', {
      minVx: -50,
      maxVx: 50,
      minVy: -50,
      maxVy: 50,
      life: 0.15,
      lifeVariation: 0.05,
      minSize: 10,
      maxSize: 20,
      size: 15,
      gravity: 0,
      colors: ['#ffffff', '#ffffcc', '#ffff88', '#ffff00'],
      fadeOut: true,
      shrink: true,
      endSize: 0,
      spreadX: 5,
      spreadY: 5
    });

    // burn_effect: orange/red, flicker upward, 0.4s, size 3-6
    this.registerPreset('burn_effect', {
      minVx: -25,
      maxVx: 25,
      minVy: -120,
      maxVy: -40,
      life: 0.4,
      lifeVariation: 0.15,
      minSize: 3,
      maxSize: 6,
      size: 4,
      gravity: -80,
      colors: ['#ff4400', '#ff6600', '#ee2200', '#ff8800', '#cc2200'],
      fadeOut: true,
      shrink: true,
      endSize: 1,
      spreadX: 6,
      spreadY: 6
    });
  }
}

export default ParticleSystem;
