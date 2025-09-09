import { Alert } from "react-native";
import { useEffect, useState, useCallback } from "react";

interface UseDataOptions<T, P extends Record<string, string | number>> {
  fn: (params: P) => Promise<T>;
  params?: P;
  skip?: boolean;
}

interface UseDataReturn<T, P> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: (newParams?: P) => Promise<void>;
}

export const useData = <T, P extends Record<string, string | number>>({
  fn,
  params = {} as P,
  skip = false,
}: UseDataOptions<T, P>): UseDataReturn<T, P> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (fetchParams: P) => {
      setLoading(true);
      setError(null);

      try {
        const result = await fn(fetchParams);
        setData(result);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Une erreur inconnue s'est produite";
        setError(errorMessage);
        Alert.alert("Erreur", errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [fn]
  );

  useEffect(() => {
    if (!skip) {
      fetchData(params);
    }
  }, []);

  const refetch = async (newParams?: P) => await fetchData(newParams || params);

  return { data, loading, error, refetch };
};
