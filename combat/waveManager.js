// waveManager.js - Abandoned Ward
// Wave management system: loads wave compositions from level data,
// spawns enemies at intervals, tracks wave progress, and handles
// boss spawning and level completion.

import { WAVE_COMPOSITIONS } from '../data/levelData.js';
import { LEVELS } from '../data/levelData.js';
import { ENEMY_TYPES } from '../data/enemyStats.js';
import { BOSSES } from '../data/enemyStats.js';
import { createEnemy } from '../entities/enemyTypes.js';
import { createBoss } from '../entities/enemyTypes.js';

export class WaveManager {
    constructor() {
        /** Array of wave definitions loaded from WAVE_COMPOSITIONS. */
        this.waves = [];

        /** Index of the currently active wave within this.waves. */
        this.currentWaveIndex = 0;

        /** Queue of enemy type keys waiting to be spawned for the current wave. */
        this.spawnQueue = [];

        /** Timer counting down to the next spawn (seconds). */
        this.spawnTimer = 0;

        /** Whether a wave is currently in progress. */
        this.waveActive = false;

        /** Whether all enemies in the spawn queue have been spawned. */
        this.allSpawned = false;

        /** Whether all waves including the boss wave are complete. */
        this.allWavesComplete = false;

        /** Whether the boss for this level has been spawned. */
        this.bossSpawned = false;

        /** The key of the boss for the current level. */
        this.currentBossKey = null;

        /** Total enemies spawned across all waves so far. */
        this._totalSpawned = 0;

        /** Total enemies spawned in the current wave. */
        this._waveSpawnCount = 0;

        /** Interval between spawns in seconds. */
        this._spawnInterval = 0.5;

        /** Spawn X offset range (enemies spawn off-screen). */
        this._spawnMargin = 80;

        /** Reference to current level data for enemy creation scaling. */
        this._levelIndex = 0;
    }

    /**
     * Load wave compositions for the given level.
     *
     * @param {number} levelIndex - Zero-based level index (0 = Level 1).
     */
    loadLevel(levelIndex) {
        this.reset();

        this._levelIndex = levelIndex;

        // Get wave compositions for this level
        const levelWaves = WAVE_COMPOSITIONS[levelIndex];
        if (!levelWaves || levelWaves.length === 0) {
            console.warn(`WaveManager: no wave compositions for level ${levelIndex}`);
            return;
        }

        // Get the boss key from level data
        const levelData = LEVELS[levelIndex];
        this.currentBossKey = levelData ? levelData.bossKey : null;

        // Parse wave compositions into structured wave data.
        // Each wave entry is an array of [enemyType, count, enemyType, count, ...] pairs.
        this.waves = levelWaves.map(waveEntry => {
            if (waveEntry.length === 1 && waveEntry[0] === 'boss') {
                // Boss wave sentinel
                return { isBossWave: true, enemies: [] };
            }

            const enemyList = [];
            // Walk the flat array in pairs of [type, count].
            for (let i = 0; i < waveEntry.length; i += 2) {
                const typeKey = waveEntry[i];
                const count = waveEntry[i + 1] || 0;
                for (let c = 0; c < count; c++) {
                    enemyList.push(typeKey);
                }
            }

            return { isBossWave: false, enemies: enemyList };
        });

        this.currentWaveIndex = 0;
        this.allWavesComplete = false;
    }

