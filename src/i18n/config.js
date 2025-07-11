import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../i18n/locales/en/translations.json';
import hiTranslations from '../i18n/locales/hn/translations.json';

i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  lng: 'en',
  resources: {
    en: {
      translations: enTranslations
    },
    hi: {
      translations: hiTranslations
    }
  },
  ns: ['translations'],
  defaultNS: 'translations'
});

i18n.languages = ['en', 'hi'];

export default i18n;