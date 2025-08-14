import { useState, useEffect, useCallback } from 'react';
import { tmdbApi, ContentItem } from '../lib/tmdbService';

interface UseMovieDataReturn {
  // Watchlist data (trending mixed content as example)
  watchlist: ContentItem[];
  watchlistLoading: boolean;
  watchlistError: string | null;
  
  // Recently finished (popular content as example)
  recentlyFinished: ContentItem[];
  recentlyFinishedLoading: boolean;
  recentlyFinishedError: string | null;
  
  // Trending content for explore
  trending: ContentItem[];
  trendingLoading: boolean;
  trendingError: string | null;
  
  // Top rated content
  topRated: ContentItem[];
  topRatedLoading: boolean;
  topRatedError: string | null;
  
  // Search functionality
  searchResults: ContentItem[];
  searchLoading: boolean;
  searchError: string | null;
  
  // Actions
  search: (query: string) => Promise<void>;
  refreshWatchlist: () => Promise<void>;
  refreshRecentlyFinished: () => Promise<void>;
  refreshTrending: () => Promise<void>;
  refreshTopRated: () => Promise<void>;
}

export function useMovieData(): UseMovieDataReturn {
  // Watchlist state (using trending as example watchlist)
  const [watchlist, setWatchlist] = useState<ContentItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  
  // Recently finished state (using popular content as example)
  const [recentlyFinished, setRecentlyFinished] = useState<ContentItem[]>([]);
  const [recentlyFinishedLoading, setRecentlyFinishedLoading] = useState(false);
  const [recentlyFinishedError, setRecentlyFinishedError] = useState<string | null>(null);
  
  // Trending state
  const [trending, setTrending] = useState<ContentItem[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState<string | null>(null);
  
  // Top rated state
  const [topRated, setTopRated] = useState<ContentItem[]>([]);
  const [topRatedLoading, setTopRatedLoading] = useState(false);
  const [topRatedError, setTopRatedError] = useState<string | null>(null);
  
  // Search state
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Fetch watchlist (trending mixed content)
  const refreshWatchlist = useCallback(async () => {
    setWatchlistLoading(true);
    setWatchlistError(null);
    
    try {
      const data = await tmdbApi.getTrendingMixed();
      setWatchlist(data.slice(0, 6)); // Limit to 6 items for watchlist
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de chargement de la watchlist';
      setWatchlistError(errorMessage);
      console.error('Error fetching watchlist:', error);
    } finally {
      setWatchlistLoading(false);
    }
  }, []);

  // Fetch recently finished (popular movies + shows)
  const refreshRecentlyFinished = useCallback(async () => {
    setRecentlyFinishedLoading(true);
    setRecentlyFinishedError(null);
    
    try {
      const [movies, shows] = await Promise.all([
        tmdbApi.getPopularMovies(),
        tmdbApi.getPopularTVShows(),
      ]);
      
      // Mix movies and shows, limit to 6 items
      const mixed = [...movies.slice(0, 3), ...shows.slice(0, 3)];
      setRecentlyFinished(mixed.sort((a, b) => b.rating - a.rating));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de chargement des contenus terminés';
      setRecentlyFinishedError(errorMessage);
      console.error('Error fetching recently finished:', error);
    } finally {
      setRecentlyFinishedLoading(false);
    }
  }, []);

  // Fetch trending content
  const refreshTrending = useCallback(async () => {
    setTrendingLoading(true);
    setTrendingError(null);
    
    try {
      const data = await tmdbApi.getTrendingMixed();
      setTrending(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de chargement des tendances';
      setTrendingError(errorMessage);
      console.error('Error fetching trending:', error);
    } finally {
      setTrendingLoading(false);
    }
  }, []);

  // Fetch top rated content
  const refreshTopRated = useCallback(async () => {
    setTopRatedLoading(true);
    setTopRatedError(null);
    
    try {
      const [movies, shows] = await Promise.all([
        tmdbApi.getTopRatedMovies(),
        tmdbApi.getTopRatedTVShows(),
      ]);
      
      // Mix top rated movies and shows
      const mixed = [...movies.slice(0, 5), ...shows.slice(0, 5)];
      setTopRated(mixed.sort((a, b) => b.rating - a.rating));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de chargement des mieux notés';
      setTopRatedError(errorMessage);
      console.error('Error fetching top rated:', error);
    } finally {
      setTopRatedLoading(false);
    }
  }, []);

  // Search function
  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    setSearchError(null);
    
    try {
      const results = await tmdbApi.searchMulti(query);
      setSearchResults(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de recherche';
      setSearchError(errorMessage);
      console.error('Error searching:', error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Load initial data on mount
  useEffect(() => {
    refreshWatchlist();
    refreshRecentlyFinished();
    refreshTrending();
    refreshTopRated();
  }, [refreshWatchlist, refreshRecentlyFinished, refreshTrending, refreshTopRated]);

  return {
    // Watchlist
    watchlist,
    watchlistLoading,
    watchlistError,
    
    // Recently finished
    recentlyFinished,
    recentlyFinishedLoading,
    recentlyFinishedError,
    
    // Trending
    trending,
    trendingLoading,
    trendingError,
    
    // Top rated
    topRated,
    topRatedLoading,
    topRatedError,
    
    // Search
    searchResults,
    searchLoading,
    searchError,
    
    // Actions
    search,
    refreshWatchlist,
    refreshRecentlyFinished,
    refreshTrending,
    refreshTopRated,
  };
}