export type Locale = 'en' | 'hi' | 'mr';

export type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};