    /**
     * Per-frame update. Processes the spawn queue, spawns enemies at
     * intervals, checks wave completion, and advances to the next wave.
     *
     * @param {number} dt - Delta time in seconds.
     * @param {number} cameraX - Current camera X offset (for spawn positioning).
     * @param {number} cameraY - Current camera Y offset (for spawn positioning).
     * @param {{ x: number, y: number }} player - Player position for spawn placement.
     * @returns {Array<{ entity: object, isBoss: boolean }>} Array of newly spawned enemies.
     */
    update(dt, cameraX = 0, cameraY = 0, player = null) {
        const spawned = [];

        if (this.allWavesComplete) {
            return spawned;
        }

        // If no wave is active, try to start the next one.
        if (!this.waveActive) {
            if (this.currentWaveIndex < this.waves.length) {
                this.startNextWave(cameraX, player);
            } else {
                this.allWavesComplete = true;
                return spawned;
            }
        }

        // If the wave is active, process the spawn queue.
        if (this.waveActive && this.spawnQueue.length > 0) {
            this.spawnTimer -= dt;

            if (this.spawnTimer <= 0) {
                // Spawn one enemy from the queue
                const enemyTypeKey = this.spawnQueue.shift();
                const entity = this._createEnemyAt(enemyTypeKey, cameraX, player);
                if (entity) {
                    spawned.push({ entity: entity, isBoss: false });
                    this._waveSpawnCount++;
                    this._totalSpawned++;
                }

                // Reset spawn timer
                this.spawnTimer = this._spawnInterval;
            }
        }

        // Check if all enemies in the queue have been spawned.
        if (this.spawnQueue.length === 0 && !this.allSpawned) {
            this.allSpawned = true;
        }

        // Handle boss wave: spawn boss once all regular enemies are cleared.
        if (this.waveActive && this.allSpawned) {
            const wave = this.waves[this.currentWaveIndex];
            if (wave && wave.isBossWave && !this.bossSpawned && this.currentBossKey) {
                const boss = this._createBossAt(cameraX, player);
                if (boss) {
                    spawned.push({ entity: boss, isBoss: true });
                    this.bossSpawned = true;
                    this._waveSpawnCount++;
                    this._totalSpawned++;
                }
                // Boss wave is done once boss is spawned
                this.waveActive = false;
            }
        }

        return spawned;
    }

    /**
     * Begin the next wave. Populates the spawn queue with enemies from
     * the wave composition and resets wave state.
     *
     * @param {number} cameraX - Camera X offset for spawn positioning.
     * @param {{ x: number, y: number }|null} player - Player for directional spawning.
     */
    startNextWave(cameraX = 0, player = null) {
        if (this.currentWaveIndex >= this.waves.length) {
            this.allWavesComplete = true;
            return;
        }

        const wave = this.waves[this.currentWaveIndex];
        this.spawnQueue = wave.enemies.slice(); // Copy the array
        this._waveSpawnCount = 0;
        this.allSpawned = wave.enemies.length === 0;
        this.waveActive = true;
        this.spawnTimer = this._spawnInterval; // First spawn comes after initial delay

        // If this is a boss wave with no regular enemies, mark allSpawned immediately.
        if (wave.isBossWave) {
            this.allSpawned = true;
        }
    }

    /**
     * Check whether the current wave is complete.
     * A wave is complete when all enemies have been spawned AND
     * all spawned enemies are dead (or it was a boss wave and the
     * boss has been spawned).
     *
     * @param {Array<object>} enemies - Array of all active enemy entities.
     * @returns {boolean}
     */
    isWaveComplete(enemies) {
        if (!this.waveActive && !this.allSpawned) {
            // Wave hasn't started yet or just finished
            return false;
        }

        if (!this.allSpawned) {
            return false;
        }

        const wave = this.waves[this.currentWaveIndex];
        if (wave && wave.isBossWave) {
            // Boss wave is complete once boss has been spawned (enemies checked externally).
            return this.bossSpawned;
        }

        // Regular wave: check if any enemies from this wave's spawn are still alive.
        // Since we track spawn counts, we check if there are still live enemies.
        // The caller should check against the total alive enemies.
        // We return true when all have been spawned, leaving it to the playState
        // to check if all enemies are dead.
        return true;
    }

    /**
     * Mark the current wave as complete and advance to the next.
     * Called by the playState when all wave enemies are dead.
     */
    advanceWave() {
        if (this.currentWaveIndex < this.waves.length) {
            this.currentWaveIndex++;
            this.waveActive = false;
            this.allSpawned = false;
            this.spawnQueue = [];
            this._waveSpawnCount = 0;
        }

        // Check if all waves are done.
        if (this.currentWaveIndex >= this.waves.length) {
            this.allWavesComplete = true;
        }
    }

