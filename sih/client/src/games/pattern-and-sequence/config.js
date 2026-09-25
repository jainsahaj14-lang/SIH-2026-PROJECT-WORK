/**
 * Configuration and Pattern Generators for "Pattern & Sequence"
 *
 * Implements:
 * - Easy: Themed emoji patterns (alternating, cycling, repeating)
 * - Medium: Numeral relations (arithmetic progressions, skip patterns <= 50)
 * - Hard: Square, cube, and quadratic relations (small base numbers <= 10)
 * - Anti-repetition: Tracks recent items/rules across rounds to ensure variety
 * - NOTA logic: Exactly 1 option is correct; NOTA is correct when the true answer is intentionally withheld.
 */

export const DIFFICULTY_LEVELS = {
  easy: {
    id: 'easy',
    label: 'Easy',
    subLabel: 'Picture Patterns',
    description: 'Find the next emoji in the repeating pattern',
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    subLabel: 'Number Sequences',
    description: 'Find the next number in the arithmetic sequence',
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    subLabel: 'Squares & Cubes',
    description: 'Find the next square, cube, or exponential number',
  },
};

export const EMOJI_POOLS = {
  fruits: ['🍎', '🥭', '🍌', '🍇', '🍉', '🍓', '🍍', '🥥', '🍊', '🍐'],
  animals: ['🐶', '🐱', '🐘', '🦁', '🐵', '🐼', '🐰', '🦊', '🐸', '🦆', '🐢', '🐟'],
  nature: ['🌸', '🌻', '🌳', '🌴', '☀️', '🌙', '⭐', '🌈'],
  everyday: ['🔔', '🪔', '⚽', '🚗', '🚲', '⛵', '⏰', '🎁', '👒', '📚'],
};

// Flattened list of 40+ emojis for random fallback
export const ALL_EMOJIS = Object.values(EMOJI_POOLS).flat();

/**
 * Storage keys for streak persistence
 */
export const STORAGE_KEYS = {
  STREAK_PREFIX: 'ps_best_streak_',
  ROUND_PREFIX: 'ps_current_round_',
};

/**
 * Helper to shuffle an array
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * EASY DIFFICULTY GENERATOR
 * Generates emoji sequences:
 * - Alternating: A > B > A > ? (Answer: B)
 * - 3-Cycle: A > B > C > ? (Answer: A or D)
 * - Double: A > A > B > ? (Answer: B)
 * - Progressive: A > B > C > ? (Answer: D)
 */
export function generateEasyPattern(recentHistory = []) {
  // Filter out emojis used in recent 2-3 rounds if possible
  const availablePool = ALL_EMOJIS.filter(e => !recentHistory.includes(e));
  const pool = availablePool.length >= 10 ? availablePool : ALL_EMOJIS;

  const shuffledPool = shuffle(pool);
  const [a, b, c, d, e1, e2] = shuffledPool;

  const patternTypes = ['alternating', 'cycle3', 'doublePair', 'threePlusOne'];
  const patternType = patternTypes[Math.floor(Math.random() * patternTypes.length)];

  let sequence = [];
  let trueAnswer = '';

  switch (patternType) {
    case 'alternating':
      // A > B > A > ? (Answer: B)
      sequence = [a, b, a];
      trueAnswer = b;
      break;
    case 'cycle3':
      // A > B > C > ? (Answer: A)
      sequence = [a, b, c];
      trueAnswer = a;
      break;
    case 'doublePair':
      // A > A > B > ? (Answer: B)
      sequence = [a, a, b];
      trueAnswer = b;
      break;
    case 'threePlusOne':
    default:
      // A > B > A > B > ? (Answer: A)
      sequence = [a, b, a, b];
      trueAnswer = a;
      break;
  }

  // 25% chance of making NOTA the correct answer
  const isNotaCorrect = Math.random() < 0.25;

  let options = [];
  if (isNotaCorrect) {
    // Withhold trueAnswer from the 3 choices. Pick 3 distinct wrong emojis.
    const wrongPool = shuffledPool.filter(item => item !== trueAnswer && !sequence.includes(item));
    const wrongChoices = wrongPool.slice(0, 3);
    // If not enough unique, fallback to other unused emojis
    while (wrongChoices.length < 3) {
      wrongChoices.push(ALL_EMOJIS.find(x => x !== trueAnswer && !wrongChoices.includes(x)) || '🍀');
    }
    options = [
      { id: 'opt_1', text: wrongChoices[0], isCorrect: false },
      { id: 'opt_2', text: wrongChoices[1], isCorrect: false },
      { id: 'opt_3', text: wrongChoices[2], isCorrect: false },
      { id: 'opt_nota', text: 'NOTA', isCorrect: true, isNota: true },
    ];
  } else {
    // True answer is included. 2 wrong choices + NOTA (false)
    const wrongPool = shuffledPool.filter(item => item !== trueAnswer);
    const wrong1 = wrongPool[0] || '⭐';
    const wrong2 = wrongPool[1] || '🔔';

    options = [
      { id: 'opt_correct', text: trueAnswer, isCorrect: true },
      { id: 'opt_wrong1', text: wrong1, isCorrect: false },
      { id: 'opt_wrong2', text: wrong2, isCorrect: false },
      { id: 'opt_nota', text: 'NOTA', isCorrect: false, isNota: true },
    ];
  }

  // Shuffle the 4 option cards
  const shuffledOptions = shuffle(options);

  return {
    sequence,
    trueAnswer,
    options: shuffledOptions,
    isNotaCorrect,
    explanation: isNotaCorrect
      ? `The pattern continues with ${trueAnswer}, which is not listed above (NOTA).`
      : `The pattern continues with ${trueAnswer}.`,
    usedItems: [a, b, c].filter(Boolean),
  };
}

