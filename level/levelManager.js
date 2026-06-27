/**
 * Level Manager for Abandoned Ward.
 * Manages level loading, arena progression, gates, scrolling, and hazard placement.
 */
import { LEVELS } from '../data/levelData.js';
import { drawLevelBackground, drawHazard, getHazardZones } from './levelDefs.js';

export class LevelManager {
  constructor() {
    this.currentLevel = 0;
    this.worldWidth = 3200;
    this.worldHeight = 720;
    this.scrollX = 0;
    this.targetScrollX = 0;
    this.scrollSpeed = 400; // pixels per second

    this.gates = [];
    this.hazards = [];
    this.arenaZones = [];
    this.currentArena = 0;

    this._levelData = null;
    this._fogDensity = 0.6;
  }

  /**
   * Load a level by index.
   * @param {number} levelIndex
   */
  loadLevel(levelIndex) {
    if (levelIndex < 0 || levelIndex >= LEVELS.length) {
      console.warn(`Level index ${levelIndex} out of range`);
      return;
    }

    this.currentLevel = levelIndex;
    this._levelData = LEVELS[levelIndex];
    this.worldWidth = this._levelData.worldWidth;
    this.worldHeight = this._levelData.worldHeight;
    this._fogDensity = this._levelData.fogDensity;
    this.scrollX = 0;
    this.targetScrollX = 0;
    this.currentArena = 0;

    this._buildArenaZones();
    this._buildGates();
    this._buildHazards();
  }

  /**
   * Build arena zones based on level data.
   * Each arena is a combat area separated by gates.
   */
  _buildArenaZones() {
    this.arenaZones = [];
    const data = this._levelData;
    const arenaCount = data.arenaCount;
    const arenaWidth = data.arenaWidth;
    const groundY = data.groundY;

    for (let i = 0; i < arenaCount; i++) {
      const left = i * arenaWidth;
      const right = (i + 1) * arenaWidth;
      this.arenaZones.push({
        index: i,
        left: left,
        right: Math.min(right, this.worldWidth),
        top: 0,
        bottom: groundY,
        centerX: (left + Math.min(right, this.worldWidth)) / 2,
        cleared: false,
        enemyData: data.enemies.filter(e => e.arena === i),
        hasBoss: data.boss && data.boss.arena === i
      });
    }
  }

  /**
   * Build gates between arena zones.
   * Gates are positioned at the boundary between arenas.
   */
  _buildGates() {
    this.gates = [];
    const arenaCount = this.arenaZones.length;

    for (let i = 0; i < arenaCount - 1; i++) {
      const gateX = this.arenaZones[i].right;
      this.gates.push({
        x: gateX,
        y: 0,
        width: 30,
        height: this.worldHeight,
        locked: true,
        arenaIndex: i,
        openTimer: 0,
        openDuration: 0.8 // seconds to fully open
      });
    }
  }

  /**
   * Build hazard instances from level data.
   */
  _buildHazards() {
    this.hazards = [];
    if (!this._levelData || !this._levelData.hazards) return;

    for (const h of this._levelData.hazards) {
      this.hazards.push({
        type: h.type,
        x: h.x,
        y: h.y,
        x2: h.x2,
        y2: h.y2,
        w: h.w,
        h: h.h,
        radius: h.radius,
        damage: h.damage || 5,
        interval: h.interval,
        active: true,
        cooldownTimer: 0
      });
    }
  }

  /**
   * Update level state each frame.
   * @param {number} dt - delta time in seconds
   * @param {boolean} allEnemiesDead - whether all enemies in current arena are dead
   */
  update(dt, allEnemiesDead) {
    // Update scrolling
    this._updateScroll(dt);

    // Update gates
    this._updateGates(dt, allEnemiesDead);

    // Update hazards
    this._updateHazards(dt);
  }