    /**
     * Check whether the entire level is complete.
     * This means all waves have been processed and the boss has been defeated.
     *
     * @returns {boolean}
     */
    isLevelComplete() {
        return this.allWavesComplete && this.bossSpawned;
    }

    /**
     * Get the total number of enemies spawned in the current wave.
     * @returns {number}
     */
    getSpawnedEnemyCount() {
        return this._waveSpawnCount;
    }

    /**
     * Get information about the current wave for UI display.
     *
     * @returns {{ waveNumber: number, totalWaves: number, enemyCount: number,
     *            isBossWave: boolean, bossName: string|null }}
     */
    getCurrentWaveInfo() {
        const waveNumber = this.currentWaveIndex + 1;
        const totalWaves = this.waves.length;
        const enemyCount = this.spawnQueue.length + this._waveSpawnCount;

        let isBossWave = false;
        let bossName = null;

        if (this.currentWaveIndex < this.waves.length) {
            const wave = this.waves[this.currentWaveIndex];
            isBossWave = wave.isBossWave;
            if (isBossWave && this.currentBossKey && BOSSES[this.currentBossKey]) {
                bossName = BOSSES[this.currentBossKey].name;
            }
        }

        return {
            waveNumber: waveNumber,
            totalWaves: totalWaves,
            enemyCount: enemyCount,
            isBossWave: isBossWave,
            bossName: bossName
        };
    }

    /**
     * Reset all state to initial values.
     */
    reset() {
        this.waves = [];
        this.currentWaveIndex = 0;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.waveActive = false;
        this.allSpawned = false;
        this.allWavesComplete = false;
        this.bossSpawned = false;
        this.currentBossKey = null;
        this._totalSpawned = 0;
        this._waveSpawnCount = 0;
        this._levelIndex = 0;
    }

    /**
     * Create an enemy entity positioned off-screen relative to the camera.
     *
     * @param {string} enemyTypeKey - Enemy type key (e.g. WALKER, RUNNER).
     * @param {number} cameraX - Current camera X offset.
     * @param {{ x: number, y: number }|null} player - Player for directional placement.
     * @returns {object|null} The created enemy entity, or null on failure.
     * @private
     */
    _createEnemyAt(enemyTypeKey, cameraX, player) {
        const level = this._levelIndex + 1;
        let spawnX;
        const spawnY = 400; // Default spawn Y near ground level

        // Spawn enemies on the side opposite to the player, or alternating.
        if (player) {
            const playerSide = player.x > (cameraX + 640) ? 1 : -1; // Which side player is on
            // Spawn on the far side
            if (playerSide === 1) {
                // Player is on right, spawn on left edge
                spawnX = cameraX - this._spawnMargin;
            } else {
                // Player is on left, spawn on right edge
                spawnX = cameraX + 1280 + this._spawnMargin;
            }
        } else {
            // Alternate sides if no player reference
            spawnX = (this._waveSpawnCount % 2 === 0)
                ? cameraX - this._spawnMargin
                : cameraX + 1280 + this._spawnMargin;
        }

        // Add slight random offset to avoid stacking
        spawnX += (Math.random() - 0.5) * 40;

        try {
            return createEnemy(spawnX, spawnY, enemyTypeKey, level);
        } catch (e) {
            console.warn(`WaveManager: failed to create enemy "${enemyTypeKey}":`, e);
            return null;
        }
    }

    /**
     * Create a boss entity positioned in front of the camera center.
     *
     * @param {number} cameraX - Current camera X offset.
     * @param {{ x: number, y: number }|null} player - Player for directional placement.
     * @returns {object|null} The created boss entity, or null on failure.
     * @private
     */
    _createBossAt(cameraX, player) {
        if (!this.currentBossKey) return null;

        const level = this._levelIndex + 1;
        let spawnX;

        // Boss spawns at center-right of camera view
        spawnX = cameraX + 900 + (Math.random() - 0.5) * 100;

        try {
            return createBoss(spawnX, 380, this.currentBossKey, level);
        } catch (e) {
            console.warn(`WaveManager: failed to create boss "${this.currentBossKey}":`, e);
            return null;
        }
    }
}
