import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import OfflineBanner from './components/OfflineBanner';
import ReminderAlertModal from './components/ReminderAlertModal';
import Home from './pages/Home';
import GamesHub from './pages/GamesHub';
import RoutineRecallGame from './pages/RoutineRecallGame';
import RemindersPage from './pages/RemindersPage';
import CaregiverDashboard from './pages/CaregiverDashboard';
import PatientLogin from './pages/PatientLogin';
import CaregiverLogin from './pages/CaregiverLogin';
import { syncManager } from './db/syncManager';
import { notificationService } from './services/notificationService';

import RememberAndMatchPage from './pages/RememberAndMatchPage';
import PatternAndSequencePage from './pages/PatternAndSequencePage';
import MemoryMatchPage from './pages/MemoryMatchPage';
import SequenceRecallPage from './pages/SequenceRecallPage';

export default function App() {
  const [isSimpleMode, setIsSimpleMode] = useState(() => {
    return localStorage.getItem('cognicare_simple_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('cognicare_simple_mode', isSimpleMode);
  }, [isSimpleMode]);

  useEffect(() => {
    // 1. Initialize background sync manager
    syncManager.init();

    // 2. Initialize offline reminder notifications scheduler
    notificationService.requestPermission();
    notificationService.startReminderScheduler();

    return () => {
      notificationService.stopReminderScheduler();
    };
  }, []);

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Offline Status & Live Sync Banner */}
        <OfflineBanner />

        {/* Global Accessible Navbar */}
        <Navbar isSimpleMode={isSimpleMode} setIsSimpleMode={setIsSimpleMode} />

        {/* Pop-up Reminder Alert Modal when an activity or medicine is due */}
        <ReminderAlertModal />

        {/* Main Content Area */}
        <main style={{ flex: 1, paddingBottom: '48px' }}>
          <Routes>
            <Route path="/" element={<Home isSimpleMode={isSimpleMode} />} />
            <Route path="/games" element={<GamesHub />} />
            <Route path="/games/memory-match" element={<MemoryMatchPage />} />
            <Route path="/games/routine-recall" element={<RoutineRecallGame />} />
            <Route path="/daily-routine-recall" element={<RoutineRecallGame />} />
            <Route path="/memory-game" element={<RememberAndMatchPage />} />
            <Route path="/pattern-sequence" element={<PatternAndSequencePage />} />
            <Route path="/memory-match" element={<MemoryMatchPage />} />
            <Route path="/sequence-recall" element={<SequenceRecallPage />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/dashboard" element={<CaregiverDashboard />} />
            <Route path="/patient-login" element={<PatientLogin />} />
            <Route path="/caregiver-login" element={<CaregiverLogin />} />
          </Routes>
        </main>

        {/* Subtle regional footer */}
        <footer
          style={{
            borderTop: '2px solid #e2e8f0',
            backgroundColor: '#ffffff',
            padding: '24px 20px',
            textAlign: 'center',
            fontSize: '0.95rem',
            color: '#64748b',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <p style={{ fontWeight: 700, color: '#334155' }}>
              CogniCare NER — AI-Adaptive Cognitive Platform for Dementia & MCI Elderly Care
            </p>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              Built for North Eastern Region (Assam, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, Arunachal Pradesh, Sikkim) • 100% Offline-First
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
