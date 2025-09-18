'use client'

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './productCard';
import { categories, products } from '@/data/mockData';

interface ProductSliderProps {
  title?: string;
}

const ProductSlider: React.FC<ProductSliderProps> = ({
  title
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [category, setCategory] = useState(categories.macbook);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const maxIndex = Math.max(0, products.length - itemsPerPage);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
    setCategory(categories[currentIndex + 1]);
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
    setCategory(categories[currentIndex - 1]);
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-0.5 bg-gray-800 hidden lg:block"></div>
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
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
          <div className="absolute inset-0 bg-[#243042] ">
            <img
              src={category.image}
              alt={category.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Products Grid : 2/3 */}
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2  gap-x-6">
          {products.slice(0, itemsPerPage).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          <button onClick={handleSeeMore} className=" block lg:hidden bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            {itemsPerPage === 4 ? 'voir plus' : 'voir moins'} →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductSlider;