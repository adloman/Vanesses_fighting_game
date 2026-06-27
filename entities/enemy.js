import { GRAVITY, GROUND_Y, MAX_FALL_SPEED, GAME_WIDTH } from '../game.config.js';
import { clamp, randomRange, distance } from '../utils/math.js';

export class Enemy {
    constructor(x, y, typeData) {
        this.x = x;
        this.y = y;
        this.width = typeData.width || 28;
        this.height = typeData.height || 52;
        this.hp = typeData.hp || 30;
        this.maxHp = this.hp;
        this.speed = typeData.speed || 60;
        this.damage = typeData.damage || 10;
        this.attackRange = typeData.attackRange || 40;
        this.aggroRange = typeData.aggroRange || 200;
        this.attackCooldown = typeData.attackCooldown || 1.0;
        this.attackTimer = 0;
        this.alive = true;
        this.facing = 1;
        this.grounded = true;
        this.type = 'enemy';
        this.enemyType = typeData.enemyType || 'zombie';
        this.isBoss = false;
        this.score = typeData.score || 10;
        this.color = typeData.color || '#4A6B4A';
        this.behavior = typeData.behavior || 'walk';
        this.aiState = 'idle';
        this.aiTimer = randomRange(0.5, 1.5);
        this.targetX = x;
        this.stunTimer = 0;
        this.armor = typeData.armor || 0;
        this.burnTimer = 0;
        this.burnDmg = 0;
        this.bleedTimer = 0;
        this.bleedDmg = 0;
        this.animState = 'idle';
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.deathTimer = 0;
        this.phase = 1;
        this.phaseThresholds = [];
        this.bossPhaseAttackTimer = 0;
        this.bossSpawnTimer = 0;
        this.specialProperties = typeData.specialProperties || {};
        this._recentlyHitTimer = 0;
        this._attackActiveTimer = 0;
        this._projectileFired = false;
        this._exploding = false;
        this._explodeTriggered = false;
        this.vx = 0;
        this.vy = 0;
    }

    setBoss(bossData) {
        this.isBoss = true;
        this.score = bossData.score || 100;
        this.phaseThresholds = bossData.phaseThresholds || [];
        this.phase = 1;
        this.bossPhaseAttackTimer = 0;
        this.bossSpawnTimer = 0;
        if (bossData.color) this.color = bossData.color;
        if (bossData.width) this.width = bossData.width;
        if (bossData.height) this.height = bossData.height;
        if (bossData.specialProperties) {
            this.specialProperties = { ...this.specialProperties, ...bossData.specialProperties };
        }
    }

    update(dt, playerX, playerY, playerAlive) {
        if (!this.alive) return;

        this._recentlyHitTimer = Math.max(0, this._recentlyHitTimer - dt);

        switch (this.aiState) {
            case 'idle':
                this._updateIdle(dt);
                break;
            case 'patrol':
                this._updatePatrol(dt, playerX, playerY);
                break;
            case 'chase':
                this._updateChase(dt, playerX, playerY);
                break;
            case 'attack':
                this._updateAttack(dt, playerX, playerY);
                break;
            case 'stunned':
                this._updateStunned(dt);
                break;
            case 'dying':
                this._updateDying(dt);
                break;
        }

        this._applyGravity(dt);
        this._updateStatusEffects(dt);
        this._updateAnimations(dt);

        if (this.isBoss) {
            this._updateBossPhases(dt, playerX, playerY, playerAlive);
        }
    }

    _updateIdle(dt) {
        this.animState = 'idle';
        this.vx = 0;
        this.aiTimer -= dt;
        if (this.aiTimer <= 0) {
            this.aiState = 'patrol';
            this.targetX = this.x + randomRange(-120, 120);
            this.aiTimer = randomRange(2, 4);
        }
    }

    _updatePatrol(dt, playerX, playerY) {
        this.animState = 'walk';
        const dist = distance(this.x, this.y, playerX, playerY);
        if (dist < this.aggroRange) {
            this.aiState = 'chase';
            return;
        }

        const dx = this.targetX - this.x;
        if (Math.abs(dx) > 5) {
            this.vx = Math.sign(dx) * this.speed * 0.5;
            this.facing = Math.sign(dx);
        } else {
            this.vx = 0;
            this.aiTimer -= dt;
            if (this.aiTimer <= 0) {
                this.aiState = 'idle';
                this.aiTimer = randomRange(0.5, 1.5);
            }
        }
    }

