'use client'

import React, { useState } from 'react';
import { useGetTopCategoriesQuery } from '@/services/api/CategoryApi';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface CategorySliderProps {
  className?: string;
}

const CategorySlider: React.FC<CategorySliderProps> = () => {
  const locale = useLocale();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const {
    data: categoriesData,
    isLoading,
    error
  } = useGetTopCategoriesQuery({
    limit: 12,
    language: locale
  });

  const categories = categoriesData?.data || [];

  console.log('categories', categories);

  // Fonction pour gérer le clic sur une catégorie
  const handleCategoryClick = (categoryId: number) => {
    setActiveCategory(categoryId);
    router.push(`/offers/${categoryId}`);
  };

  if (isLoading) return null;

  if (error || categories.length === 0) return null;

  return (
    <div className={`w-full flex justify-center `}>
      <div className="overflow-x-auto ">
        <div className="flex items-center gap-6 py-4 px-2 min-w-max">
          {categories.map((cat: any) => {
            const isActive = activeCategory === cat.id;
            const label = cat?.name || cat?.nameFr || '';
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="relative flex flex-col items-center gap-2 cat-item focus:outline-none pt-2 group"
                aria-label={label}
              >
                <div className="hidden group-hover:block absolute -top-3">
                  <Image src="/Arrow 2.svg" alt="triangle-up" width={13} height={13} />
                </div>

                <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-[2px] group-hover:border-[#c9a227] bg-white`}>
                  {/* Icône de la catégorie */}
                  <img
                    src={cat.icon}
                    alt={label}
                    className="w-9 h-9 object-contain opacity-90"
                  />
                  <span className={`text-[13px] text-gray-700 mt-2`}>
                    {label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategorySlider;
