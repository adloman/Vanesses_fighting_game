/**
 * Screen effects system for Abandoned Ward.
 * Handles screen shake, flash, fade transitions, and blood vignette.
 */

export class ScreenEffects {
  constructor() {
    // Shake effect
    this._shakeIntensity = 0;
    this._shakeDuration = 0;
    this._shakeTimer = 0;
    this._shakeDecay = true;

    // Flash effect
    this._flashColor = '#ffffff';
    this._flashDuration = 0;
    this._flashTimer = 0;

    // Fade effect
    this._fadeType = 'in'; // 'in' or 'out'
    this._fadeColor = '#000000';
    this._fadeDuration = 1;
    this._fadeTimer = 0;
    this._fadeActive = false;

    // Blood vignette
    this._vignetteIntensity = 0;
    this._vignetteDuration = 0;
    this._vignetteTimer = 0;
    this._vignetteMaxIntensity = 0;

    // Cached shake offset
    this._shakeOffsetX = 0;
    this._shakeOffsetY = 0;
  }

  /**
   * Trigger a screen shake effect.
   * @param {number} intensity - shake magnitude in pixels (0-20 typical)
   * @param {number} duration - shake duration in seconds
   */
  shake(intensity, duration) {
    this._shakeIntensity = intensity;
    this._shakeDuration = duration;
    this._shakeTimer = duration;
    this._shakeDecay = true;
  }

  /**
   * Trigger a screen shake without decay (constant intensity).
   * @param {number} intensity
   * @param {number} duration
   */
  shakeConstant(intensity, duration) {
    this._shakeIntensity = intensity;
    this._shakeDuration = duration;
    this._shakeTimer = duration;
    this._shakeDecay = false;
  }

  /**
   * Trigger a screen flash (e.g., white on hit, red on damage).
   * @param {string} color - CSS color string
   * @param {number} duration - flash duration in seconds
   */
  flash(color, duration) {
    this._flashColor = color;
    this._flashDuration = duration;
    this._flashTimer = duration;
  }

  /**
   * Trigger a fade transition.
   * @param {string} type - 'in' (fade from black) or 'out' (fade to black)
   * @param {number} duration - fade duration in seconds
   * @param {string} color - fade color (default black)
   */
  fade(type, duration, color) {
    this._fadeType = type;
    this._fadeColor = color || '#000000';
    this._fadeDuration = duration;
    this._fadeTimer = 0;
    this._fadeActive = true;
  }

  /**
   * Trigger a red edge vignette (low HP indicator).
   * @param {number} intensity - 0-1 intensity
   * @param {number} duration - duration in seconds (0 = persistent)
   */
  bloodVignette(intensity, duration) {
    this._vignetteMaxIntensity = Math.max(0, Math.min(1, intensity));
    this._vignetteDuration = duration;
    this._vignetteTimer = duration;
    this._vignetteIntensity = intensity;
  }