  /**
   * Update scroll position, smoothly approaching target.
   */
  _updateScroll(dt) {
    const maxScroll = Math.max(0, this.worldWidth - 1280);
    this.targetScrollX = Math.max(0, Math.min(this.targetScrollX, maxScroll));

    // Smooth interpolation toward target
    const diff = this.targetScrollX - this.scrollX;
    if (Math.abs(diff) < 1) {
      this.scrollX = this.targetScrollX;
    } else {
      this.scrollX += diff * Math.min(1, dt * 5);
    }

    this.scrollX = Math.max(0, Math.min(this.scrollX, maxScroll));
  }

  /**
   * Update gate states. Gates prevent scrolling until enemies are dead.
   */
  _updateGates(dt, allEnemiesDead) {
    for (const gate of this.gates) {
      if (gate.locked && allEnemiesDead && this.currentArena === gate.arenaIndex) {
        // Unlock gate
        gate.locked = false;
        gate.openTimer = 0;
        // Mark arena as cleared
        if (this.currentArena < this.arenaZones.length) {
          this.arenaZones[this.currentArena].cleared = true;
        }
      }

      if (!gate.locked) {
        gate.openTimer += dt;
        if (gate.openTimer > gate.openDuration) {
          gate.openTimer = gate.openDuration;
        }
      }
    }
  }

  /**
   * Update hazard cooldown timers.
   */
  _updateHazards(dt) {
    for (const hazard of this.hazards) {
      if (hazard.interval) {
        hazard.cooldownTimer -= dt;
        if (hazard.cooldownTimer < 0) {
          hazard.cooldownTimer = 0;
        }
      }
    }
  }

  /**
   * Get the x position of the current combat arena center.
   * @returns {number}
   */
  getCurrentArenaX() {
    if (this.currentArena < this.arenaZones.length) {
      return this.arenaZones[this.currentArena].centerX;
    }
    return this.worldWidth / 2;
  }

  /**
   * Get the bounds of the current combat arena.
   * @returns {{left: number, right: number, top: number, bottom: number}}
   */
  getArenaBounds() {
    if (this.currentArena < this.arenaZones.length) {
      const arena = this.arenaZones[this.currentArena];
      return {
        left: arena.left,
        right: arena.right,
        top: arena.top,
        bottom: arena.bottom
      };
    }
    return { left: 0, right: this.worldWidth, top: 0, bottom: 600 };
  }

  /**
   * Determine whether the player is past the gate threshold and should trigger scrolling.
   * @param {number} playerX - player's world x position
   * @returns {boolean}
   */
  shouldScroll(playerX) {
    // Check if there is a next arena and the current arena's gate is unlocked
    if (this.currentArena >= this.gates.length) return false;
    const gate = this.gates[this.currentArena];
    return !gate.locked && playerX > gate.x - 200;
  }

  /**
   * Advance to the next arena. Called when player passes through an open gate.
   */
  nextArena() {
    if (this.currentArena < this.arenaZones.length - 1) {
      this.currentArena++;
    }
  }

  /**
   * Check if all arenas in the current level have been cleared.
   * @returns {boolean}
   */
  isLevelComplete() {
    return this.arenaZones.every(arena => arena.cleared);
  }

  /**
   * Get the ground Y coordinate.
   * @returns {number}
   */
  getGroundY() {
    return 600;
  }

  /**
   * Get the current fog density (0-1) for the level.
   * @returns {number}
   */
  getFogDensity() {
    return this._fogDensity || 0.6;
  }

  /**
   * Get the light positions for the current level.
   * @returns {Array}
   */
  getLightPositions() {
    if (this._levelData && this._levelData.lightPositions) {
      return this._levelData.lightPositions;
    }
    return [];
  }

  /**
   * Get enemy spawn data for the current arena.
   * @returns {Array}
   */
  getCurrentEnemyData() {
    if (this.currentArena < this.arenaZones.length) {
      return this.arenaZones[this.currentArena].enemyData;
    }
    return [];
  }

  /**
   * Get boss data for the current level if any.
   * @returns {object|null}
   */
  getBossData() {
    if (this._levelData && this._levelData.boss) {
      return this._levelData.boss;
    }
    return null;
  }

