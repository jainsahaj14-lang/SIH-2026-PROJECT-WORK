import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import as from './locales/as.json';

const savedLanguage = localStorage.getItem('cognicare_lang') || 'as';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    as: { translation: as },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
