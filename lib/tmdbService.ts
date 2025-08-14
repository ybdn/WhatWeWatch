// TMDB API Service for The Movie Database integration

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Get API key from environment variables
const getApiKey = (): string => {
  const apiKey = process.env.EXPO_PUBLIC_TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB API key not configured. Please set EXPO_PUBLIC_TMDB_API_KEY in your environment.');
  }
  return apiKey;
};

// TMDB API Types
export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  runtime: number | null;
  genres: TMDBGenre[];
  poster_path: string | null;
  backdrop_path: string | null;
  original_language: string;
  popularity: number;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  episode_run_time: number[];
  number_of_episodes: number;
  number_of_seasons: number;
  genres: TMDBGenre[];
  poster_path: string | null;
  backdrop_path: string | null;
  original_language: string;
  popularity: number;
}

export interface TMDBCredits {
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export interface TMDBSearchResults<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// Our app's unified content interface
export interface ContentItem {
  id: string;
  title: string;
  type: 'Film' | 'Série';
  year: number;
  rating: number;
  synopsis: string;
  overview?: string; // Alternative to synopsis for compatibility
  director?: string;
  duration: string;
  genres: string[];
  posterUrl?: string;
  backdropUrl?: string;
  originalLanguage: string;
  popularity: number;
  color: string; // Generated color for cards
}

// Helper functions
const generateColorFromId = (id: number): string => {
  const colors = [
    '#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51',
    '#8ecae6', '#ffb703', '#fb8500', '#5d8bff', '#ff8b5d',
    '#6b5dff', '#1b8c6e', '#c255c2', '#6a4c93', '#5f0f40',
    '#3a0ca3', '#0a9396', '#9b2226'
  ];
  return colors[id % colors.length];
};

const formatDuration = (runtime: number | null, episodeRuntime?: number[]): string => {
  if (runtime) {
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  }
  if (episodeRuntime && episodeRuntime.length > 0) {
    const avgRuntime = episodeRuntime[0];
    return `~${avgRuntime}min/épisode`;
  }
  return 'Durée inconnue';
};

const getImageUrl = (path: string | null, size: 'w300' | 'w500' | 'original' = 'w500'): string | undefined => {
  if (!path) {
    return undefined;
  }
  
  // Clean the path to remove any leading slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Validate the path format (should start with / and have an extension)
  if (!cleanPath.includes('.')) {
    console.warn(`Invalid image path format: ${path}`);
    return undefined;
  }
  
  const url = `${TMDB_IMAGE_BASE_URL}/${size}${cleanPath}`;
  
  // Additional validation of the constructed URL
  try {
    new URL(url);
    return url;
  } catch (error) {
    console.warn(`Invalid image URL constructed: ${url}`, error);
    return undefined;
  }
};

const getDirectorFromCredits = (credits: TMDBCredits): string | undefined => {
  const director = credits.crew.find(member => 
    member.job === 'Director' || member.job === 'Réalisateur'
  );
  return director?.name;
};

// API request helper
const tmdbRequest = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  const apiKey = getApiKey();
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  
  // Add API key and default params
  url.searchParams.append('api_key', apiKey);
  url.searchParams.append('language', 'fr-FR'); // French language
  
  // Add custom params
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('TMDB API request failed:', error);
    throw error;
  }
};

// Convert TMDB data to our ContentItem format
const convertMovieToContentItem = async (movie: TMDBMovie): Promise<ContentItem> => {
  try {
    // Get credits for director info
    const credits = await tmdbRequest<TMDBCredits>(`/movie/${movie.id}/credits`);
    const result = {
      id: movie.id.toString(),
      title: movie.title,
      type: 'Film' as const,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : new Date().getFullYear(),
      rating: Math.round((movie.vote_average || 0) * 10) / 10,
      synopsis: movie.overview || 'Aucun synopsis disponible.',
      director: getDirectorFromCredits(credits),
      duration: formatDuration(movie.runtime),
      genres: movie.genres ? movie.genres.map(g => g.name) : [],
      posterUrl: getImageUrl(movie.poster_path),
      backdropUrl: getImageUrl(movie.backdrop_path, 'original'),
      originalLanguage: movie.original_language,
      popularity: movie.popularity || 0,
      color: generateColorFromId(movie.id),
    };
    
    return result;
  } catch (error) {
    console.error(`Error converting movie ${movie.id}:`, error);
    // Return basic data without credits if credits fetch fails
    return {
      id: movie.id.toString(),
      title: movie.title,
      type: 'Film',
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : new Date().getFullYear(),
      rating: Math.round((movie.vote_average || 0) * 10) / 10,
      synopsis: movie.overview || 'Aucun synopsis disponible.',
      duration: formatDuration(movie.runtime),
      genres: movie.genres ? movie.genres.map(g => g.name) : [],
      posterUrl: getImageUrl(movie.poster_path),
      backdropUrl: getImageUrl(movie.backdrop_path, 'original'),
      originalLanguage: movie.original_language,
      popularity: movie.popularity || 0,
      color: generateColorFromId(movie.id),
    };
  }
};

