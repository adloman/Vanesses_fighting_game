import { GAME_WIDTH, GAME_HEIGHT, GRAVITY, GROUND_Y, MAX_FALL_SPEED, PLAYER_INVINCIBLE_TIME } from '../game.config.js';
import gameState from '../core/gameState.js';
import { lerp, clamp, distance, randomRange } from '../utils/math.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 56;
        this.vx = 0;
        this.vy = 0;
        this.speed = 160;
        this.hp = 120;
        this.maxHp = 120;
        this.alive = true;
        this.facing = 1;
        this.grounded = true;
        this.character = null;
        this.weapon = null;
        this.abilities = [];
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboMaxTime = 2.0;
        this.specialEnergy = 100;
        this.maxSpecialEnergy = 100;
        this.energyRegen = 12;
        this.invincibleTimer = 0;
        this.stunTimer = 0;
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.abilityTimers = [0, 0, 0];
        this.abilityCooldowns = [0, 0, 0];
        this.isAttacking = false;
        this.attackFrame = 0;
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.damageModifier = 1.0;
        this.defense = 0;
        this.lifestealPercent = 0;
        this.passiveHealRate = 0;
        this.killHealBonus = 0;
        this.flightActive = false;
        this.transformActive = false;
        this.bleedTimers = [];
        this.burnTimers = [];
        this.statusEffects = [];
        this.animState = 'idle';
        this._recentlyHitTimer = 0;
    }

    setCharacter(charData) {
        this.character = charData;
        if (charData) {
            this.maxHp = charData.maxHp || 120;
            this.hp = this.maxHp;
            this.speed = charData.speed || 160;
            this.defense = charData.defense || 0;
            this.damageModifier = charData.damageModifier || 1.0;
            this.specialEnergy = charData.maxSpecialEnergy || 100;
            this.maxSpecialEnergy = charData.maxSpecialEnergy || 100;
            this.energyRegen = charData.energyRegen || 12;
            if (charData.characterType === 'ANGEL') {
                this.passiveHealRate = charData.passiveHealRate || 0.5;
                this.killHealBonus = charData.killHealBonus || 0;
                this.lifestealPercent = 0;
            } else if (charData.characterType === 'DEVIL') {
                this.lifestealPercent = charData.lifestealPercent || 0.15;
                this.killHealBonus = charData.killHealBonus || 15;
                this.passiveHealRate = 0;
            }
            this.abilities = charData.abilities ? charData.abilities.slice() : [];
            this.abilityCooldowns = this.abilities.map(a => a.cooldown || 0);
            this.abilityTimers = this.abilityCooldowns.map(() => 0);
        }
    }

    setWeapon(weaponData) {
        this.weapon = weaponData;
        if (weaponData) {
            this.attackCooldown = weaponData.attackCooldown || 0.4;
        }
    }

    update(dt, inputDir, inputAttack, inputAbilities, levelData) {
        if (!this.alive) return;

        if (this.stunTimer > 0) {
            this.stunTimer -= dt;
            this.isAttacking = false;
            this.attackTimer = 0;
            this.animState = 'stunned';
            this._applyGravity(dt, levelData);
            this._updateStatusEffects(dt);
            this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);
            this._recentlyHitTimer = Math.max(0, this._recentlyHitTimer - dt);
            return;
        }

        this._processInput(dt, inputDir);
        this._applyGravity(dt, levelData);
        this._handleAttacking(dt, inputAttack);
        this._handleAbilities(dt, inputAbilities);
        this._updateCombo(dt);
        this._regenEnergy(dt);
        this._updateStatusEffects(dt);
        this._applyPassive(dt);
        this._updateAnimations(dt);
        this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);
        this.attackCooldown = Math.max(0, this.attackCooldown - dt);
        this._recentlyHitTimer = Math.max(0, this._recentlyHitTimer - dt);
        this._clampPosition(levelData);
    }

    _processInput(dt, inputDir) {
        this.vx = 0;
        if (inputDir !== 0) {
            this.vx = inputDir * this.speed;
            this.facing = inputDir;
            if (this.grounded && !this.isAttacking) {
                this.animState = 'walk';
            }
        } else {
            if (!this.isAttacking) {
                this.animState = 'idle';
            }
        }
    }

    _applyGravity(dt, levelData) {
        if (this.flightActive || this.transformActive) {
            this.vy += GRAVITY * 0.3 * dt;
            if (this.vy > 20) this.vy = 20;
        } else {
            this.vy += GRAVITY * dt;
        }
        if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;
        this.y += this.vy * dt;

        const groundLevel = (levelData && levelData.groundY != null) ? levelData.groundY : GROUND_Y;
        const feetY = this.y + this.height;
        if (feetY >= groundLevel) {
            this.y = groundLevel - this.height;
            this.vy = 0;
            this.grounded = true;
        } else {
            this.grounded = false;
        }
    }

    _handleAttacking(dt, inputAttack) {
        if (this.isAttacking) {
            this.attackTimer -= dt;
            this.attackFrame += dt * 10;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.attackFrame = 0;
                this.animState = this.vx !== 0 ? 'walk' : 'idle';
            }
        }

        if (inputAttack && !this.isAttacking && this.attackCooldown <= 0 && this.weapon) {
            this.isAttacking = true;
            this.attackTimer = this.weapon.attackDuration || 0.3;
            this.attackCooldown = this.weapon.attackCooldown || 0.4;
            this.attackFrame = 0;
            this.animState = 'attack';
        }
    }

    _handleAbilities(dt, inputAbilities) {
        for (let i = 0; i < 3; i++) {
            this.abilityTimers[i] = Math.max(0, this.abilityTimers[i] - dt);
            if (inputAbilities && inputAbilities[i] && this.abilityTimers[i] <= 0) {
                if (i < this.abilities.length) {
                    const ability = this.abilities[i];
                    const cost = ability.energyCost || 0;
                    if (this.specialEnergy >= cost) {
                        this.specialEnergy -= cost;
                        this.abilityTimers[i] = this.abilityCooldowns[i] || ability.cooldown || 1.0;
                    }
                }
            }
        }
    }

    _updateCombo(dt) {
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
                this.comboTimer = 0;
            }
        }
    }

    _regenEnergy(dt) {
        this.specialEnergy = Math.min(
            this.maxSpecialEnergy,
            this.specialEnergy + this.energyRegen * dt
        );
    }

    _updateStatusEffects(dt) {
        for (let i = this.bleedTimers.length - 1; i >= 0; i--) {
            this.bleedTimers[i] -= dt;
            if (this.bleedTimers[i] <= 0) {
                this.bleedTimers.splice(i, 1);
            }
        }
        for (let i = this.burnTimers.length - 1; i >= 0; i--) {
            const burnEntry = this.burnTimers[i];
            burnEntry.timer -= dt;
            burnEntry.tickTimer -= dt;
            if (burnEntry.tickTimer <= 0) {
                this.hp -= burnEntry.damage;
                burnEntry.tickTimer = 0.5;
                if (this.hp <= 0) {
                    this.hp = 0;
                    this.alive = false;
                }
            }
            if (burnEntry.timer <= 0) {
                this.burnTimers.splice(i, 1);
            }
        }
    }

    _applyPassive(dt) {
        if (this.character && this.character.characterType === 'ANGEL' && this.passiveHealRate > 0) {
            this.hp = Math.min(this.maxHp, this.hp + this.passiveHealRate * dt);
        }
    }

    _updateAnimations(dt) {
        if (this.animState === 'walk' || (this.vx !== 0 && this.animState !== 'attack')) {
            this.walkTimer += dt * 8;
            this.walkFrame = Math.floor(this.walkTimer) % 4;
        } else {
            this.walkTimer = 0;
            this.walkFrame = 0;
        }
    }

    _clampPosition(levelData) {
        const camX = gameState.camera ? gameState.camera.x : 0;
        const worldWidth = (levelData && levelData.width) ? levelData.width : GAME_WIDTH * 3;
        this.x = clamp(this.x, camX + this.width, camX + worldWidth - this.width - GAME_WIDTH);
    }

    attack() {
        if (!this.isAttacking || !this.weapon) return null;
        const hitbox = this.getAttackHitbox();
        if (!hitbox) return null;

        let damage = this.weapon.damage * this.damageModifier;
        let knockback = this.weapon.knockback || 3;
        let specialEffect = null;

        if (this.weapon.specialEffect) {
            specialEffect = this.weapon.specialEffect;
        }

        this.comboCount++;
        this.comboTimer = this.comboMaxTime;

        if (this.comboCount >= 3) {
            damage *= 1.25;
            knockback *= 1.5;
            this.comboCount = 0;
        }

        return {
            x: hitbox.x,
            y: hitbox.y,
            w: hitbox.w,
            h: hitbox.h,
            damage: damage,
            knockback: knockback,
            specialEffect: specialEffect
        };
    }

    useAbility(index) {
        if (index < 0 || index >= this.abilities.length) return null;
        if (this.abilityTimers[index] > 0) return null;

        const ability = this.abilities[index];
        const cost = ability.energyCost || 0;
        if (this.specialEnergy < cost) return null;

        this.specialEnergy -= cost;
        this.abilityTimers[index] = this.abilityCooldowns[index] || ability.cooldown || 1.0;

        const effectX = this.x + this.width / 2 + this.facing * 40;
        const effectY = this.y + this.height / 2;

        return {
            type: ability.type || 'projectile',
            x: effectX,
            y: effectY,
            direction: this.facing,
            damage: (ability.damage || 10) * this.damageModifier,
            radius: ability.radius || 30,
            range: ability.range || 200,
            duration: ability.duration || 0.5,
            knockback: ability.knockback || 5,
            specialEffect: ability.specialEffect || null,
            speed: ability.speed || 300,
            name: ability.name || 'ability'
        };
    }

    takeDamage(amount, source) {
        if (this.invincibleTimer > 0) return 0;
        if (!this.alive) return 0;

        let reduced = amount - this.defense;
        if (reduced < 1) reduced = 1;
        this.hp -= reduced;
        this.invincibleTimer = PLAYER_INVINCIBLE_TIME || 0.5;
        this._recentlyHitTimer = 0.15;

        if (this.character && this.character.characterType === 'DEVIL') {
            const stealAmount = reduced * this.lifestealPercent;
            this.hp = Math.min(this.maxHp, this.hp + stealAmount);
        }

        if (source && source.knockback) {
            this.vx = (source.x < this.x ? 1 : -1) * source.knockback * 60;
            this.vy = -80;
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }

        return reduced;
    }

    onKill(enemy) {
        if (this.character && this.character.characterType === 'DEVIL' && this.killHealBonus > 0) {
            this.hp = Math.min(this.maxHp, this.hp + this.killHealBonus);
        }
    }

    getAttackHitbox() {
        if (!this.weapon || !this.isAttacking) return null;

        const wep = this.weapon;
        let range = wep.range || 40;
        let hitW = range;
        let hitH = wep.height || 24;

        let hx, hy;
        if (this.facing === 1) {
            hx = this.x + this.width;
            hy = this.y + this.height * 0.25;
        } else {
            hx = this.x - range;
            hy = this.y + this.height * 0.25;
        }

        return { x: hx, y: hy, w: hitW, h: hitH };
    }

    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            w: this.width,
            h: this.height
        };
    }

    draw(ctx, cam) {
        if (!this.alive) return;

        const drawX = this.x - cam.x;
        const drawY = this.y - cam.y;
        const cx = drawX + this.width / 2;
        const cy = drawY + this.height / 2;

        ctx.save();

        if (this.invincibleTimer > 0) {
            ctx.globalAlpha = Math.sin(Date.now() * 0.02) > 0 ? 0.4 : 1.0;
        }

        const bodyW = this.width;
        const bodyH = 28;
        const bodyX = drawX;
        const bodyY = drawY + 16;

        let bodyColor = '#6FA8DC';
        let headColor = '#F5DEB3';
        let limbColor = '#4A6B8A';

        if (this.character) {
            if (this.character.characterType === 'ANGEL') {
                bodyColor = '#E8E8F0';
                headColor = '#F5DEB3';
                limbColor = '#C0C0D0';
            } else if (this.character.characterType === 'DEVIL') {
                bodyColor = '#8B0000';
                headColor = '#D4A574';
                limbColor = '#660000';
            }
        }

        if (this._recentlyHitTimer > 0) {
            ctx.fillStyle = '#FF4444';
            ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
        } else {
            ctx.fillStyle = bodyColor;
            ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
        }

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(bodyX, bodyY, bodyW, bodyH);

        const headR = 10;
        const headCX = cx;
        const headCY = drawY + 10;

        ctx.beginPath();
        ctx.arc(headCX, headCY, headR, 0, Math.PI * 2);
        ctx.fillStyle = headColor;
        ctx.fill();
        ctx.stroke();

        if (this.character && this.character.characterType === 'ANGEL') {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(headCX, headCY - headR - 4, 8, 4, 0, Math.PI, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = 1;
        } else if (this.character && this.character.characterType === 'DEVIL') {
            ctx.fillStyle = '#4A0000';
            ctx.beginPath();
            ctx.moveTo(headCX - 7, headCY - headR + 2);
            ctx.lineTo(headCX - 10, headCY - headR - 10);
            ctx.lineTo(headCX - 3, headCY - headR + 1);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(headCX + 7, headCY - headR + 2);
            ctx.lineTo(headCX + 10, headCY - headR - 10);
            ctx.lineTo(headCX + 3, headCY - headR + 1);
            ctx.fill();
        }

        const legW = 8;
        const legH = 12;
        const legY = bodyY + bodyH;
        let leftLegOffset = 0;
        let rightLegOffset = 0;

        if (this.animState === 'walk') {
            const phase = this.walkFrame;
            if (phase === 0) { leftLegOffset = 0; rightLegOffset = 4; }
            else if (phase === 1) { leftLegOffset = 3; rightLegOffset = 0; }
            else if (phase === 2) { leftLegOffset = 0; rightLegOffset = -4; }
            else if (phase === 3) { leftLegOffset = -3; rightLegOffset = 0; }
        }

        ctx.fillStyle = limbColor;
        ctx.fillRect(cx - legW - 1 + leftLegOffset, legY, legW, legH);
        ctx.fillRect(cx + 1 + rightLegOffset, legY, legW, legH);

        const shoulderY = bodyY + 4;
        const armLen = 16;
        let leftArmAngle = Math.PI * 0.5;
        let rightArmAngle = Math.PI * 0.5;

        if (this.animState === 'walk') {
            const swing = Math.sin(this.walkTimer * 1.5) * 0.3;
            leftArmAngle += swing;
            rightArmAngle -= swing;
        }

        if (this.animState === 'attack' && this.weapon) {
            const progress = Math.min(this.attackTimer / (this.weapon.attackDuration || 0.3), 1.0);
            if (this.facing === 1) {
                rightArmAngle = Math.PI * (0.2 - 0.8 * progress);
            } else {
                rightArmAngle = Math.PI * (0.8 + 0.2 * progress);
            }
        }

        const leftShoulderX = bodyX + 3;
        const rightShoulderX = bodyX + bodyW - 3;

        ctx.strokeStyle = limbColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, shoulderY);
        ctx.lineTo(
            leftShoulderX + Math.cos(leftArmAngle) * armLen,
            shoulderY + Math.sin(leftArmAngle) * armLen
        );
        ctx.stroke();

        let weaponTipX = rightShoulderX + Math.cos(rightArmAngle) * armLen;
        let weaponTipY = shoulderY + Math.sin(rightArmAngle) * armLen;

        ctx.beginPath();
        ctx.moveTo(rightShoulderX, shoulderY);
        ctx.lineTo(weaponTipX, weaponTipY);
        ctx.stroke();

        if (this.weapon && (this.isAttacking || this.attackCooldown > this.weapon.attackCooldown * 0.7)) {
            const wepLen = this.weapon.range || 30;
            const wepAngle = rightArmAngle;
            const wepEndX = rightShoulderX + Math.cos(wepAngle) * (armLen + wepLen);
            const wepEndY = shoulderY + Math.sin(wepAngle) * (armLen + wepLen);

            ctx.strokeStyle = this.weapon.color || '#AAAAAA';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(weaponTipX, weaponTipY);
            ctx.lineTo(wepEndX, wepEndY);
            ctx.stroke();

            ctx.fillStyle = this.weapon.color || '#CCCCCC';
            ctx.beginPath();
            ctx.arc(wepEndX, wepEndY, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.burnTimers.length > 0) {
            ctx.fillStyle = '#FF6600';
            for (let i = 0; i < 3; i++) {
                const fx = drawX + randomRange(2, bodyW - 2);
                const fy = drawY + randomRange(0, bodyH + 8);
                const fs = randomRange(2, 5);
                ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01 + i) * 0.3;
                ctx.beginPath();
                ctx.moveTo(fx, fy - fs);
                ctx.lineTo(fx - fs * 0.5, fy + fs * 0.5);
                ctx.lineTo(fx + fs * 0.5, fy + fs * 0.5);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }

        if (this.bleedTimers.length > 0) {
            ctx.fillStyle = '#CC0000';
            for (let i = 0; i < 2; i++) {
                const dx = drawX + randomRange(-4, bodyW + 4);
                const dy = bodyY + bodyH + randomRange(0, 12);
                ctx.beginPath();
                ctx.ellipse(dx, dy, 2, 3, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}
