import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "../lib/analytics";
import { curatedCollections } from "../lib/curatedCollections";
import { MediaSearchResult, searchMedia } from "../lib/searchService";
import { useDebounce } from "./useDebounce";

export interface ExploreSection {
  id: string;
  title: string;
  type: "top" | "trending" | "collection" | "results";
  items: any[]; // TODO: typer par sous-type
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
}

// Placeholder données Top / Trending pour MVP (remplacer par backend plus tard)
const TOP_TITLES: MediaSearchResult[] = [
  { id: "top1", title: "The Matrix" },
  { id: "top2", title: "Inception" },
  { id: "top3", title: "Se7en" },
];
const TRENDING_TITLES: MediaSearchResult[] = [
  { id: "tr1", title: "Parasite" },
  { id: "tr2", title: "Afterlight" },
  { id: "tr3", title: "Echoes" },
];

export function useExploreData(): ExploreState {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 400);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [results, setResults] = useState<MediaSearchResult[]>([]);
  const lastTrackedQueryRef = useRef<string>("");

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
        const r = await searchMedia(debounced.trim());
        if (!cancelled) setResults(r);
      } catch {
        if (!cancelled) setError(true);
        track("explore_search_error", { q_len: debounced.trim().length });
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
    // Mode d'accueil: top + trending + curated collections
    return [
      { id: "top", title: "Top recherché", type: "top", items: TOP_TITLES },
      {
        id: "trending",
        title: "Tendances",
        type: "trending",
        items: TRENDING_TITLES,
      },
      ...curatedCollections.map((c) => ({
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        type: "collection" as const,
        items: c.items,
      })),
    ];
  }, [debounced, results]);

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

  return { query, setQuery, debounced, loading, error, sections, showEmpty };
}
