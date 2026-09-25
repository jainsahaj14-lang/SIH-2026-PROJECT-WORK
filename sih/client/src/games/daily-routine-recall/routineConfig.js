/**
 * routineConfig.js
 * 
 * Configurable configuration for the Daily Routine Recall game.
 * You can easily add more routines, edit step labels, swap emojis,
 * or change the correct sequence order without touching the core game engine.
 */

// Master Activity Definitions
export const ACTIVITIES = {
  WAKE_UP: {
    id: 'wake_up',
    label: 'wake up',
    labelLocal: 'পুৱা সাৰ পোৱা', // Assamese translation for CogniCare NER
    emoji: '🌅',
    category: 'morning',
  },
  BATHING: {
    id: 'bathing',
    label: 'bathing',
    labelLocal: 'গা ধোৱা',
    emoji: '🚿',
    category: 'hygiene',
  },
  BRUSH_TEETH: {
    id: 'brush_teeth',
    label: 'brush your teeth',
    labelLocal: 'দাঁত ঘঁহা',
    emoji: '🪥',
    category: 'hygiene',
  },
  EAT_FOOD: {
    id: 'eat_food',
    label: 'eat food',
    labelLocal: 'ভাত খোৱা',
    emoji: '🍔',
    category: 'meal',
  },
  MEDICINE_TIME: {
    id: 'medicine_time',
    label: 'medicine time',
    labelLocal: 'ঔষধ খোৱাৰ সময়',
    emoji: '💊',
    category: 'health',
  },
};

/**
 * DEFAULT_ROUTINE
 * The primary 5-step daily routine matching the UI requirements & screenshot:
 * Step 1: wake up 🌅
 * Step 2: brush your teeth 🪥
 * Step 3: bathing 🚿
 * Step 4: eat food 🍔
 * Step 5: medicine time 💊
 */
export const DEFAULT_ROUTINE = {
  id: 'morning_routine_5_step',
  title: 'Daily routine Recall',
  titleEmoji: '🔔',
  description: 'Arrange daily activities in chronological sequence from Step 1 to Step 5.',

  // Total steps in the sequence diagram
  totalSteps: 5,

  // 5 Step definitions in the zigzag layout
  steps: [
    {
      stepNumber: 1,
      label: 'step 1',
      correctActivityId: 'wake_up',
      align: 'left', // zigzag side
    },
    {
      stepNumber: 2,
      label: 'step 2',
      correctActivityId: 'brush_teeth',
      align: 'right',
    },
    {
      stepNumber: 3,
      label: 'step 3',
      correctActivityId: 'bathing',
      align: 'left',
    },
    {
      stepNumber: 4,
      label: 'step 4',
      correctActivityId: 'eat_food',
      align: 'right',
    },
    {
      stepNumber: 5,
      label: 'step 5',
      correctActivityId: 'medicine_time',
      align: 'left',
    },
  ],

  // 5 Activities available in the bottom tray
  // Default positions in screenshot:
  // Row 1 (2 items): wake up, bathing
  // Row 2 (1 item, centered): brush your teeth
  // Row 3 (2 items): eat food, medicine time
  trayActivities: [
    ACTIVITIES.WAKE_UP,
    ACTIVITIES.BATHING,
    ACTIVITIES.BRUSH_TEETH,
    ACTIVITIES.EAT_FOOD,
    ACTIVITIES.MEDICINE_TIME,
  ],

  // Layout slots for the tray: 2 items on row 1, 1 item centered on row 2, 2 items on row 3
  trayLayout: {
    row1: [0, 1], // indices in trayActivities
    row2: [2],    // centered
    row3: [3, 4], // indices in trayActivities
  },
};

/**
 * Alternative Routines (Ready to plug in if you want more levels/variations)
 */
export const ALTERNATIVE_ROUTINES = [
  DEFAULT_ROUTINE,
  {
    id: 'evening_routine_5_step',
    title: 'Evening Routine Recall',
    titleEmoji: '🌙',
    description: 'Arrange evening activities in order before going to sleep.',
    totalSteps: 5,
    steps: [
      { stepNumber: 1, label: 'step 1', correctActivityId: 'evening_tea', align: 'left' },
      { stepNumber: 2, label: 'step 2', correctActivityId: 'take_walk', align: 'right' },
      { stepNumber: 3, label: 'step 3', correctActivityId: 'night_medicine', align: 'left' },
      { stepNumber: 4, label: 'step 4', correctActivityId: 'read_book', align: 'right' },
      { stepNumber: 5, label: 'step 5', correctActivityId: 'sleep_bed', align: 'left' },
    ],
    trayActivities: [
      { id: 'evening_tea', label: 'evening tea', emoji: '☕' },
      { id: 'take_walk', label: 'take a walk', emoji: '🚶' },
      { id: 'night_medicine', label: 'night medicine', emoji: '💊' },
      { id: 'read_book', label: 'read book', emoji: '📖' },
      { id: 'sleep_bed', label: 'sleep in bed', emoji: '🛏️' },
    ],
    trayLayout: {
      row1: [0, 1],
      row2: [2],
      row3: [3, 4],
    },
  },
];

/**
 * Helper to shuffle an array (Fisher-Yates)
 */
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
