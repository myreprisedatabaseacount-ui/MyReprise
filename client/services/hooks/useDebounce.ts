'use client';

import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour implémenter le debounce
 * @param value - La valeur à débouncer
 * @param delay - Le délai en millisecondes
 * @returns La valeur débouncée
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Créer un timer qui met à jour la valeur débouncée après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si la valeur change avant que le délai soit écoulé
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook personnalisé pour la recherche avec debounce
 * @param searchQuery - La requête de recherche
 * @param delay - Le délai de debounce en millisecondes (défaut: 500ms)
 * @returns L'objet de recherche avec debounce
 */
export function useSearchDebounce(searchQuery: string, delay: number = 500) {
  const debouncedSearchQuery = useDebounce(searchQuery, delay);
  
  return {
    searchQuery: debouncedSearchQuery,
    isSearching: searchQuery !== debouncedSearchQuery,
    hasQuery: searchQuery.trim().length > 0,
    hasDebouncedQuery: debouncedSearchQuery.trim().length > 0
  };
}