  /**
   * Draw the background using the level definitions.
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} camera - {x, y} camera position
   */
  drawBackground(ctx, camera) {
    const cam = camera || { x: this.scrollX, y: 0 };
    drawLevelBackground(ctx, this.currentLevel, cam, this.scrollX);
  }

  /**
   * Draw all active hazards.
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} camera - {x, y} camera position
   */
  drawHazards(ctx, camera) {
    const cam = camera || { x: this.scrollX, y: 0 };
    for (const hazard of this.hazards) {
      if (!hazard.active) continue;

      // Culling: skip if off-screen
      const hx = hazard.x - cam.x;
      const screenW = ctx.canvas.width;
      if (hx < -300 || hx > screenW + 300) continue;

      drawHazard(ctx, hazard.type, hazard, cam);
    }
  }

  /**
   * Draw all gates (iron bars).
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} camera - {x, y} camera position
   */
  drawGates(ctx, camera) {
    const cam = camera || { x: this.scrollX, y: 0 };
    const canvasWidth = ctx.canvas.width;

    for (const gate of this.gates) {
      const screenX = gate.x - cam.x;
      // Culling
      if (screenX < -50 || screenX > canvasWidth + 50) continue;

      // If fully open, do not draw
      if (!gate.locked && gate.openTimer >= gate.openDuration) continue;

      // Calculate gate opening animation (bars slide apart)
      const openProgress = gate.locked ? 0 : gate.openTimer / gate.openDuration;
      const slideOffset = openProgress * 60; // How far bars have slid apart

      // Draw iron bars
      const barCount = 12;
      const barSpacing = (gate.height) / barCount;

      for (let i = 0; i < barCount; i++) {
        const barY = i * barSpacing;
        // Alternating left/right slide
        const offset = (i % 2 === 0) ? -slideOffset : slideOffset;
        const bx = screenX + offset;

        // Bar body
        ctx.fillStyle = '#555566';
        ctx.fillRect(bx - 3, barY, 6, barSpacing - 4);

        // Bar highlight (metallic look)
        ctx.fillStyle = 'rgba(180,180,200,0.3)';
        ctx.fillRect(bx - 1, barY, 2, barSpacing - 4);

        // Bar shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(bx + 1, barY, 2, barSpacing - 4);

        // Rivets on every 3rd bar
        if (i % 3 === 0) {
          ctx.fillStyle = '#777788';
          ctx.beginPath();
          ctx.arc(bx, barY + 8, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(bx, barY + barSpacing - 12, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Top and bottom horizontal bars (frame)
      const frameColor = gate.locked ? '#666677' : '#555566';
      ctx.fillStyle = frameColor;
      ctx.fillRect(screenX - 10, 0, 20, 12);
      ctx.fillRect(screenX - 10, gate.height - 12, 20, 12);

      // Lock indicator (glowing red if locked)
      if (gate.locked) {
        const lockGlow = ctx.createRadialGradient(screenX, gate.height / 2, 2, screenX, gate.height / 2, 40);
        lockGlow.addColorStop(0, 'rgba(255,50,50,0.4)');
        lockGlow.addColorStop(1, 'rgba(255,50,50,0)');
        ctx.fillStyle = lockGlow;
        ctx.fillRect(screenX - 40, gate.height / 2 - 40, 80, 80);

        // Lock symbol
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(screenX, gate.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#220000';
        ctx.fillRect(screenX - 3, gate.height / 2, 6, 8);
      }
    }
  }

  /**
   * Reset the level manager to initial state.
   */
  reset() {
    this.currentLevel = 0;
    this.worldWidth = 3200;
    this.worldHeight = 720;
    this.scrollX = 0;
    this.targetScrollX = 0;
    this.gates = [];
    this.hazards = [];
    this.arenaZones = [];
    this.currentArena = 0;
    this._levelData = null;
    this._fogDensity = 0.6;
  }
}

export default LevelManager;
