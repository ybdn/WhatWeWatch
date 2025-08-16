import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContentItem } from './tmdbService';

// Types pour le syst�me de listes
export interface ListItem {
  contentId: string;
  addedAt: Date;
  contentData: ContentItem;
}

export interface UserList {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  items: ListItem[];
  isDefault: boolean; // Pour watchlist, finished, etc.
}

export enum DefaultListType {
  WATCHLIST = 'watchlist',
  FINISHED = 'finished',
  FAVORITES = 'favorites',
  TO_REWATCH = 'to_rewatch',
}

// Cl�s de stockage
const STORAGE_KEYS = {
  LISTS: 'user_lists',
  WATCHLIST: 'user_watchlist',
  FINISHED: 'user_finished',
  FAVORITES: 'user_favorites',
  TO_REWATCH: 'user_to_rewatch',
} as const;

// Service de gestion des listes
export class ListService {
  // === LISTES PAR D�FAUT ===
  
  // R�cup�rer la watchlist
  static async getWatchlist(): Promise<ListItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WATCHLIST);
      if (!data) return [];
      
      const items = JSON.parse(data);
      return items.map((item: any) => ({
        ...item,
        addedAt: new Date(item.addedAt),
      }));
    } catch (error) {
      console.error('Error getting watchlist:', error);
      return [];
    }
  }

  // Ajouter � la watchlist
  static async addToWatchlist(content: ContentItem): Promise<void> {
    try {
      const watchlist = await this.getWatchlist();
      
      // V�rifier si d�j� pr�sent
      if (watchlist.some(item => item.contentId === content.id)) {
        return; // D�j� dans la liste
      }

      const newItem: ListItem = {
        contentId: content.id,
        addedAt: new Date(),
        contentData: content,
      };

      const updatedWatchlist = [newItem, ...watchlist];
      await AsyncStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(updatedWatchlist));
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }

  // Retirer de la watchlist
  static async removeFromWatchlist(contentId: string): Promise<void> {
    try {
      const watchlist = await this.getWatchlist();
      const updatedWatchlist = watchlist.filter(item => item.contentId !== contentId);
      await AsyncStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(updatedWatchlist));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }

  // V�rifier si un contenu est dans la watchlist
  static async isInWatchlist(contentId: string): Promise<boolean> {
    try {
      const watchlist = await this.getWatchlist();
      return watchlist.some(item => item.contentId === contentId);
    } catch (error) {
      console.error('Error checking watchlist:', error);
      return false;
    }
  }

  // === CONTENUS TERMIN�S ===
  
  // R�cup�rer les contenus termin�s
  static async getFinished(): Promise<ListItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FINISHED);
      if (!data) return [];
      
      const items = JSON.parse(data);
      return items.map((item: any) => ({
        ...item,
        addedAt: new Date(item.addedAt),
      }));
    } catch (error) {
      console.error('Error getting finished:', error);
      return [];
    }
  }

  // Marquer comme termin� (et retirer de la watchlist)
  static async markAsFinished(content: ContentItem): Promise<void> {
    try {
      // Ajouter aux termin�s
      const finished = await this.getFinished();
      
      // V�rifier si d�j� pr�sent
      if (finished.some(item => item.contentId === content.id)) {
        return; // D�j� termin�
      }

      const newItem: ListItem = {
        contentId: content.id,
        addedAt: new Date(),
        contentData: content,
      };

      const updatedFinished = [newItem, ...finished];
      await AsyncStorage.setItem(STORAGE_KEYS.FINISHED, JSON.stringify(updatedFinished));

      // Retirer de la watchlist si pr�sent
      await this.removeFromWatchlist(content.id);
    } catch (error) {
      console.error('Error marking as finished:', error);
      throw error;
    }
  }

  // V�rifier si un contenu est termin�
  static async isFinished(contentId: string): Promise<boolean> {
    try {
      const finished = await this.getFinished();
      return finished.some(item => item.contentId === contentId);
    } catch (error) {
      console.error('Error checking finished:', error);
      return false;
    }
  }

  // === FAVORIS ===
  
  // R�cup�rer les favoris
  static async getFavorites(): Promise<ListItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (!data) return [];
      
      const items = JSON.parse(data);
      return items.map((item: any) => ({
        ...item,
        addedAt: new Date(item.addedAt),
      }));
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  // Ajouter aux favoris
  static async addToFavorites(content: ContentItem): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      
      // V�rifier si d�j� pr�sent
      if (favorites.some(item => item.contentId === content.id)) {
        return; // D�j� dans les favoris
      }

      const newItem: ListItem = {
        contentId: content.id,
        addedAt: new Date(),
        contentData: content,
      };

      const updatedFavorites = [newItem, ...favorites];
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  // Retirer des favoris
  static async removeFromFavorites(contentId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const updatedFavorites = favorites.filter(item => item.contentId !== contentId);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  // V�rifier si un contenu est dans les favoris
  static async isFavorite(contentId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some(item => item.contentId === contentId);
    } catch (error) {
      console.error('Error checking favorites:', error);
      return false;
    }
  }

  // === UTILITAIRES ===
  
  // Obtenir le statut complet d'un contenu
  static async getContentStatus(contentId: string): Promise<{
    inWatchlist: boolean;
    isFinished: boolean;
    isFavorite: boolean;
  }> {
    try {
      const [inWatchlist, isFinished, isFavorite] = await Promise.all([
        this.isInWatchlist(contentId),
        this.isFinished(contentId),
        this.isFavorite(contentId),
      ]);

      return { inWatchlist, isFinished, isFavorite };
    } catch (error) {
      console.error('Error getting content status:', error);
      return { inWatchlist: false, isFinished: false, isFavorite: false };
    }
  }

  // Nettoyer le stockage (pour debug/reset)
  static async clearAllLists(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.WATCHLIST),
        AsyncStorage.removeItem(STORAGE_KEYS.FINISHED),
        AsyncStorage.removeItem(STORAGE_KEYS.FAVORITES),
        AsyncStorage.removeItem(STORAGE_KEYS.TO_REWATCH),
      ]);
    } catch (error) {
      console.error('Error clearing lists:', error);
      throw error;
    }
  }

  // Obtenir les statistiques des listes
  static async getListsStats(): Promise<{
    watchlistCount: number;
    finishedCount: number;
    favoritesCount: number;
  }> {
    try {
      const [watchlist, finished, favorites] = await Promise.all([
        this.getWatchlist(),
        this.getFinished(),
        this.getFavorites(),
      ]);

      return {
        watchlistCount: watchlist.length,
        finishedCount: finished.length,
        favoritesCount: favorites.length,
      };
    } catch (error) {
      console.error('Error getting lists stats:', error);
      return { watchlistCount: 0, finishedCount: 0, favoritesCount: 0 };
    }
  }
}

export default ListService;