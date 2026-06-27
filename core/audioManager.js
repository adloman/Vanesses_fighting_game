// ============================================================================
// core/audioManager.js - Web Audio API Procedural Audio Manager (Singleton)
// ============================================================================

let audioContext = null;
let masterGain = null;
let masterVolume = 0.7;
let initialized = false;

/**
 * Create and resume the AudioContext. Must be called from a user gesture.
 */
function createAudioContext() {
    if (initialized) return;

    try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;

        audioContext = new AC();
        masterGain = audioContext.createGain();
        masterGain.gain.value = masterVolume;
        masterGain.connect(audioContext.destination);

        initialized = true;
    } catch (e) {
        console.warn('AudioManager: Failed to create AudioContext', e);
    }
}

/**
 * Ensure the audio context is running (browsers require user gesture).
 */
function ensureRunning() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

// ============================================================================
// Sound Generators
// ============================================================================

/**
 * Hit sound - short noise burst with quick decay.
 */
function playHit() {
    if (!audioContext) return;
    ensureRunning();

    const duration = 0.12;
    const now = audioContext.currentTime;

    // Noise source via buffer
    const bufferSize = audioContext.sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + duration);
    filter.Q.value = 1.5;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start(now);
    source.stop(now + duration);
}

/**
 * Swing sound - filtered frequency sweep downward.
 */
function playSwing() {
    if (!audioContext) return;
    ensureRunning();

    const duration = 0.15;
    const now = audioContext.currentTime;

    const osc = audioContext.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + duration);

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + duration);
}

/**
 * Ability sound - ascending tone with harmonics.
 */
function playAbility() {
    if (!audioContext) return;
    ensureRunning();

    const duration = 0.4;
    const now = audioContext.currentTime;

    // Main oscillator
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + duration * 0.7);

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.setValueAtTime(0.3, now + duration * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Harmonic
    const osc2 = audioContext.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(600, now);
    osc2.frequency.exponentialRampToValueAtTime(2400, now + duration * 0.7);

    const gain2 = audioContext.createGain();
    gain2.gain.setValueAtTime(0.1, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(masterGain);
    osc2.connect(gain2);
    gain2.connect(masterGain);

    osc.start(now);
    osc.stop(now + duration);
    osc2.start(now);
    osc2.stop(now + duration);
}

/**
 * Death sound - low thud with rumble.
 */
function playDeath() {
    if (!audioContext) return;
    ensureRunning();

    const duration = 0.5;
    const now = audioContext.currentTime;

    // Low oscillator
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + duration);

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Noise layer
    const bufferSize = audioContext.sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const noiseData = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 4);
    }

    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.5);

    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 200;

    osc.connect(gain);
    gain.connect(masterGain);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    osc.start(now);
    osc.stop(now + duration);
    noiseSource.start(now);
    noiseSource.stop(now + duration);
}

/**
 * Boss roar sound - descending growl with noise.
 */
function playBossRoar() {
    if (!audioContext) return;
    ensureRunning();

    const duration = 1.0;
    const now = audioContext.currentTime;

    // Growl oscillator
    const osc = audioContext.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + duration);

    const oscGain = audioContext.createGain();
    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.setValueAtTime(0.35, now + 0.1);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + duration);
    filter.Q.value = 5;

    // Noise component
    const bufferSize = audioContext.sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const noiseData = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        const env = Math.pow(1 - i / bufferSize, 2);
        noiseData[i] = (Math.random() * 2 - 1) * env;
    }

    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(300, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(60, now + duration);
    noiseFilter.Q.value = 3;

    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(masterGain);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    osc.start(now);
    osc.stop(now + duration);
    noiseSource.start(now);
    noiseSource.stop(now + duration);
}

/**
 * Pickup sound - cheerful ascending ding.
 */
function playPickup() {
    if (!audioContext) return;
    ensureRunning();

    const now = audioContext.currentTime;

    // First note
    const osc1 = audioContext.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);

    const gain1 = audioContext.createGain();
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    // Second note (higher)
    const osc2 = audioContext.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, now + 0.1);

    const gain2 = audioContext.createGain();
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.25, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc2.connect(gain2);
    gain2.connect(masterGain);

    osc1.start(now);
    osc1.stop(now + 0.15);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.35);
}