    _updateChase(dt, playerX, playerY) {
        const dist = distance(this.x, this.y, playerX, playerY);

        if (dist > this.aggroRange * 1.5) {
            this.aiState = 'idle';
            this.aiTimer = randomRange(0.5, 1.0);
            return;
        }

        this.facing = playerX > this.x ? 1 : -1;

        if (dist < this.attackRange) {
            this.aiState = 'attack';
            this._attackActiveTimer = 0;
            this._projectileFired = false;
            this._explodeTriggered = false;
            return;
        }

        this.animState = 'walk';
        const chaseSpeed = this.behavior === 'run' ? this.speed * 1.6 : this.speed;
        this.vx = this.facing * chaseSpeed;

        if (this.behavior === 'explode') {
            this.vx = this.facing * this.speed * 2.0;
        }
    }

    _updateAttack(dt, playerX, playerY) {
        this.animState = 'attack';
        this.attackTimer -= dt;
        this._attackActiveTimer += dt;

        switch (this.behavior) {
            case 'walk':
                this._behaviorWalk(dt, playerX);
                break;
            case 'run':
                this._behaviorRun(dt, playerX, playerY);
                break;
            case 'spit':
                this._behaviorSpit(dt, playerX, playerY);
                break;
            case 'brute':
                this._behaviorBrute(dt);
                break;
            case 'explode':
                this._behaviorExplode(dt, playerX, playerY);
                break;
            default:
                this._behaviorWalk(dt, playerX);
                break;
        }

        if (this.attackTimer <= 0) {
            this.aiState = 'chase';
            this.attackTimer = this.attackCooldown;
        }
    }

    _behaviorWalk(dt, playerX) {
        this.facing = playerX > this.x ? 1 : -1;
        if (this._attackActiveTimer < 0.15) {
            this.vx = this.facing * this.speed * 1.5;
        } else {
            this.vx = 0;
        }
    }

    _behaviorRun(dt, playerX, playerY) {
        this.facing = playerX > this.x ? 1 : -1;
        if (this._attackActiveTimer < 0.2) {
            this.vx = this.facing * this.speed * 2.5;
            this.vy = -200;
        } else {
            this.vx = this.facing * this.speed * 0.3;
        }
    }

    _behaviorSpit(dt, playerX, playerY) {
        this.vx = 0;
        this.facing = playerX > this.x ? 1 : -1;
        if (!this._projectileFired && this._attackActiveTimer >= 0.3) {
            this._projectileFired = true;
        }
    }

    _behaviorBrute(dt) {
        if (this._attackActiveTimer < 0.5) {
            this.vx = 0;
            this.animState = 'idle';
        } else if (this._attackActiveTimer < 0.65) {
            this.vx = 0;
            this.animState = 'attack';
        } else {
            this.vx = 0;
        }
    }

    _behaviorExplode(dt, playerX, playerY) {
        const dist = distance(this.x, this.y, playerX, playerY);
        this.facing = playerX > this.x ? 1 : -1;

        if (dist < 30 || this._attackActiveTimer > 0.8) {
            if (!this._explodeTriggered) {
                this._explodeTriggered = true;
                this._exploding = true;
            }
        }
    }

    _updateStunned(dt) {
        this.animState = 'stunned';
        this.vx = 0;
        this.stunTimer -= dt;
        if (this.stunTimer <= 0) {
            this.stunTimer = 0;
            this.aiState = 'chase';
        }
    }

    _updateDying(dt) {
        this.animState = 'dying';
        this.vx = 0;
        this.deathTimer += dt;
        if (this.deathTimer > 0.6) {
            this.alive = false;
        }
    }

    _applyGravity(dt) {
        this.vy += GRAVITY * dt;
        if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;
        this.y += this.vy * dt;
        this.x += this.vx * dt;

        const feetY = this.y + this.height;
        if (feetY >= GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
            this.grounded = true;
        } else {
            this.grounded = false;
        }
    }

    _updateStatusEffects(dt) {
        if (this.burnTimer > 0) {
            this.burnTimer -= dt;
            if (this.burnTimer <= 0) {
                this.burnTimer = 0;
                this.burnDmg = 0;
            } else {
                this.hp -= this.burnDmg * dt;
                if (this.hp <= 0) {
                    this.hp = 0;
                    this.aiState = 'dying';
                    this.deathTimer = 0;
                }
            }
        }

        if (this.bleedTimer > 0) {
            this.bleedTimer -= dt;
            if (this.bleedTimer <= 0) {
                this.bleedTimer = 0;
                this.bleedDmg = 0;
            } else {
                this.hp -= this.bleedDmg * dt;
                if (this.hp <= 0) {
                    this.hp = 0;
                    this.aiState = 'dying';
                    this.deathTimer = 0;
                }
            }
        }
    }

