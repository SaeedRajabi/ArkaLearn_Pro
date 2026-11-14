'use client';

import { useCallback } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { getDictValue } from '@/lib/i18n-client';
import enDict from '@/lib/locales/en.json';
import faDict from '@/lib/locales/fa.json';
import type { Dictionary } from '@/types';

const BUNDLED_LOCALES: Record<'en' | 'fa', Dictionary> = {
  en: enDict as Dictionary,
  fa: faDict as Dictionary,
};

/**
 * Returns a translator for professor dashboard strings.
 * Uses server dict first, then bundled locale JSON for missing keys.
 */
export function useProfessorDict(serverDict: Dictionary) {
  const { locale } = useLanguage();
  const clientDict = BUNDLED_LOCALES[locale === 'fa' ? 'fa' : 'en'];

  const t = useCallback(
    (path: string, fallback: string) => {
      const fromServer = getDictValue(serverDict, path, '');
      if (fromServer) return fromServer;
      const fromClient = getDictValue(clientDict, path, '');
      if (fromClient) return fromClient;
      return fallback;
    },
    [serverDict, clientDict]
  );

  return t;
}
