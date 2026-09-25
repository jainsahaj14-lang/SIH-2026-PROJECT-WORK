import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { syncManager } from '../db/syncManager';

export default function OfflineBanner() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced'

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = syncManager.subscribe((data) => {
      if (data.status === 'syncing') setSyncStatus('syncing');
      else if (data.status === 'synced') {
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 4000);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const handleManualSync = () => {
    syncManager.syncNow();
  };

  if (isOnline && syncStatus === 'idle') {
    return null; // Keep screen clean when connected normally
  }

  return (
    <div
      style={{
        backgroundColor: !isOnline ? '#fef3c7' : '#dcfce7',
        color: !isOnline ? '#92400e' : '#166534',
        borderBottom: `2px solid ${!isOnline ? '#fcd34d' : '#86efac'}`,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '0.95rem',
        fontWeight: '600',
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {!isOnline ? (
          <>
            <WifiOff size={22} style={{ color: '#d97706' }} />
            <span>{t('app.offlineNotice')}</span>
          </>
        ) : (
          <>
            <CheckCircle2 size={22} style={{ color: '#16a34a' }} />
            <span>{t('app.onlineNotice')}</span>
          </>
        )}
      </div>

      {isOnline && (
        <button
          onClick={handleManualSync}
          disabled={syncStatus === 'syncing'}
          style={{
            background: 'white',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '6px 14px',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={16} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
          {syncStatus === 'syncing' ? t('app.syncing') : t('app.syncNow')}
        </button>
      )}
    </div>
  );
}
