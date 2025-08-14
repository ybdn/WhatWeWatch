import { useState, useEffect, useCallback } from 'react';
import ListServiceSupabase, { ListItem } from '../lib/listServiceSupabase';
import { ContentItem } from '../lib/tmdbService';

interface UseListManagerReturn {
  // États des listes
  watchlist: ListItem[];
  finished: ListItem[];
  favorites: ListItem[];
  
  // États de chargement
  watchlistLoading: boolean;
  finishedLoading: boolean;
  favoritesLoading: boolean;
  
  // États d'erreur
  watchlistError: string | null;
  finishedError: string | null;
  favoritesError: string | null;
  
  // Actions Watchlist
  addToWatchlist: (content: ContentItem) => Promise<void>;
  removeFromWatchlist: (contentId: string) => Promise<void>;
  isInWatchlist: (contentId: string) => boolean;
  
  // Actions Terminés
  markAsFinished: (content: ContentItem) => Promise<void>;
  isFinished: (contentId: string) => boolean;
  
  // Actions Favoris
  addToFavorites: (content: ContentItem) => Promise<void>;
  removeFromFavorites: (contentId: string) => Promise<void>;
  isFavorite: (contentId: string) => boolean;
  
  // Utilitaires
  getContentStatus: (contentId: string) => {
    inWatchlist: boolean;
    isFinished: boolean;
    isFavorite: boolean;
  };
  refreshAllLists: () => Promise<void>;
  getStats: () => {
    watchlistCount: number;
    finishedCount: number;
    favoritesCount: number;
  };
}

export function useListManager(): UseListManagerReturn {
  // États des listes
  const [watchlist, setWatchlist] = useState<ListItem[]>([]);
  const [finished, setFinished] = useState<ListItem[]>([]);
  const [favorites, setFavorites] = useState<ListItem[]>([]);
  
  // États de chargement
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [finishedLoading, setFinishedLoading] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  
  // États d'erreur
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  const [finishedError, setFinishedError] = useState<string | null>(null);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);

  // === CHARGEMENT DES LISTES ===
  
  const loadWatchlist = useCallback(async () => {
    setWatchlistLoading(true);
    setWatchlistError(null);
    try {
      const data = await ListServiceSupabase.getWatchlist();
      setWatchlist(data);
    } catch (error) {
      setWatchlistError(error instanceof Error ? error.message : 'Erreur de chargement');
    } finally {
      setWatchlistLoading(false);
    }
  }, []);

  const loadFinished = useCallback(async () => {
    setFinishedLoading(true);
    setFinishedError(null);
    try {
      const data = await ListServiceSupabase.getFinished();
      setFinished(data);
    } catch (error) {
      setFinishedError(error instanceof Error ? error.message : 'Erreur de chargement');
    } finally {
      setFinishedLoading(false);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    setFavoritesLoading(true);
    setFavoritesError(null);
    try {
      const data = await ListServiceSupabase.getFavorites();
      setFavorites(data);
    } catch (error) {
      setFavoritesError(error instanceof Error ? error.message : 'Erreur de chargement');
    } finally {
      setFavoritesLoading(false);
    }
  }, []);

  const refreshAllLists = useCallback(async () => {
    await Promise.all([
      loadWatchlist(),
      loadFinished(),
      loadFavorites(),
    ]);
  }, [loadWatchlist, loadFinished, loadFavorites]);

  // === ACTIONS WATCHLIST ===
  
  const addToWatchlist = useCallback(async (content: ContentItem) => {
    try {
      await ListServiceSupabase.addToWatchlist(content);
      await loadWatchlist(); // Recharger pour mettre à jour l'état
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }, [loadWatchlist]);

  const removeFromWatchlist = useCallback(async (contentId: string) => {
    try {
      await ListServiceSupabase.removeFromWatchlist(contentId);
      await loadWatchlist(); // Recharger pour mettre à jour l'état
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }, [loadWatchlist]);

  const isInWatchlist = useCallback((contentId: string) => {
    return watchlist.some(item => item.contentId === contentId);
  }, [watchlist]);

  // === ACTIONS TERMINÉS ===
  
  const markAsFinished = useCallback(async (content: ContentItem) => {
    try {
      await ListServiceSupabase.markAsFinished(content);
      // Recharger les deux listes car le contenu peut être déplacé
      await Promise.all([loadFinished(), loadWatchlist()]);
    } catch (error) {
      console.error('Error marking as finished:', error);
      throw error;
    }
  }, [loadFinished, loadWatchlist]);

  const isFinished = useCallback((contentId: string) => {
    return finished.some(item => item.contentId === contentId);
  }, [finished]);

  // === ACTIONS FAVORIS ===
  
  const addToFavorites = useCallback(async (content: ContentItem) => {
    try {
      await ListServiceSupabase.addToFavorites(content);
      await loadFavorites(); // Recharger pour mettre à jour l'état
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }, [loadFavorites]);

  const removeFromFavorites = useCallback(async (contentId: string) => {
    try {
      await ListServiceSupabase.removeFromFavorites(contentId);
      await loadFavorites(); // Recharger pour mettre à jour l'état
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }, [loadFavorites]);

  const isFavorite = useCallback((contentId: string) => {
    return favorites.some(item => item.contentId === contentId);
  }, [favorites]);

  // === UTILITAIRES ===
  
  const getContentStatus = useCallback((contentId: string) => {
    return {
      inWatchlist: isInWatchlist(contentId),
      isFinished: isFinished(contentId),
      isFavorite: isFavorite(contentId),
    };
  }, [isInWatchlist, isFinished, isFavorite]);

  const getStats = useCallback(() => {
    return {
      watchlistCount: watchlist.length,
      finishedCount: finished.length,
      favoritesCount: favorites.length,
    };
  }, [watchlist.length, finished.length, favorites.length]);

  // Charger les données au montage et migrer si nécessaire
  useEffect(() => {
    const initializeAndMigrate = async () => {
      // Charger les données
      await refreshAllLists();
      
      // Tentative de migration des données locales vers Supabase
      try {
        await ListServiceSupabase.migrateLocalDataToSupabase();
      } catch (error) {
        console.log('Migration skipped or failed:', error);
      }
    };
    
    initializeAndMigrate();
  }, []);

  return {
    // États des listes
    watchlist,
    finished,
    favorites,
    
    // États de chargement
    watchlistLoading,
    finishedLoading,
    favoritesLoading,
    
    // États d'erreur
    watchlistError,
    finishedError,
    favoritesError,
    
    // Actions Watchlist
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    
    // Actions Terminés
    markAsFinished,
    isFinished,
    
    // Actions Favoris
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    
    // Utilitaires
    getContentStatus,
    refreshAllLists,
    getStats,
  };
}