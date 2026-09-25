require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB, closeDB } = require('../config/db');

const User = require('../models/User');
const Patient = require('../models/Patient');
const GameSession = require('../models/GameSession');
const Reminder = require('../models/Reminder');
const CognitiveScore = require('../models/CognitiveScore');

async function seed() {
  console.log('--- Starting CogniCare NER Data Seeding ---');
  await connectDB();

  // Clear existing collections
  await User.deleteMany({});
  await Patient.deleteMany({});
  await GameSession.deleteMany({});
  await Reminder.deleteMany({});
  await CognitiveScore.deleteMany({});
  console.log('Cleared existing database records.');

  // 1. Create Caregiver User
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const caregiver = await User.create({
    name: 'Priya Sharma (প্ৰিয়া শৰ্মা)',
    email: 'caregiver@cognicare.ner',
    password: hashedPassword,
    phone: '+91 98765 43210',
    role: 'caregiver',
    preferredLanguage: 'as',
  });
  console.log('Created demo Caregiver: caregiver@cognicare.ner / password123');

  // 2. Create Patient User & Patient Record
  const patientUser = await User.create({
    name: 'Bhaben Baruah (ভাবেন বৰুৱা)',
    phone: '+91 98765 11223',
    pin: '1234', // Simplified PIN for elderly login
    role: 'patient',
    preferredLanguage: 'as',
  });

  const patient = await Patient.create({
    userId: patientUser._id,
    age: 74,
    cognitiveBaseline: 'mild',
    currentDifficultyTier: {
      memory: 2,
      routine: 1,
      pattern: 1,
      attention: 1,
    },
    caregiverIds: [caregiver._id],
    region: 'Assam',
    preferredLanguage: 'as',
  });

  // Link patient to caregiver user
  caregiver.linkedPatients = [patient._id];
  await caregiver.save();
  console.log('Created demo Patient: Bhaben Baruah (PIN: 1234)');

  // 3. Create Sample Game Sessions for the past 7 days to showcase trends
  const now = new Date();
  const sampleSessions = [];

  const daysAgo = (days, hours = 10) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(hours, 15, 0, 0);
    return d;
  };

  // Day 6 ago: Memory Match Tier 1
  sampleSessions.push({
    patientId: patient._id,
    gameType: 'memory_match',
    difficultyTier: 1,
    startTime: daysAgo(6, 10),
    endTime: new Date(daysAgo(6, 10).getTime() + 120000),
    accuracy: 75,
    avgResponseTimeMs: 2800,
    hesitationCount: 4,
    completed: true,
  });

  // Day 5 ago: Daily Routine Recall Tier 1
  sampleSessions.push({
    patientId: patient._id,
    gameType: 'routine_recall',
    difficultyTier: 1,
    startTime: daysAgo(5, 11),
    endTime: new Date(daysAgo(5, 11).getTime() + 95000),
    accuracy: 80,
    avgResponseTimeMs: 2500,
    hesitationCount: 3,
    completed: true,
  });

  // Day 4 ago: Memory Match Tier 1 (High accuracy -> triggered tier advancement)
  sampleSessions.push({
    patientId: patient._id,
    gameType: 'memory_match',
    difficultyTier: 1,
    startTime: daysAgo(4, 10),
    endTime: new Date(daysAgo(4, 10).getTime() + 110000),
    accuracy: 90,
    avgResponseTimeMs: 2100,
    hesitationCount: 2,
    completed: true,
  });

  // Day 3 ago: Daily Routine Recall Tier 1
  sampleSessions.push({
    patientId: patient._id,
    gameType: 'routine_recall',
    difficultyTier: 1,
    startTime: daysAgo(3, 11),
    endTime: new Date(daysAgo(3, 11).getTime() + 90000),
    accuracy: 85,
    avgResponseTimeMs: 2200,
    hesitationCount: 2,
    completed: true,
  });

  // Day 2 ago: Memory Match Tier 2
  sampleSessions.push({
    patientId: patient._id,
    gameType: 'memory_match',
    difficultyTier: 2,
    startTime: daysAgo(2, 10),
    endTime: new Date(daysAgo(2, 10).getTime() + 140000),
    accuracy: 88,
    avgResponseTimeMs: 2400,
    hesitationCount: 3,
    completed: true,
  });

  // Yesterday: Daily Routine Recall Tier 1
  sampleSessions.push({
    patientId: patient._id,
    gameType: 'routine_recall',
    difficultyTier: 1,
    startTime: daysAgo(1, 16),
    endTime: new Date(daysAgo(1, 16).getTime() + 85000),
    accuracy: 92,
    avgResponseTimeMs: 1950,
    hesitationCount: 1,
    completed: true,
  });

  // Today morning: Memory Match Tier 2
  sampleSessions.push({
    patientId: patient._id,
    gameType: 'memory_match',
    difficultyTier: 2,
    startTime: daysAgo(0, 9),
    endTime: new Date(daysAgo(0, 9).getTime() + 130000),
    accuracy: 94,
    avgResponseTimeMs: 1850,
    hesitationCount: 1,
    completed: true,
  });

  await GameSession.insertMany(sampleSessions);
  console.log(`Seeded ${sampleSessions.length} GameSession records.`);

  // 4. Create Sample Reminders
  const reminders = [
    {
      patientId: patient._id,
      type: 'medicine',
      scheduleTime: '08:30',
      recurrence: 'daily',
      label: 'পুৱাৰ ৰক্তচাপৰ ঔষধ (Amlodipine 5mg - Morning BP pill)',
      photoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60"><rect width="120" height="60" rx="10" fill="%23e0f2fe"/><rect x="20" y="15" width="80" height="30" rx="15" fill="%230284c7"/><line x1="60" y1="15" x2="60" y2="45" stroke="white" stroke-width="2"/><text x="35" y="34" font-size="11" fill="white" font-family="sans-serif">5mg</text></svg>',
      acknowledgedAt: new Date(daysAgo(0, 8)),
    },
    {
      patientId: patient._id,
      type: 'hydration',
      scheduleTime: '11:00',
      recurrence: 'daily',
      label: 'কুহুমীয়া পানী খাওক (Drink a warm glass of water)',
      photoUrl: '',
      acknowledgedAt: null,
    },
    {
      patientId: patient._id,
      type: 'activity',
      scheduleTime: '16:30',
      recurrence: 'daily',
      label: 'ফুলনি চৰাত অলপ খোজ কাঢ়ক (15-min gentle garden walk)',
      photoUrl: '',
      acknowledgedAt: null,
    },
    {
      patientId: patient._id,
      type: 'medicine',
      scheduleTime: '20:30',
      recurrence: 'daily',
      label: 'নিশাৰ স্মৃতি সহায়ক ঔষধ (Donepezil 5mg - Night tablet)',
      photoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60"><rect width="120" height="60" rx="10" fill="%23fef3c7"/><circle cx="60" cy="30" r="20" fill="%23f59e0b"/><line x1="45" y1="30" x2="75" y2="30" stroke="white" stroke-width="2"/></svg>',
      acknowledgedAt: null,
    },
    {
      patientId: patient._id,
      type: 'appointment',
      scheduleTime: '10:00',
      recurrence: 'once',
      label: 'ডাঃ বৰাৰ সৈতে পৰামৰ্শ (Dr. Bora Neurologist Checkup - GMCH)',
      photoUrl: '',
      acknowledgedAt: null,
    },
  ];

  await Reminder.insertMany(reminders);
  console.log(`Seeded ${reminders.length} Reminders.`);

  // 5. Create CognitiveScore Summary
  await CognitiveScore.create({
    patientId: patient._id,
    weekOf: daysAgo(0, 0),
    avgAccuracyByGame: {
      memory_match: 87,
      routine_recall: 86,
    },
    trend: 'improving',
  });
  console.log('Seeded CognitiveScore aggregate.');

  console.log('--- Seeding Completed Successfully! ---');
  await closeDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
