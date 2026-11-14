
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {Skeleton} from "@/components/ui/skeleton";
import {
  formatLocaleDate,
  formatLocaleDateTime,
  formatLocaleNumber,
  formatLocaleTime,
  toLocaleDigits,
} from '@/lib/utils/locale-format';
import { getDictValue } from '@/lib/i18n-client';
import faDict from '@/lib/locales/fa.json';
import enDict from '@/lib/locales/en.json';
import type { Dictionary } from '@/types';

type Locale = 'en' | 'fa';
type Direction = 'ltr' | 'rtl';

const dictionaries: Record<Locale, Dictionary> = {
  fa: faDict as Dictionary,
  en: enDict as Dictionary,
};

interface LanguageContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  direction: Direction;
  dir: Direction;
  fontClass: string;
  t: (key: string, fallback?: string) => string;
  loading: boolean;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (value: string | Date | null | undefined, style?: 'short' | 'medium' | 'long') => string;
  formatDateTime: (value: string | Date | null | undefined) => string;
  formatTime: (value: string | Date | null | undefined) => string;
  toDigits: (value: string | number) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider = ({
  children,
  initialLocale = 'fa',
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) => {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  useEffect(() => {
    setIsMounted(true);
    localStorage.setItem('locale', initialLocale);
  }, [initialLocale]);

  const direction = locale === 'fa' ? 'rtl' : 'ltr';
  const fontClass = locale === 'fa' ? 'font-wazir' : 'font-body';

  useEffect(() => {
    if (!isMounted) return;
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    document.documentElement.dataset.locale = locale;
    document.body.className = cn(
      document.body.className.split(' ').filter((c) => !c.startsWith('font-')).join(' '),
      fontClass
    );
  }, [isMounted, locale, direction, fontClass]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = (key: string, fallback?: string): string =>
    getDictValue(dictionaries[locale], key, fallback ?? key);

  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
    formatLocaleNumber(value, locale, options);

  const formatDate = (value: string | Date | null | undefined, style: 'short' | 'medium' | 'long' = 'medium') =>
    formatLocaleDate(value, locale, style);

  const formatDateTime = (value: string | Date | null | undefined) =>
    formatLocaleDateTime(value, locale);

  const formatTime = (value: string | Date | null | undefined) =>
    formatLocaleTime(value, locale);

  const toDigits = (value: string | number) => toLocaleDigits(value, locale);

  const contextValue: LanguageContextProps = {
    locale,
    setLocale,
    direction,
    dir: direction,
    fontClass,
    t,
    loading: false,
    formatNumber,
    formatDate,
    formatDateTime,
    formatTime,
    toDigits,
  };
  
  return (
    <LanguageContext.Provider value={contextValue}>
       {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Loading Context
type LoadingContextType = {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isInitialLoading: boolean;
};

export const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setIsLoading: () => {},
  isInitialLoading: true,
});

export const useLoading = () => useContext(LoadingContext);

