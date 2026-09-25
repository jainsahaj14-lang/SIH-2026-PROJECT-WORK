import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { ttsService } from '../services/ttsService';
import { useTranslation } from 'react-i18next';

export default function VoiceSpeaker({ text, lang = null, label = null, size = 'md' }) {
  const { i18n } = useTranslation();
  const [speaking, setSpeaking] = useState(false);
  const targetLang = lang || i18n.language || 'as';

  const handleToggle = () => {
    if (speaking) {
      ttsService.stop();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      ttsService.speak(text, targetLang, {
        onEnd: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    }
  };

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`touch-target inline-flex items-center gap-2 rounded-full font-bold transition-all ${
        speaking
          ? 'bg-amber-500 text-white animate-pulse-ring'
          : 'bg-sky-100 text-sky-800 hover:bg-sky-200'
      }`}
      style={{
        padding: isSmall ? '8px 14px' : '12px 20px',
        minHeight: isSmall ? '44px' : '56px',
        fontSize: isSmall ? '0.95rem' : '1.1rem',
        border: '2px solid rgba(2, 132, 199, 0.3)',
      }}
      title="Listen to audio"
      aria-label="Read text aloud"
    >
      {speaking ? <VolumeX size={isSmall ? 20 : 24} /> : <Volume2 size={isSmall ? 20 : 24} />}
      <span>{label || (speaking ? 'Speaking...' : 'Listen')}</span>
    </button>
  );
}
