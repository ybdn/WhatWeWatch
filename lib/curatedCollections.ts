export interface CuratedItem {
  id: string;
  title: string;
  year?: number;
  tag?: string;
  color?: string; // Couleur de fond placeholder
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
    items: [
      { id: "nr1", title: "Echoes", year: 2025, color: "#5d8bff" },
      { id: "nr2", title: "Gravity Shift", year: 2025, color: "#ff8b5d" },
      { id: "nr3", title: "Afterlight", year: 2025, color: "#6b5dff" },
      { id: "nr4", title: "Evergreen", year: 2025, color: "#1b8c6e" },
      { id: "nr5", title: "Fragments", year: 2025, color: "#c255c2" },
    ],
  },
  {
    id: "critics_choice",
    title: "Acclamés par la critique",
    items: [
      { id: "cc1", title: "Silent Waves", color: "#264653" },
      { id: "cc2", title: "The Last Orchard", color: "#2a9d8f" },
      { id: "cc3", title: "Resonance", color: "#e9c46a" },
      { id: "cc4", title: "Midnight Compass", color: "#f4a261" },
      { id: "cc5", title: "Paper Suns", color: "#e76f51" },
    ],
  },
  {
    id: "pride",
    title: "Célébrons les fiertés ",
    subtitle: "Diversité & voix queer",
    items: [
      { id: "pr1", title: "Rainbow Hearts", color: "#ff4d6d" },
      { id: "pr2", title: "Out & Loud", color: "#ff9f1c" },
      { id: "pr3", title: "Chosen Family", color: "#2ec4b6" },
      { id: "pr4", title: "Neon Parade", color: "#8338ec" },
      { id: "pr5", title: "Fluid", color: "#3a86ff" },
    ],
  },
  {
    id: "world_society",
    title: "Regards sur le monde",
    subtitle: "Géopolitique, climat & dynamiques sociales",
    items: [
      { id: "ws1", title: "Fault Lines", color: "#6a4c93" },
      { id: "ws2", title: "Borders & Voices", color: "#5f0f40" },
      { id: "ws3", title: "Shifting Powers", color: "#3a0ca3" },
      { id: "ws4", title: "Civic Pulse", color: "#0a9396" },
      { id: "ws5", title: "Silent Uprisings", color: "#9b2226" },
    ],
  },
];
