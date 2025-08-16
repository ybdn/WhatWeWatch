import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "../lib/analytics";
import { curatedCollections } from "../lib/curatedCollections";
import { MediaSearchResult, searchMedia } from "../lib/searchService";
import { tmdbApi, ContentItem } from "../lib/tmdbService";
import { useDebounce } from "./useDebounce";
import { useList } from "../context/ListContext";

export interface ExploreSection {
  id: string;
  title: string;
  type: "top" | "trending" | "collection" | "results";
  items: ContentItem[] | MediaSearchResult[]; // ContentItem pour TMDB, MediaSearchResult pour recherche legacy
  subtitle?: string;
}

interface ExploreState {
  query: string;
  setQuery: (q: string) => void;
  debounced: string;
  loading: boolean;
  error: boolean;
  sections: ExploreSection[];
  showEmpty: boolean;
  sectionsLoading: boolean;
  sectionsError: boolean;
}

export function useExploreData(): ExploreState {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 400);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [results, setResults] = useState<ContentItem[]>([]);
  const lastTrackedQueryRef = useRef<string>("");
  const listManager = useList();
  
  // States for home sections (TMDB data)
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [sectionsError, setSectionsError] = useState(false);
  const [topRated, setTopRated] = useState<ContentItem[]>([]);
  const [trending, setTrending] = useState<ContentItem[]>([]);
  
  // Dynamic collections states
  const [newReleases, setNewReleases] = useState<ContentItem[]>([]);
  const [criticsChoice, setCriticsChoice] = useState<ContentItem[]>([]);
  const [prideContent, setPrideContent] = useState<ContentItem[]>([]);
  const [worldPerspectives, setWorldPerspectives] = useState<ContentItem[]>([]);

  // Function to filter out content that's already in user lists
  const filterContentAlreadyInLists = (content: ContentItem[]): ContentItem[] => {
    return content.filter(item => {
      const isInAnyList = listManager.isInWatchlist(item.id) || 
                         listManager.isFinished(item.id) || 
                         listManager.isFavorite(item.id);
      return !isInAnyList;
    });
  };

  // Function to load additional content to replace filtered items
  const loadAdditionalContent = async (originalData: ContentItem[], targetCount: number = 8): Promise<ContentItem[]> => {
    const filtered = filterContentAlreadyInLists(originalData);
    
    // If we have enough content after filtering, return it
    if (filtered.length >= targetCount) {
      return filtered.slice(0, targetCount);
    }
    
    // We'll return what we have - the TMDB service now fetches more content (20 items instead of 10)
    // to increase chances of having enough items after filtering
    return filtered;
  };

  // Load home sections data from TMDB
  useEffect(() => {
    let cancelled = false;
    
    async function loadHomeSections() {
      setSectionsLoading(true);
      setSectionsError(false);
      
      try {
        // Load main sections
        const [topRatedData, trendingData] = await Promise.all([
          tmdbApi.getTopRatedMovies(), // Use actual top rated movies
          tmdbApi.getTrendingMixed(),  // Use trending mixed content
        ]);
        
        // Load thematic collections
        const [newReleasesData, criticsChoiceData, prideContentData, worldPerspectivesData] = await Promise.all([
          tmdbApi.getNewReleases(),
          tmdbApi.getCriticsChoice(),
          tmdbApi.getPrideContent(),
          tmdbApi.getWorldPerspectives(),
        ]);
        
        if (!cancelled) {
          // Store raw data - filtering will be applied in useMemo
          setTopRated(topRatedData.slice(0, 20));
          setTrending(trendingData.slice(0, 20));
          setNewReleases(newReleasesData);
          setCriticsChoice(criticsChoiceData);
          setPrideContent(prideContentData);
          setWorldPerspectives(worldPerspectivesData);
        }
      } catch (error) {
        console.error('Error loading home sections:', error);
        if (!cancelled) {
          setSectionsError(true);
        }
      } finally {
        if (!cancelled) {
          setSectionsLoading(false);
        }
      }
    }
    
    loadHomeSections();
    
    return () => {
      cancelled = true;
    };
  }, []); // Only load once - filtering is applied in useMemo below

  // Search effect
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (debounced.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError(false);
      try {
        // Use TMDB search instead of legacy search
        const searchResults = await tmdbApi.searchMulti(debounced.trim());
        // Filter out content already in lists from search results too
        const filteredResults = filterContentAlreadyInLists(searchResults);
        if (!cancelled) setResults(filteredResults);
      } catch (searchError) {
        console.error('Search error:', searchError);
        // Fallback to legacy search if TMDB fails
        try {
          const fallbackResults = await searchMedia(debounced.trim());
          const filteredFallbackResults = filterContentAlreadyInLists(fallbackResults as any);
          if (!cancelled) setResults(filteredFallbackResults as any); // Type cast for compatibility
        } catch {
          if (!cancelled) setError(true);
          track("explore_search_error", { q_len: debounced.trim().length });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const showEmpty = debounced.length >= 2 && !loading && results.length === 0;

  const sections: ExploreSection[] = useMemo(() => {
    if (debounced.length >= 2) {
      return [
        {
          id: "results",
          title: `Résultats (${results.length})`,
          type: "results",
          items: results,
        },
      ];
    }
    // Mode d'accueil: top + trending + curated collections avec vraies données TMDB
    const homeSections: ExploreSection[] = [];
    
    // Apply filtering and add sections with filtered data
    const filteredTopRated = filterContentAlreadyInLists(topRated).slice(0, 8);
    if (filteredTopRated.length > 0) {
      homeSections.push({
        id: "top",
        title: "Les mieux notés",
        type: "top",
        items: filteredTopRated,
      });
    }
    
    const filteredTrending = filterContentAlreadyInLists(trending).slice(0, 8);
    if (filteredTrending.length > 0) {
      homeSections.push({
        id: "trending",
        title: "Tendances",
        type: "trending",
        items: filteredTrending,
      });
    }
    
    // Add dynamic thematic collections with filtered data
    const filteredNewReleases = filterContentAlreadyInLists(newReleases).slice(0, 8);
    if (filteredNewReleases.length > 0) {
      homeSections.push({
        id: "new_releases",
        title: "Nouveautés",
        subtitle: "Fraîchement sortis de l'écran",
        type: "collection" as const,
        items: filteredNewReleases,
      });
    }
    
    const filteredCriticsChoice = filterContentAlreadyInLists(criticsChoice).slice(0, 8);
    if (filteredCriticsChoice.length > 0) {
      homeSections.push({
        id: "critics_choice",
        title: "Acclamés par la critique",
        subtitle: "Les pépites qui font l'unanimité",
        type: "collection" as const,
        items: filteredCriticsChoice,
      });
    }
    
    const filteredPrideContent = filterContentAlreadyInLists(prideContent).slice(0, 8);
    if (filteredPrideContent.length > 0) {
      homeSections.push({
        id: "pride",
        title: "Célébrons les fiertés",
        subtitle: "Diversité & voix queer",
        type: "collection" as const,
        items: filteredPrideContent,
      });
    }
    
    const filteredWorldPerspectives = filterContentAlreadyInLists(worldPerspectives).slice(0, 8);
    if (filteredWorldPerspectives.length > 0) {
      homeSections.push({
        id: "world_society",
        title: "Regards sur le monde",
        subtitle: "Géopolitique, climat & dynamiques sociales",
        type: "collection" as const,
        items: filteredWorldPerspectives,
      });
    }
    
    return homeSections;
  }, [debounced, results, topRated, trending, newReleases, criticsChoice, prideContent, worldPerspectives, listManager.watchlist, listManager.finished, listManager.favorites]);

  // Tracking basique (ex: impression sections accueil seulement quand aucune recherche)
  useEffect(() => {
    if (debounced.length === 0) {
      track("explore_impression", { sections: sections.map((s) => s.id) });
    }
  }, [debounced, sections]);

  // Tracking des recherches une fois par requête débouncée
  useEffect(() => {
    if (
      debounced.length >= 2 &&
      debounced !== lastTrackedQueryRef.current &&
      !loading
    ) {
      lastTrackedQueryRef.current = debounced;
      const hasResults = results.length > 0;
      track("explore_search", {
        q_len: debounced.length,
        results: results.length,
        has_results: hasResults,
      });
      if (!hasResults) {
        track("explore_search_empty", { q_len: debounced.length });
      }
    }
  }, [debounced, loading, results]);

  return { 
    query, 
    setQuery, 
    debounced, 
    loading, 
    error, 
    sections, 
    showEmpty,
    sectionsLoading,
    sectionsError,
  };
}
