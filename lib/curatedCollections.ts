export interface CuratedItem {
  id: string;
  title: string;
  type: string; // Type de contenu (Film, Série, etc.)
  color?: string; // Couleur de fond placeholder
  year?: number;
  rating?: number;
  synopsis?: string;
  director?: string;
  duration?: string;
  genres?: string[];
}

export interface CuratedCollection {
  id: string;
  title: string;
  subtitle?: string;
  items: CuratedItem[];
}

// Données purement statiques pour MVP visuel (remplacer plus tard par backend)
export const curatedCollections: CuratedCollection[] = [
  {
    id: "new_releases",
    title: "Nouveautés",
    subtitle: "Fraîchement sortis de l'écran",
    items: [
      { 
        id: "nr1", 
        title: "Echoes", 
        type: "Film", 
        color: "#5d8bff",
        year: 2025,
        rating: 7.3,
        duration: "1h 52min",
        director: "Sofia Chen",
        genres: ["Drame", "Science-fiction"],
        synopsis: "Dans un futur proche, une technologie permet de revivre les souvenirs d'autrui. Mais quand une jeune femme découvre des échos troublants du passé, elle doit naviguer entre réalité et mémoire."
      },
      { 
        id: "nr2", 
        title: "Gravity Shift", 
        type: "Série", 
        color: "#ff8b5d",
        year: 2025,
        rating: 8.1,
        duration: "6 épisodes",
        director: "Alex Rivera",
        genres: ["Science-fiction", "Thriller"],
        synopsis: "Quand la gravité terrestre commence à fluctuer de manière imprévisible, une équipe de scientifiques doit découvrir la cause avant que l'humanité ne soit condamnée."
      },
      { id: "nr3", title: "Afterlight", type: "Film", color: "#6b5dff" },
      { id: "nr4", title: "Evergreen", type: "Série", color: "#1b8c6e" },
      { id: "nr5", title: "Fragments", type: "Film", color: "#c255c2" },
    ],
  },
  {
    id: "critics_choice",
    title: "Acclamés par la critique",
    subtitle: "Les pépites qui font l'unanimité",
    items: [
      { id: "cc1", title: "Silent Waves", type: "Film", color: "#264653" },
      { id: "cc2", title: "The Last Orchard", type: "Série", color: "#2a9d8f" },
      { id: "cc3", title: "Resonance", type: "Film", color: "#e9c46a" },
      { id: "cc4", title: "Midnight Compass", type: "Film", color: "#f4a261" },
      { id: "cc5", title: "Paper Suns", type: "Série", color: "#e76f51" },
    ],
  },
  {
    id: "pride",
    title: "Célébrons les fiertés ",
    subtitle: "Diversité & voix queer",
    items: [
      { id: "pr1", title: "Rainbow Hearts", type: "Film", color: "#ff4d6d" },
      { id: "pr2", title: "Out & Loud", type: "Série", color: "#ff9f1c" },
      { id: "pr3", title: "Chosen Family", type: "Film", color: "#2ec4b6" },
      { id: "pr4", title: "Neon Parade", type: "Docu", color: "#8338ec" },
      { id: "pr5", title: "Fluid", type: "Série", color: "#3a86ff" },
    ],
  },
  {
    id: "world_society",
    title: "Regards sur le monde",
    subtitle: "Géopolitique, climat & dynamiques sociales",
    items: [
      { id: "ws1", title: "Fault Lines", type: "Docu", color: "#6a4c93" },
      { id: "ws2", title: "Borders & Voices", type: "Film", color: "#5f0f40" },
      { id: "ws3", title: "Shifting Powers", type: "Série", color: "#3a0ca3" },
      { id: "ws4", title: "Civic Pulse", type: "Docu", color: "#0a9396" },
      { id: "ws5", title: "Silent Uprisings", type: "Film", color: "#9b2226" },
    ],
  },
];
