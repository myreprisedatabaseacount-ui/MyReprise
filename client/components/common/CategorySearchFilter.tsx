'use client'

import React from 'react';
import { Search, X } from 'lucide-react';

interface CategorySearchFilterProps {
  searchTerm: string;
  onSearchChange: (searchTerm: string) => void;
  onClear: () => void;
  isSearching?: boolean;
  placeholder?: string;
}

const CategorySearchFilter: React.FC<CategorySearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  onClear,
  isSearching = false,
  placeholder = "Rechercher une catégorie..."
}) => {
  return (
    <div className="mb-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
        />
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
        {searchTerm && !isSearching && (
          <button
            onClick={onClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>
      
      {/* Indicateur de recherche active */}
      {searchTerm && (
        <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Recherche active: "{searchTerm}"</span>
        </div>
      )}
    </div>
  );
};

export default CategorySearchFilter;
