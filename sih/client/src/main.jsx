import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './i18n/i18n.js';

// Register Service Worker for offline PWA capabilities
if ('serviceWorker' in navigator && (import.meta.env?.PROD || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production'))) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration skipped:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
