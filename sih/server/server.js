require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const { initReminderScheduler } = require('./services/reminderCron');

// Route imports
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const gameSessionRoutes = require('./routes/gameSessions');
const reminderRoutes = require('./routes/reminders');
const dashboardRoutes = require('./routes/dashboard');
const uploadRoutes = require('./routes/uploads');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for client dev server & any local origin
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploaded photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/game-sessions', gameSessionRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/uploads', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CogniCare NER API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mode: process.env.NODE_ENV || 'development',
  });
});

// Serve built React client if available
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const fs = require('fs');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[CogniCare Server Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Auto-seed helper if empty
const User = require('./models/User');
const Patient = require('./models/Patient');
const GameSession = require('./models/GameSession');
const Reminder = require('./models/Reminder');
const CognitiveScore = require('./models/CognitiveScore');
const bcrypt = require('bcryptjs');

const checkAndAutoSeed = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[CogniCare Server] Database is empty. Auto-seeding demo patient and caregiver...');
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

      const patientUser = await User.create({
        name: 'Bhaben Baruah (ভাবেন বৰুৱা)',
        phone: '+91 98765 11223',
        pin: '1234',
        role: 'patient',
        preferredLanguage: 'as',
      });

      const patient = await Patient.create({
        userId: patientUser._id,
        age: 74,
        cognitiveBaseline: 'mild',
        currentDifficultyTier: { memory: 2, routine: 1, pattern: 1, attention: 1 },
        caregiverIds: [caregiver._id],
        region: 'Assam',
        preferredLanguage: 'as',
      });

      caregiver.linkedPatients = [patient._id];
      await caregiver.save();

      const now = new Date();
      const daysAgo = (days) => {
        const d = new Date(now);
        d.setDate(d.getDate() - days);
        return d;
      };

      // Seed 7 sample game sessions
      await GameSession.insertMany([
        { patientId: patient._id, gameType: 'memory_match', difficultyTier: 1, startTime: daysAgo(6), endTime: new Date(daysAgo(6).getTime() + 120000), accuracy: 75, avgResponseTimeMs: 2800, hesitationCount: 4, completed: true },
        { patientId: patient._id, gameType: 'routine_recall', difficultyTier: 1, startTime: daysAgo(5), endTime: new Date(daysAgo(5).getTime() + 95000), accuracy: 80, avgResponseTimeMs: 2500, hesitationCount: 3, completed: true },
        { patientId: patient._id, gameType: 'memory_match', difficultyTier: 1, startTime: daysAgo(4), endTime: new Date(daysAgo(4).getTime() + 110000), accuracy: 90, avgResponseTimeMs: 2100, hesitationCount: 2, completed: true },
        { patientId: patient._id, gameType: 'routine_recall', difficultyTier: 1, startTime: daysAgo(3), endTime: new Date(daysAgo(3).getTime() + 90000), accuracy: 85, avgResponseTimeMs: 2200, hesitationCount: 2, completed: true },
        { patientId: patient._id, gameType: 'memory_match', difficultyTier: 2, startTime: daysAgo(2), endTime: new Date(daysAgo(2).getTime() + 140000), accuracy: 88, avgResponseTimeMs: 2400, hesitationCount: 3, completed: true },
        { patientId: patient._id, gameType: 'routine_recall', difficultyTier: 1, startTime: daysAgo(1), endTime: new Date(daysAgo(1).getTime() + 85000), accuracy: 92, avgResponseTimeMs: 1950, hesitationCount: 1, completed: true },
        { patientId: patient._id, gameType: 'memory_match', difficultyTier: 2, startTime: daysAgo(0), endTime: new Date(daysAgo(0).getTime() + 130000), accuracy: 94, avgResponseTimeMs: 1850, hesitationCount: 1, completed: true },
      ]);

      // Seed sample reminders
      await Reminder.insertMany([
        {
          patientId: patient._id,
          type: 'medicine',
          scheduleTime: '08:30',
          recurrence: 'daily',
          label: 'পুৱাৰ ৰক্তচাপৰ ঔষধ (Amlodipine 5mg - Morning BP pill)',
          photoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60"><rect width="120" height="60" rx="10" fill="%23e0f2fe"/><rect x="20" y="15" width="80" height="30" rx="15" fill="%230284c7"/><line x1="60" y1="15" x2="60" y2="45" stroke="white" stroke-width="2"/><text x="35" y="34" font-size="11" fill="white" font-family="sans-serif">5mg</text></svg>',
          acknowledgedAt: daysAgo(0),
        },
        { patientId: patient._id, type: 'hydration', scheduleTime: '11:00', recurrence: 'daily', label: 'কুহুমীয়া পানী খাওক (Drink a warm glass of water)', acknowledgedAt: null },
        { patientId: patient._id, type: 'activity', scheduleTime: '16:30', recurrence: 'daily', label: 'ফুলনি চৰাত অলপ খোজ কাঢ়ক (15-min gentle garden walk)', acknowledgedAt: null },
        {
          patientId: patient._id,
          type: 'medicine',
          scheduleTime: '20:30',
          recurrence: 'daily',
          label: 'নিশাৰ স্মৃতি সহায়ক ঔষধ (Donepezil 5mg - Night tablet)',
          photoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60"><rect width="120" height="60" rx="10" fill="%23fef3c7"/><circle cx="60" cy="30" r="20" fill="%23f59e0b"/><line x1="45" y1="30" x2="75" y2="30" stroke="white" stroke-width="2"/></svg>',
          acknowledgedAt: null,
        },
        { patientId: patient._id, type: 'appointment', scheduleTime: '10:00', recurrence: 'once', label: 'ডাঃ বৰাৰ সৈতে পৰামৰ্শ (Dr. Bora Neurologist Checkup - GMCH)', acknowledgedAt: null },
      ]);

      await CognitiveScore.create({
        patientId: patient._id,
        weekOf: daysAgo(0),
        avgAccuracyByGame: { memory_match: 87, routine_recall: 86 },
        trend: 'improving',
      });

      console.log('[CogniCare Server] Auto-seeding completed successfully.');
    }
  } catch (seedErr) {
    console.warn('[CogniCare Server] Auto-seed warning:', seedErr.message);
  }
};

// Start Server after connecting to DB
const startServer = async () => {
  await connectDB();
  await checkAndAutoSeed();
  initReminderScheduler();

  app.listen(PORT, () => {
    console.log(`======================================================`);
    console.log(`CogniCare NER Express API running on http://localhost:${PORT}`);
    console.log(`API Health Check: http://localhost:${PORT}/api/health`);
    console.log(`Web App Interface: http://localhost:${PORT}`);
    console.log(`======================================================`);
  });
};

startServer();

module.exports = app;
