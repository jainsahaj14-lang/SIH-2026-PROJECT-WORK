/**
 * Configuration and Audio Engine for "Sequence Recall"
 *
 * Adaptive Speed Logic:
 * - Reaction time is measured between clicks during player input.
 * - Fast reaction (< 500ms): speeds up playback animation (down to 250ms per tile).
 * - Slow reaction (> 1200ms): slows down playback animation (up to 900ms per tile).
 * - Clamped within safe, fair boundaries.
 */

export const STORAGE_KEY_HIGH_SCORE = 'cognicare_sequence_recall_high_score';

// Pentatonic scale frequencies (Hz) for 9 tiles for pleasant melodic audio
export const TILE_FREQUENCIES = [
  261.63, // Tile 0: C4
  293.66, // Tile 1: D4
  329.63, // Tile 2: E4
  392.00, // Tile 3: G4
  440.00, // Tile 4: A4
  523.25, // Tile 5: C5
  587.33, // Tile 6: D5
  659.25, // Tile 7: E5
  783.99, // Tile 8: G5
];

export const ERROR_FREQUENCY = 140; // Low buzz tone for error

/**
 * Audio Synthesizer using Web Audio API (Zero external assets required)
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTileTone(tileIndex, durationMs = 250) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const freq = TILE_FREQUENCIES[tileIndex] || 440;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Smooth attack & decay envelope
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, this.ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + durationMs / 1000 + 0.05);
    } catch (e) {
      // Audio fallback
    }
  }

  playErrorTone() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(ERROR_FREQUENCY, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(ERROR_FREQUENCY - 30, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch (e) {
      // Audio fallback
    }
  }
}

export const soundEngine = new SoundEngine();

/**
 * Adaptive Speed Controller
 */
export const SPEED_BOUNDS = {
  MIN_TOTAL: 250, // Ultra-fast (250ms total per tile)
  MAX_TOTAL: 900, // Relaxed / gentle (900ms total per tile)
  INITIAL_TOTAL: 700, // Default friendly speed
  FAST_REACTION_THRESHOLD: 500, // ms avg reaction time
  SLOW_REACTION_THRESHOLD: 1200, // ms avg reaction time
  STEP_CHANGE: 45, // ms adjustment per round
};

/**
 * Computes the new playback speed given previous speed and player reaction time
 * @param {number} currentSpeed - current total ms per tile
 * @param {number} avgReactionTime - average ms per click during round
 * @returns {number} new total ms per tile
 */
export function calculateAdaptiveSpeed(currentSpeed, avgReactionTime) {
  let newSpeed = currentSpeed;

  if (avgReactionTime > 0 && avgReactionTime < SPEED_BOUNDS.FAST_REACTION_THRESHOLD) {
    // Player is fast: speed up animation (decrease delay)
    newSpeed = Math.max(SPEED_BOUNDS.MIN_TOTAL, currentSpeed - SPEED_BOUNDS.STEP_CHANGE);
  } else if (avgReactionTime > SPEED_BOUNDS.SLOW_REACTION_THRESHOLD) {
    // Player is slow/hesitant: slow down animation (increase delay)
    newSpeed = Math.min(SPEED_BOUNDS.MAX_TOTAL, currentSpeed + SPEED_BOUNDS.STEP_CHANGE);
  }

  return newSpeed;
}

/**
 * Derives highlight duration and gap duration from total speed
 * @param {number} totalSpeed
 */
export function getPlaybackTimings(totalSpeed) {
  const highlightMs = Math.round(totalSpeed * 0.7); // 70% lit
  const gapMs = Math.round(totalSpeed * 0.3); // 30% pause between tiles
  return { highlightMs, gapMs };
}
