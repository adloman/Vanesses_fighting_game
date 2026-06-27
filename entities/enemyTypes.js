import { Enemy } from './enemy.js';
import { ENEMY_TYPES, BOSSES } from '../data/enemyStats.js';
import { LEVELS } from '../data/levelData.js';

export function createEnemy(x, y, typeKey, level = 1) {
    const typeData = ENEMY_TYPES[typeKey];
    if (!typeData) {
        console.warn(`Unknown enemy type: ${typeKey}, falling back to WALKER`);
        return createEnemy(x, y, 'WALKER', level);
    }

    const scaledData = _scaleEnemyStats({ ...typeData }, level);
    scaledData.enemyType = typeKey;
    const enemy = new Enemy(x, y, scaledData);
    return enemy;
}

export function createBoss(x, y, bossKey, level = 1) {
    const bossData = BOSSES[bossKey];
    if (!bossData) {
        console.warn(`Unknown boss type: ${bossKey}, falling back to DR_ROT`);
        return createBoss(x, y, 'DR_ROT', level);
    }

    const scaledData = _scaleBossStats({ ...bossData }, level);
    scaledData.enemyType = bossKey;
    scaledData.behavior = 'boss';
    const boss = new Enemy(x, y, scaledData);
    const bossConfig = {
        score: 200,
        phaseThresholds: _generatePhaseThresholds(bossData.phases || 2),
        color: bossData.color,
        width: bossData.width,
        height: bossData.height,
        specialProperties: {}
    };
    boss.setBoss(bossConfig);
    return boss;
}

export function getEnemyPool(levelIndex) {
    const levelInfo = LEVELS[levelIndex];
    if (!levelInfo || !levelInfo.waves) {
        console.warn(`Unknown level index: ${levelIndex}, returning default pool`);
        return ['WALKER'];
    }

    // Collect all unique enemy types from wave compositions
    const pool = new Set();
    for (const wave of levelInfo.waves) {
        if (wave.enemies) {
            for (const group of wave.enemies) {
                if (group.type) pool.add(group.type);
            }
        }
    }
    return pool.size > 0 ? Array.from(pool) : ['WALKER'];
}

function _generatePhaseThresholds(phaseCount) {
    const thresholds = [];
    for (let i = 1; i < phaseCount; i++) {
        thresholds.push(1 - (i / phaseCount));
    }
    return thresholds;
}

function _scaleEnemyStats(stats, level) {
    if (level <= 1) return stats;

    const hpScale = 1 + (level - 1) * 0.3;
    const dmgScale = 1 + (level - 1) * 0.15;
    const spdScale = 1 + (level - 1) * 0.05;

    stats.hp = Math.floor((stats.hp || 30) * hpScale);
    stats.damage = Math.floor((stats.damage || 10) * dmgScale);
    stats.speed = Math.floor((stats.speed || 60) * spdScale);
    stats.maxHp = stats.hp;

    return stats;
}

function _scaleBossStats(stats, level) {
    if (level <= 1) return stats;

    const hpScale = 1 + (level - 1) * 0.35;
    const dmgScale = 1 + (level - 1) * 0.15;
    const spdScale = 1 + (level - 1) * 0.05;

    stats.hp = Math.floor((stats.hp || 100) * hpScale);
    stats.damage = Math.floor((stats.damage || 20) * dmgScale);
    stats.speed = Math.floor((stats.speed || 40) * spdScale);
    stats.maxHp = stats.hp;

    return stats;
}