  /**
   * Update all active effects.
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    // Update shake
    if (this._shakeTimer > 0) {
      this._shakeTimer -= dt;
      if (this._shakeTimer <= 0) {
        this._shakeTimer = 0;
        this._shakeIntensity = 0;
        this._shakeOffsetX = 0;
        this._shakeOffsetY = 0;
      } else if (this._shakeDecay) {
        const progress = 1 - this._shakeTimer / this._shakeDuration;
        const currentIntensity = this._shakeIntensity * (1 - progress);
        this._shakeOffsetX = (Math.random() * 2 - 1) * currentIntensity;
        this._shakeOffsetY = (Math.random() * 2 - 1) * currentIntensity;
      } else {
        this._shakeOffsetX = (Math.random() * 2 - 1) * this._shakeIntensity;
        this._shakeOffsetY = (Math.random() * 2 - 1) * this._shakeIntensity;
      }
    } else {
      this._shakeOffsetX = 0;
      this._shakeOffsetY = 0;
    }

    // Update flash
    if (this._flashTimer > 0) {
      this._flashTimer -= dt;
      if (this._flashTimer < 0) {
        this._flashTimer = 0;
      }
    }

    // Update fade
    if (this._fadeActive) {
      this._fadeTimer += dt;
      if (this._fadeTimer >= this._fadeDuration) {
        this._fadeActive = false;
      }
    }

    // Update vignette
    if (this._vignetteTimer > 0) {
      this._vignetteTimer -= dt;
      if (this._vignetteTimer <= 0) {
        this._vignetteTimer = 0;
        this._vignetteIntensity = 0;
        this._vignetteMaxIntensity = 0;
      } else {
        const progress = this._vignetteTimer / this._vignetteDuration;
        this._vignetteIntensity = this._vignetteMaxIntensity * progress;
      }
    }
  }

  /**
   * Render all active screen effects.
   * Should be called after all other rendering.
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Render flash
    if (this._flashTimer > 0 && this._flashDuration > 0) {
      const alpha = (this._flashTimer / this._flashDuration) * 0.6;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this._flashColor;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // Render fade
    if (this._fadeActive && this._fadeDuration > 0) {
      const progress = this._fadeTimer / this._fadeDuration;
      let alpha;

      if (this._fadeType === 'in') {
        // Fade from color to transparent
        alpha = 1 - Math.min(1, progress * 2);
      } else {
        // Fade from transparent to color
        alpha = Math.min(1, progress * 2);
      }

      if (alpha > 0) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this._fadeColor;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    // Render blood vignette
    if (this._vignetteIntensity > 0.01) {
      this._renderBloodVignette(ctx, w, h);
    }
  }

  /**
   * Render the blood vignette effect.
   * Draws a radial gradient from transparent center to red edges.
   */
  _renderBloodVignette(ctx, w, h) {
    const intensity = this._vignetteIntensity;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);

    const grad = ctx.createRadialGradient(cx, cy, maxR * 0.3, cx, cy, maxR);
    grad.addColorStop(0, `rgba(180,0,0,0)`);
    grad.addColorStop(0.5, `rgba(180,0,0,${intensity * 0.1})`);
    grad.addColorStop(0.75, `rgba(160,0,0,${intensity * 0.3})`);
    grad.addColorStop(0.9, `rgba(140,0,0,${intensity * 0.5})`);
    grad.addColorStop(1, `rgba(120,0,0,${intensity * 0.7})`);

    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Additional edge darkening
    const edgeGrad = ctx.createRadialGradient(cx, cy, maxR * 0.6, cx, cy, maxR);
    edgeGrad.addColorStop(0, `rgba(0,0,0,0)`);
    edgeGrad.addColorStop(1, `rgba(0,0,0,${intensity * 0.3})`);
    ctx.save();
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  /**
   * Get the current shake offset for the camera to apply.
   * @returns {{x: number, y: number}}
   */
  getShakeOffset() {
    return {
      x: this._shakeOffsetX,
      y: this._shakeOffsetY
    };
  }

  /**
   * Check if a fade transition is currently active.
   * @returns {boolean}
   */
  isFading() {
    return this._fadeActive;
  }

  /**
   * Check if any effect is currently active.
   * @returns {boolean}
   */
  hasActiveEffects() {
    return this._shakeTimer > 0 ||
           this._flashTimer > 0 ||
           this._fadeActive ||
           this._vignetteIntensity > 0.01;
  }

  /**
   * Stop all effects immediately.
   */
  clearAll() {
    this._shakeIntensity = 0;
    this._shakeDuration = 0;
    this._shakeTimer = 0;
    this._shakeOffsetX = 0;
    this._shakeOffsetY = 0;
    this._flashTimer = 0;
    this._fadeActive = false;
    this._vignetteIntensity = 0;
    this._vignetteMaxIntensity = 0;
    this._vignetteTimer = 0;
  }
}

export default ScreenEffects;