    _updateAnimations(dt) {
        if (this.animState === 'walk') {
            this.walkTimer += dt * 6;
            this.walkFrame = Math.floor(this.walkTimer) % 4;
        } else {
            this.walkTimer = 0;
            this.walkFrame = 0;
        }
    }

    _updateBossPhases(dt, playerX, playerY, playerAlive) {
        if (!this.alive || this.aiState === 'dying') return;

        const hpPercent = this.hp / this.maxHp;
        let newPhase = 1;
        for (let i = this.phaseThresholds.length - 1; i >= 0; i--) {
            if (hpPercent <= this.phaseThresholds[i]) {
                newPhase = i + 2;
                break;
            }
        }

        if (newPhase !== this.phase) {
            this.phase = newPhase;
            this.speed = Math.min(this.speed * 1.15, 200);
            this.damage = Math.floor(this.damage * 1.1);
            this.attackCooldown = Math.max(this.attackCooldown * 0.85, 0.3);
        }

        this.bossPhaseAttackTimer -= dt;
        if (this.bossPhaseAttackTimer <= 0 && playerAlive) {
            this.bossPhaseAttackTimer = Math.max(2.0 - this.phase * 0.3, 0.8);
        }

        this.bossSpawnTimer -= dt;
    }

    takeDamage(amount, source) {
        if (!this.alive || this.aiState === 'dying') return 0;

        let reduction = 0;
        if (this.armor > 0 && source && source.x != null) {
            const attackDir = source.x < this.x ? -1 : 1;
            if (attackDir !== this.facing) {
                reduction = Math.min(this.armor, amount * 0.5);
            }
        }

        let finalDamage = amount - reduction;
        if (finalDamage < 1) finalDamage = 1;
        this.hp -= finalDamage;
        this._recentlyHitTimer = 0.15;

        if (finalDamage > this.damage * 2) {
            this.stunTimer = Math.max(this.stunTimer, 0.3);
            this.aiState = 'stunned';
        } else if (this.aiState === 'idle' || this.aiState === 'patrol') {
            this.aiState = 'chase';
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.aiState = 'dying';
            this.deathTimer = 0;
        }

        return finalDamage;
    }

    getAttackHitbox() {
        if (this.aiState !== 'attack') return null;
        if (this.behavior === 'spit') return null;
        if (this.behavior === 'explode') return null;

        let hitW, hitH;

        switch (this.behavior) {
            case 'brute':
                if (this._attackActiveTimer < 0.5 || this._attackActiveTimer > 0.75) return null;
                hitW = 60;
                hitH = 50;
                break;
            case 'run':
                hitW = 35;
                hitH = 30;
                break;
            default:
                if (this._attackActiveTimer > 0.25) return null;
                hitW = this.attackRange;
                hitH = 24;
                break;
        }

        let hx, hy;
        if (this.facing === 1) {
            hx = this.x + this.width;
            hy = this.y + this.height * 0.25;
        } else {
            hx = this.x - hitW;
            hy = this.y + this.height * 0.25;
        }

        return { x: hx, y: hy, w: hitW, h: hitH };
    }

    shouldSpawnProjectile() {
        return this.behavior === 'spit' && this._projectileFired;
    }

    getProjectileData() {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height * 0.3;
        const angle = this.facing === 1 ? 0 : Math.PI;
        return {
            x: cx + this.facing * (this.width / 2 + 5),
            y: cy,
            angle: angle,
            speed: 200,
            damage: Math.floor(this.damage * 0.8),
            type: 'spit'
        };
    }

    shouldExplode() {
        return this.behavior === 'explode' && this._exploding;
    }

    getExplosionData() {
        this._exploding = false;
        this.hp = 0;
        this.aiState = 'dying';
        this.deathTimer = 0;
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            radius: this.specialProperties.explosionRadius || 60,
            damage: this.damage * 2
        };
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
        if (!this.alive && this.aiState !== 'dying') return;

        const drawX = this.x - cam.x;
        const drawY = this.y - cam.y;
        const cx = drawX + this.width / 2;
        const cy = drawY + this.height / 2;

        ctx.save();

