import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "../lib/analytics";
import { curatedCollections } from "../lib/curatedCollections";
import { MediaSearchResult, searchMedia } from "../lib/searchService";
import { tmdbApi, ContentItem } from "../lib/tmdbService";
import { useDebounce } from "./useDebounce";

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
          setTopRated(topRatedData.slice(0, 8));
          setTrending(trendingData.slice(0, 8));
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
  }, []);

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
        const r = await tmdbApi.searchMulti(debounced.trim());
        if (!cancelled) setResults(r);
      } catch (searchError) {
        console.error('Search error:', searchError);
        // Fallback to legacy search if TMDB fails
        try {
          const fallbackResults = await searchMedia(debounced.trim());
          if (!cancelled) setResults(fallbackResults as any); // Type cast for compatibility
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
    
    // Add top rated section if data is available
    if (topRated.length > 0) {
      homeSections.push({
        id: "top",
        title: "Les mieux notés",
        type: "top",
        items: topRated,
      });
    }
    
    // Add trending section if data is available  
    if (trending.length > 0) {
      homeSections.push({
        id: "trending",
        title: "Tendances",
        type: "trending",
        items: trending,
      });
    }
    
    // Add dynamic thematic collections with real TMDB data
    if (newReleases.length > 0) {
      homeSections.push({
        id: "new_releases",
        title: "Nouveautés",
        subtitle: "Fraîchement sortis de l'écran",
        type: "collection" as const,
        items: newReleases,
      });
    }
    
    if (criticsChoice.length > 0) {
      homeSections.push({
        id: "critics_choice",
        title: "Acclamés par la critique",
        subtitle: "Les pépites qui font l'unanimité",
        type: "collection" as const,
        items: criticsChoice,
      });
    }
    
    if (prideContent.length > 0) {
      homeSections.push({
        id: "pride",
        title: "Célébrons les fiertés",
        subtitle: "Diversité & voix queer",
        type: "collection" as const,
        items: prideContent,
      });
    }
    
    if (worldPerspectives.length > 0) {
      homeSections.push({
        id: "world_society",
        title: "Regards sur le monde",
        subtitle: "Géopolitique, climat & dynamiques sociales",
        type: "collection" as const,
        items: worldPerspectives,
      });
    }
    
    return homeSections;
  }, [debounced, results, topRated, trending, newReleases, criticsChoice, prideContent, worldPerspectives]);

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
