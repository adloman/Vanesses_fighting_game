/**
 * Level definitions with drawing instructions for Abandoned Ward.
 * Draws multi-layer parallax backgrounds and environmental hazards
 * using Canvas 2D API primitives.
 */
import { LEVELS } from '../data/levelData.js';

/* ============================================================
   Level-specific drawing helpers
   ============================================================ */

// Seeded pseudo-random for deterministic decoration placement per level
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ---- Shared wall helpers ---- */

function drawWallTiles(ctx, offsetX, canvasWidth, tileColor, lineColor, tileSize) {
  const startX = -(offsetX % tileSize) - tileSize;
  for (let x = startX; x < canvasWidth + tileSize; x += tileSize) {
    ctx.fillStyle = tileColor;
    ctx.fillRect(x, 0, tileSize, tileSize);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, 0, tileSize, tileSize);
  }
}

function drawPipe(ctx, x, y, length, horizontal, radius, color) {
  ctx.fillStyle = color;
  if (horizontal) {
    ctx.fillRect(x, y - radius, length, radius * 2);
    // Joints
    ctx.fillStyle = lightenColor(color, 30);
    ctx.fillRect(x, y - radius - 2, 6, radius * 2 + 4);
    ctx.fillRect(x + length - 6, y - radius - 2, 6, radius * 2 + 4);
  } else {
    ctx.fillRect(x - radius, y, radius * 2, length);
    ctx.fillStyle = lightenColor(color, 30);
    ctx.fillRect(x - radius - 2, y, radius * 2 + 4, 6);
    ctx.fillRect(x - radius - 2, y + length - 6, radius * 2 + 4, 6);
  }
}

function lightenColor(hex, amount) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.min(255, r + amount);
  g = Math.min(255, g + amount);
  b = Math.min(255, b + amount);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex, amount) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, r - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);
  return `rgb(${r},${g},${b})`;
}

/* ---- Level 1: Lobby drawing functions ---- */

