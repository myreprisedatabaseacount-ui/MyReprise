'use client'

import React from 'react';
import { Search, Globe, Settings, Filter } from 'lucide-react';

interface CategoryFiltersProps {
  language: string;
  limit: number;
  searchTerm: string;
  onLanguageChange: (language: string) => void;
  onLimitChange: (limit: number) => void;
  onSearchChange: (searchTerm: string) => void;
  onReset: () => void;
  isSearching?: boolean;
}

const CategoryFilters: React.FC<CategoryFiltersProps> = ({
  language,
  limit,
  searchTerm,
  onLanguageChange,
  onLimitChange,
  onSearchChange,
  onReset,
  isSearching = false
}) => {
  const limitOptions = [
    { value: 5, label: '5 par page' },
    { value: 10, label: '10 par page' },
    { value: 20, label: '20 par page' },
    { value: 50, label: '50 par page' },
    { value: 100, label: '100 par page' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtres et options</h3>
        </div>
        <button
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
        >
          Réinitialiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recherche */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Recherche
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher une catégorie..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Langue */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Langue
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Globe className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 appearance-none bg-white"
            >
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Limite par page */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Éléments par page
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Settings className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={limit}
              onChange={(e) => onLimitChange(parseInt(e.target.value))}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 appearance-none bg-white"
            >
              {limitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Indicateur de filtres actifs */}
      {(searchTerm || language !== 'fr' || limit !== 10) && (
        <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Filtres actifs</span>
          {searchTerm && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              Recherche: "{searchTerm}"
            </span>
          )}
          {language !== 'fr' && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              Langue: {language === 'ar' ? 'العربية' : 'Français'}
            </span>
          )}
          {limit !== 10 && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
              {limit} par page
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryFilters;
