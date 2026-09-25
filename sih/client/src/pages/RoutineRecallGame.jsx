import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Check, Sparkles, AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';
import VoiceSpeaker from '../components/VoiceSpeaker';
import { ttsService } from '../services/ttsService';
import { saveLocalGameSession } from '../db/dexieDb';
import { api } from '../services/api';

// Complete master sequence of daily routines
const MASTER_ROUTINE = [
  { id: 'wake', step: 1, nameEn: 'Wake Up', nameAs: 'পুৱা সাৰ পোৱা', icon: '🌅', color: '#fef3c7', border: '#f59e0b' },
  { id: 'brush', step: 2, nameEn: 'Brush Teeth', nameAs: 'দাঁত ঘঁহা', icon: '🪥', color: '#e0f2fe', border: '#0284c7' },
  { id: 'bath', step: 3, nameEn: 'Bathing', nameAs: 'গা ধোৱা', icon: '🚿', color: '#ccfbf1', border: '#0d9488' },
  { id: 'eat', step: 4, nameEn: 'Eat Meal', nameAs: 'ভাত খোৱা', icon: '🍲', color: '#ffedd5', border: '#ea580c' },
  { id: 'walk', step: 5, nameEn: 'Evening Walk', nameAs: 'সন্ধিয়া ফুৰা', icon: '🚶‍♂️', color: '#dcfce7', border: '#16a34a' },
  { id: 'sleep', step: 6, nameEn: 'Sleep at Night', nameAs: 'নিশা শোৱা', icon: '🌙', color: '#ede9fe', border: '#7c3aed' },
];

// Distractor items that don't belong in the core sequence (or are out of place)
const DISTRACTORS = [
  { id: 'dist_fireworks', nameEn: 'Watch Fireworks', nameAs: 'ফটকা ফুটোৱা', icon: '🎆', color: '#ffe4e6', border: '#f43f5e' },
  { id: 'dist_swim', nameEn: 'Deep Sea Swim', nameAs: 'সাঁতোৰা', icon: '🏊‍♂️', color: '#cffafe', border: '#06b6d4' },
  { id: 'dist_plane', nameEn: 'Fly Airplane', nameAs: 'বিমান চলোৱা', icon: '✈️', color: '#f1f5f9', border: '#64748b' },
];

