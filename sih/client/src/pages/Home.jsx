import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brain, Bell, PhoneCall, Sparkles, ShieldCheck, ArrowRight, Activity, Users } from 'lucide-react';
import VoiceSpeaker from '../components/VoiceSpeaker';

export default function Home({ isSimpleMode }) {
  const { t, i18n } = useTranslation();

  const handleCallCaregiver = () => {
    alert(t('simple.callingMessage'));
  };

  // If in Simple Mode, show the ultra-accessible 3-card layout
  if (isSimpleMode) {
    return (
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Simple Mode Header with TTS greeting */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '24px',
            marginBottom: '28px',
            border: '2px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
              {t('simple.welcome')}
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 600 }}>
              {t('app.tagline')}
            </p>
          </div>
          <VoiceSpeaker text={t('simple.welcome')} size="lg" />
        </div>

        {/* 3 Massive Cards (Minimum 120px height, huge tap targets) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card 1: Play Games */}
          <Link
            to="/games"
            style={{
              textDecoration: 'none',
              backgroundColor: '#e0f2fe',
              border: '3px solid #0284c7',
              borderRadius: '28px',
              padding: '28px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.15)',
              transition: 'transform 0.15s ease',
            }}
          >
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                backgroundColor: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Brain size={44} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0369a1', marginBottom: '6px' }}>
                {t('simple.playGames')}
              </h3>
              <p style={{ fontSize: '1.2rem', color: '#0c4a6e', fontWeight: 600 }}>
                {t('simple.playGamesDesc')}
              </p>
            </div>
            <ArrowRight size={36} color="#0284c7" strokeWidth={3} />
          </Link>

          {/* Card 2: Reminders */}
          <Link
            to="/reminders"
            style={{
              textDecoration: 'none',
              backgroundColor: '#fef3c7',
              border: '3px solid #f59e0b',
              borderRadius: '28px',
              padding: '28px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.15)',
              transition: 'transform 0.15s ease',
            }}
          >
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                backgroundColor: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Bell size={44} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#b45309', marginBottom: '6px' }}>
                {t('simple.reminders')}
              </h3>
              <p style={{ fontSize: '1.2rem', color: '#78350f', fontWeight: 600 }}>
                {t('simple.remindersDesc')}
              </p>
            </div>
            <ArrowRight size={36} color="#f59e0b" strokeWidth={3} />
          </Link>

          {/* Card 3: Call Caregiver */}
          <button
            onClick={handleCallCaregiver}
            style={{
              textAlign: 'left',
              cursor: 'pointer',
              backgroundColor: '#ecfdf5',
              border: '3px solid #10b981',
              borderRadius: '28px',
              padding: '28px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)',
            }}
          >
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PhoneCall size={44} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#047857', marginBottom: '6px' }}>
                {t('simple.callCaregiver')}
              </h3>
              <p style={{ fontSize: '1.2rem', color: '#064e3b', fontWeight: 600 }}>
                {t('simple.callCaregiverDesc')}
              </p>
            </div>
            <ArrowRight size={36} color="#10b981" strokeWidth={3} />
          </button>
        </div>
      </div>
    );
  }

  // Standard Mode Landing Page
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Hero Section */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 60%, #0f172a 100%)',
          color: 'white',
          borderRadius: '32px',
          padding: '48px 36px',
          marginBottom: '36px',
          boxShadow: '0 12px 36px rgba(2, 132, 199, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '32px',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            <Sparkles size={16} />
            <span>North Eastern Region (NER) Dementia Care Initiative</span>
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>
            {t('app.title')}
          </h1>

          <p style={{ fontSize: '1.25rem', opacity: 0.95, lineHeight: 1.6, marginBottom: '28px' }}>
            {t('app.tagline')} — Designed specifically for Assam and the North Eastern Region with offline-first gaming, Assamese & regional voice support, and intelligent fatigue-aware difficulty adaptation.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link
              to="/games"
              className="btn-primary"
              style={{
                backgroundColor: '#ffffff',
                color: '#0284c7',
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                textDecoration: 'none',
              }}
            >
              <Brain size={24} />
              <span>{t('games.startPlaying')}</span>
            </Link>

            <Link
              to="/patient-login"
              className="btn-secondary"
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                borderColor: 'rgba(255,255,255,0.4)',
                textDecoration: 'none',
              }}
            >
              <span>{t('auth.useDemoPatient')}</span>
            </Link>
          </div>
        </div>

        {/* Hero Visual Pill */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '28px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            padding: '28px',
            minWidth: '280px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={28} color="#38bdf8" />
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>100% Offline Ready</h4>
              <p style={{ fontSize: '0.85rem', opacity: 0.85 }}>IndexedDB + Service Worker</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={28} color="#34d399" />
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Adaptive AI Engine</h4>
              <p style={{ fontSize: '0.85rem', opacity: 0.85 }}>Rule-based + ML tier adjustment</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={28} color="#fbbf24" />
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Caregiver Sync</h4>
              <p style={{ fontSize: '0.85rem', opacity: 0.85 }}>Remote adherence & alert banners</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Game Center Card */}
        <div className="card">
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Brain size={30} color="#0284c7" />
          </div>
          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '8px' }}>
            {t('games.hubTitle')}
          </h3>
          <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: '20px', lineHeight: 1.5 }}>
            {t('games.hubSubtitle')}
          </p>
          <Link
            to="/games"
            className="btn-primary"
            style={{ width: '100%', textDecoration: 'none' }}
          >
            <span>{t('games.startPlaying')}</span>
            <ArrowRight size={20} />
          </Link>
        </div>

        {/* Reminders Card */}
        <div className="card">
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Bell size={30} color="#f59e0b" />
          </div>
          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '8px' }}>
            {t('reminders.title')}
          </h3>
          <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: '20px', lineHeight: 1.5 }}>
            {t('reminders.subtitle')}
          </p>
          <Link
            to="/reminders"
            className="btn-secondary"
            style={{ width: '100%', textDecoration: 'none' }}
          >
            <span>{t('nav.reminders')}</span>
            <ArrowRight size={20} />
          </Link>
        </div>

        {/* Remember & Match Card */}
        <div className="card" style={{ borderColor: '#F3CFBE', backgroundColor: '#FFFDFB' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#FFF7EE',
              border: '2px solid #F3CFBE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '16px',
            }}
          >
            💡
          </div>
          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '8px', color: '#2E221D' }}>
            Remember & Match
          </h3>
          <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: '20px', lineHeight: 1.5 }}>
            Watch the pictures, then find them again once they're hidden. 3 difficulty tiers with peach tiles and streak counter.
          </p>
          <Link
            to="/memory-game"
            className="btn-primary"
            style={{ width: '100%', textDecoration: 'none', backgroundColor: '#D96B43', boxShadow: '0 4px 14px rgba(217, 107, 67, 0.35)' }}
          >
            <span>Play Remember & Match</span>
            <ArrowRight size={20} />
          </Link>
        </div>

        {/* Caregiver Portal Card */}
        <div className="card">
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Activity size={30} color="#10b981" />
          </div>
          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '8px' }}>
            {t('dashboard.title')}
          </h3>
          <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: '20px', lineHeight: 1.5 }}>
            {t('dashboard.subtitle')}
          </p>
          <Link
            to="/caregiver-login"
            className="btn-secondary"
            style={{ width: '100%', textDecoration: 'none', borderColor: '#10b981', color: '#047857' }}
          >
            <span>{t('auth.loginButton')}</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}
