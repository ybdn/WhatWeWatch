import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { ContentItem } from './tmdbService';
import { ListService } from './listService';

// Types pour Supabase
interface UserContentStatus {
  id: string;
  user_id: string;
  content_id: string;
  content_type: string;
  content_data: ContentItem;
  in_watchlist: boolean;
  is_finished: boolean;
  is_favorite: boolean;
  added_at: string;
  finished_at?: string;
  updated_at: string;
}

// Interface pour les items de liste (compatible avec l'existant)
export interface ListItem {
  contentId: string;
  addedAt: Date;
  contentData: ContentItem;
}

/**
 * Service de gestion des listes avec synchronisation Supabase
 * Fallback sur AsyncStorage si Supabase n'est pas disponible
 */
export class ListServiceSupabase {
  private static isSupabaseAvailable(): boolean {
    return supabase !== null;
  }

  private static async getCurrentUser() {
    if (!this.isSupabaseAvailable()) return null;
    const { data: { user } } = await supabase!.auth.getUser();
    return user;
  }

  // === WATCHLIST ===

  static async getWatchlist(): Promise<ListItem[]> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user || !this.isSupabaseAvailable()) {
        // Fallback sur AsyncStorage
        return await ListService.getWatchlist();
      }

      const { data, error } = await supabase!
        .from('user_content_status')
        .select('*')
        .eq('user_id', user.id)
        .eq('in_watchlist', true)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        // Si la table n'existe pas encore, utiliser le fallback local
        if (error.code === 'PGRST205') {
          console.log('Table user_content_status not found, falling back to local storage.');
          return await ListService.getWatchlist();
        }
        // Pour d'autres erreurs, utiliser le fallback local
        return await ListService.getWatchlist();
      }

      // Succès Supabase - synchroniser le local en arrière-plan si nécessaire
      const supabaseList = (data || []).map((item: UserContentStatus) => ({
        contentId: item.content_id,
        addedAt: new Date(item.added_at),
        contentData: item.content_data,
      }));

      return supabaseList;
    } catch (error) {
      console.error('Error getting watchlist:', error);
      return await ListService.getWatchlist();
    }
  }

  static async addToWatchlist(content: ContentItem): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user || !this.isSupabaseAvailable()) {
        // Fallback sur AsyncStorage
        return await ListService.addToWatchlist(content);
      }

      // Vérifier si le contenu existe déjà
      const { data: existing } = await supabase!
        .from('user_content_status')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_id', content.id)
        .single();

      if (existing) {
        // Mettre à jour pour ajouter à la watchlist
        const { error } = await supabase!
          .from('user_content_status')
          .update({
            in_watchlist: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Créer un nouveau enregistrement
        const { error } = await supabase!
          .from('user_content_status')
          .insert({
            user_id: user.id,
            content_id: content.id,
            content_type: content.type || 'movie',
            content_data: content,
            in_watchlist: true,
            is_finished: false,
            is_favorite: false,
          });

        if (error) throw error;
      }

      // Synchroniser avec le stockage local en arrière-plan
      ListService.addToWatchlist(content).catch(console.error);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      // Fallback sur local storage en cas d'erreur Supabase
      throw error; // On relance l'erreur pour informer l'utilisateur
    }
  }

  static async removeFromWatchlist(contentId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user || !this.isSupabaseAvailable()) {
        return await ListService.removeFromWatchlist(contentId);
      }

      const { error } = await supabase!
        .from('user_content_status')
        .update({
          in_watchlist: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('content_id', contentId);

      if (error) throw error;

      // Synchroniser avec le stockage local
      await ListService.removeFromWatchlist(contentId);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      await ListService.removeFromWatchlist(contentId);
    }
  }

  static async isInWatchlist(contentId: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user || !this.isSupabaseAvailable()) {
        return await ListService.isInWatchlist(contentId);
      }

      const { data, error } = await supabase!
        .from('user_content_status')
        .select('in_watchlist')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .eq('in_watchlist', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Supabase error, falling back to local storage:', error);
        return await ListService.isInWatchlist(contentId);
      }

      return !!data;
    } catch (error) {
      console.error('Error checking watchlist:', error);
      return await ListService.isInWatchlist(contentId);
    }
  }

  // === FINISHED ===

  static async getFinished(): Promise<ListItem[]> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user || !this.isSupabaseAvailable()) {
        return await ListService.getFinished();
      }

      const { data, error } = await supabase!
        .from('user_content_status')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_finished', true)
        .order('finished_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        // Si la table n'existe pas encore, utiliser le fallback local
        if (error.code === 'PGRST205') {
          console.log('Table user_content_status not found for finished items, falling back to local storage.');
          return await ListService.getFinished();
        }
        // Pour d'autres erreurs, utiliser le fallback local
        return await ListService.getFinished();
      }

      return (data || []).map((item: UserContentStatus) => ({
        contentId: item.content_id,
        addedAt: new Date(item.finished_at || item.added_at),
        contentData: item.content_data,
      }));
    } catch (error) {
      console.error('Error getting finished:', error);
      return await ListService.getFinished();
    }
  }

  static async markAsFinished(content: ContentItem): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user || !this.isSupabaseAvailable()) {
        return await ListService.markAsFinished(content);
      }

      const now = new Date().toISOString();

      // Vérifier si le contenu existe déjà
      const { data: existing } = await supabase!
        .from('user_content_status')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_id', content.id)
        .single();

      if (existing) {
        // Mettre à jour pour marquer comme terminé et retirer de la watchlist
        const { error } = await supabase!
          .from('user_content_status')
          .update({
            is_finished: true,
            in_watchlist: false,
            finished_at: now,
            updated_at: now,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Créer un nouveau enregistrement
        const { error } = await supabase!
          .from('user_content_status')
          .insert({
            user_id: user.id,
            content_id: content.id,
            content_type: content.type || 'movie',
            content_data: content,
            in_watchlist: false,
            is_finished: true,
            is_favorite: false,
            finished_at: now,
          });

        if (error) throw error;
      }

      // Synchroniser avec le stockage local en arrière-plan
      ListService.markAsFinished(content).catch(console.error);
    } catch (error) {
      console.error('Error marking as finished:', error);
      throw error; // On relance l'erreur pour informer l'utilisateur
    }
  }

  static async isFinished(contentId: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user || !this.isSupabaseAvailable()) {
        return await ListService.isFinished(contentId);
      }

      const { data, error } = await supabase!
        .from('user_content_status')
        .select('is_finished')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .eq('is_finished', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase error, falling back to local storage:', error);
        return await ListService.isFinished(contentId);
      }

      return !!data;
    } catch (error) {
      console.error('Error checking finished:', error);
      return await ListService.isFinished(contentId);
    }
  }

  // === FAVORITES ===

  static async getFavorites(): Promise<ListItem[]> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user || !this.isSupabaseAvailable()) {
        return await ListService.getFavorites();
      }

      const { data, error } = await supabase!
        .from('user_content_status')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_favorite', true)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        // Si la table n'existe pas encore, utiliser le fallback local
        if (error.code === 'PGRST205') {
          console.log('Table user_content_status not found for favorites, falling back to local storage.');
          return await ListService.getFavorites();
        }
        // Pour d'autres erreurs, utiliser le fallback local
        return await ListService.getFavorites();
      }

      return (data || []).map((item: UserContentStatus) => ({
        contentId: item.content_id,
        addedAt: new Date(item.added_at),
        contentData: item.content_data,
      }));
    } catch (error) {
      console.error('Error getting favorites:', error);
      return await ListService.getFavorites();
    }
  }

  static async addToFavorites(content: ContentItem): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user || !this.isSupabaseAvailable()) {
        return await ListService.addToFavorites(content);
      }

      // Vérifier si le contenu existe déjà
      const { data: existing } = await supabase!
        .from('user_content_status')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_id', content.id)
        .single();

      if (existing) {
        const { error } = await supabase!
          .from('user_content_status')
          .update({
            is_favorite: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase!
          .from('user_content_status')
          .insert({
            user_id: user.id,
            content_id: content.id,
            content_type: content.type || 'movie',
            content_data: content,
            in_watchlist: false,
            is_finished: false,
            is_favorite: true,
          });

        if (error) throw error;
      }

      // Synchroniser avec le stockage local en arrière-plan
      ListService.addToFavorites(content).catch(console.error);
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error; // On relance l'erreur pour informer l'utilisateur
    }
  }

  static async removeFromFavorites(contentId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user || !this.isSupabaseAvailable()) {
        return await ListService.removeFromFavorites(contentId);
      }

      const { error } = await supabase!
        .from('user_content_status')
        .update({
          is_favorite: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('content_id', contentId);

      if (error) throw error;

      // Synchroniser avec le stockage local en arrière-plan
      ListService.removeFromFavorites(contentId).catch(console.error);
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error; // On relance l'erreur pour informer l'utilisateur
    }
  }

  static async isFavorite(contentId: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user || !this.isSupabaseAvailable()) {
        return await ListService.isFavorite(contentId);
      }

      const { data, error } = await supabase!
        .from('user_content_status')
        .select('is_favorite')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .eq('is_favorite', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase error, falling back to local storage:', error);
        return await ListService.isFavorite(contentId);
      }

      return !!data;
    } catch (error) {
      console.error('Error checking favorites:', error);
      return await ListService.isFavorite(contentId);
    }
  }

  // === UTILS ===

  static async getContentStatus(contentId: string): Promise<{
    inWatchlist: boolean;
    isFinished: boolean;
    isFavorite: boolean;
  }> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user || !this.isSupabaseAvailable()) {
        return await ListService.getContentStatus(contentId);
      }

      const { data, error } = await supabase!
        .from('user_content_status')
        .select('in_watchlist, is_finished, is_favorite')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase error, falling back to local storage:', error);
        return await ListService.getContentStatus(contentId);
      }

      if (!data) {
        return { inWatchlist: false, isFinished: false, isFavorite: false };
      }

      return {
        inWatchlist: data.in_watchlist,
        isFinished: data.is_finished,
        isFavorite: data.is_favorite,
      };
    } catch (error) {
      console.error('Error getting content status:', error);
      return await ListService.getContentStatus(contentId);
    }
  }

  static async getListsStats(): Promise<{
    watchlistCount: number;
    finishedCount: number;
    favoritesCount: number;
  }> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user || !this.isSupabaseAvailable()) {
        return await ListService.getListsStats();
      }

      const { data, error } = await supabase!
        .from('user_content_status')
        .select('in_watchlist, is_finished, is_favorite')
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase error, falling back to local storage:', error);
        return await ListService.getListsStats();
      }

      const watchlistCount = data?.filter(item => item.in_watchlist).length || 0;
      const finishedCount = data?.filter(item => item.is_finished).length || 0;
      const favoritesCount = data?.filter(item => item.is_favorite).length || 0;

      return { watchlistCount, finishedCount, favoritesCount };
    } catch (error) {
      console.error('Error getting lists stats:', error);
      return await ListService.getListsStats();
    }
  }

  // Migration des données locales vers Supabase
  static async migrateLocalDataToSupabase(): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user || !this.isSupabaseAvailable()) {
        console.log('Cannot migrate: user not authenticated or Supabase not available');
        return;
      }

      console.log('Starting migration from local storage to Supabase...');

      // Récupérer les données locales
      const [watchlist, finished, favorites] = await Promise.all([
        ListService.getWatchlist(),
        ListService.getFinished(),
        ListService.getFavorites(),
      ]);

      const allContent = new Map<string, any>();

      // Regrouper tous les contenus par ID
      watchlist.forEach(item => {
        allContent.set(item.contentId, {
          ...allContent.get(item.contentId),
          content_data: item.contentData,
          in_watchlist: true,
          watchlist_added_at: item.addedAt,
        });
      });

      finished.forEach(item => {
        allContent.set(item.contentId, {
          ...allContent.get(item.contentId),
          content_data: item.contentData,
          is_finished: true,
          finished_at: item.addedAt,
        });
      });

      favorites.forEach(item => {
        allContent.set(item.contentId, {
          ...allContent.get(item.contentId),
          content_data: item.contentData,
          is_favorite: true,
          favorite_added_at: item.addedAt,
        });
      });

      // Insérer les données dans Supabase
      for (const [contentId, data] of allContent) {
        const insertData = {
          user_id: user.id,
          content_id: contentId,
          content_type: data.content_data?.type || 'movie',
          content_data: data.content_data,
          in_watchlist: data.in_watchlist || false,
          is_finished: data.is_finished || false,
          is_favorite: data.is_favorite || false,
          added_at: (data.watchlist_added_at || data.finished_at || data.favorite_added_at).toISOString(),
          finished_at: data.finished_at?.toISOString(),
        };

        const { error } = await supabase!
          .from('user_content_status')
          .upsert(insertData, {
            onConflict: 'user_id,content_id',
          });

        if (error) {
          console.error('Error migrating content:', contentId, error);
        }
      }

      console.log(`Migration completed: ${allContent.size} items migrated`);
    } catch (error) {
      console.error('Error during migration:', error);
    }
  }
}

export default ListServiceSupabase;