export default function RoutineRecallGame() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [tier, setTier] = useState(1); // 1 = 3 steps + 1 distractor, 2 = 4 steps + 2 distractors, 3 = 5 steps + 2 distractors
  const [correctSequence, setCorrectSequence] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [hesitationCount, setHesitationCount] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [adaptiveResult, setAdaptiveResult] = useState(null);

  // Timing
  const startTimeRef = useRef(null);
  const lastActionTimeRef = useRef(null);
  const hesitationTimerRef = useRef(null);
  const responseTimesRef = useRef([]);

  const currentUser = api.getCurrentUser();

  const resetHesitationTracker = () => {
    if (hesitationTimerRef.current) clearTimeout(hesitationTimerRef.current);
    hesitationTimerRef.current = setTimeout(() => {
      setHesitationCount((prev) => prev + 1);
    }, 3000);
  };

  useEffect(() => {
    startNewGame();
    const introText = `${t('games.routineRecallTitle')}. ${t('games.routineRecallInstruction')}`;
    ttsService.speak(introText, i18n.language || 'as');

    return () => {
      ttsService.stop();
      if (hesitationTimerRef.current) clearTimeout(hesitationTimerRef.current);
    };
  }, [tier, i18n.language]);

  const startNewGame = () => {
    let targetStepsCount = 3;
    let distractorCount = 1;

    if (tier === 2) {
      targetStepsCount = 4;
      distractorCount = 2;
    } else if (tier === 3) {
      targetStepsCount = 5;
      distractorCount = 2;
    }

    // Pick target steps from MASTER_ROUTINE in chronological order
    const targets = MASTER_ROUTINE.slice(0, targetStepsCount);
    setCorrectSequence(targets);

    // Combine targets with distractors and shuffle
    const chosenDistractors = DISTRACTORS.slice(0, distractorCount);
    const pool = [...targets, ...chosenDistractors];

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    setAvailableItems(pool);
    setUserSequence([]);
    setFeedbackMessage(null);
    setHesitationCount(0);
    setGameCompleted(false);
    setAdaptiveResult(null);

    const now = Date.now();
    startTimeRef.current = now;
    lastActionTimeRef.current = now;
    responseTimesRef.current = [];
    resetHesitationTracker();
  };

  const handleSelectItem = (item) => {
    if (gameCompleted) return;

    // Track response time
    const now = Date.now();
    if (lastActionTimeRef.current) {
      responseTimesRef.current.push(now - lastActionTimeRef.current);
    }
    lastActionTimeRef.current = now;
    resetHesitationTracker();

    // Check if already in sequence
    if (userSequence.find((i) => i.id === item.id)) return;

    const nextSeq = [...userSequence, item];
    setUserSequence(nextSeq);
    setFeedbackMessage(null);

    // If filled all slots, automatically prompt validation or let user click Check
    if (nextSeq.length === correctSequence.length) {
      validateSequence(nextSeq);
    }
  };

  const handleRemoveFromSequence = (indexToRemove) => {
    if (gameCompleted) return;
    setUserSequence((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setFeedbackMessage(null);
  };

  const validateSequence = async (seqToTest = userSequence) => {
    if (seqToTest.length < correctSequence.length) {
      setFeedbackMessage({
        type: 'warning',
        text: `Please place all ${correctSequence.length} activities first.`,
      });
      return;
    }

    // Calculate accuracy: count how many items match correct step order
    let correctCount = 0;
    for (let i = 0; i < correctSequence.length; i++) {
      if (seqToTest[i] && seqToTest[i].id === correctSequence[i].id) {
        correctCount++;
      }
    }

    const calculatedAccuracy = Math.round((correctCount / correctSequence.length) * 100);

    if (calculatedAccuracy === 100) {
      // Perfect sequence!
      if (hesitationTimerRef.current) clearTimeout(hesitationTimerRef.current);
      setGameCompleted(true);
      setFeedbackMessage({
        type: 'success',
        text: t('games.correctOrder'),
      });

      try {
        confetti({ particleCount: 75, spread: 75, origin: { y: 0.6 } });
      } catch (e) {}

      const successVoice =
        i18n.language === 'as'
          ? "অতি উত্তম! আপোনাৰ দৈনন্দিন ক্ৰম সম্পূৰ্ণ শুদ্ধ হৈছে।"
          : "Great job! Your daily sequence order is completely correct.";
      ttsService.speak(successVoice, i18n.language || 'as');

      const endTime = Date.now();
      const avgResponseTimeMs =
        responseTimesRef.current.length > 0
          ? Math.round(
              responseTimesRef.current.reduce((a, b) => a + b, 0) /
                responseTimesRef.current.length
            )
          : 2400;

      const sessionPayload = {
        patientId: currentUser?.patientId || '65f123456789abcdef012345',
        gameType: 'routine_recall',
        difficultyTier: tier,
        startTime: new Date(startTimeRef.current).toISOString(),
        endTime: new Date(endTime).toISOString(),
        accuracy: calculatedAccuracy,
        avgResponseTimeMs,
        hesitationCount,
        completed: true,
      };

      // 1. Save to local Dexie IndexedDB
      await saveLocalGameSession(sessionPayload);

      // 2. Adaptive difficulty update
      if (navigator.onLine && currentUser?.patientId) {
        try {
          const nextDiff = await api.getNextDifficulty(currentUser.patientId, 'routine_recall');
          if (nextDiff?.data) {
            setAdaptiveResult(nextDiff.data);
          }
        } catch (err) {
          console.warn('Could not query adaptive engine online:', err);
        }
      } else {
        if (calculatedAccuracy > 85 && tier < 3) {
          setAdaptiveResult({
            nextTier: tier + 1,
            tierChange: 1,
            reason: 'Sequence master! Advancing to the next tier.',
          });
        }
      }
    } else {
      // Partial or incorrect sequence
      setFeedbackMessage({
        type: 'error',
        text: `${t('games.tryAgainOrder')} (${calculatedAccuracy}% match)`,
      });
      ttsService.speak(t('games.tryAgainOrder'), i18n.language || 'as');
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <button
          onClick={() => navigate('/games')}
          className="btn-secondary"
          style={{ minHeight: '52px', padding: '10px 18px', fontSize: '1rem' }}
        >
          <ArrowLeft size={20} />
          <span>{t('games.backToGames')}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Tier buttons */}
          <div
            style={{
              backgroundColor: '#f1f5f9',
              borderRadius: '12px',
              padding: '4px',
              display: 'flex',
              gap: '4px',
            }}
          >
            {[1, 2, 3].map((tNum) => (
              <button
                key={tNum}
                onClick={() => setTier(tNum)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  border: 'none',
                  backgroundColor: tier === tNum ? '#ea580c' : 'transparent',
                  color: tier === tNum ? 'white' : '#64748b',
                  cursor: 'pointer',
                }}
              >
                {tNum === 1 ? 'Level 1 (3 steps)' : tNum === 2 ? 'Level 2 (4 steps)' : 'Level 3 (5 steps)'}
              </button>
            ))}
          </div>

          <VoiceSpeaker
            text={t('games.routineRecallInstruction')}
            size="sm"
            label={t('games.ttsButton')}
          />

          <button
            onClick={startNewGame}
            className="btn-secondary"
            style={{ minHeight: '52px', padding: '10px 18px', fontSize: '1rem' }}
            title="Restart Game"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* Instruction Card */}
      <div
        style={{
          backgroundColor: '#fff7ed',
          border: '2px solid #fed7aa',
          borderRadius: '20px',
          padding: '18px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#9a3412', marginBottom: '4px' }}>
            {t('games.routineRecallTitle')}
          </h3>
          <p style={{ fontSize: '1.05rem', color: '#c2410c', fontWeight: 600 }}>
            {t('games.routineRecallInstruction')}
          </p>
        </div>
      </div>

      {/* Target Sequence Slots (Chronological Morning -> Night) */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
            Your Sequence Order (Tap slots to remove):
          </h4>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ea580c' }}>
            {userSequence.length} / {correctSequence.length} filled
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${correctSequence.length}, 1fr)`,
            gap: '12px',
          }}
        >
          {Array.from({ length: correctSequence.length }).map((_, slotIdx) => {
            const placedItem = userSequence[slotIdx];

            return (
              <div
                key={slotIdx}
                onClick={() => placedItem && handleRemoveFromSequence(slotIdx)}
                style={{
                  minHeight: '140px',
                  backgroundColor: placedItem ? placedItem.color : '#ffffff',
                  border: `3px dashed ${placedItem ? placedItem.border : '#cbd5e1'}`,
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px',
                  cursor: placedItem ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Step badge */}
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: placedItem ? '#0f172a' : '#94a3b8',
                  }}
                >
                  Step {slotIdx + 1}
                </span>

                {placedItem ? (
                  <>
                    <span style={{ fontSize: '3rem', marginTop: '12px' }}>{placedItem.icon}</span>
                    <span
                      style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        marginTop: '6px',
                        textAlign: 'center',
                      }}
                    >
                      {i18n.language === 'as' ? placedItem.nameAs : placedItem.nameEn}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                      (Tap to change)
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 700 }}>
                    Empty Slot
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Activity Choices (Huge tap targets, min 64px) */}
      <div style={{ marginBottom: '32px' }}>
        <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>
          Tap to Select Next Routine Activity:
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          {availableItems.map((item) => {
            const isUsed = userSequence.some((u) => u.id === item.id);

            return (
              <button
                key={item.id}
                onClick={() => !isUsed && handleSelectItem(item)}
                disabled={isUsed}
                style={{
                  backgroundColor: isUsed ? '#f1f5f9' : item.color,
                  border: `3px solid ${isUsed ? '#e2e8f0' : item.border}`,
                  borderRadius: '20px',
                  padding: '16px 12px',
                  minHeight: '110px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isUsed ? 'not-allowed' : 'pointer',
                  opacity: isUsed ? 0.45 : 1,
                  boxShadow: isUsed ? 'none' : '0 4px 12px rgba(0,0,0,0.06)',
                }}
              >
                <span style={{ fontSize: '2.5rem' }}>{item.icon}</span>
                <span
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: isUsed ? '#94a3b8' : '#0f172a',
                    marginTop: '6px',
                    textAlign: 'center',
                  }}
                >
                  {i18n.language === 'as' ? item.nameAs : item.nameEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Validation Message */}
      {feedbackMessage && (
        <div
          style={{
            backgroundColor:
              feedbackMessage.type === 'success'
                ? '#ecfdf5'
                : feedbackMessage.type === 'warning'
                ? '#fffbeb'
                : '#fef2f2',
            border: `2px solid ${
              feedbackMessage.type === 'success'
                ? '#10b981'
                : feedbackMessage.type === 'warning'
                ? '#f59e0b'
                : '#ef4444'
            }`,
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 size={24} color="#10b981" />
          ) : (
            <AlertCircle size={24} color="#ef4444" />
          )}
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
            {feedbackMessage.text}
          </span>
        </div>
      )}

      {/* Game Completed & Adaptive recommendation */}
      {gameCompleted && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '4px solid #10b981',
            borderRadius: '28px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
          }}
        >
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
            {t('games.completedTitle')}
          </h2>

          {adaptiveResult && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '2px solid #bae6fd',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                textAlign: 'left',
              }}
            >
              <TrendingUp size={28} color="#0284c7" />
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0369a1' }}>
                  {t('games.nextDifficulty')}
                </h4>
                <p style={{ fontSize: '0.95rem', color: '#334155', fontWeight: 600 }}>
                  {adaptiveResult.reason || 'AI Engine evaluated session performance.'}
                </p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={startNewGame}
              className="btn-success"
              style={{ minHeight: '64px', minWidth: '220px' }}
            >
              <RotateCcw size={22} />
              <span>{t('games.playAgain')}</span>
            </button>
            <button
              onClick={() => navigate('/games')}
              className="btn-secondary"
              style={{ minHeight: '64px', minWidth: '200px' }}
            >
              <span>{t('games.backToGames')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
