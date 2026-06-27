// ============================================================================
// core/collisionManager.js - Spatial Grid-Based Collision Detection
// ============================================================================

const CELL_SIZE = 64;

export class CollisionManager {
    constructor() {
        this._grid = new Map();
        this._entities = new Set();
    }

    /**
     * Clear the entire collision system.
     */
    clear() {
        this._grid.clear();
        this._entities.clear();
    }

    /**
     * Register an entity for collision detection.
     * Entity must have: x, y, width, height (AABB).
     * @param {Object} entity
     */
    add(entity) {
        this._entities.add(entity);

        // Insert into grid cells
        const cells = this._getCellsForEntity(entity);
        for (const key of cells) {
            if (!this._grid.has(key)) {
                this._grid.set(key, new Set());
            }
            this._grid.get(key).add(entity);
        }
    }

    /**
     * Unregister an entity from collision detection.
     * @param {Object} entity
     */
    remove(entity) {
        if (!this._entities.has(entity)) return;

        // Remove from all grid cells
        const cells = this._getCellsForEntity(entity);
        for (const key of cells) {
            const cell = this._grid.get(key);
            if (cell) {
                cell.delete(entity);
                if (cell.size === 0) {
                    this._grid.delete(key);
                }
            }
        }

        this._entities.delete(entity);
    }

    /**
     * Update an entity's position in the grid (call after movement).
     * @param {Object} entity
     */
    update(entity) {
        if (!this._entities.has(entity)) return;

        // Remove from old cells
        const oldCells = this._getCellsForEntity(entity);
        for (const key of oldCells) {
            const cell = this._grid.get(key);
            if (cell) {
                cell.delete(entity);
                if (cell.size === 0) {
                    this._grid.delete(key);
                }
            }
        }

        // Re-add to new cells
        const newCells = this._getCellsForEntity(entity);
        for (const key of newCells) {
            if (!this._grid.has(key)) {
                this._grid.set(key, new Set());
            }
            this._grid.get(key).add(entity);
        }
    }

    /**
     * Get the grid cell key for a given world position.
     * @param {number} x
     * @param {number} y
     * @returns {string}
     * @private
     */
    _cellKey(x, y) {
        const cx = Math.floor(x / CELL_SIZE);
        const cy = Math.floor(y / CELL_SIZE);
        return `${cx},${cy}`;
    }

    /**
     * Get all grid cell keys that an entity overlaps.
     * @param {Object} entity - Must have x, y, width, height.
     * @returns {string[]}
     * @private
     */
    _getCellsForEntity(entity) {
        const keys = [];
        const startX = Math.floor(entity.x / CELL_SIZE);
        const startY = Math.floor(entity.y / CELL_SIZE);
        const endX = Math.floor((entity.x + entity.width - 1) / CELL_SIZE);
        const endY = Math.floor((entity.y + entity.height - 1) / CELL_SIZE);

        for (let cx = startX; cx <= endX; cx++) {
            for (let cy = startY; cy <= endY; cy++) {
                keys.push(`${cx},${cy}`);
            }
        }

        return keys;
    }

    /**
     * Query all entities that potentially overlap with a given area.
     * @param {number} x - X position of the query area.
     * @param {number} y - Y position of the query area.
     * @param {number} w - Width of the query area.
     * @param {number} h - Height of the query area.
     * @returns {Object[]} Array of entities in the area.
     */
    queryArea(x, y, w, h) {
        const result = new Set();
        const startX = Math.floor(x / CELL_SIZE);
        const startY = Math.floor(y / CELL_SIZE);
        const endX = Math.floor((x + w - 1) / CELL_SIZE);
        const endY = Math.floor((y + h - 1) / CELL_SIZE);

        for (let cx = startX; cx <= endX; cx++) {
            for (let cy = startY; cy <= endY; cy++) {
                const cell = this._grid.get(`${cx},${cy}`);
                if (cell) {
                    for (const entity of cell) {
                        result.add(entity);
                    }
                }
            }
        }

        return Array.from(result);
    }

    /**
     * Check if two entities overlap using AABB collision.
     * @param {Object} a - Entity with x, y, width, height.
     * @param {Object} b - Entity with x, y, width, height.
     * @returns {boolean}
     */
    checkCollision(a, b) {
        if (a === b) return false;

        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    /**
     * Resolve an overlap between two entities by pushing them apart.
     * The entity with the smaller penetration vector component is pushed.
     * @param {Object} a - Entity with x, y, width, height.
     * @param {Object} b - Entity with x, y, width, height.
     */
    resolveOverlap(a, b) {
        // Calculate overlap on each axis
        const overlapLeft = (a.x + a.width) - b.x;
        const overlapRight = (b.x + b.width) - a.x;
        const overlapTop = (a.y + a.height) - b.y;
        const overlapBottom = (b.y + b.height) - a.y;

        // Find the smallest overlap axis
        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        if (minOverlapX < minOverlapY) {
            // Push apart horizontally
            if (overlapLeft < overlapRight) {
                a.x -= minOverlapX;
            } else {
                a.x += minOverlapX;
            }
        } else {
            // Push apart vertically
            if (overlapTop < overlapBottom) {
                a.y -= minOverlapY;
            } else {
                a.y += minOverlapY;
            }
        }
    }

    /**
     * Check all registered entities against each other and return
     * an array of collision pairs.
     * @returns {{a: Object, b: Object}[]}
     */
    checkAll() {
        const pairs = [];
        const checked = new Set();

        for (const entity of this._entities) {
            // Get all entities in the same cells
            const nearby = this.queryArea(entity.x, entity.y, entity.width, entity.height);

            for (const other of nearby) {
                if (entity === other) continue;

                // Create a unique pair key (sorted by reference)
                const pairKey = entity < other
                    ? `${entity.id || ''}|${other.id || ''}`
                    : `${other.id || ''}|${entity.id || ''}`;

                // Use a simpler approach: check if pair was already processed
                const pairId = entity === other ? null : (entity._collCheckId !== undefined && other._collCheckId !== undefined)
                    ? (entity._collCheckId < other._collCheckId
                        ? `${entity._collCheckId}-${other._collCheckId}`
                        : `${other._collCheckId}-${entity._collCheckId}`)
                    : null;

                if (pairId && checked.has(pairId)) continue;
                if (pairId) checked.add(pairId);

                if (this.checkCollision(entity, other)) {
                    pairs.push({ a: entity, b: other });
                }
            }
        }

        return pairs;
    }

    /**
     * Get the total number of registered entities.
     * @returns {number}
     */
    get entityCount() {
        return this._entities.size;
    }

    /**
     * Get the number of occupied grid cells.
     * @returns {number}
     */
    get cellCount() {
        return this._grid.size;
    }
}
