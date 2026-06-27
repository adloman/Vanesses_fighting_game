// ============================================================================
// states/playState.js - Core Gameplay State for "Abandoned Ward"
// ============================================================================
// This is the heart of the game. It manages player movement, combat,
// enemy AI, wave progression, level advancement, particles, lighting,
// screen effects, HUD rendering, and touch control overlays.
//
// The state object receives a `shared` property injected by main.js containing:
//   { stateMachine, inputManager, camera, collisionManager, gameState, canvas, ctx }
// ============================================================================

// --- Entity imports (relative to states/ folder) ---
import { Player } from '../entities/player.js';
import { Enemy } from '../entities/enemy.js';
import { Projectile } from '../entities/projectile.js';
import { createEnemy, createBoss } from '../entities/enemyTypes.js';

// --- Combat system imports ---
import { WaveManager } from '../combat/waveManager.js';
import { calculateDamage, applySpecialEffect, isCriticalHit } from '../combat/damageSystem.js';
import { ComboSystem } from '../combat/comboSystem.js';

// --- Level imports ---
import { LevelManager } from '../level/levelManager.js';
import { drawLevelBackground, drawHazard } from '../level/levelDefs.js';

// --- Rendering imports ---
import { ParticleSystem } from '../rendering/particleSystem.js';
import { LightingSystem } from '../rendering/lightingSystem.js';
import { ScreenEffects } from '../rendering/screenEffects.js';

// --- UI imports ---
import { HUD } from '../ui/hud.js';

// --- Weapon & Ability imports ---
import { WeaponSystem } from '../weapons/weaponBase.js';
import { AbilitySystem } from '../abilities/abilityBase.js';

// --- Audio (singleton default export) ---
import AudioManager from '../core/audioManager.js';

// --- Data imports ---
import { CHARACTERS, ABILITIES } from '../data/characterStats.js';
import { WEAPONS } from '../data/weaponStats.js';
import { LEVELS } from '../data/levelData.js';

// --- Config imports ---
import {
    GAME_WIDTH, GAME_HEIGHT, GRAVITY, GROUND_Y, MAX_FALL_SPEED,
    MAX_PARTICLES, MAX_ENEMIES_ON_SCREEN, COLORS, TOUCH_CONTROLS,
    PLAYER_INVINCIBLE_TIME,
} from '../game.config.js';

// ============================================================================
// Play State Object
// ============================================================================

