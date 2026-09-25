import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KeyRound, Delete, ArrowRight, UserCheck } from 'lucide-react';
import VoiceSpeaker from '../components/VoiceSpeaker';
import { api } from '../services/api';
import { ttsService } from '../services/ttsService';

export default function PatientLogin() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKeyClick = (num) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = async (overridePin = null) => {
    const pinToSubmit = overridePin || pin;
    if (pinToSubmit.length !== 4) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.loginPatient(pinToSubmit);
      if (res?.success) {
        api.setToken(res.token);
        api.setCurrentUser(res.user);

        const welcomeVoice =
          i18n.language === 'as'
            ? `নমস্কাৰ ${res.user.name}, কগনিকেন্দ্ৰলৈ স্বাগতম!`
            : `Welcome back, ${res.user.name}!`;
        ttsService.speak(welcomeVoice, i18n.language || 'as');

        navigate('/games');
      }
    } catch (err) {
      setError(err.message || 'Incorrect PIN. Please ask your caregiver or try again.');
      ttsService.speak('পিন ভুল হৈছে, অনুগ্ৰহ কৰি আকৌ চেষ্টা কৰক', i18n.language || 'as');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPatient = () => {
    setPin('1234');
    handleSubmit('1234');
  };

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto', padding: '0 16px' }}>
      <div
        className="card"
        style={{
          border: '3px solid #0284c7',
          borderRadius: '32px',
          padding: '36px 28px',
          textAlign: 'center',
          boxShadow: '0 12px 32px rgba(2, 132, 199, 0.12)',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: '#e0f2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          <KeyRound size={36} color="#0284c7" />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          {t('auth.patientLoginTitle')}
        </h1>

        <p style={{ fontSize: '1.15rem', color: '#64748b', marginBottom: '24px' }}>
          {t('auth.patientLoginSubtitle')}
        </p>

        {/* PIN Display Circles */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          {[0, 1, 2, 3].map((idx) => {
            const hasDigit = pin.length > idx;
            return (
              <div
                key={idx}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  border: `3px solid ${hasDigit ? '#0284c7' : '#cbd5e1'}`,
                  backgroundColor: hasDigit ? '#e0f2fe' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: '#0284c7',
                }}
              >
                {hasDigit ? '•' : ''}
              </div>
            );
          })}
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              padding: '10px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '1rem',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        {/* Large Numeric Keypad (Huge 70px+ tap targets) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '14px',
            marginBottom: '24px',
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyClick(String(num))}
              style={{
                minHeight: '72px',
                borderRadius: '18px',
                border: '2px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '2rem',
                fontWeight: 800,
                color: '#0f172a',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(0,0,0,0.04)',
              }}
            >
              {num}
            </button>
          ))}

          {/* Bottom row: Clear, 0, Backspace */}
          <button
            type="button"
            onClick={handleClear}
            style={{
              minHeight: '72px',
              borderRadius: '18px',
              border: '2px solid #cbd5e1',
              backgroundColor: '#f1f5f9',
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleKeyClick('0')}
            style={{
              minHeight: '72px',
              borderRadius: '18px',
              border: '2px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '2rem',
              fontWeight: 800,
              color: '#0f172a',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.04)',
            }}
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            style={{
              minHeight: '72px',
              borderRadius: '18px',
              border: '2px solid #cbd5e1',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Delete size={28} />
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={() => handleSubmit()}
          disabled={loading || pin.length !== 4}
          className="btn-primary"
          style={{
            width: '100%',
            minHeight: '68px',
            fontSize: '1.35rem',
            opacity: pin.length === 4 ? 1 : 0.6,
            marginBottom: '20px',
          }}
        >
          <span>{loading ? 'Verifying...' : t('auth.pinSubmit')}</span>
          <ArrowRight size={24} />
        </button>

        {/* One-Tap Demo Helper */}
        <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 600, marginBottom: '10px' }}>
            {t('auth.demoAccounts')}
          </p>
          <button
            onClick={handleDemoPatient}
            type="button"
            style={{
              backgroundColor: '#f0fdf4',
              border: '2px dashed #16a34a',
              borderRadius: '14px',
              padding: '12px 18px',
              color: '#15803d',
              fontWeight: 700,
              fontSize: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <UserCheck size={20} />
            <span>{t('auth.useDemoPatient')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
