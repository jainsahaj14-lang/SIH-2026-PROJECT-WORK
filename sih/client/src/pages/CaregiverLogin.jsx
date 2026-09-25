import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Mail, Lock, ArrowRight, UserCheck } from 'lucide-react';
import { api } from '../services/api';

export default function CaregiverLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e, demoCreds = null) => {
    if (e) e.preventDefault();
    const loginEmail = demoCreds ? demoCreds.email : email;
    const loginPassword = demoCreds ? demoCreds.password : password;

    if (!loginEmail || !loginPassword) {
      setError('Please provide email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.loginCaregiver(loginEmail, loginPassword);
      if (res?.success) {
        api.setToken(res.token);
        api.setCurrentUser(res.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoCaregiver = () => {
    setEmail('caregiver@cognicare.ner');
    setPassword('password123');
    handleSubmit(null, { email: 'caregiver@cognicare.ner', password: 'password123' });
  };

  return (
    <div style={{ maxWidth: '480px', margin: '48px auto', padding: '0 16px' }}>
      <div
        className="card"
        style={{
          border: '2px solid #0d9488',
          borderRadius: '28px',
          padding: '36px 32px',
          boxShadow: '0 10px 30px rgba(13, 148, 136, 0.1)',
        }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            backgroundColor: '#ccfbf1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          <ShieldCheck size={36} color="#0d9488" />
        </div>

        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', textAlign: 'center', marginBottom: '8px' }}>
          {t('auth.caregiverLoginTitle')}
        </h1>

        <p style={{ fontSize: '1.1rem', color: '#64748b', textAlign: 'center', marginBottom: '28px' }}>
          {t('auth.caregiverLoginSubtitle')}
        </p>

        {error && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              padding: '12px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.95rem',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              {t('auth.email')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="caregiver@cognicare.ner"
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 44px',
                  borderRadius: '14px',
                  border: '2px solid #cbd5e1',
                  fontSize: '1.05rem',
                }}
              />
              <Mail
                size={20}
                color="#94a3b8"
                style={{ position: 'absolute', left: '14px', top: '16px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              {t('auth.password')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 44px',
                  borderRadius: '14px',
                  border: '2px solid #cbd5e1',
                  fontSize: '1.05rem',
                }}
              />
              <Lock
                size={20}
                color="#94a3b8"
                style={{ position: 'absolute', left: '14px', top: '16px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              backgroundColor: '#0d9488',
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)',
              marginTop: '8px',
            }}
          >
            <span>{loading ? 'Signing In...' : t('auth.loginButton')}</span>
            <ArrowRight size={22} />
          </button>
        </form>

        {/* Demo Quick Login */}
        <div style={{ borderTop: '2px solid #f1f5f9', marginTop: '28px', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 600, marginBottom: '12px' }}>
            {t('auth.demoAccounts')}
          </p>
          <button
            type="button"
            onClick={handleDemoCaregiver}
            style={{
              backgroundColor: '#f0fdf4',
              border: '2px dashed #0d9488',
              borderRadius: '14px',
              padding: '12px 18px',
              color: '#0f766e',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <UserCheck size={20} />
            <span>{t('auth.useDemoCaregiver')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
