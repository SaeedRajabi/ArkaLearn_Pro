'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addCourseToFavorites, getMyFavoriteCourseIds, removeCourseFromFavorites } from '@/lib/api/courses';
import { useAuthOptional } from '@/contexts/auth-context';

interface FavoritesContextValue {
  favoriteIds: number[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  isFavorite: (courseId: number) => boolean;
  addFavorite: (courseId: number) => Promise<boolean>;
  removeFavorite: (courseId: number) => Promise<boolean>;
  toggleFavorite: (courseId: number) => Promise<boolean>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
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
      const ids = await getMyFavoriteCourseIds();
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

  const addFavorite = useCallback(async (courseId: number) => {
    try {
      await addCourseToFavorites(courseId);
      setFavoriteIds((prev) => (prev.includes(courseId) ? prev : [...prev, courseId]));
      return true;
    } catch {
      return false;
    }
  }, []);

  const removeFavorite = useCallback(async (courseId: number) => {
    try {
      await removeCourseFromFavorites(courseId);
      setFavoriteIds((prev) => prev.filter((id) => id !== courseId));
      return true;
    } catch {
      return false;
    }
  }, []);

  const toggleFavorite = useCallback(
    async (courseId: number) => {
      if (favoriteIds.includes(courseId)) {
        return await removeFavorite(courseId);
      }
      return await addFavorite(courseId);
    },
    [favoriteIds, addFavorite, removeFavorite]
  );

  const isFavorite = useCallback((courseId: number) => favoriteIds.includes(courseId), [favoriteIds]);

  const value = useMemo<FavoritesContextValue>(
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

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return ctx;
}

export function useFavoritesOptional(): FavoritesContextValue | null {
  return useContext(FavoritesContext);
}
