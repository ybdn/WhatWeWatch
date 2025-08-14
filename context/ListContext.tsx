import React, { createContext, useContext, ReactNode } from 'react';
import { useListManager } from '../hooks/useListManager';
import { ContentItem } from '../lib/tmdbService';

// Types pour le contexte
interface ListContextType {
  // États des listes
  watchlist: any[];
  finished: any[];
  favorites: any[];
  
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

// Création du contexte
const ListContext = createContext<ListContextType | null>(null);

// Provider du contexte
interface ListProviderProps {
  children: ReactNode;
}

export function ListProvider({ children }: ListProviderProps) {
  const listManager = useListManager();

  return (
    <ListContext.Provider value={listManager}>
      {children}
    </ListContext.Provider>
  );
}

// Hook pour utiliser le contexte
export function useList() {
  const context = useContext(ListContext);
  
  if (!context) {
    throw new Error('useList must be used within a ListProvider');
  }
  
  return context;
}

export default ListProvider;