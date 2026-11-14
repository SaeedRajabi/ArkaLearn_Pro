'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addArticleToFavorites, getMyFavoriteArticleIds, removeArticleFromFavorites } from '@/lib/api/articles';
import { useAuthOptional } from '@/contexts/auth-context';

interface ArticleFavoritesContextValue {
  favoriteIds: number[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  isFavorite: (articleId: number) => boolean;
  addFavorite: (articleId: number) => Promise<boolean>;
  removeFavorite: (articleId: number) => Promise<boolean>;
  toggleFavorite: (articleId: number) => Promise<boolean>;
}

const ArticleFavoritesContext = createContext<ArticleFavoritesContextValue | null>(null);

export function ArticleFavoritesProvider({ children }: { children: React.ReactNode }) {
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
      const ids = await getMyFavoriteArticleIds();
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

  const addFavorite = useCallback(async (articleId: number) => {
    try {
      await addArticleToFavorites(articleId);
      setFavoriteIds((prev) => (prev.includes(articleId) ? prev : [...prev, articleId]));
      return true;
    } catch {
      return false;
    }
  }, []);

  const removeFavorite = useCallback(async (articleId: number) => {
    try {
      await removeArticleFromFavorites(articleId);
      setFavoriteIds((prev) => prev.filter((id) => id !== articleId));
      return true;
    } catch {
      return false;
    }
  }, []);

  const toggleFavorite = useCallback(
    async (articleId: number) => {
      if (favoriteIds.includes(articleId)) {
        return await removeFavorite(articleId);
      }
      return await addFavorite(articleId);
    },
    [favoriteIds, addFavorite, removeFavorite]
  );

  const isFavorite = useCallback((articleId: number) => favoriteIds.includes(articleId), [favoriteIds]);

  const value = useMemo<ArticleFavoritesContextValue>(
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

  return <ArticleFavoritesContext.Provider value={value}>{children}</ArticleFavoritesContext.Provider>;
}

export function useArticleFavorites(): ArticleFavoritesContextValue {
  const ctx = useContext(ArticleFavoritesContext);
  if (!ctx) {
    throw new Error('useArticleFavorites must be used within ArticleFavoritesProvider');
  }
  return ctx;
}

export function useArticleFavoritesOptional(): ArticleFavoritesContextValue | null {
  return useContext(ArticleFavoritesContext);
}
