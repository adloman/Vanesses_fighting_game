/**
 * Main render orchestrator for Abandoned Ward.
 * Coordinates all rendering subsystems in the correct order.
 */

export class Renderer {
  /**
   * @param {CanvasRenderingContext2D} ctx - the main canvas 2D rendering context
   */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /**
   * Clear the screen to black.
   */
  clearScreen() {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  /**
   * Render the level background.
   * @param {object} camera - {x, y} camera position
   * @param {object} levelManager - LevelManager instance
   * @param {number} levelIndex - current level index
   */
  renderBackground(camera, levelManager, levelIndex) {
    this.ctx.save();
    levelManager.drawBackground(this.ctx, camera);
    this.ctx.restore();
  }

  /**
   * Render environmental hazards.
   * @param {object} camera - {x, y} camera position
   * @param {object} levelManager - LevelManager instance
   */
  renderHazards(camera, levelManager) {
    this.ctx.save();
    levelManager.drawHazards(this.ctx, camera);
    this.ctx.restore();
  }

  /**
   * Render arena gates (iron bars).
   * @param {object} camera - {x, y} camera position
   * @param {object} levelManager - LevelManager instance
   */
  renderGates(camera, levelManager) {
    this.ctx.save();
    levelManager.drawGates(this.ctx, camera);
    this.ctx.restore();
  }

  /**
   * Render all game entities (player, enemies, etc.).
   * Each entity must have a draw(ctx, camera) method.
   * @param {Array} entities - array of entity objects
   * @param {object} camera - {x, y} camera position
   */
  renderEntities(entities, camera) {
    if (!entities || entities.length === 0) return;

    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;
    const canvasWidth = this.ctx.canvas.width;
    const canvasHeight = this.ctx.canvas.height;

    // Sort entities by y-position for depth ordering (lower y = further back, drawn first)
    const sorted = [...entities].sort((a, b) => {
      const ay = a.y !== undefined ? a.y : 0;
      const by = b.y !== undefined ? b.y : 0;
      return ay - by;
    });

    for (let i = 0; i < sorted.length; i++) {
      const entity = sorted[i];

      // Culling: skip entities off-screen
      const ex = (entity.x !== undefined ? entity.x : 0) - camX;
      const ey = (entity.y !== undefined ? entity.y : 0) - camY;
      const ew = entity.width || 60;
      const eh = entity.height || 100;

      if (ex + ew < -50 || ex - ew > canvasWidth + 50 ||
          ey + eh < -50 || ey - eh > canvasHeight + 50) {
        continue;
      }

      // Skip dead entities (optional: some may want death animations)
      if (entity.dead && !entity.renderDead) continue;

      this.ctx.save();
      if (typeof entity.draw === 'function') {
        entity.draw(this.ctx, camera);
      }
      this.ctx.restore();
    }
  }

  /**
   * Render all projectiles.
   * Each projectile must have a draw(ctx, camera) method.
   * @param {Array} projectiles - array of projectile objects
   * @param {object} camera - {x, y} camera position
   */
  renderProjectiles(projectiles, camera) {
    if (!projectiles || projectiles.length === 0) return;

    const camX = camera ? camera.x : 0;
    const camY = camera ? camera.y : 0;
    const canvasWidth = this.ctx.canvas.width;

    for (let i = 0; i < projectiles.length; i++) {
      const proj = projectiles[i];

      // Skip inactive
      if (proj.active === false) continue;

      // Culling
      const px = (proj.x !== undefined ? proj.x : 0) - camX;
      if (px < -30 || px > canvasWidth + 30) continue;

      this.ctx.save();

      if (typeof proj.draw === 'function') {
        proj.draw(this.ctx, camera);
      } else {
        // Default projectile rendering if no draw method
        this._drawDefaultProjectile(proj, camera);
      }

      this.ctx.restore();
    }
  }

  /**
   * Default projectile drawing (basic bullet/magic projectile).
   */
  _drawDefaultProjectile(proj, camera) {
    const ctx = this.ctx;
    const sx = proj.x - camera.x;
    const sy = proj.y - camera.y;
    const size = proj.size || 4;
    const color = proj.color || '#ffff00';

    // Trail
    if (proj.vx !== undefined || proj.vy !== undefined) {
      const trailLen = 12;
      const speed = Math.sqrt((proj.vx || 0) * (proj.vx || 0) + (proj.vy || 0) * (proj.vy || 0));
      if (speed > 0) {
        const nx = -(proj.vx || 0) / speed;
        const ny = -(proj.vy || 0) / speed;
        const grad = ctx.createLinearGradient(sx, sy, sx + nx * trailLen, sy + ny * trailLen);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = size * 0.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + nx * trailLen, sy + ny * trailLen);
        ctx.stroke();
      }
    }

    // Projectile body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, size);
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Render the particle system.
   * @param {object} particleSystem - ParticleSystem instance
   * @param {object} camera - {x, y} camera position
   */
  renderParticles(particleSystem, camera) {
    if (!particleSystem) return;
    this.ctx.save();
    particleSystem.render(this.ctx, camera);
    this.ctx.restore();
  }

  /**
   * Render the lighting overlay.
   * @param {object} lightingSystem - LightingSystem instance
   */
  renderLighting(lightingSystem) {
    if (!lightingSystem) return;
    this.ctx.save();
    lightingSystem.render(this.ctx, { x: 0, y: 0 }); // Lighting uses its own camera offset
    this.ctx.restore();
  }

  /**
   * Render screen-space effects (shake, flash, fade, vignette).
   * @param {object} screenEffects - ScreenEffects instance
   */
  renderEffects(screenEffects) {
    if (!screenEffects) return;
    this.ctx.save();
    screenEffects.render(this.ctx);
    this.ctx.restore();
  }

  /**
   * Render the HUD (heads-up display). Screen-space, no camera offset.
   * @param {object} hud - HUD object with a render(ctx) method
   */
  renderHUD(hud) {
    if (!hud) return;
    this.ctx.save();
    if (typeof hud.render === 'function') {
      hud.render(this.ctx);
    }
    this.ctx.restore();
  }

  /**
   * Render overlay UI elements (menus, dialogs, etc.). Screen-space.
   * @param {Array} uiElements - array of UI element objects with render(ctx) methods
   */
  renderUI(uiElements) {
    if (!uiElements || uiElements.length === 0) return;

    for (let i = 0; i < uiElements.length; i++) {
      const element = uiElements[i];
      this.ctx.save();
      if (typeof element.render === 'function') {
        element.render(this.ctx);
      } else if (typeof element.draw === 'function') {
        element.draw(this.ctx);
      }
      this.ctx.restore();
    }
  }

  /**
   * Full frame render pipeline.
   * Renders everything in the correct order.
   * @param {object} params - render parameters
   */
  renderFrame(params) {
    const {
      camera,
      levelManager,
      levelIndex,
      entities,
      projectiles,
      particleSystem,
      lightingSystem,
      screenEffects,
      hud,
      uiElements
    } = params;

    // 1. Clear screen
    this.clearScreen();

    // 2. Apply screen shake transform
    if (screenEffects) {
      const shake = screenEffects.getShakeOffset();
      if (shake.x !== 0 || shake.y !== 0) {
        this.ctx.save();
        this.ctx.translate(shake.x, shake.y);
      }
    }

    // 3. Background (parallax layers)
    if (levelManager) {
      this.renderBackground(camera, levelManager, levelIndex);
    }

    // 4. Hazards
    if (levelManager) {
      this.renderHazards(camera, levelManager);
    }

    // 5. Gates
    if (levelManager) {
      this.renderGates(camera, levelManager);
    }

    // 6. Entities (player, enemies, etc.)
    this.renderEntities(entities, camera);

    // 7. Projectiles
    this.renderProjectiles(projectiles, camera);

    // 8. Particles
    this.renderParticles(particleSystem, camera);

    // 9. Lighting overlay
    this.renderLighting(lightingSystem);

    // 10. Restore shake transform
    if (screenEffects) {
      const shake = screenEffects.getShakeOffset();
      if (shake.x !== 0 || shake.y !== 0) {
        this.ctx.restore();
      }
    }

    // 11. Screen effects (post-processing, screen-space)
    this.renderEffects(screenEffects);

    // 12. HUD (screen-space)
    this.renderHUD(hud);

    // 13. UI overlays (screen-space)
    this.renderUI(uiElements);
  }
}

export default Renderer;
