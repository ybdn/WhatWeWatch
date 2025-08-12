export type AppTheme = {
  scheme: "light" | "dark";
  colors: {
    background: string;
    card: string;
    cardBorder: string;
    text: string;
    textSecondary: string;
    tint: string;
    tabBarBg: string;
    tabBarActive: string;
    tabBarInactive: string;
  };
};

export function getTheme(
  scheme: "light" | "dark" | null | undefined
): AppTheme {
  const isDark = scheme === "dark";
  if (isDark) {
    return {
      scheme: "dark",
      colors: {
        background: "#0e0f14",
        card: "#12141b",
        cardBorder: "#1f2330",
        text: "#ffffff",
        textSecondary: "#9aa4b1",
        tint: "#5d8bff",
        tabBarBg: "#12141b",
        tabBarActive: "#ffffff",
        tabBarInactive: "#6f7885",
      },
    };
  }
  return {
    scheme: "light",
    colors: {
      background: "#FFFFFF",
      card: "#f4f6f8",
      cardBorder: "#d9dee4",
      text: "#111418",
      textSecondary: "#5a6572",
      tint: "#1b63d8",
      tabBarBg: "#f9fafb",
      tabBarActive: "#1b63d8",
      tabBarInactive: "#8a949e",
    },
  };
}
