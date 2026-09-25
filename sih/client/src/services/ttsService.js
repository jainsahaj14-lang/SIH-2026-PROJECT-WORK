/**
 * Text-to-Speech service using Web Speech API.
 * Configured specifically for elderly comprehension:
 * - Slower speaking rate (~0.85x)
 * - Gentle pitch and clear pauses
 * - Regional language voice selection fallback
 */
class TTSService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.voices = [];
    this.isSupported = !!this.synth;

    if (this.isSupported) {
      this.loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  /**
   * Speak text in specified language
   * @param {string} text
   * @param {string} lang - 'as' | 'en' | 'hi'
   * @param {Object} options - { onStart, onEnd, onError }
   */
  speak(text, lang = 'as', options = {}) {
    if (!this.isSupported || !text) {
      if (options.onEnd) options.onEnd();
      return;
    }

    // Cancel any ongoing speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Elderly-friendly speech pace (calm and clear)
    utterance.rate = 0.88;
    utterance.pitch = 1.0;

    // Language mapping & voice selection
    if (lang === 'as') {
      // Browsers often group Assamese or use Bengali / Indic voice fallback for Assamese script
      utterance.lang = 'as-IN';
      const regionalVoice = this.voices.find(
        (v) =>
          v.lang.startsWith('as') ||
          v.lang.startsWith('bn') ||
          v.lang.startsWith('hi') ||
          v.name.includes('India')
      );
      if (regionalVoice) utterance.voice = regionalVoice;
    } else {
      utterance.lang = 'en-IN';
      const englishVoice = this.voices.find(
        (v) => v.lang.startsWith('en-IN') || v.lang.startsWith('en')
      );
      if (englishVoice) utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('[TTSService] Speech synthesis warning:', e);
      this.currentUtterance = null;
      if (options.onError) options.onError(e);
      if (options.onEnd) options.onEnd();
    };

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.warn('[TTSService] Could not play speech:', err.message);
      if (options.onEnd) options.onEnd();
    }
  }

  stop() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  isSpeaking() {
    return !!(this.synth && this.synth.speaking);
  }
}

export const ttsService = new TTSService();
