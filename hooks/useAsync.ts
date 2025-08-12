import { useCallback, useEffect, useRef, useState } from "react";

export interface AsyncState<T> {
  loading: boolean;
  error: Error | null;
  data: T | null;
  /** relance manuelle */
  refetch: () => Promise<void>;
  /** annule (ignore) la prochaine résolution */
  cancel: () => void;
}

/**
 * useAsync - exécute une fonction async et gère son cycle de vie.
 * Fournit data/loading/error + refetch & cancel.
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: any[] = []
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cancelled = useRef(false);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      if (!cancelled.current) setData(result);
    } catch (e: any) {
      if (!cancelled.current)
        setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (!cancelled.current) setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    cancelled.current = false;
    run();
    return () => {
      cancelled.current = true;
    };
  }, [run]);

  return {
    data,
    loading,
    error,
    refetch: run,
    cancel: () => {
      cancelled.current = true;
    },
  };
}
