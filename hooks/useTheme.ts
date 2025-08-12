import { useColorScheme } from "react-native";
import { getTheme } from "../theme/colors";

/**
 * useTheme - renvoie le thème dérivé du schéma de couleur système.
 * Wrapper pour centraliser un éventuel futur override utilisateur.
 */
export function useTheme() {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  return theme;
}
