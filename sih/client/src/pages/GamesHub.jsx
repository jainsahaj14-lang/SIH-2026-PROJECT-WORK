import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brain, CalendarCheck, Sparkles, Award, ArrowRight, Play } from 'lucide-react';
import VoiceSpeaker from '../components/VoiceSpeaker';
import { api } from '../services/api';

export default function GamesHub() {
  const { t, i18n } = useTranslation();
  const [patientTiers, setPatientTiers] = useState({ memory: 1, routine: 1 });
  const currentUser = api.getCurrentUser();

  useEffect(() => {
    // If patient is logged in or demo patient exists, fetch latest tiers
    async function loadPatientTiers() {
      if (currentUser?.patientId) {
        try {
          const res = await api.getPatient(currentUser.patientId);
          if (res?.data?.currentDifficultyTier) {
            setPatientTiers(res.data.currentDifficultyTier);
          }
        } catch (e) {
          console.warn('Could not fetch server patient tier:', e);
        }
      }
    }
    loadPatientTiers();
  }, [currentUser]);

  const getTierBadge = (tier) => {
    switch (tier) {
      case 2:
        return { label: t('games.tierMedium'), bg: '#fef3c7', text: '#b45309', border: '#f59e0b' };
      case 3:
        return { label: t('games.tierHard'), bg: '#fee2e2', text: '#b91c1c', border: '#ef4444' };
      default:
        return { label: t('games.tierEasy'), bg: '#ecfdf5', text: '#047857', border: '#10b981' };
    }
  };

  const memBadge = getTierBadge(patientTiers.memory || 1);
  const routineBadge = getTierBadge(patientTiers.routine || 1);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
          {t('games.hubTitle')}
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#64748b', maxWidth: '680px', margin: '0 auto' }}>
          {t('games.hubSubtitle')}
        </p>
      </div>

      {/* Game Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '30px' }}>
        {/* Game 1: Memory Match (Card Grid with Odd Blank Card) */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '3px solid #F3CFBE',
            backgroundColor: '#ffffff',
            borderRadius: '28px',
            padding: '32px',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '20px',
                  backgroundColor: '#FBF1E7',
                  border: '2px solid #E8A87C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                }}
              >
                ★
              </div>
              <span
                style={{
                  backgroundColor: '#FBF1E7',
                  color: '#B5471B',
                  border: '2px solid #E8A87C',
                  padding: '6px 14px',
                  borderRadius: '14px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                }}
              >
                Concentration Game
              </span>
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              💡 Memory Match
            </h2>

            <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
              Classic card pairing with peach tiles &amp; black stars. Uncover all pairs while navigating the mystery blank card!
            </p>

            <div style={{ marginBottom: '24px' }}>
              <VoiceSpeaker
                text="Memory Match. Flip the cards to uncover pairs, but watch out for the single blank card."
                size="sm"
                label={t('games.ttsButton')}
              />
            </div>
          </div>

          <Link
            to="/memory-match"
            className="btn-primary"
            style={{ width: '100%', textDecoration: 'none', backgroundColor: '#B5471B' }}
          >
            <Play size={24} fill="currentColor" />
            <span>Play Memory Match</span>
          </Link>
        </div>

        {/* Game 2: Daily Routine Recall */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '3px solid #fed7aa',
            backgroundColor: '#ffffff',
            borderRadius: '28px',
            padding: '32px',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '20px',
                  backgroundColor: '#ffedd5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CalendarCheck size={38} color="#ea580c" />
              </div>
              <span
                style={{
                  backgroundColor: routineBadge.bg,
                  color: routineBadge.text,
                  border: `2px solid ${routineBadge.border}`,
                  padding: '6px 14px',
                  borderRadius: '14px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                }}
              >
                {routineBadge.label}
              </span>
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              {t('games.routineRecallTitle')}
            </h2>

            <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
              {t('games.routineRecallDesc')}
            </p>

            <div style={{ marginBottom: '24px' }}>
              <VoiceSpeaker
                text={`${t('games.routineRecallTitle')}. ${t('games.routineRecallInstruction')}`}
                size="sm"
                label={t('games.ttsButton')}
              />
            </div>
          </div>

          <Link
            to="/games/routine-recall"
            className="btn-primary"
            style={{ width: '100%', textDecoration: 'none', backgroundColor: '#ea580c' }}
          >
            <Play size={24} fill="currentColor" />
            <span>{t('games.startPlaying')}</span>
          </Link>
        </div>

        {/* Game 3: Remember & Match */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '3px solid #fecdd3',
            backgroundColor: '#ffffff',
            borderRadius: '28px',
            padding: '32px',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '20px',
                  backgroundColor: '#FFF7EE',
                  border: '2px solid #F3CFBE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                }}
              >
                💡
              </div>
              <span
                style={{
                  backgroundColor: '#FFF7EE',
                  color: '#D96B43',
                  border: '2px solid #F3CFBE',
                  padding: '6px 14px',
                  borderRadius: '14px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                }}
              >
                Featured
              </span>
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              Remember & Match
            </h2>

            <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
              Watch the pictures, then find them again once they're hidden. 3 difficulty tiers with peach tiles and gentle feedback.
            </p>

            <div style={{ marginBottom: '24px' }}>
              <VoiceSpeaker
                text="Remember and Match. Watch the pictures, then find them again once they are hidden."
                size="sm"
                label={t('games.ttsButton')}
              />
            </div>
          </div>

          <Link
            to="/memory-game"
            className="btn-primary"
            style={{ width: '100%', textDecoration: 'none', backgroundColor: '#D96B43' }}
          >
            <Play size={24} fill="currentColor" />
            <span>Play Remember & Match</span>
          </Link>
        </div>

        {/* Game 4: Pattern & Sequence */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '3px solid #fed7aa',
            backgroundColor: '#ffffff',
            borderRadius: '28px',
            padding: '32px',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '20px',
                  backgroundColor: '#FFF7EE',
                  border: '2px solid #F3DEC4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                }}
              >
                🧩
              </div>
              <span
                style={{
                  backgroundColor: '#FFF7EE',
                  color: '#b45309',
                  border: '2px solid #F3DEC4',
                  padding: '6px 14px',
                  borderRadius: '14px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                }}
              >
                Logic & Patterns
              </span>
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              Pattern & Sequence
            </h2>

            <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
              Study the pattern strip, then choose what comes next. Features emoji cycles, arithmetic steps, square numbers, and NOTA cards.
            </p>

            <div style={{ marginBottom: '24px' }}>
              <VoiceSpeaker
                text="Pattern and Sequence. Study the pattern, then choose what comes next."
                size="sm"
                label={t('games.ttsButton')}
              />
            </div>
          </div>

          <Link
            to="/pattern-sequence"
            className="btn-primary"
            style={{ width: '100%', textDecoration: 'none', backgroundColor: '#d97706' }}
          >
            <Play size={24} fill="currentColor" />
            <span>Play Pattern & Sequence</span>
          </Link>
        </div>

        {/* Game 5: Sequence Recall (Simon-style 3x3 Tile Memory) */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '3px solid #8FD19E',
            backgroundColor: '#ffffff',
            borderRadius: '28px',
            padding: '32px',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '20px',
                  backgroundColor: '#FAF3EA',
                  border: '3px solid #000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                }}
              >
                🟩
              </div>
              <span
                style={{
                  backgroundColor: '#FAF3EA',
                  color: '#047857',
                  border: '2px solid #8FD19E',
                  padding: '6px 14px',
                  borderRadius: '14px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                }}
              >
                Adaptive Speed
              </span>
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              Sequence Recall
            </h2>

            <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
              Simon-style 3x3 grid memory game with soft green tiles and adaptive pacing based on your reaction speed!
            </p>

            <div style={{ marginBottom: '24px' }}>
              <VoiceSpeaker
                text="Sequence Recall. Watch the tiles light up and repeat the exact sequence."
                size="sm"
                label={t('games.ttsButton')}
              />
            </div>
          </div>

          <Link
            to="/sequence-recall"
            className="btn-primary"
            style={{ width: '100%', textDecoration: 'none', backgroundColor: '#000000', color: '#FFFFFF' }}
          >
            <Play size={24} fill="currentColor" />
            <span>Play Sequence Recall</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