        if (this.aiState === 'dying') {
            const deathProgress = Math.min(this.deathTimer / 0.6, 1.0);
            ctx.globalAlpha = 1.0 - deathProgress;
            ctx.translate(cx, drawY + this.height);
            ctx.rotate(deathProgress * this.facing * 0.5);
            ctx.translate(-cx, -(drawY + this.height));
        }

        this._drawBody(ctx, drawX, drawY, cx, cy);
        this._drawBossFeatures(ctx, drawX, drawY, cx, cy);

        if (this.isBoss) {
            this._drawBossHealthBar(ctx, drawX, drawY);
        }

        if (this.burnTimer > 0) {
            ctx.fillStyle = '#FF6600';
            for (let i = 0; i < 3; i++) {
                const fx = drawX + randomRange(2, this.width - 2);
                const fy = drawY + randomRange(0, this.height * 0.6);
                const fs = randomRange(2, 5);
                ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.015 + i * 2) * 0.3;
                ctx.beginPath();
                ctx.moveTo(fx, fy - fs);
                ctx.lineTo(fx - fs * 0.5, fy + fs * 0.5);
                ctx.lineTo(fx + fs * 0.5, fy + fs * 0.5);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }

        if (this.bleedTimer > 0) {
            ctx.fillStyle = '#CC0000';
            for (let i = 0; i < 3; i++) {
                const bx = drawX + randomRange(-2, this.width + 2);
                const by = drawY + this.height * 0.5 + randomRange(0, this.height * 0.5);
                ctx.beginPath();
                ctx.ellipse(bx, by, 1.5, 3, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    _drawBody(ctx, drawX, drawY, cx, cy) {
        const bodyW = this.width;
        const bodyH = this.height * 0.55;
        const bodyX = drawX;
        const bodyY = drawY + this.height * 0.25;

        let bodyColor = this.color;
        let headColor = '#7A8B6F';

        if (this._recentlyHitTimer > 0) {
            bodyColor = '#FF4444';
            headColor = '#FFAAAA';
        }

        ctx.fillStyle = bodyColor;
        ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(bodyX, bodyY, bodyW, bodyH);

        const headR = this.isBoss ? 14 : 9;
        const headCX = cx;
        const headCY = drawY + this.height * 0.15;

        ctx.beginPath();
        ctx.arc(headCX, headCY, headR, 0, Math.PI * 2);
        ctx.fillStyle = headColor;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();

        const eyeY = headCY - 1;
        const eyeSpread = headR * 0.4;
        ctx.fillStyle = this.aiState === 'stunned' ? '#FFAA00' : '#FF2222';
        ctx.beginPath();
        ctx.arc(headCX - eyeSpread, eyeY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headCX + eyeSpread, eyeY, 2, 0, Math.PI * 2);
        ctx.fill();

        const armLen = this.isBoss ? 22 : 14;
        const shoulderY = bodyY + bodyH * 0.2;
        const leftShoulderX = bodyX - 1;
        const rightShoulderX = bodyX + bodyW + 1;

        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = this.isBoss ? 4 : 3;

        let armAngle = this.facing === 1 ? Math.PI * 0.35 : Math.PI * 0.65;
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, shoulderY);
        ctx.lineTo(
            leftShoulderX - Math.cos(armAngle) * armLen * 0.5,
            shoulderY + Math.sin(armAngle) * armLen
        );
        ctx.stroke();

        const forwardArmAngle = this.facing === 1 ? Math.PI * 0.15 : Math.PI * 0.85;
        ctx.beginPath();
        ctx.moveTo(rightShoulderX, shoulderY);
        ctx.lineTo(
            rightShoulderX + Math.cos(forwardArmAngle) * armLen * 0.6 * this.facing,
            shoulderY + Math.sin(forwardArmAngle) * armLen
        );
        ctx.stroke();

        if (this.animState === 'attack') {
            const atkArmAngle = this.facing === 1 ? Math.PI * 0.05 : Math.PI * 0.95;
            ctx.strokeStyle = bodyColor;
            ctx.beginPath();
            ctx.moveTo(rightShoulderX, shoulderY);
            ctx.lineTo(
                rightShoulderX + Math.cos(atkArmAngle) * armLen * 0.8 * this.facing,
                shoulderY + Math.sin(atkArmAngle) * armLen * 0.5
            );
            ctx.stroke();
        }

        const legW = this.isBoss ? 10 : 7;
        const legH = this.isBoss ? 14 : 10;
        const legY = bodyY + bodyH;
        let leftLegOff = 0;
        let rightLegOff = 0;

        if (this.animState === 'walk') {
            const phase = this.walkFrame;
            if (phase === 0) { leftLegOff = 0; rightLegOff = 3; }
            else if (phase === 1) { leftLegOff = 2; rightLegOff = 0; }
            else if (phase === 2) { leftLegOff = 0; rightLegOff = -3; }
            else if (phase === 3) { leftLegOff = -2; rightLegOff = 0; }
        }

        ctx.fillStyle = bodyColor;
        ctx.fillRect(cx - legW - 1 + leftLegOff, legY, legW, legH);
        ctx.fillRect(cx + 1 + rightLegOff, legY, legW, legH);

        if (this.aiState === 'stunned') {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            const stunOff = Math.sin(Date.now() * 0.01) * 3;
            for (let i = 0; i < 3; i++) {
                const sx = headCX + (i - 1) * 8 + stunOff;
                const sy = headCY - headR - 8 - Math.abs(i - 1) * 4;
                ctx.beginPath();
                ctx.moveTo(sx - 2, sy + 4);
                ctx.lineTo(sx, sy);
                ctx.lineTo(sx + 2, sy + 4);
                ctx.stroke();
            }
        }

        if (this.behavior === 'explode' && this._attackActiveTimer > 0.3) {
            const pulse = Math.sin(Date.now() * 0.02) * 0.3 + 0.7;
            ctx.strokeStyle = `rgba(255, ${Math.floor(100 * pulse)}, 0, ${pulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, this.width * 0.6 * pulse, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    _drawBossFeatures(ctx, drawX, drawY, cx, cy) {
        if (!this.isBoss) return;

        const bodyW = this.width;
        const bodyH = this.height * 0.55;
        const bodyX = drawX;
        const bodyY = drawY + this.height * 0.25;
        const headR = 14;
        const headCX = cx;
        const headCY = drawY + this.height * 0.15;

        switch (this.enemyType) {
            case 'dr_rot':
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(headCX - headR, headCY - 3, headR * 2, 8);
                ctx.strokeStyle = '#999';
                ctx.lineWidth = 1;
                ctx.strokeRect(headCX - headR, headCY - 3, headR * 2, 8);

                ctx.strokeStyle = '#888';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(bodyX + bodyW + 4, bodyY + 6);
                ctx.lineTo(bodyX + bodyW + 20, bodyY - 4);
                ctx.stroke();
                ctx.strokeStyle = '#AAA';
                ctx.lineWidth = 1;
                for (let t = 0.3; t < 1.0; t += 0.2) {
                    const tx = bodyX + bodyW + 4 + 16 * t;
                    const ty = bodyY + 6 - 10 * t;
                    ctx.beginPath();
                    ctx.moveTo(tx - 2, ty - 2);
                    ctx.lineTo(tx + 2, ty + 2);
                    ctx.stroke();
                }
                break;

            case 'the_mother':
                ctx.fillStyle = this._recentlyHitTimer > 0 ? '#CC6666' : '#8B5555';
                ctx.beginPath();
                ctx.ellipse(cx, bodyY + bodyH * 0.6, bodyW * 0.6, bodyH * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#5A3333';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.fillStyle = '#AA3333';
                for (let i = 0; i < 4; i++) {
                    const sx = drawX + randomRange(bodyW * 0.2, bodyW * 0.8);
                    const sy = bodyY + randomRange(bodyH * 0.1, bodyH * 0.8);
                    ctx.beginPath();
                    ctx.ellipse(sx, sy, 3, 2, randomRange(-0.5, 0.5), 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            case 'orderly_zero':
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(bodyX + bodyW - 2, bodyY + 2, 10, 8);
                ctx.strokeStyle = '#996600';
                ctx.lineWidth = 1;
                ctx.strokeRect(bodyX + bodyW - 2, bodyY + 2, 10, 8);
                ctx.fillStyle = '#333';
                ctx.font = '6px monospace';
                ctx.fillText('01', bodyX + bodyW + 1, bodyY + 8);

                ctx.strokeStyle = '#444';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(bodyX + bodyW + 2, bodyY + 10);
                ctx.lineTo(bodyX + bodyW + 18, bodyY + 22);
                ctx.stroke();
                ctx.strokeStyle = '#666';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(bodyX + bodyW + 2, bodyY + 10);
                ctx.lineTo(bodyX + bodyW + 18, bodyY + 22);
                ctx.stroke();
                break;

            case 'patient_x43':
                ctx.strokeStyle = '#556B2F';
                ctx.lineWidth = 3;
                for (let i = 0; i < 4; i++) {
                    const baseAngle = (i / 4) * Math.PI * 2 + Date.now() * 0.002;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    for (let s = 0; s <= 1; s += 0.1) {
                        const wave = Math.sin(s * 6 + Date.now() * 0.005) * 8;
                        const tx = cx + Math.cos(baseAngle) * s * 25 + Math.cos(baseAngle + Math.PI / 2) * wave;
                        const ty = cy + Math.sin(baseAngle) * s * 25 + Math.sin(baseAngle + Math.PI / 2) * wave;
                        ctx.lineTo(tx, ty);
                    }
                    ctx.stroke();
                }
                ctx.strokeStyle = '#556B2F';
                ctx.lineWidth = 2;
                for (let i = 0; i < 3; i++) {
                    const startX = drawX + randomRange(0, bodyW);
                    const startY = bodyY + randomRange(0, bodyH);
                    const waveDir = Math.random() > 0.5 ? 1 : -1;
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    for (let s = 1; s <= 3; s += 0.5) {
                        ctx.lineTo(startX + waveDir * s * 3, startY + s * 4);
                    }
                    ctx.stroke();
                }
                break;

            case 'dr_morbus':
                ctx.fillStyle = 'rgba(240, 240, 240, 0.7)';
                ctx.fillRect(bodyX - 3, bodyY - 2, bodyW + 6, bodyH + 4);
                ctx.strokeStyle = '#CCC';
                ctx.lineWidth = 1;
                ctx.strokeRect(bodyX - 3, bodyY - 2, bodyW + 6, bodyH + 4);

                const vialColors = ['#00FF00', '#FF00FF', '#00FFFF'];
                for (let i = 0; i < 3; i++) {
                    const vx = bodyX + 4 + i * 14;
                    const vy = bodyY - 8;
                    ctx.fillStyle = vialColors[i];
                    ctx.fillRect(vx, vy, 6, 10);
                    ctx.strokeStyle = '#888';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(vx, vy, 6, 10);
                    ctx.fillStyle = '#666';
                    ctx.fillRect(vx + 1, vy - 3, 4, 4);
                }
                break;

            case 'the_warden':
                ctx.fillStyle = 'rgba(30, 30, 30, 0.6)';
                ctx.fillRect(bodyX - 2, bodyY, bodyW + 4, bodyH + 2);
                ctx.strokeStyle = '#444';
                ctx.lineWidth = 1;
                ctx.strokeRect(bodyX - 2, bodyY, bodyW + 4, bodyH + 2);

                ctx.strokeStyle = '#777';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(bodyX + bodyW + 5, bodyY + 10);
                for (let s = 0; s < 20; s += 4) {
                    ctx.lineTo(bodyX + bodyW + 5 + (s % 8 === 4 ? 3 : -1), bodyY + 10 + s);
                }
                ctx.stroke();

                ctx.fillStyle = '#555';
                ctx.fillRect(drawX + bodyW * 0.3, headCY - headR - 5, bodyW * 0.4, 4);
                ctx.strokeStyle = '#444';
                ctx.strokeRect(drawX + bodyW * 0.3, headCY - headR - 5, bodyW * 0.4, 4);
                break;
        }
    }

    _drawBossHealthBar(ctx, drawX, drawY) {
        const barW = this.width + 30;
        const barH = 6;
        const barX = drawX + this.width / 2 - barW / 2;
        const barY = drawY - 20;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

        const hpPercent = this.hp / this.maxHp;
        let barColor = '#22CC22';
        if (hpPercent < 0.3) barColor = '#CC2222';
        else if (hpPercent < 0.6) barColor = '#CCAA22';

        ctx.fillStyle = barColor;
        ctx.fillRect(barX, barY, barW * hpPercent, barH);
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);

        if (this.phaseThresholds.length > 0) {
            for (let i = 0; i < this.phaseThresholds.length; i++) {
                const thresholdX = barX + barW * this.phaseThresholds[i];
                ctx.strokeStyle = '#FF4444';
                ctx.beginPath();
                ctx.moveTo(thresholdX, barY - 2);
                ctx.lineTo(thresholdX, barY + barH + 2);
                ctx.stroke();
            }
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.enemyType.replace(/_/g, ' ').toUpperCase()} [P${this.phase}]`, cx, barY - 3);
        ctx.textAlign = 'left';
    }
}