/**
 * Ambient sound - low drone with LFO modulation.
 * Returns a function to stop the ambient.
 */
function playAmbient() {
    if (!audioContext) return null;
    ensureRunning();

    const now = audioContext.currentTime;

    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, now); // Low A

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.08, now);

    // LFO for tremolo
    const lfo = audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.5, now);

    const lfoGain = audioContext.createGain();
    lfoGain.gain.setValueAtTime(0.03, now);

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    // Second harmonic
    const osc2 = audioContext.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(82.5, now); // Slightly detuned

    const gain2 = audioContext.createGain();
    gain2.gain.setValueAtTime(0.04, now);

    osc.connect(gain);
    gain.connect(masterGain);
    osc2.connect(gain2);
    gain2.connect(masterGain);

    osc.start(now);
    osc2.start(now);
    lfo.start(now);

    // Return stop function
    return {
        stop() {
            const stopTime = audioContext ? audioContext.currentTime : 0;
            gain.gain.exponentialRampToValueAtTime(0.001, stopTime + 0.5);
            gain2.gain.exponentialRampToValueAtTime(0.001, stopTime + 0.5);
            osc.stop(stopTime + 0.6);
            osc2.stop(stopTime + 0.6);
            lfo.stop(stopTime + 0.6);
        }
    };
}

/**
 * Explosion sound - noise burst + low frequency thump.
 */
function playExplosion() {
    if (!audioContext) return;
    ensureRunning();

    const duration = 0.6;
    const now = audioContext.currentTime;

    // Low thump
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + duration);

    const oscGain = audioContext.createGain();
    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Noise burst
    const bufferSize = audioContext.sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const noiseData = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        const env = Math.pow(1 - i / bufferSize, 3);
        noiseData[i] = (Math.random() * 2 - 1) * env;
    }

    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);

    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(3000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + duration);

    // Sub bass
    const sub = audioContext.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(40, now);

    const subGain = audioContext.createGain();
    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(oscGain);
    oscGain.connect(masterGain);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    sub.connect(subGain);
    subGain.connect(masterGain);

    osc.start(now);
    osc.stop(now + duration);
    noiseSource.start(now);
    noiseSource.stop(now + duration);
    sub.start(now);
    sub.stop(now + duration);
}

// ============================================================================
// Sound Registry
// ============================================================================

const SOUND_MAP = {
    hit: playHit,
    swing: playSwing,
    ability: playAbility,
    death: playDeath,
    bossRoar: playBossRoar,
    pickup: playPickup,
    ambient: playAmbient,
    explosion: playExplosion,
};

// ============================================================================
// Singleton Audio Manager
// ============================================================================

const AudioManager = {
    /**
     * Initialize the audio system. Call from a user gesture (click/touch).
     */
    init() {
        createAudioContext();
    },

    /**
     * Play a named sound effect.
     * @param {string} soundName - Name of the sound (hit, swing, ability, death, bossRoar, pickup, ambient, explosion).
     * @returns {*} For 'ambient', returns a stop handle. For others, returns nothing.
     */
    play(soundName) {
        if (!initialized) {
            createAudioContext();
        }
        if (!audioContext) return null;

        const fn = SOUND_MAP[soundName];
        if (fn) {
            return fn();
        } else {
            console.warn(`AudioManager: Unknown sound "${soundName}"`);
        }
        return null;
    },

    /**
     * Set the master volume (0.0 to 1.0).
     * @param {number} vol
     */
    setVolume(vol) {
        masterVolume = Math.max(0, Math.min(1, vol));
        if (masterGain) {
            masterGain.gain.setValueAtTime(masterVolume, audioContext.currentTime);
        }
    },

    /**
     * Get the current master volume.
     * @returns {number}
     */
    getVolume() {
        return masterVolume;
    },

    /**
     * Check if audio is initialized.
     * @returns {boolean}
     */
    isInitialized() {
        return initialized;
    },

    /**
     * Mute all audio.
     */
    mute() {
        this.setVolume(0);
    },

    /**
     * Unmute audio to previous volume.
     * @param {number} [vol=0.7] - Volume to restore to.
     */
    unmute(vol = 0.7) {
        this.setVolume(vol);
    },
};

export default AudioManager;
