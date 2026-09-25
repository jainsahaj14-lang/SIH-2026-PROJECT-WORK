import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Check, X, Pill, Droplet, Footprints, Stethoscope, Volume2 } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { acknowledgeReminderLocally } from '../db/dexieDb';
import { ttsService } from '../services/ttsService';

export default function ReminderAlertModal() {
  const { t, i18n } = useTranslation();
  const [activeReminder, setActiveReminder] = useState(null);

  useEffect(() => {
    const unsubscribe = notificationService.onReminderDue((reminder) => {
      setActiveReminder(reminder);

      // Auto-read reminder aloud using TTS for low-vision/elderly users
      const speechText = `${t('reminders.alertDueTitle')} ${reminder.label}`;
      ttsService.speak(speechText, i18n.language || 'as');
    });

    return () => unsubscribe();
  }, [t, i18n.language]);

  const handleAcknowledge = async () => {
    if (!activeReminder) return;

    try {
      await acknowledgeReminderLocally(activeReminder.id || activeReminder.serverId);
      ttsService.speak(
        i18n.language === 'as' ? 'ধন্যবাদ, সংৰক্ষিত কৰা হ’ল' : 'Thank you, recorded!',
        i18n.language || 'as'
      );
    } catch (e) {
      console.warn('Error acknowledging reminder:', e);
    } finally {
      setActiveReminder(null);
    }
  };

  const handleDismiss = () => {
    ttsService.stop();
    setActiveReminder(null);
  };

  if (!activeReminder) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'medicine':
        return <Pill size={36} color="#0284c7" />;
      case 'hydration':
        return <Droplet size={36} color="#0ea5e9" />;
      case 'activity':
        return <Footprints size={36} color="#10b981" />;
      case 'appointment':
        return <Stethoscope size={36} color="#8b5cf6" />;
      default:
        return <Bell size={36} color="#f59e0b" />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 100,
        animation: 'fadeIn 0.2s ease-out',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-modal-title"
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          border: '4px solid #f59e0b',
          backgroundColor: '#ffffff',
          borderRadius: '28px',
          padding: '32px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 16px auto',
            borderRadius: '50%',
            backgroundColor: '#fef3c7',
            border: '3px solid #f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="animate-pulse-ring"
        >
          {getTypeIcon(activeReminder.type)}
        </div>

        <span
          style={{
            backgroundColor: '#fef3c7',
            color: '#b45309',
            fontSize: '0.9rem',
            fontWeight: 800,
            padding: '4px 14px',
            borderRadius: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {t('reminders.alertDueTitle')}
        </span>

        <h2
          id="reminder-modal-title"
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#0f172a',
            margin: '16px 0 8px 0',
            lineHeight: 1.3,
          }}
        >
          {activeReminder.label}
        </h2>

        <p style={{ fontSize: '1.15rem', color: '#64748b', fontWeight: 600, marginBottom: '20px' }}>
          {t('reminders.scheduledAt')}: <strong style={{ color: '#0f172a' }}>{activeReminder.scheduleTime}</strong>
        </p>

        {/* Optional Pill / Strip Photo Preview */}
        {activeReminder.photoUrl && (
          <div
            style={{
              marginBottom: '24px',
              backgroundColor: '#f8fafc',
              border: '2px solid #e2e8f0',
              borderRadius: '16px',
              padding: '12px',
            }}
          >
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>
              {t('reminders.photoPreview')}
            </p>
            <img
              src={activeReminder.photoUrl}
              alt="Medicine visual guide"
              style={{
                maxHeight: '120px',
                objectFit: 'contain',
                margin: '0 auto',
                borderRadius: '8px',
              }}
            />
          </div>
        )}

        {/* Action Buttons - Massive 64px tap targets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
          <button
            onClick={handleAcknowledge}
            className="btn-success"
            style={{ width: '100%', minHeight: '68px', fontSize: '1.35rem' }}
          >
            <Check size={28} strokeWidth={3} />
            <span>{t('reminders.iTookIt')}</span>
          </button>

          <button
            onClick={handleDismiss}
            className="btn-secondary"
            style={{ width: '100%', minHeight: '56px', fontSize: '1.05rem', color: '#64748b' }}
          >
            <X size={20} />
            <span>{t('reminders.dismiss')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
