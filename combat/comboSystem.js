// comboSystem.js - Abandoned Ward
// Combo tracking system: counts consecutive hits, provides a damage
// multiplier that scales with combo length, and displays combo text.

export class ComboSystem {
    constructor() {
        /** Number of consecutive hits in the current combo. */
        this.comboCount = 0;

        /** Time remaining before the combo expires (seconds). */
        this.comboTimer = 0;

        /** Maximum time window between hits to keep the combo alive. */
        this.maxTime = 2.0;

        /** Maximum combo count before the multiplier caps out. */
        this.maxCombo = 20;

        /** Best combo ever achieved (lifetime tracker). */
        this.bestCombo = 0;
    }

    /**
     * Register a new hit. Increments the combo count, resets the
     * timer to maxTime, and updates the bestCombo record.
     */
    registerHit() {
        if (this.comboCount < this.maxCombo) {
            this.comboCount++;
        }
        this.comboTimer = this.maxTime;

        if (this.comboCount > this.bestCombo) {
            this.bestCombo = this.comboCount;
        }
    }

    /**
     * Per-frame update. Decrements the combo timer. If the timer
     * expires, resets the combo to zero.
     *
     * @param {number} dt - Delta time in seconds.
     */
    update(dt) {
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.comboTimer = 0;
                this.comboCount = 0;
            }
        }
    }

    /**
     * Get the current combo multiplier.
     *
     * Formula: 1 + floor(comboCount / 5) * 0.25
     * Capped at 5.0x maximum.
     *
     * Breakpoints:
     *   0-4 hits  = 1.00x
     *   5-9 hits  = 1.25x
     *  10-14 hits = 1.50x
     *  15-19 hits = 1.75x
     *  20+ hits   = 2.00x (capped, but maxCombo is 20 so this is the ceiling)
     *
     * @returns {number} Multiplier value >= 1.
     */
    getMultiplier() {
        const tier = Math.floor(this.comboCount / 5);
        const multiplier = 1 + tier * 0.25;
        return Math.min(multiplier, 5.0);
    }

    /**
     * Get a formatted combo string for display.
     *
     * Format varies by combo count:
     *   0 hits:   ""
     *   1-2 hits: "{count} HIT"
     *   3-4 hits: "{count} HITS"
     *   5+:      "{count} HIT COMBO! x{multiplier}"
     *
     * @returns {string}
     */
    getComboText() {
        if (this.comboCount === 0) return '';

        const multiplier = this.getMultiplier();

        if (this.comboCount === 1) {
            return '1 HIT';
        }

        if (this.comboCount < 5) {
            return `${this.comboCount} HITS`;
        }

        if (multiplier >= 2.0) {
            return `${this.comboCount} HIT COMBO!! x${multiplier.toFixed(2)}`;
        }

        return `${this.comboCount} HIT COMBO! x${multiplier.toFixed(2)}`;
    }

    /**
     * Reset the combo count and timer to zero.
     * Does not reset bestCombo.
     */
    reset() {
        this.comboCount = 0;
        this.comboTimer = 0;
    }

    /**
     * Get the best combo achieved (lifetime).
     * @returns {number}
     */
    getBestCombo() {
        return this.bestCombo;
    }

    /**
     * Get the current combo count.
     * @returns {number}
     */
    getCount() {
        return this.comboCount;
    }

    /**
     * Check whether the combo is currently active (timer > 0 and count > 0).
     * @returns {boolean}
     */
    isActive() {
        return this.comboCount > 0 && this.comboTimer > 0;
    }
}
