'use client'

import React from 'react';
import { Search, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryFiltersBarProps {
  searchTerm: string;
  currentPage: number;
  totalPages: number;
  limit: number;
  onSearchChange: (searchTerm: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  totalCount: number;
  isLoading?: boolean;
}

const CategoryFiltersBar: React.FC<CategoryFiltersBarProps> = ({
  searchTerm,
  currentPage,
  totalPages,
  limit,
  onSearchChange,
  onPageChange,
  onLimitChange,
  totalCount,
  isLoading = false
}) => {
  const limitOptions = [
    { value: 5, label: '5' },
    { value: 10, label: '10' },
    { value: 20, label: '20' },
    { value: 50, label: '50' }
  ];

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalCount);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Recherche */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher une catégorie..."
              className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Contrôles de pagination */}
        <div className="flex items-center space-x-3">
          {/* Informations de pagination */}
          <div className="text-sm text-gray-600 hidden sm:block">
            {totalCount > 0 ? (
              <span>
                {startItem}-{endItem} sur {totalCount}
              </span>
            ) : (
              <span>Aucune catégorie</span>
            )}
          </div>

          {/* Limite par page */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Par page:</span>
            <div className="relative">
              <select
                value={limit}
                onChange={(e) => onLimitChange(parseInt(e.target.value))}
                className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                disabled={isLoading}
              >
                {limitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                <Settings className="h-3 w-3 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Navigation des pages */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="p-1 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                title="Page précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-2 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md min-w-[60px] text-center">
                {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className="p-1 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                title="Page suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Indicateur de recherche active */}
      {searchTerm && (
        <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Recherche: "{searchTerm}"</span>
          <button
            onClick={() => onSearchChange('')}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Effacer
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryFiltersBar;
