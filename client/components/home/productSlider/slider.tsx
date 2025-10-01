'use client'

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './productCard';
import { useGetOffersGroupedByTopCategoriesQuery } from '@/services/api/OfferApi';

interface ProductSliderProps {
  title?: string;
}

const ProductSlider: React.FC<ProductSliderProps> = ({
  title = "Recommandations personnalisées"
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  
  // Récupérer les offres groupées par catégories populaires
  const { 
    data: categoriesData, 
    isLoading: categoriesLoading, 
    error: categoriesError 
  } = useGetOffersGroupedByTopCategoriesQuery({
    limit: 3,
    offersLimit: itemsPerPage
  });
  
  const categories = categoriesData?.data || [];
  const currentCategory = categories[currentIndex];
  const offers = currentCategory?.offers || [];
  
  const maxIndex = Math.max(0, categories.length - 1);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  useEffect(() => {
    setItemsPerPage(window.innerWidth > 1024 ? 8 : 4);
  }, []);

  const handleSeeMore = () => {
    if (window.innerWidth > 1024) {
      setItemsPerPage(8);
    } else {
      if (itemsPerPage === 4) {
        setItemsPerPage(8);
      } else {
        setItemsPerPage(4);
      }
    }
  };

  // Gestion des états de chargement et d'erreur
  if (categoriesLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des catégories...</p>
          </div>
        </div>
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">Erreur lors du chargement des catégories</p>
            <p className="text-gray-600 text-sm">
              {'data' in categoriesError ? 'Erreur de chargement' : 'Erreur inconnue'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600">Aucune catégorie disponible</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 hidden lg:block"></div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">Découvrez les meilleures offres de chaque catégorie</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <button
            onClick={nextSlide}
            disabled={currentIndex >= maxIndex}
            className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Image : 1/3 */}
        <div className="lg:col-span-1 relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 p-8 min-h-[350px]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600">
            {currentCategory?.image ? (
              <img
                src={currentCategory.image}
                alt={currentCategory.name}
                className="w-full h-full object-cover opacity-80"
              />
            ) : null}
            <div className="relative z-10 w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏷️</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">{currentCategory?.name}</h3>
                <p className="text-sm opacity-90 mb-3">{currentCategory?.offersCount} offres disponibles</p>
                <div className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                  Recommandé pour vous
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid : 2/3 */}
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-x-6">
          {offers.length === 0 ? (
            <div className="col-span-2 flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-gray-600">Aucune offre disponible pour cette catégorie</p>
              </div>
            </div>
          ) : (
            <>
              {offers.slice(0, itemsPerPage).map((offer) => (
                <ProductCard key={offer.id} offer={offer} />
              ))}
              <button 
                onClick={handleSeeMore} 
                className="block lg:hidden bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {itemsPerPage === 4 ? 'voir plus' : 'voir moins'} →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductSlider;