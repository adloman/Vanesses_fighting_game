/**
 * Sprite rendering helpers for Abandoned Ward.
 * Draws characters using Canvas 2D API primitives.
 * All functions use fillRect, arc, lineTo, bezierCurveTo, gradients, etc.
 */

/**
 * Draw a humanoid character body with canvas primitives.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - screen x (center bottom)
 * @param {number} y - screen y (bottom of feet)
 * @param {number} w - body width
 * @param {number} h - total body height
 * @param {string} color - primary body color
 * @param {number} facing - 1 = right, -1 = left
 * @param {string} animState - 'idle', 'walk', 'attack', 'hurt', 'dead'
 * @param {number} frame - animation frame counter (0-based)
 */
export function drawCharacterBody(ctx, x, y, w, h, color, facing, animState, frame) {
  const f = facing || 1;
  const time = Date.now() * 0.001;
  const walkCycle = Math.sin(frame * 0.3) * 0.5;

  ctx.save();
  ctx.translate(x, y);

  // Flip for facing direction
  ctx.scale(f, 1);

  // Body proportions
  const headR = w * 0.28;
  const torsoH = h * 0.35;
  const torsoW = w * 0.55;
  const legH = h * 0.35;
  const legW = w * 0.18;
  const armLen = h * 0.3;
  const armW = w * 0.12;

  const torsoY = -h + headR * 2 + torsoH;
  const legTopY = torsoY + torsoH;

  // Animation offsets
  let legOffset = 0;
  let armAngle = 0;
  let bodyBob = 0;

  switch (animState) {
    case 'walk':
      legOffset = walkCycle * 12;
      armAngle = walkCycle * 0.5;
      bodyBob = Math.abs(Math.sin(frame * 0.3)) * 2;
      break;
    case 'attack':
      armAngle = -1.2 + Math.sin(frame * 0.5) * 0.5;
      bodyBob = -2;
      break;
    case 'hurt':
      // Lean back slightly
      ctx.rotate(-0.15);
      break;
    case 'dead':
      ctx.rotate(Math.PI / 2 * 0.8);
      break;
    default: // idle
      bodyBob = Math.sin(time * 2) * 1;
      break;
  }

  const baseY = -bodyBob;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.5, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs (rectangles)
  ctx.fillStyle = darkenColor(color, 30);
  // Left leg
  ctx.fillRect(-torsoW * 0.3 - legW / 2, legTopY + legOffset, legW, legH - legOffset);
  // Right leg
  ctx.fillRect(torsoW * 0.3 - legW / 2, legTopY - legOffset, legW, legH + legOffset);

  // Shoes
  ctx.fillStyle = '#222222';
  ctx.fillRect(-torsoW * 0.3 - legW / 2 - 2, legH - 8 + legOffset, legW + 4, 8);
  ctx.fillRect(torsoW * 0.3 - legW / 2 - 2, legH - 8 - legOffset, legW + 4, 8);

  // Torso
  ctx.fillStyle = color;
  ctx.fillRect(-torsoW / 2, torsoY + baseY, torsoW, torsoH);

  // Torso detail (darker center line)
  ctx.fillStyle = darkenColor(color, 15);
  ctx.fillRect(-2, torsoY + baseY + 4, 4, torsoH - 8);

  // Belt
  ctx.fillStyle = darkenColor(color, 40);
  ctx.fillRect(-torsoW / 2 - 1, torsoY + torsoH - 6 + baseY, torsoW + 2, 6);

  // Arms (lines with circles for joints)
  ctx.strokeStyle = color;
  ctx.lineWidth = armW;
  ctx.lineCap = 'round';

  // Back arm
  const backArmX = -torsoW / 2;
  const backArmY = torsoY + 8 + baseY;
  ctx.beginPath();
  ctx.moveTo(backArmX, backArmY);
  ctx.lineTo(backArmX - 5, backArmY + armLen * 0.5);
  ctx.lineTo(backArmX - 5 - Math.sin(armAngle) * 10, backArmY + armLen);
  ctx.stroke();

  // Front arm
  const frontArmX = torsoW / 2;
  const frontArmY = torsoY + 8 + baseY;
  ctx.beginPath();
  ctx.moveTo(frontArmX, frontArmY);
  ctx.lineTo(frontArmX + 5, frontArmY + armLen * 0.5);
  const attackSwing = animState === 'attack' ? -Math.sin(frame * 0.5) * 25 : 0;
  ctx.lineTo(frontArmX + 5 + Math.sin(armAngle) * 10 + attackSwing, frontArmY + armLen);
  ctx.stroke();

  // Hands
  ctx.fillStyle = '#ddbb99';
  ctx.beginPath();
  ctx.arc(frontArmX + 5 + Math.sin(armAngle) * 10 + attackSwing, frontArmY + armLen, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(backArmX - 5 - Math.sin(armAngle) * 10, backArmY + armLen, 4, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.fillStyle = '#ddbb99';
  ctx.fillRect(-4, torsoY - 4 + baseY, 8, 8);

  // Head
  ctx.fillStyle = '#ddbb99';
  ctx.beginPath();
  ctx.arc(0, torsoY - headR + baseY, headR, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = darkenColor(color, 50);
  ctx.beginPath();
  ctx.arc(0, torsoY - headR - 2 + baseY, headR, Math.PI, 0);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(headR * 0.3, torsoY - headR - 2 + baseY, headR * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222233';
  ctx.beginPath();
  ctx.arc(headR * 0.35, torsoY - headR - 2 + baseY, headR * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  ctx.strokeStyle = '#aa8877';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(headR * 0.1, torsoY - headR * 0.3 + baseY);
  ctx.lineTo(headR * 0.5, torsoY - headR * 0.3 + baseY);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a zombie variant body with different proportions per type.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - screen x (center bottom)
 * @param {number} y - screen y (bottom of feet)
 * @param {number} w - body width
 * @param {number} h - total body height
 * @param {string} color - skin/body color
 * @param {number} facing - 1 = right, -1 = left
 * @param {string} animState - animation state
 * @param {number} frame - animation frame
 * @param {string} type - zombie type: 'zombie', 'runner', 'brute', 'nurse', 'guard', 'scientist', 'pharmacist'
 */
export function drawZombieBody(ctx, x, y, w, h, color, facing, animState, frame, type) {
  const f = facing || 1;
  const time = Date.now() * 0.001;
  const walkCycle = Math.sin(frame * 0.25);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(f, 1);

  // Zombie-specific proportions per type
  let headR, torsoH, torsoW, legH, legW, armLen, armW;
  let skinColor = color;
  let bodyTint = color;

  switch (type) {
    case 'zombie_runner':
      headR = w * 0.22;
      torsoH = h * 0.32;
      torsoW = w * 0.45;
      legH = h * 0.38;
      legW = w * 0.14;
      armLen = h * 0.28;
      armW = w * 0.09;
      bodyTint = '#556655';
      break;
    case 'zombie_brute':
      headR = w * 0.32;
      torsoH = h * 0.4;
      torsoW = w * 0.7;
      legH = h * 0.3;
      legW = w * 0.24;
      armLen = h * 0.35;
      armW = w * 0.18;
      bodyTint = '#445544';
      skinColor = '#667766';
      break;
    case 'zombie_nurse':
      headR = w * 0.25;
      torsoH = h * 0.35;
      torsoW = w * 0.5;
      legH = h * 0.33;
      legW = w * 0.15;
      armLen = h * 0.3;
      armW = w * 0.1;
      bodyTint = '#dddddd';
      break;
    case 'zombie_guard':
      headR = w * 0.26;
      torsoH = h * 0.36;
      torsoW = w * 0.6;
      legH = h * 0.34;
      legW = w * 0.2;
      armLen = h * 0.32;
      armW = w * 0.14;
      bodyTint = '#333355';
      break;
    case 'zombie_scientist':
      headR = w * 0.25;
      torsoH = h * 0.33;
      torsoW = w * 0.48;
      legH = h * 0.35;
      legW = w * 0.14;
      armLen = h * 0.3;
      armW = w * 0.1;
      bodyTint = '#eeeeee';
      break;
    case 'zombie_pharmacist':
      headR = w * 0.24;
      torsoH = h * 0.34;
      torsoW = w * 0.5;
      legH = h * 0.34;
      legW = w * 0.15;
      armLen = h * 0.29;
      armW = w * 0.1;
      bodyTint = '#445566';
      break;
    default: // regular zombie
      headR = w * 0.28;
      torsoH = h * 0.35;
      torsoW = w * 0.55;
      legH = h * 0.35;
      legW = w * 0.18;
      armLen = h * 0.3;
      armW = w * 0.12;
  }

  // Animation offsets
  let legOffset = 0;
  let armAngle = 0;
  let bodyBob = 0;
  let bodyTilt = 0;

  switch (animState) {
    case 'walk':
      legOffset = walkCycle * 10;
      armAngle = walkCycle * 0.4;
      bodyBob = Math.abs(Math.sin(frame * 0.25)) * 1.5;
      bodyTilt = Math.sin(frame * 0.2) * 0.05; // Zombie sway
      break;
    case 'attack':
      armAngle = -1.0 + Math.sin(frame * 0.4) * 0.4;
      bodyTilt = 0.1;
      break;
    case 'hurt':
      bodyTilt = -0.2;
      break;
    case 'dead':
      ctx.rotate(Math.PI / 2);
      break;
    default:
      bodyBob = Math.sin(time * 1.5) * 1;
      bodyTilt = Math.sin(time * 0.8) * 0.03;
      break;
  }

  ctx.rotate(bodyTilt);

  const torsoY = -h + headR * 2 + torsoH;
  const legTopY = torsoY + torsoH;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.45, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs - zombie shambling walk (slightly bent)
  ctx.fillStyle = darkenColor(bodyTint, 20);
  // Left leg
  const leftLegAngle = legOffset * 0.03;
  ctx.save();
  ctx.translate(-torsoW * 0.25, legTopY);
  ctx.rotate(leftLegAngle);
  ctx.fillRect(-legW / 2, 0, legW, legH);
  ctx.restore();
  // Right leg
  const rightLegAngle = -legOffset * 0.03;
  ctx.save();
  ctx.translate(torsoW * 0.25, legTopY);
  ctx.rotate(rightLegAngle);
  ctx.fillRect(-legW / 2, 0, legW, legH);
  ctx.restore();

  // Feet (barefoot or shoes)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-torsoW * 0.25 - legW / 2 - 2, legH - 6, legW + 6, 6);
  ctx.fillRect(torsoW * 0.25 - legW / 2 - 2, legH - 6, legW + 6, 6);

  // Torso
  ctx.fillStyle = bodyTint;
  const torsoTop = torsoY - bodyBob;
  ctx.fillRect(-torsoW / 2, torsoTop, torsoW, torsoH);

  // Torso stains (blood spots on zombie)
  ctx.fillStyle = 'rgba(100,20,20,0.3)';
  ctx.beginPath();
  ctx.arc(torsoW * 0.1, torsoTop + torsoH * 0.3, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-torsoW * 0.15, torsoTop + torsoH * 0.6, 4, 0, Math.PI * 2);
  ctx.fill();

  // Type-specific clothing details
  if (type === 'zombie_nurse') {
    // Nurse hat
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-headR * 0.8, -h + headR * 0.2, headR * 1.6, 4);
    ctx.fillRect(-headR * 0.5, -h + headR * 0.2 - 8, headR, 8);
    // Red cross on hat
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(-3, -h + headR * 0.2 - 6, 6, 4);
    ctx.fillRect(-1, -h + headR * 0.2 - 8, 2, 8);
  } else if (type === 'zombie_guard') {
    // Badge
    ctx.fillStyle = '#ccaa44';
    ctx.beginPath();
    ctx.arc(torsoW * 0.15, torsoTop + 12, 5, 0, Math.PI * 2);
    ctx.fill();
    // Belt
    ctx.fillStyle = '#222233';
    ctx.fillRect(-torsoW / 2 - 1, torsoTop + torsoH - 8, torsoW + 2, 8);
  } else if (type === 'zombie_scientist') {
    // Lab coat detail
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(-torsoW / 2 - 2, torsoTop, torsoW + 4, torsoH);
    // Pocket
    ctx.strokeStyle = 'rgba(200,200,200,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(torsoW * 0.1, torsoTop + 10, 14, 16);
  } else if (type === 'zombie_brute') {
    // Chains
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(torsoW * 0.35, torsoTop + torsoH * 0.4, 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Arms (extended zombie arms - longer than normal)
  ctx.strokeStyle = skinColor;
  ctx.lineWidth = armW;
  ctx.lineCap = 'round';

  // Back arm
  const backArmX = -torsoW / 2;
  const backArmY = torsoTop + 8;
  ctx.beginPath();
  ctx.moveTo(backArmX, backArmY);
  const bArmBend = 0.3 + armAngle * 0.2;
  ctx.quadraticCurveTo(
    backArmX - 10, backArmY + armLen * 0.6,
    backArmX - 15 + Math.sin(bArmBend) * 5, backArmY + armLen + 5
  );
  ctx.stroke();

  // Front arm (extended further - zombie reaching)
  const frontArmX = torsoW / 2;
  const frontArmY = torsoTop + 8;
  const attackSwing = animState === 'attack' ? -Math.sin(frame * 0.4) * 20 : 0;
  ctx.beginPath();
  ctx.moveTo(frontArmX, frontArmY);
  ctx.quadraticCurveTo(
    frontArmX + 15, frontArmY + armLen * 0.5,
    frontArmX + 20 + Math.sin(armAngle) * 10 + attackSwing, frontArmY + armLen + 8
  );
  ctx.stroke();

  // Hands (claw-like)
  ctx.fillStyle = skinColor;
  const handX = frontArmX + 20 + Math.sin(armAngle) * 10 + attackSwing;
  const handY = frontArmY + armLen + 8;
  ctx.beginPath();
  ctx.arc(handX, handY, 4, 0, Math.PI * 2);
  ctx.fill();
  // Claws
  ctx.strokeStyle = '#ddccaa';
  ctx.lineWidth = 1.5;
  for (let c = -1; c <= 1; c++) {
    ctx.beginPath();
    ctx.moveTo(handX + 3, handY + c * 3);
    ctx.lineTo(handX + 10, handY + c * 4 - 2);
    ctx.stroke();
  }

  // Neck
  ctx.fillStyle = skinColor;
  ctx.fillRect(-4, torsoTop - 4, 8, 8);

  // Head
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(0, torsoTop - headR - bodyBob, headR, 0, Math.PI * 2);
  ctx.fill();

  // Zombie face details
  // Sunken eyes
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.ellipse(headR * 0.3, torsoTop - headR - 3 - bodyBob, headR * 0.18, headR * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(headR * 0.7, torsoTop - headR - 3 - bodyBob, headR * 0.18, headR * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glowing zombie eyes (red/yellow)
  const eyeColor = type === 'zombie_runner' ? '#ffff00' : '#ff4444';
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.arc(headR * 0.35, torsoTop - headR - 3 - bodyBob, headR * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headR * 0.65, torsoTop - headR - 3 - bodyBob, headR * 0.07, 0, Math.PI * 2);
  ctx.fill();

  // Mouth (open, teeth visible)
  ctx.fillStyle = '#220000';
  ctx.beginPath();
  ctx.ellipse(headR * 0.5, torsoTop - headR * 0.35 - bodyBob, headR * 0.3, headR * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  // Teeth
  ctx.fillStyle = '#cccc99';
  for (let t = 0; t < 4; t++) {
    const tx = headR * 0.35 + t * headR * 0.1;
    ctx.fillRect(tx, torsoTop - headR * 0.4 - bodyBob, 3, 4);
    ctx.fillRect(tx, torsoTop - headR * 0.28 - bodyBob, 3, 4);
  }

  // Wounds/scars
  ctx.strokeStyle = 'rgba(80,20,20,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.5, torsoTop - headR * 0.6 - bodyBob);
  ctx.lineTo(-headR * 0.2, torsoTop - headR * 0.2 - bodyBob);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a boss-specific body with unique features.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - screen x (center bottom)
 * @param {number} y - screen y (bottom of feet)
 * @param {number} w - body width
 * @param {number} h - total body height
 * @param {string} bossType - boss identifier
 * @param {number} facing - 1 = right, -1 = left
 * @param {string} animState - animation state
 * @param {number} frame - animation frame
 * @param {number} phase - boss phase (1, 2, 3...)
 */
export function drawBossBody(ctx, x, y, w, h, bossType, facing, animState, frame, phase) {
  const f = facing || 1;
  const time = Date.now() * 0.001;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(f, 1);

  // Boss proportions (larger than regular characters)
  const headR = w * 0.3;
  const torsoH = h * 0.38;
  const torsoW = w * 0.65;
  const legH = h * 0.32;
  const legW = w * 0.2;
  const armLen = h * 0.35;
  const armW = w * 0.15;

  const torsoY = -h + headR * 2 + torsoH;
  const legTopY = torsoY + torsoH;

  // Animation
  let legOffset = 0;
  let armAngle = 0;
  let bodyBob = 0;

  switch (animState) {
    case 'walk':
      legOffset = Math.sin(frame * 0.2) * 10;
      armAngle = Math.sin(frame * 0.2) * 0.3;
      bodyBob = Math.abs(Math.sin(frame * 0.2)) * 2;
      break;
    case 'attack':
      armAngle = -1.5 + Math.sin(frame * 0.3) * 0.5;
      bodyBob = -3;
      break;
    case 'hurt':
      ctx.rotate(-0.1);
      break;
    case 'dead':
      ctx.rotate(Math.PI / 2);
      break;
    default:
      bodyBob = Math.sin(time) * 1;
      break;
  }

  // Phase-based visual changes
  const phaseColor = phase >= 3 ? '#ff2222' : phase >= 2 ? '#aa4444' : '#554455';

  // Shadow (large)
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.6, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#333344';
  ctx.save();
  ctx.translate(-torsoW * 0.25, legTopY);
  ctx.rotate(legOffset * 0.02);
  ctx.fillRect(-legW / 2, 0, legW, legH);
  ctx.restore();
  ctx.save();
  ctx.translate(torsoW * 0.25, legTopY);
  ctx.rotate(-legOffset * 0.02);
  ctx.fillRect(-legW / 2, 0, legW, legH);
  ctx.restore();

  // Boots
  ctx.fillStyle = '#1a1a2a';
  ctx.fillRect(-torsoW * 0.25 - legW / 2 - 2, legH - 8, legW + 6, 8);
  ctx.fillRect(torsoW * 0.25 - legW / 2 - 2, legH - 8, legW + 6, 8);

  // Torso
  ctx.fillStyle = phaseColor;
  ctx.fillRect(-torsoW / 2, torsoY - bodyBob, torsoW, torsoH);

  // Suit/clothing detail
  ctx.fillStyle = darkenColor(phaseColor, 20);
  ctx.fillRect(-torsoW / 2 + 5, torsoY - bodyBob + 5, torsoW - 10, torsoH - 10);
  // Lapels
  ctx.beginPath();
  ctx.moveTo(0, torsoY - bodyBob);
  ctx.lineTo(-torsoW * 0.3, torsoY + torsoH * 0.5 - bodyBob);
  ctx.lineTo(-torsoW * 0.15, torsoY + torsoH * 0.5 - bodyBob);
  ctx.lineTo(0, torsoY - bodyBob + 20);
  ctx.fillStyle = darkenColor(phaseColor, 10);
  ctx.fill();

  // Boss-type specific features
  if (bossType === 'director') {
    // Director's tie
    ctx.fillStyle = '#cc2222';
    ctx.beginPath();
    ctx.moveTo(0, torsoY - bodyBob + 5);
    ctx.lineTo(-5, torsoY + torsoH * 0.3 - bodyBob);
    ctx.lineTo(0, torsoY + torsoH * 0.7 - bodyBob);
    ctx.lineTo(5, torsoY + torsoH * 0.3 - bodyBob);
    ctx.closePath();
    ctx.fill();

    // Gold chain
    ctx.strokeStyle = '#ddaa44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-headR * 0.3, torsoY - bodyBob + 2);
    ctx.quadraticCurveTo(0, torsoY + 20 - bodyBob, headR * 0.3, torsoY - bodyBob + 2);
    ctx.stroke();

    // Monocle
    if (phase >= 2) {
      ctx.strokeStyle = '#ddaa44';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(headR * 0.5, torsoY - headR - 2 - bodyBob, headR * 0.25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(headR * 0.5 + headR * 0.25, torsoY - headR - 2 - bodyBob);
      ctx.lineTo(headR * 0.8, torsoY - headR * 0.5 - bodyBob);
      ctx.stroke();
    }
  }

  // Arms
  ctx.strokeStyle = phaseColor;
  ctx.lineWidth = armW;
  ctx.lineCap = 'round';

  const attackSwing = animState === 'attack' ? -Math.sin(frame * 0.3) * 30 : 0;
  // Front arm
  ctx.beginPath();
  ctx.moveTo(torsoW / 2, torsoY + 10 - bodyBob);
  ctx.quadraticCurveTo(
    torsoW / 2 + 15, torsoY + armLen * 0.5 - bodyBob,
    torsoW / 2 + 20 + Math.sin(armAngle) * 10 + attackSwing, torsoY + armLen - bodyBob
  );
  ctx.stroke();
  // Back arm
  ctx.beginPath();
  ctx.moveTo(-torsoW / 2, torsoY + 10 - bodyBob);
  ctx.quadraticCurveTo(
    -torsoW / 2 - 15, torsoY + armLen * 0.5 - bodyBob,
    -torsoW / 2 - 20 + Math.sin(armAngle) * 5, torsoY + armLen - bodyBob
  );
  ctx.stroke();

  // Hands
  ctx.fillStyle = phase >= 3 ? '#ffaaaa' : '#ddbb99';
  ctx.beginPath();
  ctx.arc(torsoW / 2 + 20 + Math.sin(armAngle) * 10 + attackSwing, torsoY + armLen - bodyBob, 5, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = phase >= 3 ? '#887777' : '#ddbb99';
  ctx.beginPath();
  ctx.arc(0, torsoY - headR - bodyBob, headR, 0, Math.PI * 2);
  ctx.fill();

  // Boss face
  // Angry eyes
  ctx.fillStyle = phase >= 3 ? '#ff0000' : phase >= 2 ? '#ffaa00' : '#cc4444';
  ctx.beginPath();
  ctx.ellipse(headR * 0.35, torsoY - headR - 4 - bodyBob, headR * 0.15, headR * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(headR * 0.65, torsoY - headR - 4 - bodyBob, headR * 0.15, headR * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Angry eyebrows
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(headR * 0.2, torsoY - headR - 8 - bodyBob);
  ctx.lineTo(headR * 0.45, torsoY - headR - 10 - bodyBob);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(headR * 0.8, torsoY - headR - 8 - bodyBob);
  ctx.lineTo(headR * 0.55, torsoY - headR - 10 - bodyBob);
  ctx.stroke();

  // Mouth
  ctx.fillStyle = '#220000';
  ctx.beginPath();
  ctx.moveTo(headR * 0.3, torsoY - headR * 0.3 - bodyBob);
  ctx.quadraticCurveTo(headR * 0.5, torsoY - headR * 0.15 - bodyBob, headR * 0.7, torsoY - headR * 0.3 - bodyBob);
  ctx.quadraticCurveTo(headR * 0.5, torsoY - headR * 0.45 - bodyBob, headR * 0.3, torsoY - headR * 0.3 - bodyBob);
  ctx.fill();

  // Phase 3 aura effect
  if (phase >= 3) {
    ctx.strokeStyle = `rgba(255,50,50,${0.3 + Math.sin(time * 5) * 0.2})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -h / 2, w * 0.6, h * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw a weapon in the character's hand.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - hand position x
 * @param {number} y - hand position y
 * @param {string} weaponKey - weapon type identifier
 * @param {number} facing - 1 = right, -1 = left
 * @param {number} attackFrame - attack animation progress (0-1)
 */
export function drawWeaponInHand(ctx, x, y, weaponKey, facing, attackFrame) {
  const f = facing || 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(f, 1);

  const attackAngle = attackFrame ? -Math.sin(attackFrame * Math.PI) * 1.2 : 0;
  ctx.rotate(attackAngle);

  switch (weaponKey) {
    case 'bat':
      // Baseball bat
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(-2, -30, 5, 35);
      // Bat head
      ctx.fillStyle = '#A0782C';
      ctx.beginPath();
      ctx.ellipse(0.5, -35, 7, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tape wrap
      ctx.fillStyle = '#333333';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(-3, -5 + i * 5, 7, 3);
      }
      break;

    case 'knife':
      // Handle
      ctx.fillStyle = '#553322';
      ctx.fillRect(-2, -5, 5, 12);
      // Guard
      ctx.fillStyle = '#888888';
      ctx.fillRect(-5, -7, 11, 3);
      // Blade
      ctx.fillStyle = '#cccccc';
      ctx.beginPath();
      ctx.moveTo(-2, -7);
      ctx.lineTo(2, -7);
      ctx.lineTo(0.5, -28);
      ctx.lineTo(-0.5, -28);
      ctx.closePath();
      ctx.fill();
      // Blade highlight
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(0, -25, 1, 16);
      break;

    case 'pipe':
      // Lead pipe
      ctx.fillStyle = '#777788';
      ctx.save();
      ctx.rotate(0.1);
      ctx.fillRect(-3, -35, 6, 45);
      // Bend at top
      ctx.beginPath();
      ctx.arc(-3, -35, 3, Math.PI * 0.5, Math.PI, true);
      ctx.lineTo(-3, -30);
      ctx.lineTo(-1, -30);
      ctx.stroke();
      ctx.restore();
      // Rust spots
      ctx.fillStyle = '#aa5533';
      ctx.fillRect(-2, -20, 2, 3);
      ctx.fillRect(1, -8, 2, 2);
      break;

    case 'scalpel':
      // Small scalpel
      ctx.fillStyle = '#aaaaaa';
      ctx.fillRect(-1, -3, 3, 8);
      // Blade
      ctx.fillStyle = '#dddddd';
      ctx.beginPath();
      ctx.moveTo(-1, -3);
      ctx.lineTo(1, -3);
      ctx.lineTo(0.5, -18);
      ctx.lineTo(-0.5, -18);
      ctx.closePath();
      ctx.fill();
      break;

    case 'syringe':
      // Syringe body
      ctx.fillStyle = '#cccccc';
      ctx.fillRect(-3, -20, 6, 22);
      // Plunger
      ctx.fillStyle = '#888888';
      ctx.fillRect(-2, 2, 4, 10);
      // Needle
      ctx.fillStyle = '#aaaaaa';
      ctx.fillRect(-0.5, -28, 1, 10);
      // Liquid
      ctx.fillStyle = '#44ff44';
      ctx.fillRect(-2, -18, 4, 14);
      break;

    case 'pistol':
      // Gun handle
      ctx.fillStyle = '#333333';
      ctx.fillRect(-4, -2, 9, 15);
      // Gun body
      ctx.fillStyle = '#444444';
      ctx.fillRect(-5, -10, 12, 10);
      // Barrel
      ctx.fillStyle = '#555555';
      ctx.fillRect(0, -18, 4, 10);
      // Muzzle
      ctx.fillStyle = '#222222';
      ctx.fillRect(0.5, -20, 3, 3);
      // Trigger guard
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-1, 0, 5, 0, Math.PI);
      ctx.stroke();
      break;

    case 'shotgun':
      // Stock
      ctx.fillStyle = '#6B4414';
      ctx.fillRect(-4, 2, 8, 18);
      // Body
      ctx.fillStyle = '#555555';
      ctx.fillRect(-5, -12, 11, 16);
      // Barrels (double)
      ctx.fillStyle = '#666666';
      ctx.fillRect(-4, -30, 4, 20);
      ctx.fillRect(1, -30, 4, 20);
      // Muzzles
      ctx.fillStyle = '#333333';
      ctx.fillRect(-4, -32, 4, 3);
      ctx.fillRect(1, -32, 4, 3);
      // Pump
      ctx.fillStyle = '#775533';
      ctx.fillRect(-5, -6, 11, 5);
      break;

    case 'holy_cross':
      // Cross weapon
      ctx.fillStyle = '#ddbb44';
      ctx.fillRect(-2, -25, 5, 35); // Vertical
      ctx.fillRect(-10, -15, 21, 5); // Horizontal
      // Glow
      ctx.strokeStyle = `rgba(255,220,100,${0.4 + Math.sin(Date.now() * 0.005) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -10, 14, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;

    default:
      // Generic stick
      ctx.fillStyle = '#665544';
      ctx.fillRect(-2, -25, 4, 30);
      break;
  }

  ctx.restore();
}

/**
 * Draw a health bar.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - top-left x
 * @param {number} y - top-left y
 * @param {number} w - width
 * @param {number} h - height
 * @param {number} current - current HP
 * @param {number} max - max HP
 * @param {string} color - bar color
 * @param {boolean} showText - whether to show HP text
 */
export function drawHealthBar(ctx, x, y, w, h, current, max, color, showText) {
  if (max <= 0) return;
  const ratio = Math.max(0, Math.min(1, current / max));

  // Background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);

  // Border
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);

  // Health fill
  const barColor = ratio > 0.5 ? color : ratio > 0.25 ? '#cc8800' : '#cc2222';
  ctx.fillStyle = barColor;
  ctx.fillRect(x, y, w * ratio, h);

  // Highlight on health bar
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(x, y, w * ratio, h / 3);

  // Damage flash (low HP pulsing)
  if (ratio <= 0.25) {
    const pulse = Math.sin(Date.now() * 0.008) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255,0,0,${pulse * 0.2})`;
    ctx.fillRect(x, y, w * ratio, h);
  }

  // Text
  if (showText) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(10, h - 2)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.ceil(current)}/${max}`, x + w / 2, y + h / 2);
  }
}

/**
 * Draw an energy bar (blue).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} current
 * @param {number} max
 */
export function drawEnergyBar(ctx, x, y, w, h, current, max) {
  if (max <= 0) return;
  const ratio = Math.max(0, Math.min(1, current / max));

  // Background
  ctx.fillStyle = '#1a1a2a';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);

  // Border
  ctx.strokeStyle = '#334455';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);

  // Energy fill (gradient blue)
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#4488ff');
  grad.addColorStop(1, '#2266dd');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w * ratio, h);

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(x, y, w * ratio, h / 3);

  // Shimmer effect
  const shimmer = Math.sin(Date.now() * 0.003 + x) * 0.5 + 0.5;
  ctx.fillStyle = `rgba(150,200,255,${shimmer * 0.1})`;
  ctx.fillRect(x, y, w * ratio, h);
}

/* ============================================================
   Color utility helpers
   ============================================================ */

function darkenColor(color, amount) {
  if (!color || typeof color !== 'string') return '#000000';

  let r, g, b;

  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return color;
    }
  } else {
    return color;
  }

  r = Math.max(0, r - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);

  return `rgb(${r},${g},${b})`;
}