function drawLobbyFarLayer(ctx, offsetX, canvasWidth, canvasHeight) {
  const colors = LEVELS[0].bgColors;
  // Gradient ceiling / sky
  const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  grad.addColorStop(0, colors.sky[0]);
  grad.addColorStop(0.5, colors.sky[1]);
  grad.addColorStop(1, colors.sky[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Distant wall cracks (subtle lines)
  ctx.strokeStyle = 'rgba(60,60,90,0.3)';
  ctx.lineWidth = 1;
  const rand = seededRandom(101);
  for (let i = 0; i < 12; i++) {
    const cx = (rand() * 4000 - offsetX * 0.2) % (canvasWidth + 200) - 100;
    const cy = rand() * 400;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + rand() * 40 - 20, cy + rand() * 60);
    ctx.lineTo(cx + rand() * 60 - 30, cy + rand() * 100);
    ctx.stroke();
  }
}

function drawLobbyMidLayer(ctx, offsetX, canvasWidth, canvasHeight) {
  const colors = LEVELS[0].bgColors;
  const off = offsetX * 0.5;

  // Hospital wall background
  const wallGrad = ctx.createLinearGradient(0, 0, 0, 600);
  wallGrad.addColorStop(0, colors.wall[0]);
  wallGrad.addColorStop(0.5, colors.wall[1]);
  wallGrad.addColorStop(1, colors.wall[2]);
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, canvasWidth, 600);

  // Tile pattern on walls
  const tileSize = 80;
  const startX = -(off % tileSize) - tileSize;
  ctx.strokeStyle = 'rgba(80,80,120,0.15)';
  ctx.lineWidth = 1;
  for (let x = startX; x < canvasWidth + tileSize; x += tileSize) {
    ctx.strokeRect(x, 0, tileSize, tileSize);
    if (x + tileSize / 2 < canvasWidth + tileSize) {
      ctx.strokeRect(x + tileSize / 2, tileSize / 2, tileSize, tileSize);
    }
  }

  // Windows - large rectangular windows with glow
  const windowPositions = [200, 600, 1100, 1600, 2100, 2600];
  for (const wx of windowPositions) {
    const sx = wx - off;
    if (sx > -150 && sx < canvasWidth + 150) {
      // Window frame
      ctx.fillStyle = '#555566';
      ctx.fillRect(sx - 3, 60, 86, 126);
      // Glass (broken - some shards)
      ctx.fillStyle = 'rgba(100,120,160,0.2)';
      ctx.fillRect(sx, 63, 80, 120);
      // Broken glass effect
      ctx.strokeStyle = 'rgba(150,170,210,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 20, 63);
      ctx.lineTo(sx + 40, 100);
      ctx.lineTo(sx + 30, 140);
      ctx.lineTo(sx + 60, 183);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + 60, 63);
      ctx.lineTo(sx + 50, 120);
      ctx.lineTo(sx + 70, 183);
      ctx.stroke();
    }
  }

  // Doors
  const doorPositions = [400, 1000, 1500, 2200, 2800];
  for (const dx of doorPositions) {
    const sx = dx - off;
    if (sx > -80 && sx < canvasWidth + 80) {
      ctx.fillStyle = '#3a3a4a';
      ctx.fillRect(sx, 380, 70, 220);
      ctx.strokeStyle = '#555566';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, 380, 70, 220);
      // Door handle
      ctx.fillStyle = '#888899';
      ctx.beginPath();
      ctx.arc(sx + 55, 490, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Horizontal pipes along ceiling
  drawPipe(ctx, 50, 30, canvasWidth - 100, true, 6, '#666677');
  drawPipe(ctx, 80, 45, canvasWidth - 160, true, 4, '#555566');

  // Vertical pipes
  const vpipeX = [300, 900, 1500, 2100, 2700];
  for (const px of vpipeX) {
    const sx = px - off;
    if (sx > -20 && sx < canvasWidth + 20) {
      drawPipe(ctx, sx, 30, 80, false, 5, '#666677');
    }
  }
}

function drawLobbyNearLayer(ctx, offsetX, canvasWidth, canvasHeight) {
  const off = offsetX * 1.0;

  // Reception desk
  const deskX = 300 - off;
  if (deskX > -200 && deskX < canvasWidth + 200) {
    // Desk body
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(deskX, 500, 200, 100);
    // Desk top
    ctx.fillStyle = '#6a5a4a';
    ctx.fillRect(deskX - 10, 495, 220, 10);
    // Drawer handles
    ctx.fillStyle = '#888888';
    ctx.fillRect(deskX + 30, 530, 20, 4);
    ctx.fillRect(deskX + 90, 530, 20, 4);
    ctx.fillRect(deskX + 150, 530, 20, 4);
    // Computer monitor (broken)
    ctx.fillStyle = '#333333';
    ctx.fillRect(deskX + 70, 440, 50, 40);
    ctx.fillStyle = '#111111';
    ctx.fillRect(deskX + 73, 443, 44, 34);
    // Stand
    ctx.fillStyle = '#444444';
    ctx.fillRect(deskX + 92, 480, 6, 15);
    ctx.fillRect(deskX + 80, 490, 30, 5);
    // Scattered papers
    ctx.fillStyle = '#d4c8b0';
    ctx.save();
    ctx.translate(deskX + 30, 498);
    ctx.rotate(-0.2);
    ctx.fillRect(0, 0, 15, 20);
    ctx.restore();
    ctx.save();
    ctx.translate(deskX + 140, 492);
    ctx.rotate(0.3);
    ctx.fillRect(0, 0, 12, 18);
    ctx.restore();
  }

  // Overturned chairs
  const chairPositions = [550, 800, 1700, 2300];
  for (const cx of chairPositions) {
    const sx = cx - off;
    if (sx > -50 && sx < canvasWidth + 50) {
      ctx.save();
      ctx.translate(sx, 570);
      ctx.rotate(1.3); // Overturned
      // Chair seat
      ctx.fillStyle = '#4a3a2a';
      ctx.fillRect(-15, -5, 30, 5);
      // Chair back
      ctx.fillRect(-15, -30, 4, 30);
      ctx.fillRect(11, -30, 4, 30);
      // Legs
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(-15, 0, 3, 25);
      ctx.fillRect(12, 0, 3, 25);
      ctx.restore();
    }
  }

  // Flickering light fixtures
  const lightXs = [200, 600, 1100, 1600, 2100, 2600];
  const time = Date.now() * 0.001;
  for (let i = 0; i < lightXs.length; i++) {
    const sx = lightXs[i] - off;
    if (sx > -40 && sx < canvasWidth + 40) {
      // Fixture housing
      ctx.fillStyle = '#888899';
      ctx.fillRect(sx - 15, 8, 30, 8);
      // Light bulb glow (flickering)
      const flicker = 0.5 + 0.5 * Math.sin(time * 8 + i * 2.7) * Math.cos(time * 5.3 + i * 1.3);
      if (flicker > 0.3) {
        const glowAlpha = (flicker - 0.3) * 0.7;
        const glow = ctx.createRadialGradient(sx, 20, 2, sx, 20, 40);
        glow.addColorStop(0, `rgba(255,255,200,${glowAlpha})`);
        glow.addColorStop(1, `rgba(255,255,200,0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(sx - 40, -20, 80, 80);
        // Bulb
        ctx.fillStyle = `rgba(255,255,220,${glowAlpha})`;
        ctx.beginPath();
        ctx.arc(sx, 20, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Barrel debris
  const barrelPositions = [1200, 2000, 2800];
  for (const bx of barrelPositions) {
    const sx = bx - off;
    if (sx > -40 && sx < canvasWidth + 40) {
      // Barrel body
      ctx.fillStyle = '#3a4a3a';
      ctx.beginPath();
      ctx.ellipse(sx, 580, 20, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Metal bands
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, 565, 18, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(sx, 580, 20, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(sx, 595, 18, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

/* ---- Level 2: Maternity Ward ---- */

function drawMaternityFarLayer(ctx, offsetX, canvasWidth, canvasHeight) {
  const colors = LEVELS[1].bgColors;
  const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  grad.addColorStop(0, colors.sky[0]);
  grad.addColorStop(0.5, colors.sky[1]);
  grad.addColorStop(1, colors.sky[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Distant moon glow through broken ceiling
  const moonX = 800 - offsetX * 0.2;
  if (moonX > -200 && moonX < canvasWidth + 200) {
    const moonGlow = ctx.createRadialGradient(moonX, 50, 10, moonX, 50, 200);
    moonGlow.addColorStop(0, 'rgba(200,180,220,0.2)');
    moonGlow.addColorStop(1, 'rgba(200,180,220,0)');
    ctx.fillStyle = moonGlow;
    ctx.fillRect(moonX - 200, -150, 400, 400);
  }
}

function drawMaternityMidLayer(ctx, offsetX, canvasWidth, canvasHeight) {
  const colors = LEVELS[1].bgColors;
  const off = offsetX * 0.5;

  // Pale wallpaper
  const wallGrad = ctx.createLinearGradient(0, 0, 0, 600);
  wallGrad.addColorStop(0, colors.wall[0]);
  wallGrad.addColorStop(0.5, colors.wall[1]);
  wallGrad.addColorStop(1, colors.wall[2]);
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, canvasWidth, 600);

  // Wallpaper pattern (small faded flowers/dots)
  const tileSize = 60;
  const startX = -(off % tileSize) - tileSize;
  ctx.fillStyle = 'rgba(180,140,160,0.15)';
  for (let x = startX; x < canvasWidth + tileSize; x += tileSize) {
    for (let y = 0; y < 600; y += tileSize) {
      // Small diamond pattern
      ctx.beginPath();
      ctx.moveTo(x + tileSize / 2, y + 10);
      ctx.lineTo(x + tileSize / 2 + 8, y + tileSize / 2);
      ctx.lineTo(x + tileSize / 2, y + tileSize - 10);
      ctx.lineTo(x + tileSize / 2 - 8, y + tileSize / 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Blood stains on wall
  const stainPositions = [
    { x: 350, y: 250, r: 30 },
    { x: 800, y: 180, r: 20 },
    { x: 1400, y: 320, r: 25 },
    { x: 2200, y: 150, r: 35 },
    { x: 2900, y: 280, r: 22 }
  ];
  for (const st of stainPositions) {
    const sx = st.x - off;
    if (sx > -60 && sx < canvasWidth + 60) {
      // Drip stain
      ctx.fillStyle = 'rgba(120,20,20,0.4)';
      ctx.beginPath();
      ctx.arc(sx, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
      // Drip running down
      ctx.fillStyle = 'rgba(100,15,15,0.3)';
      ctx.fillRect(sx - 3, st.y + st.r, 6, 40);
      ctx.fillRect(sx - 2, st.y + st.r + 40, 4, 20);
      // Smaller splatter
      ctx.fillStyle = 'rgba(110,18,18,0.25)';
      ctx.beginPath();
      ctx.arc(sx + 15, st.y - 10, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Windows with pale curtains
  const windowXs = [250, 700, 1200, 1700, 2300, 3000];
  for (const wx of windowXs) {
    const sx = wx - off;
    if (sx > -60 && sx < canvasWidth + 60) {
      ctx.fillStyle = '#444455';
      ctx.fillRect(sx - 2, 80, 64, 100);
      ctx.fillStyle = 'rgba(60,50,80,0.5)';
      ctx.fillRect(sx, 82, 60, 96);
      // Curtain rod
      ctx.fillStyle = '#aa9988';
      ctx.fillRect(sx - 10, 78, 80, 4);
      // Curtain (torn)
      ctx.fillStyle = 'rgba(200,190,210,0.6)';
      ctx.fillRect(sx, 82, 25, 96);
      ctx.fillRect(sx + 35, 82, 25, 96);
    }
  }
}

function drawMaternityNearLayer(ctx, offsetX, canvasWidth, canvasHeight) {
  const off = offsetX * 1.0;
  const time = Date.now() * 0.001;

  // Cribs
  const cribXs = [200, 500, 900, 1300, 1800, 2300, 2800];
  for (const cx of cribXs) {
    const sx = cx - off;
    if (sx > -50 && sx < canvasWidth + 50) {
      // Crib frame
      ctx.fillStyle = '#e8dcc8';
      ctx.fillRect(sx - 20, 530, 40, 70);
      ctx.strokeStyle = '#c4b8a4';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - 20, 530, 40, 70);
      // Vertical bars
      for (let bx = -14; bx <= 14; bx += 7) {
        ctx.beginPath();
        ctx.moveTo(sx + bx, 530);
        ctx.lineTo(sx + bx, 575);
        ctx.stroke();
      }
      // Mattress
      ctx.fillStyle = '#aabbcc';
      ctx.fillRect(sx - 18, 575, 36, 22);
      // Blanket (rumpled)
      ctx.fillStyle = '#aabbdd';
      ctx.fillRect(sx - 16, 570, 32, 10);
      // Small pillow
      ctx.fillStyle = '#ccddcc';
      ctx.fillRect(sx - 14, 575, 28, 6);
    }
  }

  // Night lights (glowing pink/pale)
  const nightLightXs = [350, 1100, 2000, 2700];
  for (const nx of nightLightXs) {
    const sx = nx - off;
    if (sx > -30 && sx < canvasWidth + 30) {
      // Base
      ctx.fillStyle = '#ddccaa';
      ctx.fillRect(sx - 5, 575, 10, 25);
      // Shade
      ctx.fillStyle = '#eeddcc';
      ctx.fillRect(sx - 12, 568, 24, 12);
      // Glow
      const flicker = 0.6 + 0.4 * Math.sin(time * 3 + nx);
      const glow = ctx.createRadialGradient(sx, 570, 2, sx, 570, 50);
      glow.addColorStop(0, `rgba(255,200,220,${flicker * 0.4})`);
      glow.addColorStop(1, `rgba(255,200,220,0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(sx - 50, 520, 100, 100);
    }
  }

  // Overturned IV stands
  const ivXs = [700, 1500, 2500];
  for (const ix of ivXs) {
    const sx = ix - off;
    if (sx > -30 && sx < canvasWidth + 30) {
      ctx.save();
      ctx.translate(sx, 585);
      ctx.rotate(1.8);
      // Pole
      ctx.fillStyle = '#aaaaaa';
      ctx.fillRect(-2, -60, 4, 60);
      // Base
      ctx.fillRect(-15, -5, 30, 3);
      // Hook at top
      ctx.beginPath();
      ctx.arc(0, -60, 5, 0, Math.PI, true);
      ctx.stroke();
      ctx.restore();
    }
  }
}

/* ---- Level 3: Security ---- */

function drawSecurityFarLayer(ctx, offsetX, canvasWidth, canvasHeight) {
  const colors = LEVELS[2].bgColors;
  const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  grad.addColorStop(0, colors.sky[0]);
  grad.addColorStop(0.5, colors.sky[1]);
  grad.addColorStop(1, colors.sky[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Distant concrete wall texture
  const off = offsetX * 0.2;
  ctx.fillStyle = 'rgba(50,50,50,0.3)';
  const startX = -(off % 200) - 200;
  for (let x = startX; x < canvasWidth + 200; x += 200) {
    ctx.fillRect(x, 0, 198, 600);
    ctx.strokeStyle = 'rgba(70,70,70,0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 0, 198, 300);
    ctx.strokeRect(x + 99, 300, 99, 300);
  }
}

function drawSecurityMidLayer(ctx, offsetX, canvasWidth, canvasHeight) {
  const colors = LEVELS[2].bgColors;
  const off = offsetX * 0.5;

  // Concrete walls
  const wallGrad = ctx.createLinearGradient(0, 0, 0, 600);
  wallGrad.addColorStop(0, colors.wall[0]);
  wallGrad.addColorStop(0.5, colors.wall[1]);
  wallGrad.addColorStop(1, colors.wall[2]);
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, canvasWidth, 600);

  // Concrete block pattern
  const blockW = 120;
  const blockH = 60;
  const startX = -(off % blockW) - blockW;
  ctx.strokeStyle = 'rgba(60,60,60,0.4)';
  ctx.lineWidth = 1;
  for (let x = startX; x < canvasWidth + blockW; x += blockW) {
    let row = 0;
    for (let y = 0; y < 600; y += blockH) {
      const xOff = (row % 2 === 0) ? 0 : blockW / 2;
      ctx.strokeRect(x + xOff, y, blockW, blockH);
      row++;
    }
  }

  // Barred doors
  const doorXs = [300, 800, 1400, 2000, 2600, 3200];
  for (const dx of doorXs) {
    const sx = dx - off;
    if (sx > -70 && sx < canvasWidth + 70) {
      // Door frame
      ctx.fillStyle = '#555566';
      ctx.fillRect(sx - 5, 350, 70, 250);
      ctx.fillStyle = '#444455';
      ctx.fillRect(sx, 355, 60, 240);
      // Bars
      ctx.strokeStyle = '#888899';
      ctx.lineWidth = 3;
      for (let bx = sx + 8; bx < sx + 56; bx += 10) {
        ctx.beginPath();
        ctx.moveTo(bx, 355);
        ctx.lineTo(bx, 595);
        ctx.stroke();
      }
      // Horizontal bar
      ctx.beginPath();
      ctx.moveTo(sx, 430);
      ctx.lineTo(sx + 60, 430);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx, 510);
      ctx.lineTo(sx + 60, 510);
      ctx.stroke();
    }
  }

  // Metal detector frame
  const detectorX = 1000 - off;
  if (detectorX > -60 && detectorX < canvasWidth + 60) {
    ctx.fillStyle = '#667788';
    // Left pillar
    ctx.fillRect(detectorX - 25, 380, 10, 220);
    // Right pillar
    ctx.fillRect(detectorX + 15, 380, 10, 220);
    // Top bar
    ctx.fillRect(detectorX - 25, 380, 50, 8);
    // Indicator light (red, blinking)
    const blink = Math.sin(Date.now() * 0.005) > 0;
    ctx.fillStyle = blink ? '#ff3333' : '#661111';
    ctx.beginPath();
    ctx.arc(detectorX, 395, 4, 0, Math.PI * 2);
    ctx.fill();
    // LED panel
    ctx.fillStyle = '#112233';
    ctx.fillRect(detectorX - 15, 500, 30, 20);
    ctx.fillStyle = '#33aa33';
    ctx.font = '10px monospace';
    ctx.fillText('SEC', detectorX - 10, 514);
  }

  // Surveillance cameras
  const camXs = [500, 1200, 1900, 2700];
  for (const cx of camXs) {
    const sx = cx - off;
    if (sx > -30 && sx < canvasWidth + 30) {
      // Mounting bracket
      ctx.fillStyle = '#555566';
      ctx.fillRect(sx - 15, 20, 10, 15);
      // Camera body
      ctx.fillStyle = '#444455';
      ctx.fillRect(sx - 20, 30, 25, 15);
      // Lens
      ctx.fillStyle = '#222233';
      ctx.beginPath();
      ctx.arc(sx - 20, 37, 6, 0, Math.PI * 2);
      ctx.fill();
      // Lens glint
      ctx.fillStyle = 'rgba(100,150,255,0.5)';
      ctx.beginPath();
      ctx.arc(sx - 20, 37, 3, 0, Math.PI * 2);
      ctx.fill();
      // Status LED
      const ledBlink = Math.sin(Date.now() * 0.008 + cx) > 0;
      ctx.fillStyle = ledBlink ? '#ff0000' : '#660000';
      ctx.beginPath();
      ctx.arc(sx, 33, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSecurityNearLayer(ctx, offsetX, canvasWidth, canvasHeight) {
  const off = offsetX * 1.0;

  // Tire barriers (those traffic barriers)
  const barrierXs = [250, 700, 1100, 1600, 2100, 2600, 3100];
  for (const bx of barrierXs) {
    const sx = bx - off;
    if (sx > -30 && sx < canvasWidth + 30) {
      ctx.fillStyle = '#222222';
      ctx.beginPath();
      ctx.ellipse(sx, 585, 18, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Inner hole
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.ellipse(sx, 585, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Overturned benches
  const benchXs = [500, 1400, 2300, 3000];
  for (const bx of benchXs) {
    const sx = bx - off;
    if (sx > -40 && sx < canvasWidth + 40) {
      ctx.save();
      ctx.translate(sx, 580);
      ctx.rotate(1.2);
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(-25, -4, 50, 6);
      // Legs
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(-22, 2, 4, 15);
      ctx.fillRect(18, 2, 4, 15);
      ctx.restore();
    }
  }

  // Bullet shell casings (tiny)
  ctx.fillStyle = '#ccaa44';
  const rand = seededRandom(303);
  for (let i = 0; i < 15; i++) {
    const sx = (rand() * 4000 - off);
    if (sx > -5 && sx < canvasWidth + 5) {
      ctx.fillRect(sx, 595 + rand() * 5, 3, 6);
    }
  }
}

/* ---- Level 4: Laboratory ---- */

function drawLabFarLayer(ctx, offsetX, canvasWidth, canvasHeight) {
  const colors = LEVELS[3].bgColors;
  const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  grad.addColorStop(0, colors.sky[0]);
  grad.addColorStop(0.5, colors.sky[1]);
  grad.addColorStop(1, colors.sky[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

function drawLabMidLayer(ctx, offsetX, canvasWidth, canvasHeight) {
  const colors = LEVELS[3].bgColors;
  const off = offsetX * 0.5;

  // Green-tinted walls
  const wallGrad = ctx.createLinearGradient(0, 0, 0, 600);
  wallGrad.addColorStop(0, colors.wall[0]);
  wallGrad.addColorStop(0.5, colors.wall[1]);
  wallGrad.addColorStop(1, colors.wall[2]);
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, canvasWidth, 600);

  // Glass tubes with murky liquid
  const tubeXs = [200, 600, 1100, 1600, 2200, 2800, 3400];
  const time = Date.now() * 0.001;
  for (let i = 0; i < tubeXs.length; i++) {
    const sx = tubeXs[i] - off;
    if (sx > -30 && sx < canvasWidth + 30) {
      // Tube frame
      ctx.strokeStyle = '#888899';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx - 12, 100);
      ctx.lineTo(sx - 12, 400);
      ctx.quadraticCurveTo(sx, 420, sx + 12, 400);
      ctx.lineTo(sx + 12, 100);
      ctx.quadraticCurveTo(sx, 80, sx - 12, 100);
      ctx.stroke();

      // Murky liquid (bubbling)
      ctx.fillStyle = 'rgba(40,120,60,0.4)';
      ctx.beginPath();
      ctx.moveTo(sx - 10, 200);
      ctx.lineTo(sx - 10, 390);
      ctx.quadraticCurveTo(sx, 410, sx + 10, 390);
      ctx.lineTo(sx + 10, 200);
      ctx.quadraticCurveTo(sx, 190 + Math.sin(time * 2 + i) * 5, sx - 10, 200);
      ctx.fill();

      // Bubbles
      ctx.fillStyle = 'rgba(60,180,80,0.3)';
      for (let b = 0; b < 3; b++) {
        const by = 250 + ((time * 30 + b * 80 + i * 50) % 150);
        const bx2 = sx - 5 + Math.sin(time * 3 + b * 2) * 5;
        ctx.beginPath();
        ctx.arc(bx2, by, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Glass reflection
      ctx.strokeStyle = 'rgba(200,255,200,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx - 8, 120);
      ctx.lineTo(sx - 8, 380);
      ctx.stroke();
    }
  }

  // Lab tables
  const tableXs = [400, 900, 1500, 2000, 2600, 3200];
  for (const tx of tableXs) {
    const sx = tx - off;
    if (sx > -80 && sx < canvasWidth + 80) {
      // Table top
      ctx.fillStyle = '#667777';
      ctx.fillRect(sx - 40, 450, 80, 6);
      // Legs
      ctx.fillStyle = '#556666';
      ctx.fillRect(sx - 35, 456, 6, 144);
      ctx.fillRect(sx + 29, 456, 6, 144);
      // Cross brace
      ctx.fillRect(sx - 30, 530, 60, 3);
    }
  }
}

function drawLabNearLayer(ctx, offsetX, canvasWidth, canvasHeight) {
  const off = offsetX * 1.0;

  // Chemical shelves
  const shelfXs = [300, 1000, 1800, 2500, 3300];
  for (const sx2 of shelfXs) {
    const sx = sx2 - off;
    if (sx > -60 && sx < canvasWidth + 60) {
      // Shelf frame
      ctx.fillStyle = '#556666';
      ctx.fillRect(sx - 40, 350, 80, 8);
      ctx.fillRect(sx - 40, 420, 80, 8);
      // Supports
      ctx.fillRect(sx - 38, 350, 4, 78);
      ctx.fillRect(sx + 34, 350, 4, 78);
      // Bottles on shelf
      const bottleColors = ['#44aa44', '#aa4444', '#4444aa', '#aaaa44', '#aa44aa'];
      for (let b = 0; b < 4; b++) {
        ctx.fillStyle = bottleColors[b % bottleColors.length];
        ctx.fillRect(sx - 30 + b * 18, 360, 12, 18);
        // Bottle cap
        ctx.fillStyle = '#888888';
        ctx.fillRect(sx - 29 + b * 18, 358, 10, 4);
      }
      for (let b = 0; b < 3; b++) {
        ctx.fillStyle = bottleColors[(b + 2) % bottleColors.length];
        ctx.fillRect(sx - 25 + b * 20, 430, 14, 22);
        ctx.fillStyle = '#888888';
        ctx.fillRect(sx - 24 + b * 20, 428, 12, 4);
      }
    }
  }

  // Spilled liquid on floor
  ctx.fillStyle = 'rgba(40,120,60,0.3)';
  const spillXs = [500, 1300, 2200];
  for (const spx of spillXs) {
    const sx = spx - off;
    if (sx > -40 && sx < canvasWidth + 40) {
      ctx.beginPath();
      ctx.ellipse(sx, 598, 35, 8, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Broken equipment on floor
  const equipXs = [800, 1700, 2800];
  for (const ex of equipXs) {
    const sx = ex - off;
    if (sx > -30 && sx < canvasWidth + 30) {
      ctx.save();
      ctx.translate(sx, 585);
      ctx.rotate(0.5);
      // Monitor body
      ctx.fillStyle = '#334444';
      ctx.fillRect(-15, -20, 30, 20);
      // Cracked screen
      ctx.strokeStyle = 'rgba(100,200,100,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-10, -18);
      ctx.lineTo(0, -10);
      ctx.lineTo(8, -18);
      ctx.moveTo(2, -15);
      ctx.lineTo(10, -5);
      ctx.stroke();
      ctx.restore();
    }
  }
}

/* ---- Level 5: Pharmacy ---- */

function drawPharmacyFarLayer(ctx, offsetX, canvasWidth, canvasHeight) {
  const colors = LEVELS[4].bgColors;
  const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  grad.addColorStop(0, colors.sky[0]);
  grad.addColorStop(0.5, colors.sky[1]);
  grad.addColorStop(1, colors.sky[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

function drawPharmacyMidLayer(ctx, offsetX, canvasWidth, canvasHeight) {
  const colors = LEVELS[4].bgColors;
  const off = offsetX * 0.5;

  // Walls
  const wallGrad = ctx.createLinearGradient(0, 0, 0, 600);
  wallGrad.addColorStop(0, colors.wall[0]);
  wallGrad.addColorStop(0.5, colors.wall[1]);
  wallGrad.addColorStop(1, colors.wall[2]);
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, canvasWidth, 600);

  // Tile pattern (pharmacy-style white tiles)
  const tileSize = 50;
  const startX = -(off % tileSize) - tileSize;
  ctx.strokeStyle = 'rgba(80,90,110,0.2)';
  ctx.lineWidth = 1;
  for (let x = startX; x < canvasWidth + tileSize; x += tileSize) {
    for (let y = 0; y < 600; y += tileSize) {
      ctx.strokeRect(x, y, tileSize, tileSize);
    }
  }

  // Chemical shelves (large floor-to-ceiling)
  const shelfXs = [200, 600, 1100, 1700, 2300, 2900];
  for (const sx2 of shelfXs) {
    const sx = sx2 - off;
    if (sx > -50 && sx < canvasWidth + 50) {
      // Shelf unit
      ctx.fillStyle = '#556677';
      ctx.fillRect(sx - 30, 200, 60, 400);
      // Shelf dividers
      ctx.fillStyle = '#667788';
      for (let sy = 250; sy < 590; sy += 60) {
        ctx.fillRect(sx - 28, sy, 56, 4);
      }
      // Pill bottles on shelves
      const pillColors = ['#ff6666', '#66ff66', '#6666ff', '#ffff66', '#ff66ff', '#66ffff'];
      for (let sy = 210; sy < 580; sy += 60) {
        const count = 3 + Math.floor(Math.sin(sx2 + sy) * 2);
        for (let p = 0; p < count; p++) {
          ctx.fillStyle = pillColors[Math.abs(Math.floor(sx2 * sy + p * 7)) % pillColors.length];
          ctx.fillRect(sx - 25 + p * 16, sy + 6, 10, 16);
          // Label
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(sx - 24 + p * 16, sy + 10, 8, 6);
        }
      }
    }
  }
}

function drawPharmacyNearLayer(ctx, offsetX, canvasWidth, canvasHeight) {
  const off = offsetX * 1.0;
  const time = Date.now() * 0.001;

  // Pill bottles scattered on floor
  const bottleXs = [150, 350, 550, 800, 1050, 1300, 1600, 1900, 2200, 2600, 2900, 3100];
  for (let i = 0; i < bottleXs.length; i++) {
    const sx = bottleXs[i] - off;
    if (sx > -10 && sx < canvasWidth + 10) {
      ctx.save();
      ctx.translate(sx, 595 + (i % 3) * 3);
      ctx.rotate((i * 0.7) % 3 - 1.5);
      // Bottle
      ctx.fillStyle = i % 2 === 0 ? '#cc5555' : '#55cc55';
      ctx.fillRect(-4, -10, 8, 14);
      // Cap
      ctx.fillStyle = '#888888';
      ctx.fillRect(-3, -12, 6, 3);
      ctx.restore();
    }
  }

  // Spilled liquid on floor (multiple colors)
  const spills = [
    { x: 400, color: 'rgba(200,50,50,0.25)' },
    { x: 1200, color: 'rgba(50,200,50,0.25)' },
    { x: 2000, color: 'rgba(50,50,200,0.25)' },
    { x: 2800, color: 'rgba(200,200,50,0.25)' }
  ];
  for (const sp of spills) {
    const sx = sp.x - off;
    if (sx > -50 && sx < canvasWidth + 50) {
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.ellipse(sx, 600, 40, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Puddle shimmer
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.ellipse(sx - 10, 598, 15, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Overturned pharmacy cart
  const cartX = 1500 - off;
  if (cartX > -60 && cartX < canvasWidth + 60) {
    ctx.save();
    ctx.translate(cartX, 575);
    ctx.rotate(1.6);
    // Cart body
    ctx.fillStyle = '#778899';
    ctx.fillRect(-25, -15, 50, 30);
    // Wheels
    ctx.fillStyle = '#555555';
    ctx.beginPath();
    ctx.arc(-20, 18, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(20, 18, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* ---- Level 6: Director's Office ---- */

function drawDirectorFarLayer(ctx, offsetX, canvasWidth, canvasHeight) {
  const colors = LEVELS[5].bgColors;
  const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  grad.addColorStop(0, colors.sky[0]);
  grad.addColorStop(0.5, colors.sky[1]);
  grad.addColorStop(1, colors.sky[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Storm clouds (dark swirling shapes)
  const time = Date.now() * 0.001;
  const off = offsetX * 0.2;
  ctx.fillStyle = 'rgba(20,15,30,0.5)';
  for (let i = 0; i < 6; i++) {
    const cx = (i * 300 + 100) - off + Math.sin(time * 0.5 + i) * 30;
    const cy = 60 + Math.cos(time * 0.3 + i * 2) * 20;
    ctx.beginPath();
    ctx.arc(cx, cy, 80, 0, Math.PI * 2);
    ctx.arc(cx + 40, cy - 20, 60, 0, Math.PI * 2);
    ctx.arc(cx - 30, cy + 10, 50, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lightning flash in background (occasional)
  if (Math.sin(time * 1.5) > 0.95) {
    ctx.fillStyle = 'rgba(200,200,255,0.08)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
}

function drawDirectorMidLayer(ctx, offsetX, canvasWidth, canvasHeight) {
  const colors = LEVELS[5].bgColors;
  const off = offsetX * 0.5;
  const time = Date.now() * 0.001;

  // Luxurious dark walls
  const wallGrad = ctx.createLinearGradient(0, 0, 0, 600);
  wallGrad.addColorStop(0, colors.wall[0]);
  wallGrad.addColorStop(0.5, colors.wall[1]);
  wallGrad.addColorStop(1, colors.wall[2]);
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, canvasWidth, 600);

  // Wainscoting (lower wall paneling)
  ctx.fillStyle = 'rgba(60,40,50,0.6)';
  ctx.fillRect(0, 350, canvasWidth, 250);
  ctx.strokeStyle = 'rgba(100,70,90,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 350);
  ctx.lineTo(canvasWidth, 350);
  ctx.stroke();
  // Panel details
  const panelW = 150;
  const panelStartX = -(off % panelW) - panelW;
  for (let x = panelStartX; x < canvasWidth + panelW; x += panelW) {
    ctx.strokeRect(x + 10, 370, panelW - 20, 220);
    // Vertical groove in center of panel
    ctx.strokeStyle = 'rgba(80,50,70,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + panelW / 2, 370);
    ctx.lineTo(x + panelW / 2, 590);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(100,70,90,0.4)';
    ctx.lineWidth = 2;
  }

  // Large windows with storm outside
  const windowXs = [400, 1200, 2000, 2800, 3600];
  for (const wx of windowXs) {
    const sx = wx - off;
    if (sx > -100 && sx < canvasWidth + 100) {
      // Window frame (ornate)
      ctx.fillStyle = '#5a3a5a';
      ctx.fillRect(sx - 5, 80, 110, 250);
      ctx.strokeStyle = '#7a5a7a';
      ctx.lineWidth = 3;
      ctx.strokeRect(sx - 5, 80, 110, 250);
      // Storm view through window
      ctx.fillStyle = 'rgba(30,20,40,0.8)';
      ctx.fillRect(sx, 85, 100, 240);
      // Rain streaks
      ctx.strokeStyle = 'rgba(150,150,200,0.3)';
      ctx.lineWidth = 1;
      for (let r = 0; r < 8; r++) {
        const rx = sx + 10 + r * 12;
        const ry = 85 + (time * 100 + r * 30) % 240;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 2, ry + 15);
        ctx.stroke();
      }
      // Window cross bars (ornate)
      ctx.strokeStyle = '#6a4a6a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx + 50, 85);
      ctx.lineTo(sx + 50, 325);
      ctx.moveTo(sx, 200);
      ctx.lineTo(sx + 100, 200);
      ctx.stroke();
    }
  }

  // Chandeliers
  const chandXs = [600, 1600, 2600, 3500];
  for (let i = 0; i < chandXs.length; i++) {
    const sx = chandXs[i] - off;
    if (sx > -60 && sx < canvasWidth + 60) {
      // Chain
      ctx.strokeStyle = '#aa9977';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, 50);
      ctx.stroke();
      // Body
      ctx.fillStyle = '#8a7755';
      ctx.beginPath();
      ctx.ellipse(sx, 55, 30, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Arms
      for (let a = 0; a < 5; a++) {
        const angle = -Math.PI * 0.8 + (a / 4) * Math.PI * 0.6;
        const ax = sx + Math.cos(angle) * 35;
        const ay = 55 + Math.sin(angle) * 12;
        ctx.strokeStyle = '#aa9977';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(angle) * 20, 55);
        ctx.lineTo(ax, ay);
        ctx.stroke();
        // Candle/light
        const flicker = 0.4 + 0.6 * Math.sin(time * 6 + a * 1.5 + i * 3);
        ctx.fillStyle = `rgba(255,220,150,${flicker})`;
        ctx.beginPath();
        ctx.arc(ax, ay - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        const glow = ctx.createRadialGradient(ax, ay - 5, 1, ax, ay - 5, 25);
        glow.addColorStop(0, `rgba(255,220,150,${flicker * 0.3})`);
        glow.addColorStop(1, 'rgba(255,220,150,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(ax - 25, ay - 30, 50, 50);
      }
    }
  }
}

function drawDirectorNearLayer(ctx, offsetX, canvasWidth, canvasHeight) {
  const off = offsetX * 1.0;

  // Luxury furniture in ruin
  // Overturned desk
  const deskX = 500 - off;
  if (deskX > -120 && deskX < canvasWidth + 120) {
    ctx.save();
    ctx.translate(deskX, 570);
    ctx.rotate(1.5);
    // Desk body (ornate)
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(-40, -15, 80, 20);
    // Carved legs
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(-38, 5, 6, 30);
    ctx.fillRect(32, 5, 6, 30);
    // Gold trim (tarnished)
    ctx.strokeStyle = '#8a7a3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(-40, -15, 80, 20);
    ctx.restore();
  }

  // Overturned bookshelf
  const shelfX = 1500 - off;
  if (shelfX > -80 && shelfX < canvasWidth + 80) {
    ctx.save();
    ctx.translate(shelfX, 560);
    ctx.rotate(1.8);
    // Shelf body
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(-30, -60, 60, 100);
    // Shelves
    ctx.fillStyle = '#3a2a1a';
    for (let sy = -50; sy < 40; sy += 25) {
      ctx.fillRect(-28, sy, 56, 4);
    }
    // Scattered books
    ctx.fillStyle = '#aa3333';
    ctx.fillRect(-20, -55, 8, 18);
    ctx.fillStyle = '#3333aa';
    ctx.fillRect(-8, -53, 7, 16);
    ctx.fillStyle = '#33aa33';
    ctx.fillRect(5, -56, 9, 19);
    ctx.restore();
  }

  // Ruined armchairs
  const chairXs = [800, 2200, 3200];
  for (const cx of chairXs) {
    const sx = cx - off;
    if (sx > -40 && sx < canvasWidth + 40) {
      ctx.save();
      ctx.translate(sx, 575);
      ctx.rotate(1.1 + (cx % 3) * 0.3);
      // Chair body
      ctx.fillStyle = '#4a1a1a';
      ctx.fillRect(-20, -35, 40, 35);
      // Back
      ctx.fillRect(-20, -55, 6, 25);
      ctx.fillRect(14, -55, 6, 25);
      // Seat cushion (torn, stuffing visible)
      ctx.fillStyle = '#5a2a2a';
      ctx.fillRect(-18, -20, 36, 10);
      // Torn fabric
      ctx.fillStyle = '#aa9977';
      ctx.fillRect(-10, -18, 20, 5);
      ctx.restore();
    }
  }

  // Scattered papers and debris
  ctx.fillStyle = '#d4c8b0';
  const rand = seededRandom(606);
  for (let i = 0; i < 20; i++) {
    const sx = (rand() * 4000 - off);
    if (sx > -10 && sx < canvasWidth + 10) {
      ctx.save();
      ctx.translate(sx, 596 + rand() * 4);
      ctx.rotate(rand() * 3);
      ctx.fillRect(0, 0, 8, 12);
      ctx.restore();
    }
  }

  // Broken picture frames on wall
  const frameXs = [350, 1100, 1900, 2700];
  for (const fx of frameXs) {
    const sx = fx - off;
    if (sx > -40 && sx < canvasWidth + 40) {
      // Frame
      ctx.strokeStyle = '#aa8855';
      ctx.lineWidth = 3;
      ctx.strokeRect(sx - 18, 260, 36, 48);
      // Dark canvas (painting destroyed)
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(sx - 15, 263, 30, 42);
      // Crack through painting
      ctx.strokeStyle = 'rgba(100,80,60,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx - 5, 263);
      ctx.lineTo(sx + 3, 285);
      ctx.lineTo(sx - 2, 305);
      ctx.stroke();
    }
  }
}

/* ============================================================
   Main exported functions
   ============================================================ */

/**
 * Draw the multi-layer parallax background for a given level.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} levelIndex - index into LEVELS array
 * @param {object} camera - {x, y} camera position
 * @param {number} scrollX - horizontal scroll offset
 */
export function drawLevelBackground(ctx, levelIndex, camera, scrollX) {
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;

  switch (levelIndex) {
    case 0: // Lobby
      drawLobbyFarLayer(ctx, scrollX, canvasWidth, canvasHeight);
      drawLobbyMidLayer(ctx, scrollX, canvasWidth, canvasHeight);
      drawLobbyNearLayer(ctx, scrollX, canvasWidth, canvasHeight);
      break;
    case 1: // Maternity
      drawMaternityFarLayer(ctx, scrollX, canvasWidth, canvasHeight);
      drawMaternityMidLayer(ctx, scrollX, canvasWidth, canvasHeight);
      drawMaternityNearLayer(ctx, scrollX, canvasWidth, canvasHeight);
      break;
    case 2: // Security
      drawSecurityFarLayer(ctx, scrollX, canvasWidth, canvasHeight);
      drawSecurityMidLayer(ctx, scrollX, canvasWidth, canvasHeight);
      drawSecurityNearLayer(ctx, scrollX, canvasWidth, canvasHeight);
      break;
    case 3: // Lab
      drawLabFarLayer(ctx, scrollX, canvasWidth, canvasHeight);
      drawLabMidLayer(ctx, scrollX, canvasWidth, canvasHeight);
      drawLabNearLayer(ctx, scrollX, canvasWidth, canvasHeight);
      break;
    case 4: // Pharmacy
      drawPharmacyFarLayer(ctx, scrollX, canvasWidth, canvasHeight);
      drawPharmacyMidLayer(ctx, scrollX, canvasWidth, canvasHeight);
      drawPharmacyNearLayer(ctx, scrollX, canvasWidth, canvasHeight);
      break;
    case 5: // Director
      drawDirectorFarLayer(ctx, scrollX, canvasWidth, canvasHeight);
      drawDirectorMidLayer(ctx, scrollX, canvasWidth, canvasHeight);
      drawDirectorNearLayer(ctx, scrollX, canvasWidth, canvasHeight);
      break;
    default:
      // Fallback: dark background
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // Floor (always drawn at y=600 to y=720)
  drawFloor(ctx, levelIndex, scrollX, canvasWidth);
}

/**
 * Draw the floor for the current level.
 */
function drawFloor(ctx, levelIndex, scrollX, canvasWidth) {
  const colors = LEVELS[Math.min(levelIndex, LEVELS.length - 1)].bgColors;
  const floorY = 600;
  const floorH = 120;

  // Main floor
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, floorY + floorH);
  floorGrad.addColorStop(0, colors.floor[0]);
  floorGrad.addColorStop(0.5, colors.floor[1]);
  floorGrad.addColorStop(1, colors.floor[2]);
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, canvasWidth, floorH);

  // Floor line
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(canvasWidth, floorY);
  ctx.stroke();

  // Floor tiles
  ctx.strokeStyle = 'rgba(100,100,100,0.1)';
  ctx.lineWidth = 1;
  const tileSize = 64;
  const startX = -(scrollX % tileSize) - tileSize;
  for (let x = startX; x < canvasWidth + tileSize; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, floorY);
    ctx.lineTo(x, floorY + floorH);
    ctx.stroke();
  }
  // Horizontal floor lines
  for (let y = floorY + tileSize; y < floorY + floorH; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }
}

/* ============================================================
   Hazard drawing
   ============================================================ */

/**
 * Draw an environmental hazard.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} hazardType - type identifier
 * @param {object} hazard - hazard data object
 * @param {object} camera - {x, y} camera position
 */
export function drawHazard(ctx, hazardType, hazard, camera) {
  const time = Date.now() * 0.001;

  switch (hazardType) {
    case 'broken_glass':
      drawBrokenGlass(ctx, hazard, camera, time);
      break;
    case 'biohazard_puddle':
      drawBiohazardPuddle(ctx, hazard, camera, time);
      break;
    case 'tripwire':
      drawTripwire(ctx, hazard, camera, time);
      break;
    case 'toxic_gas':
      drawToxicGas(ctx, hazard, camera, time);
      break;
    case 'acid_drip':
      drawAcidDrip(ctx, hazard, camera, time);
      break;
    case 'lightning':
      drawLightningHazard(ctx, hazard, camera, time);
      break;
    default:
      break;
  }
}

function drawBrokenGlass(ctx, hazard, camera, time) {
  const x = hazard.x - camera.x;
  const y = hazard.y - camera.y;
  const w = hazard.w || 80;

  // Shimmer effect
  const shimmer = 0.5 + 0.5 * Math.sin(time * 4 + hazard.x);
  for (let i = 0; i < 8; i++) {
    const gx = x + (i / 8) * w;
    const gy = y + Math.sin(time * 2 + i * 1.5) * 2;

    // Glass shard (triangle)
    ctx.fillStyle = `rgba(180,220,255,${shimmer * 0.4})`;
    ctx.strokeStyle = `rgba(200,240,255,${shimmer * 0.6})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + 8 + Math.sin(i) * 4, gy + 6);
    ctx.lineTo(gx - 3 + Math.cos(i) * 3, gy + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Glint highlights
  ctx.fillStyle = `rgba(255,255,255,${shimmer * 0.3})`;
  for (let i = 0; i < 4; i++) {
    const gx = x + Math.sin(time * 3 + i * 2) * w * 0.3 + w * 0.5;
    const gy = y + Math.cos(time * 2.5 + i) * 3;
    ctx.beginPath();
    ctx.arc(gx, gy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBiohazardPuddle(ctx, hazard, camera, time) {
  const x = hazard.x - camera.x;
  const y = hazard.y - camera.y;
  const r = hazard.radius || 30;
  const pulse = 1 + 0.1 * Math.sin(time * 3 + hazard.x * 0.01);

  // Outer glow
  const outerGlow = ctx.createRadialGradient(x, y, r * 0.3 * pulse, x, y, r * 1.5 * pulse);
  outerGlow.addColorStop(0, 'rgba(50,200,50,0.3)');
  outerGlow.addColorStop(0.6, 'rgba(30,150,30,0.15)');
  outerGlow.addColorStop(1, 'rgba(20,100,20,0)');
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.5 * pulse, 0, Math.PI * 2);
  ctx.fill();

  // Inner puddle
  const innerGlow = ctx.createRadialGradient(x, y, 0, x, y, r * pulse);
  innerGlow.addColorStop(0, 'rgba(80,255,80,0.5)');
  innerGlow.addColorStop(0.5, 'rgba(40,180,40,0.35)');
  innerGlow.addColorStop(1, 'rgba(20,120,20,0.1)');
  ctx.fillStyle = innerGlow;
  ctx.beginPath();
  ctx.arc(x, y, r * pulse, 0, Math.PI * 2);
  ctx.fill();

  // Bubble effect
  ctx.fillStyle = 'rgba(120,255,120,0.3)';
  for (let i = 0; i < 3; i++) {
    const bx = x + Math.sin(time * 2 + i * 2.5) * r * 0.5;
    const by = y + Math.cos(time * 1.5 + i * 3) * r * 0.3 - 5;
    const br = 2 + Math.sin(time * 4 + i) * 1;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTripwire(ctx, hazard, camera, time) {
  const x1 = hazard.x - camera.x;
  const y1 = hazard.y - camera.y;
  const x2 = (hazard.x2 || hazard.x + 120) - camera.x;
  const y2 = (hazard.y2 || hazard.y) - camera.y;

  // Slight sag in the wire
  const midX = (x1 + x2) / 2;
  const midY = Math.max(y1, y2) + 8 + Math.sin(time * 2) * 2;

  // Wire
  ctx.strokeStyle = 'rgba(180,180,180,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(midX, midY, x2, y2);
  ctx.stroke();

  // Shimmer on wire
  const shimmer = 0.3 + 0.3 * Math.sin(time * 5);
  ctx.strokeStyle = `rgba(255,255,255,${shimmer})`;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(midX, midY, x2, y2);
  ctx.stroke();

  // Mounting points
  ctx.fillStyle = '#666666';
  ctx.beginPath();
  ctx.arc(x1, y1, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x2, y2, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawToxicGas(ctx, hazard, camera, time) {
  const x = hazard.x - camera.x;
  const y = hazard.y - camera.y;
  const w = hazard.w || 200;
  const h = hazard.h || 200;

  // Multiple cloud puffs
  for (let i = 0; i < 6; i++) {
    const puffX = x + (Math.sin(time * 0.8 + i * 1.7) * w * 0.3) + (i / 6) * w;
    const puffY = y + (Math.cos(time * 0.6 + i * 2.1) * h * 0.2) + h * 0.5;
    const puffR = 25 + Math.sin(time * 1.5 + i * 0.8) * 10;
    const alpha = 0.15 + 0.1 * Math.sin(time * 2 + i);

    const grad = ctx.createRadialGradient(puffX, puffY, 0, puffX, puffY, puffR);
    grad.addColorStop(0, `rgba(80,200,80,${alpha})`);
    grad.addColorStop(0.5, `rgba(50,150,50,${alpha * 0.6})`);
    grad.addColorStop(1, 'rgba(30,100,30,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(puffX, puffY, puffR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Overall green tint for the area
  ctx.fillStyle = 'rgba(40,120,40,0.05)';
  ctx.fillRect(x, y, w, h);
}

function drawAcidDrip(ctx, hazard, camera, time) {
  const x = hazard.x - camera.x;
  const interval = hazard.interval || 1.5;
  const phase = (time % interval) / interval;

  // Pipe/ceiling attachment point
  ctx.fillStyle = '#556666';
  ctx.fillRect(x - 5, 0, 10, 15);
  ctx.fillStyle = '#445555';
  ctx.beginPath();
  ctx.arc(x, 15, 6, 0, Math.PI * 2);
  ctx.fill();

  // Dripping acid droplet
  if (phase < 0.7) {
    const dropY = 20 + phase * 500;
    const dropAlpha = 1 - phase * 1.2;
    if (dropAlpha > 0 && dropY < 600) {
      // Droplet shape
      ctx.fillStyle = `rgba(150,255,50,${Math.max(0, dropAlpha)})`;
      ctx.beginPath();
      ctx.arc(x, dropY, 4, 0, Math.PI * 2);
      ctx.fill();
      // Droplet tail
      ctx.beginPath();
      ctx.moveTo(x, dropY - 4);
      ctx.lineTo(x - 2, dropY - 10);
      ctx.lineTo(x + 2, dropY - 10);
      ctx.closePath();
      ctx.fill();
      // Glow around droplet
      const glow = ctx.createRadialGradient(x, dropY, 1, x, dropY, 15);
      glow.addColorStop(0, `rgba(150,255,50,${Math.max(0, dropAlpha * 0.3)})`);
      glow.addColorStop(1, 'rgba(150,255,50,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, dropY, 15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Splash effect at bottom
  if (phase > 0.65 && phase < 0.85) {
    const splashPhase = (phase - 0.65) / 0.2;
    const splashAlpha = 1 - splashPhase;
    ctx.fillStyle = `rgba(150,255,50,${Math.max(0, splashAlpha * 0.5)})`;
    for (let i = 0; i < 5; i++) {
      const sx = x + Math.sin(i * 1.5) * (8 + splashPhase * 15);
      const sy = 595 - splashPhase * 20 + Math.cos(i * 2) * 5;
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Puddle at base
  ctx.fillStyle = 'rgba(100,200,50,0.2)';
  ctx.beginPath();
  ctx.ellipse(x, 598, 15, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawLightningHazard(ctx, hazard, camera, time) {
  const interval = hazard.interval || 3.0;
  const phase = (time % interval) / interval;

  // Only flash briefly
  if (phase < 0.15) {
    const flashAlpha = 1 - phase / 0.15;
    const x = hazard.x - camera.x;

    // Bright jagged line from top
    ctx.strokeStyle = `rgba(255,255,220,${flashAlpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    let cy = 0;
    const targetY = 500;
    const segments = 8;
    for (let i = 1; i <= segments; i++) {
      const ny = (i / segments) * targetY;
      const nx = x + (Math.random() - 0.5) * 60;
      ctx.lineTo(nx, ny);
      cy = ny;
    }
    ctx.stroke();

    // Inner brighter line
    ctx.strokeStyle = `rgba(255,255,255,${flashAlpha * 0.8})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let i = 1; i <= segments; i++) {
      const ny = (i / segments) * targetY;
      const nx = x + (Math.random() - 0.5) * 30;
      ctx.lineTo(nx, ny);
    }
    ctx.stroke();

    // Glow effect
    const glow = ctx.createRadialGradient(x, 200, 10, x, 200, 200);
    glow.addColorStop(0, `rgba(255,255,220,${flashAlpha * 0.3})`);
    glow.addColorStop(1, 'rgba(255,255,220,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 200, 0, 400, 500);
  }

  // Warning indicator
  if (phase > 0.8) {
    const warnAlpha = (phase - 0.8) / 0.2;
    const x = hazard.x - camera.x;
    ctx.fillStyle = `rgba(255,255,100,${warnAlpha * 0.3 * Math.sin(time * 15)})`;
    ctx.beginPath();
    ctx.arc(x, 20, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ============================================================
   Hazard zone queries
   ============================================================ */

/**
 * Get hazard zone positions and sizes for a level.
 * Returns array of {type, x, y, w, h, damage, ...extra}.
 * @param {number} levelIndex
 * @param {number} worldWidth
 * @returns {Array}
 */
export function getHazardZones(levelIndex, worldWidth) {
  if (levelIndex < 0 || levelIndex >= LEVELS.length) {
    return [];
  }

  const level = LEVELS[levelIndex];
  const zones = [];

  for (const h of level.hazards) {
    const zone = { type: h.type, damage: h.damage || 5 };

    switch (h.type) {
      case 'broken_glass':
        zone.x = h.x;
        zone.y = h.y || 590;
        zone.w = h.w || 80;
        zone.h = h.h || 10;
        break;
      case 'biohazard_puddle':
        zone.x = h.x - (h.radius || 30);
        zone.y = h.y - (h.radius || 30);
        zone.w = (h.radius || 30) * 2;
        zone.h = (h.radius || 30) * 2;
        zone.radius = h.radius;
        break;
      case 'tripwire':
        zone.x = Math.min(h.x, h.x2 || h.x + 120);
        zone.y = h.y - 10;
        zone.w = Math.abs((h.x2 || h.x + 120) - h.x);
        zone.h = 20;
        zone.x1 = h.x;
        zone.y1 = h.y;
        zone.x2 = h.x2 || h.x + 120;
        zone.y2 = h.y2 || h.y;
        break;
      case 'toxic_gas':
        zone.x = h.x;
        zone.y = h.y || 350;
        zone.w = h.w || 200;
        zone.h = h.h || 200;
        break;
      case 'acid_drip':
        zone.x = h.x - 20;
        zone.y = 0;
        zone.w = 40;
        zone.h = 600;
        zone.interval = h.interval || 1.5;
        break;
      case 'lightning':
        zone.x = h.x - 40;
        zone.y = 0;
        zone.w = 80;
        zone.h = 600;
        zone.interval = h.interval || 3.0;
        break;
      default:
        zone.x = h.x;
        zone.y = h.y || 580;
        zone.w = h.w || 50;
        zone.h = h.h || 20;
    }

    zones.push(zone);
  }

  return zones;
}