/**
 * MEDIUM DIFFICULTY GENERATOR
 * Generates friendly number sequences (arithmetic progressions / skip-counting <= 50)
 */
export function generateMediumPattern(recentHistory = []) {
  // Possible step differences (+2, +3, +4, +5, +6, +10, -2, -3, -5)
  const steps = [2, 3, 4, 5, 6, 7, 10, -2, -3, -5];
  // Filter out recently used steps if possible
  const validSteps = steps.filter(s => !recentHistory.includes(s));
  const step = validSteps.length > 0
    ? validSteps[Math.floor(Math.random() * validSteps.length)]
    : steps[Math.floor(Math.random() * steps.length)];

  let start = 0;
  if (step > 0) {
    // Keep sequence ending below 50
    const maxStart = 45 - (step * 3);
    start = Math.floor(Math.random() * Math.max(1, maxStart)) + (step === 10 ? 10 : 2);
  } else {
    // Descending sequence: start higher
    start = Math.floor(Math.random() * 20) + 30; // 30-50
  }

  const sequence = [start, start + step, start + (step * 2)];
  const trueAnswer = String(start + (step * 3));

  const isNotaCorrect = Math.random() < 0.25;

  let options = [];
  if (isNotaCorrect) {
    // Withhold true answer. Generate 3 plausible wrong numbers.
    const trueNum = Number(trueAnswer);
    const wrong1 = String(trueNum + 1);
    const wrong2 = String(trueNum - (step > 0 ? 2 : -2));
    const wrong3 = String(trueNum + (step > 0 ? step + 1 : step - 1));

    options = [
      { id: 'opt_1', text: wrong1, isCorrect: false },
      { id: 'opt_2', text: wrong2, isCorrect: false },
      { id: 'opt_3', text: wrong3, isCorrect: false },
      { id: 'opt_nota', text: 'NOTA', isCorrect: true, isNota: true },
    ];
  } else {
    const trueNum = Number(trueAnswer);
    // Plausible off-by-one or off-by-step numbers
    const wrong1 = String(trueNum + 1);
    const wrong2 = String(trueNum - Math.abs(step));

    options = [
      { id: 'opt_correct', text: trueAnswer, isCorrect: true },
      { id: 'opt_wrong1', text: wrong1, isCorrect: false },
      { id: 'opt_wrong2', text: wrong2, isCorrect: false },
      { id: 'opt_nota', text: 'NOTA', isCorrect: false, isNota: true },
    ];
  }

  const shuffledOptions = shuffle(options);

  return {
    sequence,
    trueAnswer,
    options: shuffledOptions,
    isNotaCorrect,
    explanation: isNotaCorrect
      ? `The rule is ${step > 0 ? `+${step}` : step} each step. Next is ${trueAnswer}, so NOTA is correct.`
      : `The rule is ${step > 0 ? `+${step}` : step} each step: ${trueAnswer}.`,
    usedItems: [step],
  };
}

