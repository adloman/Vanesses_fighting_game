// ============================================================================
// core/gameState.js - Singleton Global Game State
// ============================================================================

import { SPECIAL_ENERGY_REGEN_BASE } from '../game.config.js';

class GameState {
    constructor() {
        this.reset();
    }

    /**
     * Reset all game state to defaults. Called when starting a new game.
     */
    reset() {
        this.currentLevel = 1;
        this.score = 0;
        this.highScore = this._loadHighScore() || 0;
        this.selectedCharacter = null;
        this.selectedWeapon = null;

        // Player stats
        this.playerHP = 100;
        this.playerMaxHP = 100;
        this.specialEnergy = 0;
        this.maxSpecialEnergy = 100;

        // Combo system
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboMaxTime = 2.0; // seconds to maintain combo

        // Progression
        this.unlockedWeapons = ['fists']; // start with fists
        this.currentWave = 0;
        this.totalWaves = 0;
        this.levelComplete = false;
        this.bossActive = false;
        this.paused = false;
        this.gameActive = false;
    }

    /**
     * Set up for a new level. Preserves score and unlocks, resets combat state.
     */
    startLevel() {
        this.playerHP = this.playerMaxHP;
        this.specialEnergy = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.currentWave = 0;
        this.levelComplete = false;
        this.bossActive = false;
        this.paused = false;
        this.gameActive = true;
    }

    /**
     * Add points to the score.
     * @param {number} pts
     */
    addScore(pts) {
        this.score += pts;
    }

    /**
     * Increment combo counter and reset the combo timer.
     */
    addCombo() {
        this.comboCount += 1;
        this.comboTimer = this.comboMaxTime;
    }

    /**
     * Reset the combo counter and timer.
     */
    resetCombo() {
        this.comboCount = 0;
        this.comboTimer = 0;
    }

    /**
     * Get the current combo multiplier based on combo count.
     * @returns {number} Multiplier (1x base, +0.5x per combo hit, capped at 5x).
     */
    getComboMultiplier() {
        if (this.comboCount <= 0) return 1.0;
        return Math.min(1.0 + this.comboCount * 0.5, 5.0);
    }

    /**
     * Regenerate special energy. Called each frame.
     * @param {number} dt - Delta time in seconds.
     */
    regenSpecialEnergy(dt) {
        if (this.specialEnergy < this.maxSpecialEnergy) {
            this.specialEnergy = Math.min(
                this.maxSpecialEnergy,
                this.specialEnergy + SPECIAL_ENERGY_REGEN_BASE * dt
            );
        }
    }

    /**
     * Consume special energy for an ability.
     * @param {number} amount
     * @returns {boolean} True if enough energy was available.
     */
    consumeSpecialEnergy(amount) {
        if (this.specialEnergy >= amount) {
            this.specialEnergy -= amount;
            return true;
        }
        return false;
    }

    /**
     * Update combo timer. Call each frame.
     * @param {number} dt - Delta time in seconds.
     */
    updateCombo(dt) {
        if (this.comboCount > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.resetCombo();
            }
        }
    }

    /**
     * Save high score to localStorage.
     */
    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
        try {
            localStorage.setItem('abandonedWard_highScore', String(this.highScore));
        } catch (e) {
            // localStorage may be unavailable in some contexts
        }
    }

    /**
     * Load high score from localStorage.
     * @returns {number}
     * @private
     */
    _loadHighScore() {
        try {
            const stored = localStorage.getItem('abandonedWard_highScore');
            if (stored !== null) {
                return parseInt(stored, 10) || 0;
            }
        } catch (e) {
            // localStorage may be unavailable
        }
        return 0;
    }

    /**
     * Load the high score (public API).
     * @returns {number}
     */
    loadHighScore() {
        this.highScore = this._loadHighScore();
        return this.highScore;
    }

    /**
     * Advance to the next level.
     */
    advanceLevel() {
        this.currentLevel += 1;
        this.levelComplete = false;
        this.bossActive = false;
        this.currentWave = 0;
    }

    /**
     * Get the difficulty multiplier for a given level and scale factor.
     * @param {number} scale - The scaling constant (e.g., ENEMY_HP_SCALE).
     * @returns {number}
     */
    getDifficultyMultiplier(scale) {
        return Math.pow(scale, this.currentLevel - 1);
    }
}

// Singleton instance
const gameState = new GameState();
export default gameState;
