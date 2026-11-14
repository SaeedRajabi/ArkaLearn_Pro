'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addSeminarToFavorites, getMyFavoriteSeminarIds, removeSeminarFromFavorites } from '@/lib/api/seminars';
import { useAuthOptional } from '@/contexts/auth-context';

interface SeminarFavoritesContextValue {
  favoriteIds: number[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  isFavorite: (seminarId: number) => boolean;
  addFavorite: (seminarId: number) => Promise<boolean>;
  removeFavorite: (seminarId: number) => Promise<boolean>;
  toggleFavorite: (seminarId: number) => Promise<boolean>;
}

const SeminarFavoritesContext = createContext<SeminarFavoritesContextValue | null>(null);

export function SeminarFavoritesProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthOptional();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoriteIds([]);
      return;
    }
    setIsLoading(true);
    try {
      const ids = await getMyFavoriteSeminarIds();
      setFavoriteIds(ids);
    } catch {
      setFavoriteIds([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addFavorite = useCallback(async (seminarId: number) => {
    try {
      await addSeminarToFavorites(seminarId);
      setFavoriteIds((prev) => (prev.includes(seminarId) ? prev : [...prev, seminarId]));
      return true;
    } catch {
      return false;
    }
  }, []);

  const removeFavorite = useCallback(async (seminarId: number) => {
    try {
      await removeSeminarFromFavorites(seminarId);
      setFavoriteIds((prev) => prev.filter((id) => id !== seminarId));
      return true;
    } catch {
      return false;
    }
  }, []);

  const toggleFavorite = useCallback(
    async (seminarId: number) => {
      if (favoriteIds.includes(seminarId)) {
        return await removeFavorite(seminarId);
      }
      return await addFavorite(seminarId);
    },
    [favoriteIds, addFavorite, removeFavorite]
  );

  const isFavorite = useCallback((seminarId: number) => favoriteIds.includes(seminarId), [favoriteIds]);

  const value = useMemo<SeminarFavoritesContextValue>(
    () => ({
      favoriteIds,
      isLoading,
      refresh,
      isFavorite,
      addFavorite,
      removeFavorite,
      toggleFavorite,
    }),
    [favoriteIds, isLoading, refresh, isFavorite, addFavorite, removeFavorite, toggleFavorite]
  );

  return <SeminarFavoritesContext.Provider value={value}>{children}</SeminarFavoritesContext.Provider>;
}

export function useSeminarFavorites(): SeminarFavoritesContextValue {
  const ctx = useContext(SeminarFavoritesContext);
  if (!ctx) {
    throw new Error('useSeminarFavorites must be used within SeminarFavoritesProvider');
  }
  return ctx;
}

export function useSeminarFavoritesOptional(): SeminarFavoritesContextValue | null {
  return useContext(SeminarFavoritesContext);
}
