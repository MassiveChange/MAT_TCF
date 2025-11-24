import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '../types';
import { translations } from '../services/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('tcf_app_lang') as Language;
    if (storedLang && (storedLang === 'en' || storedLang === 'fa')) {
      setLanguageState(storedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('tcf_app_lang', lang);
  };

  const dir = language === 'fa' ? 'rtl' : 'ltr';
  
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