export const playState = {
    /** Shared refs injected by main.js before the state is entered. */
    shared: null,

    // --- Entity references ---
    _player: null,
    _enemies: [],
    _projectiles: [],

    // --- System references ---
    _waveManager: null,
    _levelManager: null,
    _particles: null,
    _lighting: null,
    _screenFX: null,
    _hud: null,
    _weaponSys: null,
    _abilitySys: null,
    _comboSys: null,

    // --- Short-hand shared refs (set in enter) ---
    _sm: null,
    _input: null,
    _cam: null,
    _coll: null,
    _gs: null,
    _canvas: null,
    _ctx: null,

    // --- Timing / state ---
    _time: 0,
    _waveTransitionTimer: null,
    _ambientHandle: null,
    _levelIndex: 0,
    _worldWidth: 3200,
    _groundY: GROUND_Y || 600,
    _damageFlashTimer: 0,
    _gateOpen: false,
    _levelComplete: false,
    _levelCompleteTimer: 0,
    _deathTimer: 0,

    // ========================================================================
    // enter(prevState)
    // Called by StateMachine.switch when entering the play state.
    // ========================================================================
    enter(prevState) {
        const { stateMachine, inputManager, camera, collisionManager, gameState, canvas, ctx } = this.shared;
        this._sm = stateMachine;
        this._input = inputManager;
        this._cam = camera;
        this._coll = collisionManager;
        this._gs = gameState;
        this._canvas = canvas;
        this._ctx = ctx;

        // --- Determine level index (1-indexed in gameState -> 0-indexed for arrays) ---
        this._levelIndex = Math.max(0, (gameState.currentLevel || 1) - 1);

        // Clamp level index to available levels
        if (this._levelIndex >= LEVELS.length) {
            this._levelIndex = LEVELS.length - 1;
        }

        const levelData = LEVELS[this._levelIndex];
        this._worldWidth = levelData ? levelData.worldWidth : 3200;
        this._groundY = levelData ? levelData.groundY : (GROUND_Y || 600);

        // --- Start level on game state ---
        gameState.startLevel();

        // --- Create Player ---
        const charKey = gameState.selectedCharacter || 'ANGEL';
        const charData = CHARACTERS[charKey] || CHARACTERS['ANGEL'];

        this._player = new Player(200, this._groundY - 56);
        this._player.setCharacter({
            ...charData,
            characterType: charKey,
            abilities: [],
        });

        // Map character abilities from ABILITIES data
        const charAbilities = ABILITIES[charKey];
        if (charAbilities) {
            const abilityList = [];
            for (let i = 1; i <= 3; i++) {
                if (charAbilities[i]) {
                    abilityList.push(charAbilities[i]);
                }
            }
            this._player.setCharacter({
                ...charData,
                characterType: charKey,
                abilities: abilityList,
            });
        }

        // Equip weapon
        const weaponKey = gameState.selectedWeapon || 'BAT';
        const weaponData = WEAPONS[weaponKey] || WEAPONS['BAT'];
        this._player.setWeapon(weaponData);
        gameState.equippedWeapon = weaponKey;

        // --- Create sub-systems ---
        this._waveManager = new WaveManager();
        this._levelManager = new LevelManager();
        this._particles = new ParticleSystem();
        this._lighting = new LightingSystem(GAME_WIDTH, GAME_HEIGHT);
        this._screenFX = new ScreenEffects();
        this._hud = new HUD();
        this._weaponSys = new WeaponSystem();
        this._abilitySys = new AbilitySystem();
        this._comboSys = new ComboSystem();

        // Equip weapon into WeaponSystem
        this._weaponSys.equip(weaponKey);

        // Set abilities into AbilitySystem
        const abilityDataArr = charAbilities
            ? [charAbilities[1] || null, charAbilities[2] || null, charAbilities[3] || null]
            : [null, null, null];
        this._abilitySys.setAbilities(abilityDataArr);

        // --- Load level and waves ---
        this._levelManager.loadLevel(this._levelIndex);
        this._waveManager.loadLevel(this._levelIndex);

        // --- Set up camera ---
        this._cam.setPosition(this._player.x, this._player.y);
        this._cam.follow(this._player);
        this._cam.setBounds(0, Math.max(0, this._worldWidth - GAME_WIDTH), 0, GAME_HEIGHT - 10);

        // --- Set up lighting ---
        const fogDensity = this._levelManager.getFogDensity ? this._levelManager.getFogDensity() : 0.6;
        this._lighting.setFogDensity(fogDensity);

        // --- Show level name on HUD ---
        if (levelData && levelData.name) {
            this._hud.showLevelName(levelData.name);
        }

        // --- Clear collision manager ---
        this._coll.clear();

        // --- Reset internal state ---
        this._enemies = [];
        this._projectiles = [];
        this._time = 0;
        this._waveTransitionTimer = null;
        this._damageFlashTimer = 0;
        this._gateOpen = false;
        this._levelComplete = false;
        this._levelCompleteTimer = 0;
        this._deathTimer = 0;

        // --- Start ambient sound ---
        this._ambientHandle = AudioManager.play('ambient');

        // --- Start first wave ---
        this._waveManager.startNextWave(0, this._player);

        // Update HUD with wave info
        const waveInfo = this._waveManager.getCurrentWaveInfo();
        if (waveInfo) {
            this._hud.currentWave = waveInfo.waveNumber;
            this._hud.totalWaves = waveInfo.totalWaves;
        }
    },

    // ========================================================================
    // exit(nextState)
    // ========================================================================
    exit(nextState) {
        this._cam.unfollow();
        this._coll.clear();
        this._enemies = [];
        this._projectiles = [];
        this._waveTransitionTimer = null;

        if (this._particles) this._particles.clear();
        if (this._lighting) this._lighting.reset();
        if (this._screenFX) this._screenFX.reset();
        if (this._ambientHandle) {
            this._ambientHandle.stop();
            this._ambientHandle = null;
        }
    },

    // ========================================================================
    // update(dt)
    // ========================================================================
    update(dt) {
        // Cap dt to prevent physics explosions
        dt = Math.min(dt, 0.05);

        // --- Level complete delay ---
        if (this._levelComplete) {
            this._updateLevelComplete(dt);
            return;
        }

        // --- Death delay ---
        if (this._player && this._player.hp <= 0) {
            this._updateDeath(dt);
            return;
        }

        this._time += dt;

        // --- Pause check ---
        if (this._input.isPausePressed()) {
            this._gs.paused = true;
            this._sm.switch('pause');
            return;
        }

        // --- Player input ---
        const dir = this._input.getDirection();
        const inputAttack = this._input.isAttacking();
        const inputAbilities = [
            this._input.isAbility1JustPressed(),
            this._input.isAbility2JustPressed(),
            this._input.isAbility3JustPressed(),
        ];

        // Build level data for player update
        const levelDataForPlayer = {
            groundY: this._groundY,
            width: this._worldWidth,
        };

        // Update the player entity (handles movement, gravity, attack animation, abilities)
        this._player.update(dt, dir.dx !== 0 ? (dir.dx > 0 ? 1 : -1) : 0, inputAttack, inputAbilities, levelDataForPlayer);

        // --- Handle player attack hit resolution ---
        if (this._player.isAttacking) {
            this._resolvePlayerAttack();
        }

        // --- Handle player abilities ---
        for (let i = 0; i < 3; i++) {
            if (inputAbilities[i]) {
                this._activatePlayerAbility(i);
            }
        }

        // --- Update ability system active effects ---
        this._abilitySys.update(dt);

        // --- Update combo system ---
        this._comboSys.update(dt);

        // --- Update combo and energy on gameState (for HUD) ---
        this._gs.updateCombo(dt);
        this._gs.regenSpecialEnergy(dt);

        // Sync player hp/energy to gameState for cross-state persistence
        this._gs.playerHP = this._player.hp;
        this._gs.playerMaxHP = this._player.maxHp;
        this._gs.specialEnergy = this._player.specialEnergy;
        this._gs.maxSpecialEnergy = this._player.maxSpecialEnergy;

        // --- Wave Manager: spawn enemies ---
        const spawned = this._waveManager.update(dt, this._cam.getOffsetX(), this._cam.getOffsetY(), this._player);
        for (const entry of spawned) {
            this._enemies.push(entry.entity);
        }

        // --- Cap enemies on screen ---
        if (this._enemies.length > MAX_ENEMIES_ON_SCREEN) {
            // Remove furthest enemies
            this._enemies.sort((a, b) => {
                const distA = Math.abs(a.x - this._player.x);
                const distB = Math.abs(b.x - this._player.x);
                return distB - distA;
            });
            const removed = this._enemies.splice(MAX_ENEMIES_ON_SCREEN);
        }

        // --- Update enemies ---
        for (let i = this._enemies.length - 1; i >= 0; i--) {
            const enemy = this._enemies[i];
            enemy.update(dt, this._player.x, this._player.y, this._player.alive);

            // Remove dead enemies that finished death animation
            if (!enemy.alive && enemy.aiState !== 'dying') {
                this._enemies.splice(i, 1);
                continue;
            }
            if (enemy.aiState === 'dying' && enemy.deathTimer > 0.6) {
                this._enemies.splice(i, 1);
                continue;
            }

            // --- Enemy melee/contact damage to player ---
            if (enemy.alive && enemy.aiState === 'attack') {
                const hitbox = enemy.getAttackHitbox();
                if (hitbox) {
                    const pH = this._player.getHitbox();
                    if (this._rectsOverlap(hitbox.x, hitbox.y, hitbox.w, hitbox.h, pH.x, pH.y, pH.w, pH.h)) {
                        const dmg = enemy.damage || 10;
                        this._applyDamageToPlayer(dmg, enemy);
                    }
                }
            }

            // --- Spitter: spawn projectile ---
            if (enemy.alive && enemy.shouldSpawnProjectile && enemy.shouldSpawnProjectile()) {
                const projData = enemy.getProjectileData();
                const proj = new Projectile(
                    projData.x, projData.y,
                    projData.angle, projData.speed,
                    projData.damage, 'enemy', 'spit',
                    { color: '#00FF00' }
                );
                this._projectiles.push(proj);
            }

            // --- Exploder: trigger explosion ---
            if (enemy.alive && enemy.shouldExplode && enemy.shouldExplode()) {
                const expData = enemy.getExplosionData();
                this._handleExplosion(expData);
            }
        }

        // --- Update projectiles ---
        this._updateProjectiles(dt);

        // --- Check wave completion ---
        this._checkWaveProgress(dt);

        // --- Check hazard damage ---
        this._checkHazardDamage(dt);

        // --- Update level manager (gates, scrolling, hazards) ---
        const allEnemiesDead = this._enemies.every(e => !e.alive || e.aiState === 'dying');
        this._levelManager.update(dt, allEnemiesDead);

        // Check if player should scroll to next arena
        if (this._levelManager.shouldScroll(this._player.x)) {
            this._levelManager.nextArena();
        }

        // --- Update particles ---
        this._particles.update(dt);

        // --- Update lighting ---
        this._lighting.update(dt, this._player.x, this._player.y);

        // --- Update screen effects ---
        this._screenFX.update(dt);

        // --- Update camera ---
        this._cam.update(dt);

        // --- Update HUD ---
        this._hud.update(this._player, this._waveManager, this._gs);
        this._hud.updateCombo(this._comboSys.getCount());

        // --- Sync score ---
        this._hud.score = this._gs.score;

        // --- Check player death ---
        if (this._player.hp <= 0) {
            this._gs.playerHP = 0;
            this._gs.saveHighScore();
            AudioManager.play('death');
            this._screenFX.flash('#ff0000', 0.3);
            this._cam.shake(8, 0.4);
            return; // death delay starts next frame
        }

        // --- Damage flash decay ---
        if (this._damageFlashTimer > 0) {
            this._damageFlashTimer -= dt;
        }
    },

    // ========================================================================
    // render(ctx)
    // ========================================================================
    render(ctx) {
        // 1. Clear screen dark
        ctx.fillStyle = COLORS.BG_DARK;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // 2. Draw level background using levelDefs
        const camOffset = { x: this._cam.getOffsetX(), y: this._cam.getOffsetY() };
        this._levelManager.drawBackground(ctx, camOffset);

        // 3. Draw hazards
        this._levelManager.drawHazards(ctx, camOffset);

        // 4. Draw gates
        this._levelManager.drawGates(ctx, camOffset);

        // 5. Collect all renderable entities, sort by Y for depth ordering
        const renderables = [];

        for (const enemy of this._enemies) {
            if (enemy.alive || enemy.aiState === 'dying') {
                renderables.push({ y: enemy.y + enemy.height, render: () => enemy.draw(ctx, camOffset) });
            }
        }

        renderables.push({
            y: this._player.y + this._player.height,
            render: () => this._player.draw(ctx, camOffset),
        });

        renderables.sort((a, b) => a.y - b.y);
        for (const r of renderables) {
            r.render();
        }

        // 6. Draw projectiles
        for (const proj of this._projectiles) {
            proj.draw(ctx, camOffset);
        }

        // 7. Draw particles
        this._particles.render(ctx, camOffset);

        // 8. Draw lighting overlay
        this._lighting.render(ctx);

        // 9. Draw screen effects
        this._screenFX.render(ctx);

        // 10. Draw damage flash
        if (this._damageFlashTimer > 0) {
            ctx.fillStyle = `rgba(255, 34, 34, ${Math.min(this._damageFlashTimer * 5, 0.5)})`;
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }

        // 11. Draw HUD
        this._hud.render(ctx);

        // 12. Draw touch controls overlay (only if touch is active)
        if (this._input.isTouchActive()) {
            this._renderTouchControls(ctx);
        }
    },

    // ========================================================================
    // PRIVATE HELPERS - Combat
    // ========================================================================

    _resolvePlayerAttack() {
        const attackResult = this._player.attack();
        if (!attackResult) return;

        const comboMult = this._comboSys.getMultiplier();
        const damageMult = this._player.damageModifier || 1.0;

        // Calculate damage using damage system
        const finalDamage = calculateDamage(
            attackResult.damage,
            comboMult,
            damageMult,
            1.0 // ability bonus
        );

        // Check hits against all alive enemies
        let hitAny = false;
        for (const enemy of this._enemies) {
            if (!enemy.alive || enemy.aiState === 'dying') continue;

            const eH = enemy.getHitbox();
            if (this._rectsOverlap(attackResult.x, attackResult.y, attackResult.w, attackResult.h,
                eH.x, eH.y, eH.w, eH.h)) {

                const actualDamage = enemy.takeDamage(finalDamage, this._player);
                hitAny = true;

                // Register combo hit
                this._comboSys.registerHit();
                this._gs.addCombo();
                this._gs.addScore(Math.floor(10 * this._gs.getComboMultiplier()));

                // Knockback
                if (attackResult.knockback && attackResult.knockback > 0) {
                    const kbDir = this._player.facing || 1;
                    enemy.x += kbDir * attackResult.knockback;
                }

                // Apply special effects from weapon
                if (attackResult.specialEffect) {
                    const effect = this._buildSpecialEffect(attackResult.specialEffect, enemy);
                    if (effect) {
                        applySpecialEffect(enemy, effect, actualDamage);
                    }
                }

                // Critical hit effects
                if (isCriticalHit()) {
                    enemy.stunTimer = Math.max(enemy.stunTimer || 0, 0.3);
                    if (enemy.aiState && enemy.aiState !== 'dying') {
                        enemy.aiState = 'stunned';
                    }
                    this._particles.emit(enemy.x + enemy.width / 2, enemy.y, 'burst', 8, '#FFD700');
                }

                // Hit particles
                this._particles.emit(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'blood', 5, '#cc2222');
                this._particles.emit(enemy.x + enemy.width / 2, enemy.y, 'damage', 1, '#ff4444', actualDamage);

                // Lifesteal for Devil character
                if (this._player.lifestealPercent > 0) {
                    const healAmt = actualDamage * this._player.lifestealPercent;
                    this._player.hp = Math.min(this._player.maxHp, this._player.hp + healAmt);
                }

                // On kill callback
                if (!enemy.alive) {
                    this._onEnemyKilled(enemy);
                }

                // Play hit sound
                AudioManager.play('hit');
                this._cam.shake(2, 0.1);
            }
        }

        // Play swing sound
        if (this._player.attackTimer > (this._player.weapon ? (this._player.weapon.attackDuration || 0.3) * 0.8 : 0.2)) {
            AudioManager.play('swing');
        }
    },

    _buildSpecialEffect(effectName, enemy) {
        switch (effectName) {
            case 'stun':
                return { type: 'stun', params: { duration: 0.3 } };
            case 'bleed':
                return { type: 'bleed', params: { damagePerSec: 3, duration: 3 } };
            case 'burn':
                return { type: 'burn', params: { damagePerSec: 5, duration: 4 } };
            default:
                return null;
        }
    },

    _onEnemyKilled(enemy) {
        this._gs.addScore(enemy.score || 10);
        this._comboSys.registerHit(); // extra combo for kill
        this._player.onKill(enemy);

        // Death particles
        this._particles.emit(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'death', 20, '#cc4444');

        if (enemy.isBoss) {
            AudioManager.play('explosion');
            this._cam.shake(12, 0.5);
            this._screenFX.flash('#ffffff', 0.3);
            this._hud.showBossBar = false;
        } else {
            this._cam.shake(3, 0.15);
        }
    },

    _activatePlayerAbility(index) {
        const abilityResult = this._player.useAbility(index);
        if (!abilityResult) return;

        const px = abilityResult.x;
        const py = abilityResult.y;
        const facing = this._player.facing || 1;

        AudioManager.play('ability');

        switch (abilityResult.type) {
            case 'buff': {
                this._particles.emit(px, py, 'burst', 15, '#ffaa22');
                this._screenFX.flash('#ffaa22', 0.15);
                this._cam.shake(3, 0.15);
                break;
            }

            case 'aoe': {
                const radius = abilityResult.radius || 150;
                const damage = abilityResult.damage || 25;
                this._particles.emit(px, py, 'aoe', 30, '#ff4444');
                this._screenFX.flash('#ff4444', 0.15);
                this._cam.shake(6, 0.25);

                for (const enemy of this._enemies) {
                    if (!enemy.alive || enemy.aiState === 'dying') continue;
                    const dx = (enemy.x + enemy.width / 2) - px;
                    const dy = (enemy.y + enemy.height / 2) - py;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < radius) {
                        const dmg = calculateDamage(damage, this._comboSys.getMultiplier(), this._player.damageModifier);
                        enemy.takeDamage(dmg, this._player);
                        if (!enemy.alive) this._onEnemyKilled(enemy);
                    }
                }
                break;
            }

            case 'projectile': {
                const angle = facing === 1 ? 0 : Math.PI;
                const speed = abilityResult.speed || 300;
                const damage = abilityResult.damage || 30;
                const range = abilityResult.range || 500;

                const proj = new Projectile(
                    px, py,
                    angle, speed,
                    damage, 'player', 'fireball',
                    { lifetime: range / speed, color: abilityResult.specialEffect === 'burn' ? '#ff6600' : '#44aaff' }
                );
                this._projectiles.push(proj);
                this._particles.emit(px, py, 'burst', 8, '#ff6600');
                break;
            }

            default: {
                this._particles.emit(px, py, 'burst', 12, '#aa88ff');
                break;
            }
        }
    },

    _applyDamageToPlayer(damage, source) {
        if (this._player.invincibleTimer > 0) return;
        if (!this._player.alive) return;

        const actualDamage = this._player.takeDamage(damage, source);

        this._screenFX.flash('#ff0000', 0.15);
        this._cam.shake(4, 0.2);
        this._damageFlashTimer = 0.12;

        this._particles.emit(this._player.x + this._player.width / 2, this._player.y, 'damage', 1, '#ff0000', actualDamage);

        // Reset combo when hit
        this._comboSys.reset();
        this._gs.resetCombo();

        // Sync HP
        this._gs.playerHP = this._player.hp;
    },

    _handleExplosion(expData) {
        // Damage player if in range
        const dx = (this._player.x + this._player.width / 2) - expData.x;
        const dy = (this._player.y + this._player.height / 2) - expData.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < expData.radius) {
            this._applyDamageToPlayer(expData.damage, { x: expData.x, knockback: 10 });
        }

        // Damage other enemies in range (chain reaction)
        for (const enemy of this._enemies) {
            if (!enemy.alive || enemy.aiState === 'dying') continue;
            if (enemy.shouldExplode) continue; // don't trigger other exploders this way
            const edx = (enemy.x + enemy.width / 2) - expData.x;
            const edy = (enemy.y + enemy.height / 2) - expData.y;
            const eDist = Math.sqrt(edx * edx + edy * edy);
            if (eDist < expData.radius) {
                enemy.takeDamage(Math.floor(expData.damage * 0.5), { x: expData.x });
                if (!enemy.alive) this._onEnemyKilled(enemy);
            }
        }

        // Visual effects
        this._particles.emit(expData.x, expData.y, 'explosion', 25, '#ff8822');
        this._screenFX.flash('#ff8822', 0.2);
        this._cam.shake(6, 0.3);
        AudioManager.play('explosion');
    },

    // ========================================================================
    // PRIVATE HELPERS - Projectiles
    // ========================================================================

    _updateProjectiles(dt) {
        for (let i = this._projectiles.length - 1; i >= 0; i--) {
            const proj = this._projectiles[i];
            proj.update(dt);

            if (!proj.alive) {
                this._projectiles.splice(i, 1);
                continue;
            }

            // Out of world bounds
            if (proj.x < -100 || proj.x > this._worldWidth + 100 ||
                proj.y < -100 || proj.y > GAME_HEIGHT + 100) {
                this._projectiles.splice(i, 1);
                continue;
            }

            // Player projectiles hit enemies
            if (proj.owner === 'player') {
                for (const enemy of this._enemies) {
                    if (!enemy.alive || enemy.aiState === 'dying') continue;
                    if (proj.hasHit(enemy)) continue;

                    const eH = enemy.getHitbox();
                    const pH = proj.getHitbox();
                    if (this._rectsOverlap(pH.x, pH.y, pH.w, pH.h, eH.x, eH.y, eH.w, eH.h)) {
                        const dmg = calculateDamage(proj.damage, this._comboSys.getMultiplier(), this._player.damageModifier);
                        enemy.takeDamage(dmg, this._player);
                        proj.registerHit(enemy);
                        this._particles.emit(proj.x, proj.y, 'burst', 5, proj.color);
                        this._cam.shake(2, 0.1);

                        // Apply burn effect for fire-type projectiles
                        if (proj.type === 'fireball') {
                            applySpecialEffect(enemy, { type: 'burn', params: { damagePerSec: 8, duration: 3 } }, dmg);
                        }

                        if (!enemy.alive) this._onEnemyKilled(enemy);
                        break;
                    }
                }
            }

            // Enemy projectiles hit player
            if (proj.owner === 'enemy') {
                const pH = this._player.getHitbox();
                const pHit = proj.getHitbox();
                if (this._rectsOverlap(pHit.x, pHit.y, pHit.w, pHit.h, pH.x, pH.y, pH.w, pH.h)) {
                    this._applyDamageToPlayer(proj.damage, { x: proj.x, knockback: 5 });
                    this._particles.emit(proj.x, proj.y, 'burst', 5, proj.color);
                    proj.alive = false;
                    this._projectiles.splice(i, 1);
                }
            }
        }
    },

    // ========================================================================
    // PRIVATE HELPERS - Waves & Level Progression
    // ========================================================================

    _checkWaveProgress(dt) {
        // Get alive enemies count (exclude dying)
        const aliveEnemies = this._enemies.filter(e => e.alive && e.aiState !== 'dying');
        const waveInfo = this._waveManager.getCurrentWaveInfo();

        // Update HUD wave info
        if (waveInfo) {
            this._hud.currentWave = waveInfo.waveNumber;
            this._hud.totalWaves = waveInfo.totalWaves;

            // Boss bar
            if (waveInfo.isBossWave && waveInfo.bossName) {
                const boss = this._enemies.find(e => e.isBoss && e.alive);
                if (boss) {
                    this._hud.showBossBar = true;
                    this._hud.bossName = waveInfo.bossName;
                    this._hud.bossHP = boss.hp;
                    this._hud.bossMaxHP = boss.maxHp;
                }
            } else {
                this._hud.showBossBar = false;
            }
        }

        // Check if current wave is complete (all enemies spawned and dead)
        if (this._waveManager.waveActive && this._waveManager.allSpawned && aliveEnemies.length === 0) {
            // Boss wave needs boss to be spawned and dead
            if (waveInfo && waveInfo.isBossWave && !this._waveManager.bossSpawned) {
                // Boss will be spawned by waveManager in next update
                return;
            }
            if (waveInfo && waveInfo.isBossWave && this._waveManager.bossSpawned) {
                const bossAlive = this._enemies.some(e => e.isBoss && e.alive);
                if (bossAlive) return;
            }

            // Wave complete - advance
            if (!this._waveTransitionTimer) {
                this._waveTransitionTimer = 1.5;
                this._gs.addScore(200);
                this._screenFX.flash('#ffffff', 0.1);

                // Open gate
                this._gateOpen = true;
            }
        }

        // Handle wave transition timer
        if (this._waveTransitionTimer !== null) {
            this._waveTransitionTimer -= dt;
            if (this._waveTransitionTimer <= 0) {
                this._waveTransitionTimer = null;

                // Advance wave
                this._waveManager.advanceWave();

                // Check if all waves complete
                if (this._waveManager.allWavesComplete) {
                    this._handleLevelComplete();
                    return;
                }

                // Start next wave
                this._waveManager.startNextWave(this._cam.getOffsetX(), this._player);

                // Move to next arena
                this._levelManager.nextArena();
                const bounds = this._levelManager.getArenaBounds();
                if (bounds) {
                    // Ensure player is within arena bounds
                    this._player.x = Math.max(bounds.left + 40, Math.min(bounds.right - 40, this._player.x));
                }

                // Update camera bounds
                const arenaIdx = this._levelManager.currentArena;
                const arena = this._levelManager.arenaZones[arenaIdx];
                if (arena) {
                    this._cam.setBounds(
                        arena.left - GAME_WIDTH / 2,
                        Math.min(Math.max(0, arena.right + GAME_WIDTH / 2 - GAME_WIDTH), Math.max(0, this._worldWidth - GAME_WIDTH)),
                        0,
                        GAME_HEIGHT - 10
                    );
                }
            }
        }
    },

    _handleLevelComplete() {
        this._levelComplete = true;
        this._levelCompleteTimer = 0;

        this._gs.addScore(500);
        this._gs.levelComplete = true;
        this._gs.saveHighScore();

        this._screenFX.flash('#ffffff', 0.5);
        this._cam.shake(6, 0.4);
        this._particles.emit(this._player.x + this._player.width / 2,
            this._player.y + this._player.height / 2, 'burst', 30, '#ffdd44');

        AudioManager.play('pickup');
    },

    _updateLevelComplete(dt) {
        this._levelCompleteTimer += dt;
        this._particles.update(dt);
        this._screenFX.update(dt);
        this._cam.update(dt);
        this._lighting.update(dt, this._player.x, this._player.y);

        if (this._levelCompleteTimer > 2.5) {
            this._sm.switch('victory');
        }
    },

    _updateDeath(dt) {
        this._deathTimer += dt;
        this._particles.update(dt);
        this._screenFX.update(dt);
        this._cam.update(dt);

        // Death particles
        if (this._deathTimer < 0.5) {
            this._particles.emit(this._player.x + this._player.width / 2,
                this._player.y + this._player.height / 2, 'blood', 2, '#cc0000');
        }

        if (this._deathTimer > 2.0) {
            this._sm.switch('gameOver');
        }
    },

    // ========================================================================
    // PRIVATE HELPERS - Hazards
    // ========================================================================

    _checkHazardDamage(dt) {
        const hazards = this._levelManager.hazards || [];
        const px = this._player.x + this._player.width / 2;
        const py = this._player.y + this._player.height / 2;

        for (const hazard of hazards) {
            if (!hazard.active) continue;
            if (hazard.cooldownTimer > 0) continue;

            let hit = false;
            switch (hazard.type) {
                case 'broken_glass': {
                    hit = px > hazard.x && px < hazard.x + (hazard.w || 80) &&
                          py > hazard.y && py < hazard.y + (hazard.h || 10);
                    break;
                }
                case 'biohazard_puddle': {
                    const hdx = px - hazard.x;
                    const hdy = py - hazard.y;
                    const hdist = Math.sqrt(hdx * hdx + hdy * hdy);
                    hit = hdist < (hazard.radius || 30);
                    break;
                }
                case 'tripwire': {
                    // Simple line check
                    const wy = hazard.y || 540;
                    hit = py > wy - 15 && py < wy + 15 &&
                          px > Math.min(hazard.x, hazard.x2 || hazard.x + 120) &&
                          px < Math.max(hazard.x, hazard.x2 || hazard.x + 120);
                    break;
                }
                case 'toxic_gas': {
                    hit = px > hazard.x && px < hazard.x + (hazard.w || 200) &&
                          py > hazard.y && py < hazard.y + (hazard.h || 200);
                    break;
                }
                case 'acid_drip':
                case 'lightning': {
                    hit = px > (hazard.x - 30) && px < (hazard.x + 30);
                    break;
                }
            }

            if (hit && this._player.invincibleTimer <= 0) {
                this._applyDamageToPlayer(hazard.damage || 5, { x: hazard.x, knockback: 3 });
                hazard.cooldownTimer = 1.0; // 1 second invulnerability to same hazard
            }
        }
    },

    // ========================================================================
    // PRIVATE HELPERS - Rendering
    // ========================================================================

    _renderTouchControls(ctx) {
        const joy = this._input.getJoystickInfo();

        // Joystick base
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = COLORS.UI_TEXT;
        ctx.beginPath();
        ctx.arc(joy.baseX, joy.baseY, joy.radius, 0, Math.PI * 2);
        ctx.fill();

        // Joystick knob
        if (joy.active) {
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(joy.knobX, joy.knobY, joy.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Attack button
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = COLORS.UI_ACCENT;
        ctx.beginPath();
        ctx.arc(TOUCH_CONTROLS.ATTACK_BTN_X, TOUCH_CONTROLS.ATTACK_BTN_Y,
            TOUCH_CONTROLS.ATTACK_BTN_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.fillStyle = COLORS.UI_TEXT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ATK', TOUCH_CONTROLS.ATTACK_BTN_X, TOUCH_CONTROLS.ATTACK_BTN_Y);

        // Ability buttons
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = COLORS.ENERGY_FULL;

        ctx.beginPath();
        ctx.arc(TOUCH_CONTROLS.ABILITY1_BTN_X, TOUCH_CONTROLS.ABILITY1_BTN_Y,
            TOUCH_CONTROLS.ABILITY1_BTN_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(TOUCH_CONTROLS.ABILITY2_BTN_X, TOUCH_CONTROLS.ABILITY2_BTN_Y,
            TOUCH_CONTROLS.ABILITY2_BTN_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(TOUCH_CONTROLS.ABILITY3_BTN_X, TOUCH_CONTROLS.ABILITY3_BTN_Y,
            TOUCH_CONTROLS.ABILITY3_BTN_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.4;
        ctx.font = '12px "Courier New", monospace';
        ctx.fillStyle = COLORS.UI_TEXT;
        ctx.fillText('A1', TOUCH_CONTROLS.ABILITY1_BTN_X, TOUCH_CONTROLS.ABILITY1_BTN_Y);
        ctx.fillText('A2', TOUCH_CONTROLS.ABILITY2_BTN_X, TOUCH_CONTROLS.ABILITY2_BTN_Y);
        ctx.fillText('A3', TOUCH_CONTROLS.ABILITY3_BTN_X, TOUCH_CONTROLS.ABILITY3_BTN_Y);

        // Pause button
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = COLORS.UI_TEXT;
        ctx.beginPath();
        ctx.arc(TOUCH_CONTROLS.PAUSE_BTN_X, TOUCH_CONTROLS.PAUSE_BTN_Y,
            TOUCH_CONTROLS.PAUSE_BTN_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.4;
        ctx.fillText('||', TOUCH_CONTROLS.PAUSE_BTN_X, TOUCH_CONTROLS.PAUSE_BTN_Y);

        ctx.globalAlpha = 1.0;
    },

    // ========================================================================
    // PRIVATE HELPERS - Utility
    // ========================================================================

    _rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    },
};
