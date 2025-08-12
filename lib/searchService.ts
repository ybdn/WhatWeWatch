export interface MediaSearchResult {
  id: string;
  title: string;
  year?: number;
  overview?: string;
  posterUrl?: string;
  provider?: string;
  type?: string;
}

// Petit jeu de données local (fallback quand backend absent)
const LOCAL_DATA: MediaSearchResult[] = [
  {
    id: "tt0133093",
    title: "The Matrix",
    year: 1999,
    overview: "A hacker discovers the true nature of reality.",
  },
  {
    id: "tt1375666",
    title: "Inception",
    year: 2010,
    overview: "Dream within a dream heist thriller.",
  },
  {
    id: "tt0114369",
    title: "Se7en",
    year: 1995,
    overview: "Two detectives hunt a serial killer using seven deadly sins.",
  },
  {
    id: "tt6751668",
    title: "Parasite",
    year: 2019,
    overview: "Social satire about two families' intertwined lives.",
  },
];

/**
 * Recherche films (MVP: fallback local). Si API backend disponible (EXPO_PUBLIC_API_BASE_URL)
 * alors utilise /catalog/search (spécification RIDEMI.md) et normalise.
 */
export async function searchMedia(query: string): Promise<MediaSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const base = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (base && /^https?:/i.test(base)) {
    try {
      const url = `${base.replace(
        /\/$/,
        ""
      )}/catalog/search?q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      if (Array.isArray(json.results)) {
        return json.results.map((r: any) => ({
          id: r.id || `${r.provider}:${r.externalId}`,
          title: r.title,
          year: r.year,
          overview: r.overview,
          posterUrl: r.coverUrl,
          provider: r.provider,
          type: r.type,
        }));
      }
    } catch {
      // fallback silent
    }
  }
  // Fallback local simple (filtre substring insensible casse)
  const low = q.toLowerCase();
  return LOCAL_DATA.filter((m) => m.title.toLowerCase().includes(low));
}
