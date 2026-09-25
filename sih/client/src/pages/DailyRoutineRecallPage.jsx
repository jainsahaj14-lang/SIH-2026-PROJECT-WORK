import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DailyRoutineRecall from '../games/daily-routine-recall';
import { saveLocalGameSession } from '../db/dexieDb';
import { api } from '../services/api';

/**
 * DailyRoutineRecallPage
 * 
 * Standalone page wrapper for the Daily Routine Recall game,
 * seamlessly integrating back navigation, user session telemetry,
 * and the responsive phone-mockup component.
 */
export default function DailyRoutineRecallPage() {
  const navigate = useNavigate();
  const currentUser = api.getCurrentUser();

  const handleGameComplete = async (sessionData) => {
    try {
      await saveLocalGameSession({
        patientId: currentUser?.patientId || 'demo-patient',
        gameType: 'routine_recall',
        difficultyTier: 1,
        startTime: new Date(Date.now() - sessionData.timeTakenSec * 1000).toISOString(),
        endTime: new Date().toISOString(),
        accuracy: 100,
        avgResponseTimeMs: Math.round((sessionData.timeTakenSec * 1000) / 5),
        hesitationCount: 0,
        completed: true,
      });
    } catch (err) {
      console.warn('Could not save session to local DB:', err);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px 20px' }}>
      {/* Back navigation button */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => navigate('/games')}
          className="btn-secondary"
          style={{ minHeight: '48px', padding: '8px 16px', fontSize: '0.95rem' }}
          type="button"
        >
          <ArrowLeft size={18} />
          <span>Back to Cognitive Games</span>
        </button>
      </div>

      {/* Render the Daily Routine Recall exercise */}
      <DailyRoutineRecall onComplete={handleGameComplete} showPhoneFrame={true} />
    </div>
  );
}