/**
 * HARD DIFFICULTY GENERATOR
 * Generates square, cube, or simple quadratic sequences with small base numbers (n <= 8)
 */
export function generateHardPattern(recentHistory = []) {
  const ruleTypes = ['squares', 'cubes', 'squares_plus_one', 'doubles_plus_one'];
  const validTypes = ruleTypes.filter(r => !recentHistory.includes(r));
  const ruleType = validTypes.length > 0
    ? validTypes[Math.floor(Math.random() * validTypes.length)]
    : ruleTypes[Math.floor(Math.random() * ruleTypes.length)];

  let sequence = [];
  let trueAnswer = '';
  let ruleName = '';

  switch (ruleType) {
    case 'squares': {
      // e.g. 1, 4, 9, ? (16) or 4, 9, 16, ? (25) or 9, 16, 25, ? (36)
      const startN = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
      sequence = [startN ** 2, (startN + 1) ** 2, (startN + 2) ** 2];
      trueAnswer = String((startN + 3) ** 2);
      ruleName = 'Consecutive square numbers (n²)';
      break;
    }
    case 'cubes': {
      // 1, 8, 27, ? (64)
      const startN = 1;
      sequence = [1, 8, 27];
      trueAnswer = '64';
      ruleName = 'Consecutive cubes (1³, 2³, 3³, 4³)';
      break;
    }
    case 'squares_plus_one': {
      // n² + 1: e.g. 2, 5, 10, ? (17) or 5, 10, 17, ? (26)
      const startN = Math.floor(Math.random() * 2) + 1; // 1 or 2
      sequence = [(startN ** 2) + 1, ((startN + 1) ** 2) + 1, ((startN + 2) ** 2) + 1];
      trueAnswer = String(((startN + 3) ** 2) + 1);
      ruleName = 'Square numbers plus 1 (n² + 1)';
      break;
    }
    case 'doubles_plus_one':
    default: {
      // 2, 5, 11, ? (23) -> double and add 1
      const startVal = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
      const term2 = (startVal * 2) + 1;
      const term3 = (term2 * 2) + 1;
      sequence = [startVal, term2, term3];
      trueAnswer = String((term3 * 2) + 1);
      ruleName = 'Double the number plus 1 (2n + 1)';
      break;
    }
  }

  const isNotaCorrect = Math.random() < 0.25;
  const trueNum = Number(trueAnswer);

  let options = [];
  if (isNotaCorrect) {
    // Plausible distractors (e.g. neighboring numbers or wrong squares)
    const wrong1 = String(trueNum + 2);
    const wrong2 = String(trueNum - 1);
    const wrong3 = String(trueNum + 5);

    options = [
      { id: 'opt_1', text: wrong1, isCorrect: false },
      { id: 'opt_2', text: wrong2, isCorrect: false },
      { id: 'opt_3', text: wrong3, isCorrect: false },
      { id: 'opt_nota', text: 'NOTA', isCorrect: true, isNota: true },
    ];
  } else {
    const wrong1 = String(trueNum + 2);
    const wrong2 = String(trueNum - 2);

    options = [
      { id: 'opt_correct', text: trueAnswer, isCorrect: true },
      { id: 'opt_wrong1', text: wrong1, isCorrect: false },
      { id: 'opt_wrong2', text: wrong2, isCorrect: false },
      { id: 'opt_nota', text: 'NOTA', isCorrect: false, isNota: true },
    ];
  }

  const shuffledOptions = shuffle(options);

  return {
    sequence,
    trueAnswer,
    options: shuffledOptions,
    isNotaCorrect,
    explanation: isNotaCorrect
      ? `${ruleName}. The next number is ${trueAnswer}, so NOTA is the correct answer.`
      : `${ruleName}. The next number is ${trueAnswer}.`,
    usedItems: [ruleType],
  };
}

/**
 * Main generator entry point for any difficulty level
 */
export function generateRound(difficultyKey = 'easy', recentHistory = []) {
  switch (difficultyKey) {
    case 'hard':
      return generateHardPattern(recentHistory);
    case 'medium':
      return generateMediumPattern(recentHistory);
    case 'easy':
    default:
      return generateEasyPattern(recentHistory);
  }
}
