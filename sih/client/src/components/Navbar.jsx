import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brain, Heart, Bell, LayoutDashboard, Globe, ToggleLeft, ToggleRight, LogOut, User, Sparkles, Layers } from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ isSimpleMode, setIsSimpleMode }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = api.getCurrentUser();

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    localStorage.setItem('cognicare_lang', newLang);
  };

  const handleLogout = () => {
    api.setToken(null);
    api.setCurrentUser(null);
    navigate('/');
  };

  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '2px solid #e2e8f0',
        padding: '12px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* Brand & Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: '#0284c7',
          }}
        >
          <div
            style={{
              backgroundColor: '#e0f2fe',
              padding: '10px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Brain size={32} color="#0284c7" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              CogniCare <span style={{ color: '#0284c7' }}>NER</span>
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
              {t('app.tagline')}
            </p>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Link
            to="/games"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              backgroundColor: location.pathname.startsWith('/games') ? '#e0f2fe' : 'transparent',
              color: location.pathname.startsWith('/games') ? '#0284c7' : '#334155',
            }}
          >
            <Brain size={20} />
            <span>{t('nav.games')}</span>
          </Link>

          <Link
            to="/memory-game"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              backgroundColor: location.pathname === '/memory-game' ? '#fff7ed' : 'transparent',
              color: location.pathname === '/memory-game' ? '#ea580c' : '#334155',
            }}
          >
            <Sparkles size={20} color="#ea580c" />
            <span>Memory Game</span>
          </Link>

          <Link
            to="/pattern-sequence"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              backgroundColor: location.pathname === '/pattern-sequence' ? '#fff7ed' : 'transparent',
              color: location.pathname === '/pattern-sequence' ? '#d97706' : '#334155',
            }}
          >
            <Layers size={20} color="#d97706" />
            <span>Pattern & Sequence</span>
          </Link>

          <Link
            to="/memory-match"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              backgroundColor: location.pathname === '/memory-match' ? '#fff1ea' : 'transparent',
              color: location.pathname === '/memory-match' ? '#b5471b' : '#334155',
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>💡</span>
            <span>Memory Match</span>
          </Link>

          <Link
            to="/sequence-recall"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              backgroundColor: location.pathname === '/sequence-recall' ? '#ecfdf5' : 'transparent',
              color: location.pathname === '/sequence-recall' ? '#047857' : '#334155',
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>🟩</span>
            <span>Sequence Recall</span>
          </Link>

          <Link
            to="/reminders"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              backgroundColor: location.pathname.startsWith('/reminders') ? '#fef3c7' : 'transparent',
              color: location.pathname.startsWith('/reminders') ? '#b45309' : '#334155',
            }}
          >
            <Bell size={20} />
            <span>{t('nav.reminders')}</span>
          </Link>

          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              backgroundColor: location.pathname.startsWith('/dashboard') ? '#ecfdf5' : 'transparent',
              color: location.pathname.startsWith('/dashboard') ? '#047857' : '#334155',
            }}
          >
            <LayoutDashboard size={20} />
            <span>{t('nav.dashboard')}</span>
          </Link>
        </nav>

        {/* Control Cluster: Simple Mode Toggle + Language Selector + User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Simple Mode Toggle */}
          <button
            onClick={() => setIsSimpleMode(!isSimpleMode)}
            style={{
              backgroundColor: isSimpleMode ? '#fef3c7' : '#f1f5f9',
              color: isSimpleMode ? '#b45309' : '#475569',
              border: `2px solid ${isSimpleMode ? '#f59e0b' : '#cbd5e1'}`,
              borderRadius: '30px',
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: '0.92rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
            title="Toggle simplified 3-button layout for low digital literacy"
          >
            {isSimpleMode ? <ToggleRight size={22} color="#d97706" /> : <ToggleLeft size={22} />}
            <span>{isSimpleMode ? t('app.simpleMode') : t('app.standardMode')}</span>
          </button>

          {/* Language Selector */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f8fafc',
              border: '2px solid #cbd5e1',
              borderRadius: '12px',
              padding: '6px 12px',
            }}
          >
            <Globe size={18} color="#0284c7" />
            <select
              value={i18n.language}
              onChange={handleLanguageChange}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: '#0f172a',
                cursor: 'pointer',
                outline: 'none',
              }}
              aria-label="Select Language"
            >
              <option value="as">অসমীয়া (Assamese)</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* User Status / Login */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  backgroundColor: '#f1f5f9',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                <User size={16} color="#0284c7" />
                <span>{currentUser.name}</span>
                <span
                  style={{
                    backgroundColor: currentUser.role === 'patient' ? '#e0f2fe' : '#ecfdf5',
                    color: currentUser.role === 'patient' ? '#0369a1' : '#047857',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
                title={t('app.logout')}
              >
                <LogOut size={16} />
                <span>{t('app.logout')}</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '6px' }}>
              <Link
                to="/patient-login"
                className="btn-primary"
                style={{
                  minHeight: '44px',
                  padding: '8px 16px',
                  fontSize: '0.92rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                }}
              >
                {t('nav.patientLogin')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
