/**
 * Configuration and Deck Generator for "Memory Match"
 *
 * Rules:
 * - Easy: 9 cards (4 pairs + 1 blank card)
 * - Medium: 13 cards (6 pairs + 1 blank card)
 * - Hard: 15 cards (7 pairs + 1 blank card)
 * - Blank card has no pair and reveals as empty/blank.
 */

export const DIFFICULTY_LEVELS = {
  easy: {
    id: 'easy',
    label: 'Easy',
    totalCards: 9,
    pairsCount: 4,
    hasBlank: true,
    rows: 3,
    columns: 3,
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    totalCards: 13,
    pairsCount: 6,
    hasBlank: true,
    rows: 5,
    columns: 3,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    totalCards: 15,
    pairsCount: 7,
    hasBlank: true,
    rows: 5,
    columns: 3,
  },
};

/**
 * Pool of easily recognizable symbols/emojis for the hidden card faces
 */
export const CARD_SYMBOLS_POOL = [
  '🍎', '🌸', '☕', '🔔', '🚗', '🎁', '⚽', '🌙',
  '🐱', '🐘', '👒', '🪔', '🍉', '🦋', '🌻', '⭐',
  '🚲', '⛵', '⏰', '🐢', '🍇', '🦁', '🌴', '🍍'
];

/**
 * Shuffles an array with Fisher-Yates algorithm
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates and shuffles a deck based on the selected difficulty
 * @param {string} difficultyKey - 'easy' | 'medium' | 'hard'
 * @returns {Array} Array of card objects
 */
export function generateMemoryDeck(difficultyKey = 'medium') {
  const config = DIFFICULTY_LEVELS[difficultyKey] || DIFFICULTY_LEVELS.medium;
  const { pairsCount, hasBlank } = config;

  // Pick pairsCount unique symbols from pool
  const shuffledSymbols = shuffleArray(CARD_SYMBOLS_POOL);
  const selectedSymbols = shuffledSymbols.slice(0, pairsCount);

  // Build paired cards (2 cards per symbol)
  const pairedCards = [];
  selectedSymbols.forEach((symbol, pairIdx) => {
    pairedCards.push({
      id: `card-${pairIdx}-a-${Date.now()}-${Math.random()}`,
      pairId: `pair-${pairIdx}`,
      symbol,
      isBlank: false,
    });
    pairedCards.push({
      id: `card-${pairIdx}-b-${Date.now()}-${Math.random()}`,
      pairId: `pair-${pairIdx}`,
      symbol,
      isBlank: false,
    });
  });

  // Add 1 blank card if specified (odd total count)
  if (hasBlank) {
    pairedCards.push({
      id: `blank-card-${Date.now()}-${Math.random()}`,
      pairId: 'blank-unmatchable',
      symbol: '', // blank / empty tile
      isBlank: true,
    });
  }

  // Shuffle the entire deck randomly
  return shuffleArray(pairedCards);
}
