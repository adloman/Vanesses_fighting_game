// ============================================================================
// main.js - Entry Point for "Abandoned Ward"
// Modular HTML5 Canvas game with state-machine-driven architecture.
// ============================================================================

import { GAME_WIDTH, GAME_HEIGHT, COLORS, TOUCH_CONTROLS } from './game.config.js';
import { StateMachine } from './core/stateMachine.js';
import { InputManager } from './core/inputManager.js';
import { Camera } from './core/camera.js';
import { CollisionManager } from './core/collisionManager.js';
import AudioManager from './core/audioManager.js';
import gameState from './core/gameState.js';

// ============================================================================
// Import all state objects from states/ folder
// ============================================================================

import { bootState } from './states/bootState.js';
import { menuState } from './states/menuState.js';
import { charSelectState } from './states/charSelectState.js';
import { weaponSelectState } from './states/weaponSelectState.js';
import { playState } from './states/playState.js';
import { pauseState } from './states/pauseState.js';
import { gameOverState } from './states/gameOverState.js';
import { victoryState } from './states/victoryState.js';

// ============================================================================
// Canvas Setup
// ============================================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set internal resolution
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// ============================================================================
// Core Systems Initialization
// ============================================================================

const stateMachine = new StateMachine();
const inputManager = new InputManager(canvas);
const camera = new Camera();
const collisionManager = new CollisionManager();

// Initialize audio (singleton, safe to call multiple times)
AudioManager.init();

// ============================================================================
// Shared References
// All state objects receive the same shared object so they can access
// core systems without importing them individually.
// ============================================================================

const sharedRefs = {
    stateMachine,
    inputManager,
    camera,
    collisionManager,
    gameState,
    canvas,
    ctx,
};

bootState.shared = sharedRefs;
menuState.shared = sharedRefs;
charSelectState.shared = sharedRefs;
weaponSelectState.shared = sharedRefs;
playState.shared = sharedRefs;
pauseState.shared = sharedRefs;
gameOverState.shared = sharedRefs;
victoryState.shared = sharedRefs;

// ============================================================================
// Register All States
// ============================================================================

stateMachine.add('boot', bootState);
stateMachine.add('menu', menuState);
stateMachine.add('charSelect', charSelectState);
stateMachine.add('weaponSelect', weaponSelectState);
stateMachine.add('play', playState);
stateMachine.add('pause', pauseState);
stateMachine.add('gameOver', gameOverState);
stateMachine.add('victory', victoryState);

// ============================================================================
// Window Resize Handler
// Maintains aspect ratio and updates input coordinate mapping.
// ============================================================================

function handleResize() {
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;

    // Calculate scale to fit game canvas in window while maintaining aspect ratio
    const gameAspect = GAME_WIDTH / GAME_HEIGHT;
    const windowAspect = windowW / windowH;

    let displayW, displayH;
    if (windowAspect > gameAspect) {
        // Window is wider than game - fit height
        displayH = windowH;
        displayW = windowH * gameAspect;
    } else {
        // Window is taller than game - fit width
        displayW = windowW;
        displayH = windowW / gameAspect;
    }

    canvas.style.width = displayW + 'px';
    canvas.style.height = displayH + 'px';

    // Update input manager scale for touch coordinate mapping
    const scaleX = GAME_WIDTH / displayW;
    const scaleY = GAME_HEIGHT / displayH;
    inputManager.updateScale(scaleX, scaleY);
}

window.addEventListener('resize', handleResize);
handleResize();

// ============================================================================
// Game Loop
// Uses requestAnimationFrame with delta time capped at 50ms to prevent
// physics issues after tab switches or long frame stalls.
// ============================================================================

let lastTime = 0;

function gameLoop(timestamp) {
    // Calculate delta time in seconds
    if (lastTime === 0) {
        lastTime = timestamp;
    }
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Cap delta time to prevent huge jumps (e.g., after tab switch)
    dt = Math.min(dt, 0.05);

    // Update
    stateMachine.update(dt);

    // Render
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    stateMachine.render(ctx);

    // Clear input frame state (reset "just pressed" flags)
    inputManager.endFrame();

    // Request next frame
    requestAnimationFrame(gameLoop);
}

// ============================================================================
// Start
// ============================================================================

stateMachine.switch('boot');
requestAnimationFrame(gameLoop);

console.log('Abandoned Ward - Game Initialized');