const convertTVShowToContentItem = async (tvShow: TMDBTVShow): Promise<ContentItem> => {
  try {
    // Get credits for creator/director info
    const credits = await tmdbRequest<TMDBCredits>(`/tv/${tvShow.id}/credits`);
    
    return {
      id: tvShow.id.toString(),
      title: tvShow.name,
      type: 'Série',
      year: tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : new Date().getFullYear(),
      rating: Math.round((tvShow.vote_average || 0) * 10) / 10,
      synopsis: tvShow.overview || 'Aucun synopsis disponible.',
      director: getDirectorFromCredits(credits),
      duration: `${tvShow.number_of_seasons || 1} saison${(tvShow.number_of_seasons || 1) > 1 ? 's' : ''}, ${tvShow.number_of_episodes || 0} épisodes`,
      genres: tvShow.genres ? tvShow.genres.map(g => g.name) : [],
      posterUrl: getImageUrl(tvShow.poster_path),
      backdropUrl: getImageUrl(tvShow.backdrop_path, 'original'),
      originalLanguage: tvShow.original_language,
      popularity: tvShow.popularity || 0,
      color: generateColorFromId(tvShow.id),
    };
  } catch (error) {
    console.error(`Error converting TV show ${tvShow.id}:`, error);
    // Return basic data without credits if credits fetch fails
    return {
      id: tvShow.id.toString(),
      title: tvShow.name,
      type: 'Série',
      year: tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : new Date().getFullYear(),
      rating: Math.round((tvShow.vote_average || 0) * 10) / 10,
      synopsis: tvShow.overview || 'Aucun synopsis disponible.',
      duration: `${tvShow.number_of_seasons || 1} saison${(tvShow.number_of_seasons || 1) > 1 ? 's' : ''}, ${tvShow.number_of_episodes || 0} épisodes`,
      genres: tvShow.genres ? tvShow.genres.map(g => g.name) : [],
      posterUrl: getImageUrl(tvShow.poster_path),
      backdropUrl: getImageUrl(tvShow.backdrop_path, 'original'),
      originalLanguage: tvShow.original_language,
      popularity: tvShow.popularity || 0,
      color: generateColorFromId(tvShow.id),
    };
  }
};

