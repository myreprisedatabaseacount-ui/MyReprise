'use client'

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useGetAllCategoriesQuery } from '@/services/api/CategoryApi';

interface CategoryFilters {
  language: string;
  limit: number;
  searchTerm: string;
  page: number;
}

interface UseCategoriesWithPaginationAndFiltersReturn {
  // Données
  categories: any[];
  isLoading: boolean;
  error: any;
  
  // Métadonnées de pagination
  totalCount: number;
  totalPages: number;
  currentPage: number;
  
  // Filtres
  filters: CategoryFilters;
  
  // États de recherche
  isSearching: boolean;
  hasSearch: boolean;
  searchTerm: string;
  
  // Actions
  setLanguage: (language: string) => void;
  setLimit: (limit: number) => void;
  setSearchTerm: (searchTerm: string) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
  
  // Fonction de recherche locale (pour les catégories déjà chargées)
  searchCategories: (categories: any[], searchTerm: string) => any[];
}

const useCategoriesWithPaginationAndFilters = (): UseCategoriesWithPaginationAndFiltersReturn => {
  // État des filtres
  const [filters, setFilters] = useState<CategoryFilters>({
    language: 'fr',
    limit: 10,
    searchTerm: '',
    page: 1
  });

  // État pour le debounce de la recherche
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce de la recherche (500ms de délai)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(filters.searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.searchTerm]);

  // Paramètres pour l'API
  const apiParams = useMemo(() => ({
    language: filters.language,
    page: filters.page,
    limit: filters.limit,
    search: debouncedSearchTerm || undefined
  }), [filters.language, filters.page, filters.limit, debouncedSearchTerm]);

  // Appel à l'API
  const { data: apiResponse, isLoading, error } = useGetAllCategoriesQuery(apiParams);

  // Fonction de recherche locale
  const searchCategories = useCallback((categories: any[], searchTerm: string) => {
    if (!searchTerm.trim()) return categories;
    
    const term = searchTerm.toLowerCase().trim();
    return categories.filter(category => 
      category.name?.toLowerCase().includes(term) ||
      category.description?.toLowerCase().includes(term) ||
      category.nameAr?.toLowerCase().includes(term) ||
      category.descriptionAr?.toLowerCase().includes(term)
    );
  }, []);

  // Catégories retournées par l'API (recherche gérée côté backend)
  const filteredCategories = useMemo(() => {
    if (!apiResponse?.data) return [];
    
    // La recherche est maintenant gérée côté backend
    // On retourne directement les données de l'API
    return apiResponse.data;
  }, [apiResponse?.data]);

  // Actions pour modifier les filtres
  const setLanguage = useCallback((language: string) => {
    setFilters(prev => ({
      ...prev,
      language,
      page: 1 // Reset à la première page
    }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setFilters(prev => ({
      ...prev,
      limit,
      page: 1 // Reset à la première page
    }));
  }, []);

  const setSearchTerm = useCallback((searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      searchTerm,
      page: 1 // Reset à la première page
    }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      language: 'fr',
      limit: 10,
      searchTerm: '',
      page: 1
    });
  }, []);

  return {
    // Données
    categories: filteredCategories,
    isLoading,
    error,
    
    // Métadonnées de pagination
    totalCount: apiResponse?.totalCount || 0,
    totalPages: apiResponse?.totalPages || 0,
    currentPage: filters.page,
    
    // Filtres
    filters,
    
    // États de recherche
    isSearching: filters.searchTerm !== debouncedSearchTerm,
    hasSearch: !!(apiResponse?.hasSearch),
    searchTerm: filters.searchTerm,
    
    // Actions
    setLanguage,
    setLimit,
    setSearchTerm,
    setPage,
    resetFilters,
    searchCategories
  };
};

export default useCategoriesWithPaginationAndFilters;
