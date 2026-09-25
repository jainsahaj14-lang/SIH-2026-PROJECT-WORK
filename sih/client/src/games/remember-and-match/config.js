/**
 * Game Configuration for "Remember & Match"
 * 
 * Change difficulty tiers, timings, or add new emojis here.
 */

export const DIFFICULTY_LEVELS = {
  easy: {
    id: 'easy',
    label: 'Easy',
    targetsCount: 3,
    gridCount: 8,
    columns: 4,
    rows: 2,
    memorizeSeconds: 5,
    description: 'Remember 3 pictures out of 8',
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    targetsCount: 5,
    gridCount: 10,
    columns: 5,
    rows: 2,
    memorizeSeconds: 6,
    description: 'Remember 5 pictures out of 10',
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    targetsCount: 7,
    gridCount: 12,
    columns: 4,
    rows: 3,
    memorizeSeconds: 7,
    description: 'Remember 7 pictures out of 12',
  },
};

/**
 * Pool of 50+ distinct, easily recognizable, everyday emojis
 * Culturally clear and familiar for elderly cognitive recall.
 */
export const EMOJI_POOL = [
  // Familiar Animals & Birds
  '🐶', '🐱', '🐘', '🦁', '🐵', '🐼', '🐰', '🦊', '🐸', '🦆',
  '🦋', '🐢', '🐮', '🐴', '🦉', '🐠', '🐝', '🦚',
  // Fruits & Healthy Foods
  '🍎', '🍌', '🍇', '🍉', '🍓', '🍍', '🥥', '🌽', '🥕', '🍲',
  '☕', '🥛', '🍞',
  // Everyday Household & Nature
  '🌸', '🌻', '🌳', '🌴', '☀️', '🌙', '⭐', '🌈', '🔔', '🪔',
  '🔑', '☂️', '👒', '📚', '🎁', '⚽', '🚗', '🚲', '⛵', '⏰'
];

/**
 * Generates targets and distractors for a new round without overlap or duplicates.
 * @param {string} difficultyKey - 'easy' | 'medium' | 'hard'
 * @returns {Object} { targets: string[], recallGrid: string[] }
 */
export function generateRoundItems(difficultyKey = 'easy') {
  const config = DIFFICULTY_LEVELS[difficultyKey] || DIFFICULTY_LEVELS.easy;
  const { targetsCount, gridCount } = config;

  // Shuffle master pool
  const shuffledPool = [...EMOJI_POOL].sort(() => Math.random() - 0.5);

  // Pick unique targets
  const targets = shuffledPool.slice(0, targetsCount);

  // Pick distinct distractors from the remainder of the pool
  const distractorsCount = gridCount - targetsCount;
  const distractors = shuffledPool.slice(targetsCount, targetsCount + distractorsCount);

  // Combine targets and distractors and shuffle for recall grid
  const recallGrid = [...targets, ...distractors].sort(() => Math.random() - 0.5);

  return {
    targets,
    recallGrid,
    config,
  };
}

/**
 * Storage key constants for localStorage streak tracking
 */
export const STORAGE_KEYS = {
  STREAK_PREFIX: 'rm_best_streak_',
  ROUND_PREFIX: 'rm_current_round_',
};
