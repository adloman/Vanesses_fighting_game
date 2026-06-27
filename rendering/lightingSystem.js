/**
 * Dynamic lighting system for Abandoned Ward.
 * Uses an offscreen canvas to create a light map with radial gradient cutouts.
 */

export class LightingSystem {
  /**
   * @param {number} canvasWidth - game canvas width (1280)
   * @param {number} canvasHeight - game canvas height (720)
   */
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // Offscreen canvas for the light map
    this._lightMap = document.createElement('canvas');
    this._lightMap.width = canvasWidth;
    this._lightMap.height = canvasHeight;
    this._lightCtx = this._lightMap.getContext('2d');

    this.lightSources = [];
    this._nextId = 0;
    this._time = 0;
    this._fogDensity = 0.6;
    this._ambientColor = 'rgba(0,0,10,';
  }

  /**
   * Update the lighting system.
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    this._time += dt;

    // Update flickering light sources
    for (const light of this.lightSources) {
      if (light.flicker) {
        light._currentIntensity = light.intensity *
          (0.7 + 0.3 * Math.sin(this._time * light._flickerSpeed + light._flickerPhase));
        if (Math.random() < 0.02) {
          light._currentIntensity *= 0.3; // Occasional deep flicker
        }
      }
    }
  }

  /**
   * Add a light source to the scene.
   * @param {number} x - world x position
   * @param {number} y - world y position
   * @param {number} radius - light radius in pixels
   * @param {number} intensity - 0-1 brightness
   * @param {string} color - CSS color string (e.g. '#ffffff')
   * @param {boolean} flicker - whether the light flickers
   * @returns {number} light source id
   */
  addLightSource(x, y, radius, intensity, color, flicker) {
    const id = this._nextId++;
    const light = {
      id,
      x,
      y,
      radius: Math.max(10, radius),
      intensity: Math.max(0, Math.min(1, intensity)),
      color: color || '#ffffff',
      flicker: !!flicker,
      _currentIntensity: intensity,
      _flickerSpeed: 3 + Math.random() * 8,
      _flickerPhase: Math.random() * Math.PI * 2
    };
    this.lightSources.push(light);
    return id;
  }

  /**
   * Remove a light source by id.
   * @param {number} id
   */
  removeLightSource(id) {
    const idx = this.lightSources.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.lightSources.splice(idx, 1);
    }
  }

  /**
   * Remove all light sources.
   */
  clearLights() {
    this.lightSources = [];
  }

  /**
   * Set the fog density (0 = no fog, 1 = complete darkness).
   * @param {number} density
   */
  setFogDensity(density) {
    this._fogDensity = Math.max(0, Math.min(1, density));
  }

  /**
   * Render the lighting overlay onto the main canvas.
   * @param {CanvasRenderingContext2D} ctx - main canvas context
   * @param {object} camera - {x, y} camera position
   */
  render(ctx, camera) {
    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;
    const lctx = this._lightCtx;

    // Clear the light map
    lctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Fill with dark overlay based on fog density
    const darkness = Math.floor(this._fogDensity * 220);
    lctx.fillStyle = `rgba(0,0,${Math.floor(darkness * 0.1)},${this._fogDensity})`;
    lctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Additional dark layer for depth
    lctx.fillStyle = `rgba(0,0,5,${this._fogDensity * 0.3})`;
    lctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Cut out light sources using destination-out composite
    lctx.globalCompositeOperation = 'destination-out';

    for (const light of this.lightSources) {
      const screenX = light.x - camX;
      const screenY = light.y - camY;

      // Skip off-screen lights
      if (screenX < -light.radius - 50 || screenX > this.canvasWidth + light.radius + 50 ||
          screenY < -light.radius - 50 || screenY > this.canvasHeight + light.radius + 50) {
        continue;
      }

      const intensity = light._currentIntensity || light.intensity;
      const radius = light.radius;
      const alpha = intensity * this._fogDensity;

      // Parse light color for tinting
      const colorRgb = this._parseColor(light.color);

      // Main light gradient (radial)
      const grad = lctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius);

      // Use white for the destination-out to create pure transparency
      grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
      grad.addColorStop(0.4, `rgba(255,255,255,${alpha * 0.7})`);
      grad.addColorStop(0.7, `rgba(255,255,255,${alpha * 0.3})`);
      grad.addColorStop(1, `rgba(255,255,255,0)`);

      lctx.fillStyle = grad;
      lctx.beginPath();
      lctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
      lctx.fill();

      // If light has a color, add a colored glow on top using source-atop
      if (colorRgb && (colorRgb.r < 240 || colorRgb.g < 240 || colorRgb.b < 240)) {
        lctx.globalCompositeOperation = 'source-atop';
        const colorGrad = lctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius);
        colorGrad.addColorStop(0, `rgba(${colorRgb.r},${colorRgb.g},${colorRgb.b},${alpha * 0.3})`);
        colorGrad.addColorStop(0.5, `rgba(${colorRgb.r},${colorRgb.g},${colorRgb.b},${alpha * 0.15})`);
        colorGrad.addColorStop(1, `rgba(${colorRgb.r},${colorRgb.g},${colorRgb.b},0)`);
        lctx.fillStyle = colorGrad;
        lctx.beginPath();
        lctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        lctx.fill();
        lctx.globalCompositeOperation = 'destination-out';
      }
    }

    lctx.globalCompositeOperation = 'source-over';

    // Draw lightmap onto main canvas with multiply blend
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(this._lightMap, 0, 0);
    ctx.restore();

    // Additional soft dark overlay for atmospheric effect
    if (this._fogDensity > 0.3) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = `rgba(10,10,20,${(this._fogDensity - 0.3) * 0.4})`;
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      ctx.restore();
    }
  }

  /**
   * Draw a flickering light glow at a position (for light fixtures).
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - screen x
   * @param {number} y - screen y
   * @param {number} radius
   * @param {number} intensity
   * @param {string} color
   * @param {number} time - current time for animation
   */
  drawFlickeringLight(ctx, x, y, radius, intensity, color, time) {
    const flicker = 0.6 + 0.4 * Math.sin(time * 6.3) * Math.cos(time * 4.7);
    const currentIntensity = intensity * flicker;
    const rgb = this._parseColor(color);

    if (!rgb) return;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${currentIntensity * 0.6})`);
    grad.addColorStop(0.3, `rgba(${rgb.r},${rgb.g},${rgb.b},${currentIntensity * 0.3})`);
    grad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Add ambient lights based on the current level.
   * @param {number} levelIndex
   * @param {Array} lightPositions - array of light position objects from level data
   */
  addAmbientLights(levelIndex, lightPositions) {
    this.clearLights();

    if (!lightPositions || lightPositions.length === 0) return;

    for (const lp of lightPositions) {
      this.addLightSource(
        lp.x,
        lp.y,
        lp.radius || 150,
        lp.intensity || 0.5,
        lp.color || '#ffffff',
        lp.flicker || false
      );
    }
  }

  /**
   * Parse a CSS color string into {r, g, b}.
   * @param {string} color
   * @returns {object|null}
   */
  _parseColor(color) {
    if (!color || typeof color !== 'string') return null;

    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16)
        };
      } else if (hex.length === 6) {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16)
        };
      }
    }

    // Handle rgb/rgba
    const match = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }

    return { r: 255, g: 255, b: 255 };
  }
}

export default LightingSystem;
