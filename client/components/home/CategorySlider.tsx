'use client'

import React, { useState } from 'react';
import { useGetTopCategoriesQuery } from '@/services/api/CategoryApi';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

interface CategorySliderProps {
  className?: string;
}

const CategorySlider: React.FC<CategorySliderProps> = ({ className = '' }) => {
  const locale = useLocale();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  
  const { 
    data: categoriesData, 
    isLoading, 
    error 
  } = useGetTopCategoriesQuery({ 
    limit: 5, 
    language: locale 
  });

  const categories = categoriesData?.data || [];

  // Fonction pour gérer le clic sur une catégorie
  const handleCategoryClick = (categoryId: number) => {
    router.push(`/offers/${categoryId}`);
  };

  if (isLoading) {
    return (
      <div className={`py-6 bg-white ${className}`}>
        <div className="max-w-7xl mx-auto px-6">
          {/* Header avec le texte "Spine" et les formes abstraites */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl overflow-hidden">
              {/* Formes abstraites en arrière-plan */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full transform translate-x-16 -translate-y-8"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full transform -translate-x-12 translate-y-6"></div>
              <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-white bg-opacity-5 rounded-full transform -translate-x-8 -translate-y-8"></div>
              
              {/* Texte "Spine" */}
              <div className="relative z-10 flex items-center justify-center h-20">
                <h2 className="text-3xl font-bold text-white">Spine</h2>
              </div>
            </div>
          </div>

          {/* Slider des catégories en loading */}
          <div className="flex justify-center">
            <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto pb-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {/* Générer 5 catégories de loading */}
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center group flex-shrink-0"
                >
                  {/* Cercle de la catégorie en gris */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-gray-200 animate-pulse">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-300"></div>
                  </div>
                  
                  {/* Nom de la catégorie en gris */}
                  <div className="mt-2 h-4 bg-gray-200 rounded animate-pulse w-16 sm:w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || categories.length === 0) {
    return null;
  }

  return (
    <div className={`py-6 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header avec le texte "Spine" et les formes abstraites */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl overflow-hidden">
            {/* Formes abstraites en arrière-plan */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full transform translate-x-16 -translate-y-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full transform -translate-x-12 translate-y-6"></div>
            <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-white bg-opacity-5 rounded-full transform -translate-x-8 -translate-y-8"></div>
            
            {/* Texte "Spine" */}
            <div className="relative z-10 flex items-center justify-center h-20">
              <h2 className="text-3xl font-bold text-white">Spine</h2>
            </div>
          </div>
        </div>

        {/* Slider des catégories */}
        <div className="flex justify-center">
          <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto pb-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="flex flex-col items-center cursor-pointer group flex-shrink-0"
                onClick={() => handleCategoryClick(category.id)}
              >
                {/* Cercle de la catégorie */}
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105 border-2 border-gray-300 bg-white hover:border-gray-400"
                >
                  {category.icon ? (
                    <img
                      src={category.icon}
                      alt={category.name}
                      className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600"
                    />
                  ) : (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-400"></div>
                  )}
                </div>
                
                {/* Nom de la catégorie */}
                <span className="text-xs sm:text-sm font-medium mt-2 text-center max-w-16 sm:max-w-20 leading-tight text-gray-700">
                  {category.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorySlider;
