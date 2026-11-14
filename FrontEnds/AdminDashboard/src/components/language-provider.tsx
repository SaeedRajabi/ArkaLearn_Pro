
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import faTranslations from '../../public/locales/fa.json';
import enTranslations from '../../public/locales/en.json';

type Locale = 'en' | 'fa';
type Direction = 'ltr' | 'rtl';
type Translations = Record<string, string>;
type TranslationParams = Record<string, string | number | boolean | null | undefined>;

interface LanguageContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  direction: Direction;
  fontClass: string;
  t: (key: string, params?: TranslationParams) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const BUNDLED_LOCALES: Record<Locale, Translations> = {
  fa: faTranslations as Translations,
  en: enTranslations as Translations,
};

function isLocale(value: string | null): value is Locale {
  return value === 'en' || value === 'fa';
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>('fa');
  const [translations, setTranslations] = useState<Translations>(BUNDLED_LOCALES.fa);

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale');
    if (isLocale(savedLocale)) {
      setLocaleState(savedLocale);
      setTranslations(BUNDLED_LOCALES[savedLocale]);
    }
  }, []);

  useEffect(() => {
    const direction = locale === 'fa' ? 'rtl' : 'ltr';
    const fontClass = locale === 'fa' ? 'font-wazir' : 'font-body';

    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    document.body.classList.remove('font-body', 'font-wazir');
    document.body.classList.add(fontClass);
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;

    localStorage.setItem('locale', newLocale);
    setLocaleState(newLocale);
    setTranslations(BUNDLED_LOCALES[newLocale]);
  };

  const direction = locale === 'fa' ? 'rtl' : 'ltr';
  const fontClass = locale === 'fa' ? 'font-wazir' : 'font-body';
  const t = (key: string, params?: TranslationParams): string => {
    let template = translations[key] || key;
    if (!params) return template;

    for (const [paramKey, paramValue] of Object.entries(params)) {
      template = template.replaceAll(`{${paramKey}}`, String(paramValue ?? ''));
    }

    return template;
  };

  const contextValue: LanguageContextProps = {
    locale,
    setLocale,
    direction,
    fontClass,
    t,
  };

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
