import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { LanguageContext } from './LanguageContext';
import type { Locale } from './types';

const messages: Record<Locale, Record<string, string>> = {
  en: {
    'language.label': 'Language', 'nav.diagnosis': 'Diagnosis', 'nav.soil': 'Soil Health',
    'diagnosis.title': 'Plant Disease Diagnosis', 'diagnosis.subtitle': 'Upload a clear plant photo for a disease screening.',
    'diagnosis.uploadTitle': 'Upload Plant Image for Analysis', 'diagnosis.uploadHint': 'Upload a clear image of your plant for screening.',
    'diagnosis.analyze': 'Analyze', 'soil.title': 'Soil Health Photo Check', 'soil.upload': 'Upload a soil photo',
    'soil.analyze': 'Check soil photo', 'soil.checking': 'Checking soil…',
  },
  hi: {
    'language.label': 'भाषा', 'nav.diagnosis': 'रोग पहचान', 'nav.soil': 'मिट्टी स्वास्थ्य',
    'diagnosis.title': 'पौधों के रोग की जाँच', 'diagnosis.subtitle': 'रोग की प्रारंभिक जाँच के लिए पौधे की साफ़ तस्वीर अपलोड करें।',
    'diagnosis.uploadTitle': 'जाँच के लिए पौधे की तस्वीर अपलोड करें', 'diagnosis.uploadHint': 'जाँच के लिए पौधे की साफ़ तस्वीर अपलोड करें।',
    'diagnosis.analyze': 'जाँचें', 'soil.title': 'मिट्टी की तस्वीर से जाँच', 'soil.upload': 'मिट्टी की तस्वीर अपलोड करें',
    'soil.analyze': 'मिट्टी की जाँच करें', 'soil.checking': 'मिट्टी की जाँच हो रही है…',
  },
  mr: {
    'language.label': 'भाषा', 'nav.diagnosis': 'रोग ओळख', 'nav.soil': 'मातीचे आरोग्य',
    'diagnosis.title': 'पिकांच्या रोगाची तपासणी', 'diagnosis.subtitle': 'रोग तपासणीसाठी पिकाचा स्पष्ट फोटो अपलोड करा.',
    'diagnosis.uploadTitle': 'तपासणीसाठी पिकाचा फोटो अपलोड करा', 'diagnosis.uploadHint': 'तपासणीसाठी पिकाचा स्पष्ट फोटो अपलोड करा.',
    'diagnosis.analyze': 'तपासा', 'soil.title': 'मातीच्या फोटोची तपासणी', 'soil.upload': 'मातीचा फोटो अपलोड करा',
    'soil.analyze': 'माती तपासा', 'soil.checking': 'माती तपासत आहे…',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = window.localStorage.getItem('agriwise-locale');
    return saved === 'hi' || saved === 'mr' ? saved : 'en';
  });

  useEffect(() => {
    window.localStorage.setItem('agriwise-locale', locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (key: string) => messages[locale][key] ?? messages.en[key] ?? key,
  }), [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

