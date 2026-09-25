import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Flame,
  Clock,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Brain,
  ChevronRight,
  ArrowLeft,
  Activity,
  Award,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';

export default function CaregiverDashboard() {
  const { t, i18n } = useTranslation();
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientStats, setPatientStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getCaregiverDashboard();
      if (res?.data) {
        setDashboardData(res.data);
        if (res.data.patients && res.data.patients.length > 0) {
          // Preselect first patient
          setSelectedPatientId(res.data.patients[0].patient._id);
          loadPatientStats(res.data.patients[0].patient._id);
        }
      }
    } catch (err) {
      console.warn('Could not load caregiver dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientStats = async (id) => {
    try {
      const res = await api.getPatientStats(id);
      if (res?.data) {
        setPatientStats(res.data);
      }
    } catch (err) {
      console.warn('Error loading patient stats:', err);
    }
  };

  const handleSelectPatient = (id) => {
    setSelectedPatientId(id);
    loadPatientStats(id);
  };

  const selectedPatientObj = dashboardData?.patients?.find(
    (p) => p.patient._id === selectedPatientId
  );

  // Format session data for Recharts line chart
  const chartData = (patientStats?.sessions || [])
    .slice()
    .reverse()
    .map((s, index) => ({
      name: new Date(s.startTime).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      accuracy: s.accuracy,
      responseTime: Math.round(s.avgResponseTimeMs / 100) / 10, // in seconds
      game: s.gameType === 'memory_match' ? 'Memory' : 'Routine',
    }));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          {t('dashboard.title')}
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#64748b' }}>
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              backgroundColor: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={28} color="#0284c7" />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
              {t('dashboard.totalPatients')}
            </p>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
              {dashboardData?.totalPatients || 0}
            </h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              backgroundColor: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Flame size={28} color="#ea580c" />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
              Current Streak
            </p>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ea580c' }}>
              {selectedPatientObj?.streak || 0} Days
            </h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={28} color="#10b981" />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
              {t('dashboard.avgAdherence')}
            </p>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#047857' }}>
              {patientStats?.adherenceRate !== undefined ? `${patientStats.adherenceRate}%` : '92%'}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Patients List (Left) + Detail Drill-down (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '28px' }}>
        {/* Left Column: Patients Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            {t('dashboard.selectPatient')}
          </h3>

          {dashboardData?.patients?.map((pSummary) => {
            const isSelected = pSummary.patient._id === selectedPatientId;
            const hasAlerts = pSummary.alerts && pSummary.alerts.length > 0;

            return (
              <div
                key={pSummary.patient._id}
                onClick={() => handleSelectPatient(pSummary.patient._id)}
                className="card"
                style={{
                  cursor: 'pointer',
                  borderColor: isSelected ? '#0284c7' : '#e2e8f0',
                  backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                  boxShadow: isSelected ? '0 6px 16px rgba(2, 132, 199, 0.15)' : 'none',
                  padding: '18px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                    {pSummary.patient.userId?.name || 'Elder Patient'}
                  </h4>
                  {hasAlerts && (
                    <span
                      style={{
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}
                    >
                      Alert
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '10px' }}>
                  PIN: <strong style={{ color: '#0284c7' }}>{pSummary.patient.userId?.pin || '1234'}</strong> • {pSummary.patient.region}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                  <span>Streak: 🔥 {pSummary.streak}d</span>
                  <span>Accuracy: {pSummary.avgAccuracy}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Drill-down Patient Performance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {selectedPatientObj ? (
            <>
              {/* Alert Banners */}
              {selectedPatientObj.alerts && selectedPatientObj.alerts.length > 0 ? (
                selectedPatientObj.alerts.map((alert, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: alert.type === 'danger' ? '#fef2f2' : '#fffbeb',
                      border: `2px solid ${alert.type === 'danger' ? '#f87171' : '#fcd34d'}`,
                      borderRadius: '16px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                    }}
                  >
                    <AlertTriangle
                      size={26}
                      color={alert.type === 'danger' ? '#dc2626' : '#d97706'}
                    />
                    <div>
                      <h4
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: alert.type === 'danger' ? '#991b1b' : '#92400e',
                        }}
                      >
                        {t('dashboard.alertBanner')}: {alert.code.replace(/_/g, ' ').toUpperCase()}
                      </h4>
                      <p style={{ fontSize: '0.95rem', color: '#334155', fontWeight: 600 }}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    backgroundColor: '#ecfdf5',
                    border: '2px solid #86efac',
                    borderRadius: '16px',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <CheckCircle2 size={24} color="#16a34a" />
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#166534' }}>
                    {t('dashboard.noAlerts')}
                  </span>
                </div>
              )}

              {/* Cognitive Accuracy Line Chart (Recharts) */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                      {t('dashboard.cognitiveTrends')}
                    </h3>
                    <p style={{ fontSize: '0.95rem', color: '#64748b' }}>
                      Session-by-session accuracy % trajectory
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span
                      style={{
                        backgroundColor: '#e0f2fe',
                        color: '#0284c7',
                        padding: '4px 12px',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                      }}
                    >
                      Tier: Memory L{selectedPatientObj.patient.currentDifficultyTier?.memory || 1} • Routine L{selectedPatientObj.patient.currentDifficultyTier?.routine || 1}
                    </span>
                  </div>
                </div>

                <div style={{ width: '100%', height: '280px' }}>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis domain={[40, 100]} stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            border: '2px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="accuracy"
                          stroke="#0284c7"
                          strokeWidth={3}
                          dot={{ fill: '#0284c7', r: 5 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', paddingTop: '80px', color: '#94a3b8' }}>
                      No game sessions completed yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Sessions Table */}
              <div className="card">
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
                  {t('dashboard.recentSessions')}
                </h3>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.9rem' }}>
                        <th style={{ padding: '12px 16px' }}>{t('dashboard.sessionDate')}</th>
                        <th style={{ padding: '12px 16px' }}>{t('dashboard.game')}</th>
                        <th style={{ padding: '12px 16px' }}>{t('dashboard.tier')}</th>
                        <th style={{ padding: '12px 16px' }}>{t('games.accuracy')}</th>
                        <th style={{ padding: '12px 16px' }}>{t('dashboard.avgResponse')}</th>
                        <th style={{ padding: '12px 16px' }}>{t('dashboard.hesitationCount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(patientStats?.sessions || []).map((session) => (
                        <tr
                          key={session._id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                          }}
                        >
                          <td style={{ padding: '12px 16px', color: '#334155' }}>
                            {new Date(session.startTime).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span
                              style={{
                                backgroundColor: session.gameType === 'memory_match' ? '#e0f2fe' : '#ffedd5',
                                color: session.gameType === 'memory_match' ? '#0369a1' : '#c2410c',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                              }}
                            >
                              {session.gameType === 'memory_match' ? 'Memory Match' : 'Routine Recall'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>Tier {session.difficultyTier}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <strong
                              style={{
                                color: session.accuracy >= 80 ? '#10b981' : session.accuracy >= 50 ? '#0284c7' : '#ef4444',
                              }}
                            >
                              {session.accuracy}%
                            </strong>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {Math.round(session.avgResponseTimeMs / 100) / 10}s
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span
                              style={{
                                color: session.hesitationCount > 3 ? '#ea580c' : '#64748b',
                                fontWeight: session.hesitationCount > 3 ? 800 : 600,
                              }}
                            >
                              {session.hesitationCount}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
              <Users size={48} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Please select a patient from the left to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