// Public API functions
export const tmdbApi = {
  // Get trending movies
  getTrendingMovies: async (timeWindow: 'day' | 'week' = 'week'): Promise<ContentItem[]> => {
    const data = await tmdbRequest<TMDBSearchResults<TMDBMovie>>(`/trending/movie/${timeWindow}`);
    const movies = await Promise.allSettled(
      data.results.slice(0, 10).map(movie => convertMovieToContentItem(movie))
    );
    return movies
      .filter((result): result is PromiseFulfilledResult<ContentItem> => result.status === 'fulfilled')
      .map(result => result.value);
  },

  // Get trending TV shows
  getTrendingTVShows: async (timeWindow: 'day' | 'week' = 'week'): Promise<ContentItem[]> => {
    const data = await tmdbRequest<TMDBSearchResults<TMDBTVShow>>(`/trending/tv/${timeWindow}`);
    const shows = await Promise.allSettled(
      data.results.slice(0, 10).map(show => convertTVShowToContentItem(show))
    );
    return shows
      .filter((result): result is PromiseFulfilledResult<ContentItem> => result.status === 'fulfilled')
      .map(result => result.value);
  },

  // Get popular movies
  getPopularMovies: async (): Promise<ContentItem[]> => {
    const data = await tmdbRequest<TMDBSearchResults<TMDBMovie>>('/movie/popular');
    const movies = await Promise.allSettled(
      data.results.slice(0, 10).map(movie => convertMovieToContentItem(movie))
    );
    return movies
      .filter((result): result is PromiseFulfilledResult<ContentItem> => result.status === 'fulfilled')
      .map(result => result.value);
  },

  // Get popular TV shows
  getPopularTVShows: async (): Promise<ContentItem[]> => {
    const data = await tmdbRequest<TMDBSearchResults<TMDBTVShow>>('/tv/popular');
    const shows = await Promise.allSettled(
      data.results.slice(0, 10).map(show => convertTVShowToContentItem(show))
    );
    return shows
      .filter((result): result is PromiseFulfilledResult<ContentItem> => result.status === 'fulfilled')
      .map(result => result.value);
  },

  // Get top rated movies
  getTopRatedMovies: async (): Promise<ContentItem[]> => {
    const data = await tmdbRequest<TMDBSearchResults<TMDBMovie>>('/movie/top_rated');
    const movies = await Promise.allSettled(
      data.results.slice(0, 10).map(movie => convertMovieToContentItem(movie))
    );
    return movies
      .filter((result): result is PromiseFulfilledResult<ContentItem> => result.status === 'fulfilled')
      .map(result => result.value);
  },

  // Get top rated TV shows
  getTopRatedTVShows: async (): Promise<ContentItem[]> => {
    const data = await tmdbRequest<TMDBSearchResults<TMDBTVShow>>('/tv/top_rated');
    const shows = await Promise.allSettled(
      data.results.slice(0, 10).map(show => convertTVShowToContentItem(show))
    );
    return shows
      .filter((result): result is PromiseFulfilledResult<ContentItem> => result.status === 'fulfilled')
      .map(result => result.value);
  },

  // Search for movies and TV shows
  searchMulti: async (query: string): Promise<ContentItem[]> => {
    if (query.length < 2) return [];
    
    try {
      // Search movies and TV shows separately to avoid media_type issues
      const [movieResults, tvResults] = await Promise.all([
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/search/movie', {
          query: query.trim(),
        }),
        tmdbRequest<TMDBSearchResults<TMDBTVShow>>('/search/tv', {
          query: query.trim(),
        }),
      ]);
      
      // Convert results
      const movieItems = await Promise.allSettled(
        movieResults.results.slice(0, 10).map(movie => convertMovieToContentItem(movie))
      );
      
      const tvItems = await Promise.allSettled(
        tvResults.results.slice(0, 10).map(tv => convertTVShowToContentItem(tv))
      );
      
      const successfulMovies = movieItems
        .filter((result): result is PromiseFulfilledResult<ContentItem> => result.status === 'fulfilled')
        .map(result => result.value);
        
      const successfulTVShows = tvItems
        .filter((result): result is PromiseFulfilledResult<ContentItem> => result.status === 'fulfilled')
        .map(result => result.value);
      
      // Combine and sort by popularity
      const allItems = [...successfulMovies, ...successfulTVShows];
      return allItems.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 20);
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },

  // Get mixed trending content (movies + TV shows)
  getTrendingMixed: async (): Promise<ContentItem[]> => {
    const [movies, tvShows] = await Promise.all([
      tmdbApi.getTrendingMovies(),
      tmdbApi.getTrendingTVShows(),
    ]);
    
    // Mix and sort by popularity
    const mixed = [...movies.slice(0, 5), ...tvShows.slice(0, 5)];
    return mixed.sort((a, b) => b.popularity - a.popularity);
  },

  // Get content by ID (for detailed view)
  getMovieById: async (id: string): Promise<ContentItem> => {
    const movie = await tmdbRequest<TMDBMovie>(`/movie/${id}`);
    return convertMovieToContentItem(movie);
  },

  getTVShowById: async (id: string): Promise<ContentItem> => {
    const tvShow = await tmdbRequest<TMDBTVShow>(`/tv/${id}`);
    return convertTVShowToContentItem(tvShow);
  },

  // Thematic collections for explore page
  
  // Nouveautés - Recent releases (movies and TV shows from last 6 months)
  getNewReleases: async (): Promise<ContentItem[]> => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    const currentYear = now.getFullYear();
    const sixMonthsAgoDate = sixMonthsAgo.toISOString().split('T')[0];
    const todayDate = now.toISOString().split('T')[0];
    
    try {
      const [movieData, tvData, popularMovies] = await Promise.allSettled([
        // Recent movies (last 6 months)
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/discover/movie', {
          'primary_release_date.gte': sixMonthsAgoDate,
          'primary_release_date.lte': todayDate,
          'sort_by': 'popularity.desc',
          'vote_count.gte': '50',
        }),
        // Recent TV shows (last 6 months)
        tmdbRequest<TMDBSearchResults<TMDBTVShow>>('/discover/tv', {
          'first_air_date.gte': sixMonthsAgoDate,
          'first_air_date.lte': todayDate,
          'sort_by': 'popularity.desc',
          'vote_count.gte': '20',
        }),
        // Popular movies from current year as backup
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/discover/movie', {
          'primary_release_year': currentYear.toString(),
          'sort_by': 'popularity.desc',
          'vote_count.gte': '100',
        }),
      ]);
      
      const allResults: ContentItem[] = [];
      
      // Add recent movies
      if (movieData.status === 'fulfilled') {
        const movies = await Promise.allSettled(
          movieData.value.results.slice(0, 8).map(movie => convertMovieToContentItem(movie))
        );
        movies.forEach(result => {
          if (result.status === 'fulfilled') allResults.push(result.value);
        });
      }
      
      // Add recent TV shows
      if (tvData.status === 'fulfilled') {
        const shows = await Promise.allSettled(
          tvData.value.results.slice(0, 6).map(show => convertTVShowToContentItem(show))
        );
        shows.forEach(result => {
          if (result.status === 'fulfilled') allResults.push(result.value);
        });
      }
      
      // Add popular movies from current year if we don't have enough content
      if (allResults.length < 10 && popularMovies.status === 'fulfilled') {
        const movies = await Promise.allSettled(
          popularMovies.value.results.slice(0, 6).map(movie => convertMovieToContentItem(movie))
        );
        movies.forEach(result => {
          if (result.status === 'fulfilled' && !allResults.find(item => item.id === result.value.id)) {
            allResults.push(result.value);
          }
        });
      }
      
      // Sort by popularity and return top 25
      return allResults
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 25);
        
    } catch (error) {
      console.error('Error fetching new releases:', error);
      return [];
    }
  },

  // Acclamés par la critique - Award winners and high-rated content
  getCriticsChoice: async (): Promise<ContentItem[]> => {
    try {
      const [topMovies, topTVShows, awardMovies, criticallyAcclaimed, recentCritical] = await Promise.allSettled([
        // Top rated movies with substantial vote count
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/movie/top_rated', {
          'vote_count.gte': '2000',
        }),
        // Top rated TV shows with substantial vote count
        tmdbRequest<TMDBSearchResults<TMDBTVShow>>('/tv/top_rated', {
          'vote_count.gte': '1000',
        }),
        // Discover highly rated movies (8.0+) with many votes
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/discover/movie', {
          'vote_average.gte': '8.0',
          'vote_count.gte': '1500',
          'sort_by': 'vote_average.desc',
        }),
        // Discover highly rated TV shows (8.5+) with many votes
        tmdbRequest<TMDBSearchResults<TMDBTVShow>>('/discover/tv', {
          'vote_average.gte': '8.5',
          'vote_count.gte': '500',
          'sort_by': 'vote_average.desc',
        }),
        // Recent critically acclaimed content (last 3 years)
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/discover/movie', {
          'primary_release_date.gte': `${new Date().getFullYear() - 3}-01-01`,
          'vote_average.gte': '7.5',
          'vote_count.gte': '1000',
          'sort_by': 'vote_average.desc',
        }),
      ]);
      
      const allResults: ContentItem[] = [];
      
      // Add top rated movies
      if (topMovies.status === 'fulfilled') {
        const movies = await Promise.allSettled(
          topMovies.value.results.slice(0, 6).map(movie => convertMovieToContentItem(movie))
        );
        movies.forEach(result => {
          if (result.status === 'fulfilled') allResults.push(result.value);
        });
      }
      
      // Add top rated TV shows
      if (topTVShows.status === 'fulfilled') {
        const shows = await Promise.allSettled(
          topTVShows.value.results.slice(0, 6).map(show => convertTVShowToContentItem(show))
        );
        shows.forEach(result => {
          if (result.status === 'fulfilled') allResults.push(result.value);
        });
      }
      
      // Add award-worthy movies
      if (awardMovies.status === 'fulfilled') {
        const movies = await Promise.allSettled(
          awardMovies.value.results.slice(0, 4).map(movie => convertMovieToContentItem(movie))
        );
        movies.forEach(result => {
          if (result.status === 'fulfilled' && !allResults.find(item => item.id === result.value.id)) {
            allResults.push(result.value);
          }
        });
      }
      
      // Add critically acclaimed TV shows
      if (criticallyAcclaimed.status === 'fulfilled') {
        const shows = await Promise.allSettled(
          criticallyAcclaimed.value.results.slice(0, 4).map(show => convertTVShowToContentItem(show))
        );
        shows.forEach(result => {
          if (result.status === 'fulfilled' && !allResults.find(item => item.id === result.value.id)) {
            allResults.push(result.value);
          }
        });
      }
      
      // Add recent critical successes
      if (recentCritical.status === 'fulfilled') {
        const movies = await Promise.allSettled(
          recentCritical.value.results.slice(0, 4).map(movie => convertMovieToContentItem(movie))
        );
        movies.forEach(result => {
          if (result.status === 'fulfilled' && !allResults.find(item => item.id === result.value.id)) {
            allResults.push(result.value);
          }
        });
      }
      
      // Sort by rating (highest first) and return top 25
      return allResults
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 25);
        
    } catch (error) {
      console.error('Error fetching critics choice content:', error);
      return [];
    }
  },

  // Célébrons les fiertés - LGBTQ+ and diversity content
  getPrideContent: async (): Promise<ContentItem[]> => {
    try {
      console.log('Fetching Pride content...');
      
      // Search for LGBTQ+ themed content using various keywords and approaches
      const searches = await Promise.allSettled([
        // Basic LGBTQ+ searches with lower thresholds
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/search/movie', {
          query: 'lgbt',
          'vote_average.gte': '5.0',
        }),
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/search/movie', {
          query: 'gay',
          'vote_average.gte': '5.0',
        }),
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/search/movie', {
          query: 'lesbian',
          'vote_average.gte': '5.0',
        }),
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/search/movie', {
          query: 'queer',
          'vote_average.gte': '5.0',
        }),
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/search/movie', {
          query: 'pride',
          'vote_average.gte': '5.0',
        }),
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/search/movie', {
          query: 'transgender',
          'vote_average.gte': '5.0',
        }),
        // TV Show searches
        tmdbRequest<TMDBSearchResults<TMDBTVShow>>('/search/tv', {
          query: 'lgbt',
          'vote_average.gte': '5.0',
        }),
        tmdbRequest<TMDBSearchResults<TMDBTVShow>>('/search/tv', {
          query: 'gay',
          'vote_average.gte': '5.0',
        }),
        tmdbRequest<TMDBSearchResults<TMDBTVShow>>('/search/tv', {
          query: 'lesbian',
          'vote_average.gte': '5.0',
        }),
        tmdbRequest<TMDBSearchResults<TMDBTVShow>>('/search/tv', {
          query: 'queer',
          'vote_average.gte': '5.0',
        }),
        // Diversity searches
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/search/movie', {
          query: 'diversity',
          'vote_average.gte': '5.5',
        }),
        tmdbRequest<TMDBSearchResults<TMDBTVShow>>('/search/tv', {
          query: 'diversity',
          'vote_average.gte': '5.5',
        }),
        // Romance genre as backup with broader criteria
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/discover/movie', {
          'with_genres': '10749', // Romance genre
          'vote_average.gte': '6.5',
          'vote_count.gte': '50',
          'sort_by': 'popularity.desc',
        }),
        tmdbRequest<TMDBSearchResults<TMDBTVShow>>('/discover/tv', {
          'with_genres': '10749', // Romance genre
          'vote_average.gte': '6.5',
          'vote_count.gte': '20',
          'sort_by': 'popularity.desc',
        }),
        // Drama genre with diversity keywords
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/search/movie', {
          query: 'coming out',
          'vote_average.gte': '5.5',
        }),
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/search/movie', {
          query: 'identity',
          'vote_average.gte': '6.0',
        }),
      ]);
      
      const allMovieResults: TMDBMovie[] = [];
      const allTVResults: TMDBTVShow[] = [];
      
      // Collect all results with logging
      searches.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const data = result.value;
          console.log(`Search ${index} successful: ${data.results.length} results`);
          
          // Determine if it's movie or TV results based on the structure
          if (data.results.length > 0) {
            const firstResult = data.results[0];
            // Check if it's a movie (has 'title') or TV show (has 'name')
            if ('title' in firstResult) {
              allMovieResults.push(...(data.results as TMDBMovie[]).slice(0, 8));
            } else if ('name' in firstResult) {
              allTVResults.push(...(data.results as TMDBTVShow[]).slice(0, 6));
            }
          }
        } else {
          console.log(`Search ${index} failed:`, result.reason);
        }
      });
      
      console.log(`Total movie results: ${allMovieResults.length}`);
      console.log(`Total TV results: ${allTVResults.length}`);
      
      // Remove duplicates
      const uniqueMovies = allMovieResults.filter((movie, index, self) => 
        index === self.findIndex(m => m.id === movie.id)
      );
      const uniqueTV = allTVResults.filter((show, index, self) => 
        index === self.findIndex(s => s.id === show.id)
      );
      
      console.log(`Unique movies: ${uniqueMovies.length}`);
      console.log(`Unique TV shows: ${uniqueTV.length}`);
      
      const allResults: ContentItem[] = [];
      
      // Convert movies with better error handling
      const movieItems = await Promise.allSettled(
        uniqueMovies.slice(0, 20).map(movie => convertMovieToContentItem(movie))
      );
      
      let successfulMovies = 0;
      movieItems.forEach(result => {
        if (result.status === 'fulfilled') {
          allResults.push(result.value);
          successfulMovies++;
        } else {
          console.log('Movie conversion failed:', result.reason);
        }
      });
      
      // Convert TV shows with better error handling
      const tvItems = await Promise.allSettled(
        uniqueTV.slice(0, 15).map(show => convertTVShowToContentItem(show))
      );
      
      let successfulTV = 0;
      tvItems.forEach(result => {
        if (result.status === 'fulfilled') {
          allResults.push(result.value);
          successfulTV++;
        } else {
          console.log('TV conversion failed:', result.reason);
        }
      });
      
      console.log(`Successfully converted: ${successfulMovies} movies, ${successfulTV} TV shows`);
      console.log(`Total Pride content items: ${allResults.length}`);
      
      // If we still have too few results, add some popular drama content as fallback
      if (allResults.length < 10) {
        console.log('Adding fallback drama content...');
        try {
          const fallbackDrama = await tmdbRequest<TMDBSearchResults<TMDBMovie>>('/discover/movie', {
            'with_genres': '18', // Drama genre
            'vote_average.gte': '7.0',
            'vote_count.gte': '500',
            'sort_by': 'popularity.desc',
          });
          
          const dramaItems = await Promise.allSettled(
            fallbackDrama.results.slice(0, 8).map(movie => convertMovieToContentItem(movie))
          );
          
          dramaItems.forEach(result => {
            if (result.status === 'fulfilled' && !allResults.find(item => item.id === result.value.id)) {
              allResults.push(result.value);
            }
          });
          
          console.log(`After adding drama fallback: ${allResults.length} total items`);
        } catch (fallbackError) {
          console.log('Fallback drama search failed:', fallbackError);
        }
      }
      
      // Sort by rating and return
      const finalResults = allResults
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 25); // Increased limit
        
      console.log(`Final Pride content count: ${finalResults.length}`);
      return finalResults;
        
    } catch (error) {
      console.error('Error fetching pride content:', error);
      return [];
    }
  },

  // Regards sur le monde - Geopolitics, climate, social dynamics
  getWorldPerspectives: async (): Promise<ContentItem[]> => {
    try {
      // Search for content about global issues across multiple themes and media types
      const [
        climateMovies,
        climateTV,
        politicsMovies,
        politicsTV,
        documentaryMovies,
        documentaryTV,
        socialMovies,
        socialTV,
        warMovies,
        crimeMovies,
        historyMovies,
      ] = await Promise.allSettled([
        // Climate and environment
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/search/movie', {
          query: 'climate change environment ecology',
          'vote_average.gte': '6.0',
        }),
        tmdbRequest<TMDBSearchResults<TMDBTVShow>>('/search/tv', {
          query: 'climate environment nature documentary',
          'vote_average.gte': '6.5',
        }),
        // Politics and geopolitics
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/search/movie', {
          query: 'politics government conspiracy corruption',
          'vote_average.gte': '6.5',
        }),
        tmdbRequest<TMDBSearchResults<TMDBTVShow>>('/search/tv', {
          query: 'politics government international',
          'vote_average.gte': '6.5',
        }),
        // Documentary movies
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/discover/movie', {
          'with_genres': '99', // Documentary genre ID
          'sort_by': 'vote_average.desc',
          'vote_count.gte': '100',
        }),
        // Documentary TV shows
        tmdbRequest<TMDBSearchResults<TMDBTVShow>>('/discover/tv', {
          'with_genres': '99', // Documentary genre ID
          'sort_by': 'vote_average.desc',
          'vote_count.gte': '50',
        }),
        // Social issues and society
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/search/movie', {
          query: 'social justice inequality racism poverty',
          'vote_average.gte': '6.5',
        }),
        tmdbRequest<TMDBSearchResults<TMDBTVShow>>('/search/tv', {
          query: 'social issues society culture',
          'vote_average.gte': '6.5',
        }),
        // War and conflict
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/discover/movie', {
          'with_genres': '10752', // War genre ID
          'vote_average.gte': '7.0',
          'vote_count.gte': '500',
          'sort_by': 'vote_average.desc',
        }),
        // Crime and investigative content
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/discover/movie', {
          'with_genres': '80', // Crime genre ID
          'vote_average.gte': '7.0',
          'vote_count.gte': '1000',
          'sort_by': 'vote_average.desc',
        }),
        // Historical content
        tmdbRequest<TMDBSearchResults<TMDBMovie>>('/discover/movie', {
          'with_genres': '36', // History genre ID
          'vote_average.gte': '7.0',
          'vote_count.gte': '500',
          'sort_by': 'vote_average.desc',
        }),
      ]);
      
      const allMovieResults: TMDBMovie[] = [];
      const allTVResults: TMDBTVShow[] = [];
      
      // Collect movie results
      [climateMovies, politicsMovies, documentaryMovies, socialMovies, warMovies, crimeMovies, historyMovies].forEach(result => {
        if (result.status === 'fulfilled') {
          allMovieResults.push(...result.value.results.slice(0, 4));
        }
      });
      
      // Collect TV results
      [climateTV, politicsTV, documentaryTV, socialTV].forEach(result => {
        if (result.status === 'fulfilled') {
          allTVResults.push(...result.value.results.slice(0, 4));
        }
      });
      
      // Remove duplicates
      const uniqueMovies = allMovieResults.filter((movie, index, self) => 
        index === self.findIndex(m => m.id === movie.id)
      );
      const uniqueTV = allTVResults.filter((show, index, self) => 
        index === self.findIndex(s => s.id === show.id)
      );
      
      const allResults: ContentItem[] = [];
      
      // Convert movies
      const movieItems = await Promise.allSettled(
        uniqueMovies.slice(0, 15).map(movie => convertMovieToContentItem(movie))
      );
      movieItems.forEach(result => {
        if (result.status === 'fulfilled') allResults.push(result.value);
      });
      
      // Convert TV shows
      const tvItems = await Promise.allSettled(
        uniqueTV.slice(0, 10).map(show => convertTVShowToContentItem(show))
      );
      tvItems.forEach(result => {
        if (result.status === 'fulfilled') allResults.push(result.value);
      });
      
      // Sort by rating and return top 25
      return allResults
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 25);
        
    } catch (error) {
      console.error('Error fetching world perspectives content:', error);
      return [];
    }
  },
};