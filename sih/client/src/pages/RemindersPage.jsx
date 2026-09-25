import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Pill, Droplet, Footprints, Stethoscope, Check, Plus, Clock, Camera, Image } from 'lucide-react';
import VoiceSpeaker from '../components/VoiceSpeaker';
import { db, acknowledgeReminderLocally, cacheRemindersLocally } from '../db/dexieDb';
import { api } from '../services/api';
import { ttsService } from '../services/ttsService';

export default function RemindersPage() {
  const { t, i18n } = useTranslation();
  const [reminders, setReminders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('medicine');
  const [newTime, setNewTime] = useState('09:00');
  const [newRecurrence, setNewRecurrence] = useState('daily');
  const [newPhotoBase64, setNewPhotoBase64] = useState('');

  const currentUser = api.getCurrentUser();
  const patientId = currentUser?.patientId || '65f123456789abcdef012345';

  useEffect(() => {
    loadReminders();
  }, [patientId]);

  const loadReminders = async () => {
    // 1. Load from Dexie IndexedDB first (100% offline available)
    try {
      const localList = await db.reminders.toArray();
      if (localList.length > 0) {
        setReminders(localList);
      }
    } catch (e) {
      console.warn('Error querying local reminders:', e);
    }

    // 2. If online, fetch latest from server and cache to Dexie
    if (navigator.onLine && patientId) {
      try {
        const res = await api.getReminders(patientId);
        if (res?.data && res.data.length > 0) {
          setReminders(res.data);
          await cacheRemindersLocally(res.data);
        }
      } catch (err) {
        console.warn('Server unreachable, using local Dexie reminders.');
      }
    }
  };

  const handleAcknowledge = async (reminder) => {
    try {
      const updated = await acknowledgeReminderLocally(reminder.id || reminder.serverId || reminder._id);
      
      // Update local UI state
      setReminders((prev) =>
        prev.map((r) =>
          (r.id === reminder.id || r._id === reminder._id || r.serverId === reminder.serverId)
            ? { ...r, acknowledgedAt: new Date().toISOString() }
            : r
        )
      );

      const ackVoice =
        i18n.language === 'as'
          ? 'ধন্যবাদ! আপুনি ঔষধ খোৱাটো সংৰক্ষণ কৰা হ’ল।'
          : 'Thank you! Your reminder completion has been recorded.';
      ttsService.speak(ackVoice, i18n.language || 'as');

      // Attempt online sync if connected
      if (navigator.onLine && (reminder.serverId || reminder._id)) {
        await api.acknowledgeReminder(reminder.serverId || reminder._id);
      }
    } catch (e) {
      console.error('Error acknowledging reminder:', e);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhotoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!newLabel || !newTime) return;

    const reminderPayload = {
      patientId,
      type: newType,
      scheduleTime: newTime,
      recurrence: newRecurrence,
      label: newLabel,
      photoUrl: newPhotoBase64,
    };

    try {
      // 1. Save locally to Dexie
      const localId = await db.reminders.add({
        ...reminderPayload,
        acknowledgedAt: null,
        synced: false,
      });

      // 2. If online, sync to server
      if (navigator.onLine) {
        const res = await api.createReminder(reminderPayload);
        if (res?.data) {
          await db.reminders.update(localId, {
            serverId: res.data._id,
            synced: true,
          });
        }
      }

      setShowAddModal(false);
      setNewLabel('');
      setNewPhotoBase64('');
      loadReminders();
    } catch (err) {
      console.error('Failed to create reminder:', err);
    }
  };

  const getFilteredReminders = () => {
    if (activeFilter === 'all') return reminders;
    return reminders.filter((r) => r.type === activeFilter);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'medicine':
        return <Pill size={32} color="#0284c7" />;
      case 'hydration':
        return <Droplet size={32} color="#0ea5e9" />;
      case 'activity':
        return <Footprints size={32} color="#10b981" />;
      case 'appointment':
        return <Stethoscope size={32} color="#8b5cf6" />;
      default:
        return <Bell size={32} color="#f59e0b" />;
    }
  };

  const filtered = getFilteredReminders();

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 16px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
            {t('reminders.title')}
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#64748b' }}>
            {t('reminders.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
          style={{ minHeight: '56px', padding: '10px 22px', fontSize: '1.05rem' }}
        >
          <Plus size={22} />
          <span>{t('reminders.addNew')}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '24px',
        }}
      >
        {[
          { key: 'all', label: t('reminders.all'), icon: null },
          { key: 'medicine', label: t('reminders.medicine'), icon: <Pill size={18} /> },
          { key: 'hydration', label: t('reminders.hydration'), icon: <Droplet size={18} /> },
          { key: 'activity', label: t('reminders.activity'), icon: <Footprints size={18} /> },
          { key: 'appointment', label: t('reminders.appointment'), icon: <Stethoscope size={18} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            style={{
              padding: '12px 20px',
              borderRadius: '16px',
              fontWeight: 800,
              fontSize: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: `2px solid ${activeFilter === tab.key ? '#0284c7' : '#cbd5e1'}`,
              backgroundColor: activeFilter === tab.key ? '#e0f2fe' : '#ffffff',
              color: activeFilter === tab.key ? '#0284c7' : '#475569',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Reminders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {filtered.length === 0 ? (
          <div
            className="card"
            style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}
          >
            <Bell size={48} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
            <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{t('reminders.noReminders')}</p>
          </div>
        ) : (
          filtered.map((reminder) => {
            const isAck = !!reminder.acknowledgedAt;

            return (
              <div
                key={reminder.id || reminder._id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '20px',
                  backgroundColor: isAck ? '#f8fafc' : '#ffffff',
                  borderColor: isAck ? '#e2e8f0' : '#bae6fd',
                  padding: '24px',
                  opacity: isAck ? 0.75 : 1,
                }}
              >
                {/* Left: Icon & Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flex: 1, minWidth: '260px' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '18px',
                      backgroundColor: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getTypeIcon(reminder.type)}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Clock size={16} color="#64748b" />
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7' }}>
                        {reminder.scheduleTime}
                      </span>
                      <span
                        style={{
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '8px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {reminder.recurrence}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                      {reminder.label}
                    </h3>
                  </div>
                </div>

                {/* Center: Photo Preview if exists */}
                {reminder.photoUrl && (
                  <div style={{ flexShrink: 0 }}>
                    <img
                      src={reminder.photoUrl}
                      alt="Pill guide"
                      style={{
                        height: '56px',
                        width: '84px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#f8fafc',
                      }}
                    />
                  </div>
                )}

                {/* Right: TTS Speaker & One-Tap Acknowledge Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <VoiceSpeaker
                    text={`${reminder.label}, scheduled for ${reminder.scheduleTime}`}
                    size="sm"
                    label=""
                  />

                  {isAck ? (
                    <div
                      style={{
                        backgroundColor: '#ecfdf5',
                        color: '#047857',
                        border: '2px solid #10b981',
                        borderRadius: '16px',
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        minHeight: '64px',
                      }}
                    >
                      <Check size={22} strokeWidth={3} />
                      <span>{t('reminders.done')}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(reminder)}
                      className="btn-success"
                      style={{ minHeight: '64px', padding: '12px 28px', fontSize: '1.2rem' }}
                    >
                      <Check size={24} strokeWidth={3} />
                      <span>{t('reminders.iTookIt')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 90,
          }}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: '520px', backgroundColor: '#ffffff', borderRadius: '24px' }}
          >
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '20px' }}>
              {t('reminders.addNew')}
            </h2>

            <form onSubmit={handleCreateReminder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>
                  {t('reminders.label')}
                </label>
                <input
                  type="text"
                  required
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g., Blood Pressure Tablet / পানী খাওক"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '2px solid #cbd5e1',
                    fontSize: '1.05rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>
                    {t('reminders.type')}
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '2px solid #cbd5e1',
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    <option value="medicine">Medicine</option>
                    <option value="hydration">Hydration</option>
                    <option value="activity">Activity</option>
                    <option value="appointment">Appointment</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>
                    {t('reminders.time')}
                  </label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '2px solid #cbd5e1',
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  />
                </div>
              </div>

              {/* Medicine photo upload */}
              {newType === 'medicine' && (
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>
                    Optional Medicine / Pill Photo Guide:
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ fontSize: '0.9rem' }}
                  />
                  {newPhotoBase64 && (
                    <div style={{ marginTop: '8px' }}>
                      <img
                        src={newPhotoBase64}
                        alt="Preview"
                        style={{ height: '60px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  {t('reminders.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
