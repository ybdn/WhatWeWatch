import { useEffect, useState } from "react";

/**
 * useDebounce - renvoie une valeur seulement après un délai d'inactivité.
 * Utile pour la recherche (éviter requêtes sur chaque frappe).
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
