'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useLanguage } from '@/contexts/language-context';
import faTranslations from '@/lib/locales/professor-admin/fa.json';
import enTranslations from '@/lib/locales/professor-admin/en.json';

type Translations = Record<string, string>;
type TranslationParams = Record<string, string | number | boolean | null | undefined>;

type ProfessorAdminLanguageContextValue = {
  locale: 'en' | 'fa';
  direction: 'ltr' | 'rtl';
  t: (key: string, params?: TranslationParams) => string;
};

const ProfessorAdminLanguageContext = createContext<ProfessorAdminLanguageContextValue | null>(null);

const BUNDLED: Record<'en' | 'fa', Translations> = {
  fa: faTranslations as Translations,
  en: enTranslations as Translations,
};

export function ProfessorAdminLanguageProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLanguage();
  const lang = locale === 'en' ? 'en' : 'fa';

  const value = useMemo<ProfessorAdminLanguageContextValue>(
    () => ({
      locale: lang,
      direction: lang === 'fa' ? 'rtl' : 'ltr',
      t: (key, params) => {
        let template = BUNDLED[lang][key] || key;
        if (!params) return template;
        for (const [paramKey, paramValue] of Object.entries(params)) {
          template = template.replaceAll(`{${paramKey}}`, String(paramValue ?? ''));
        }
        return template;
      },
    }),
    [lang]
  );

  return (
    <ProfessorAdminLanguageContext.Provider value={value}>{children}</ProfessorAdminLanguageContext.Provider>
  );
}

export function useProfessorAdminLanguage() {
  const ctx = useContext(ProfessorAdminLanguageContext);
  if (!ctx) {
    throw new Error('useProfessorAdminLanguage must be used within ProfessorAdminLanguageProvider');
  }
  return ctx;
}
