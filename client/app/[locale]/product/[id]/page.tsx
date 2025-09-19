'use client'

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, Plus, Star } from 'lucide-react';
import { product } from '@/data/productDetails'
import NavBar from '@/components/Header/NavBar';

interface ProductImage {
  id: number;
  url: string;
  alt: string;
}

interface Brand {
  id: number;
  name: string;
  logo: string;
}

interface RepriseCategory {
  id: number;
  name: string;
  icon: React.ReactNode;
  brands: Brand[];
}

interface Owner {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  totalReviews: number;
  joinedDate: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  images: ProductImage[];
  rating: number;
  totalRatings: number;
  repriseCategory: RepriseCategory;
  owner: Owner;
  description: string;
  price: string;
}

const RepriseIcon: React.FC = () => (
  <svg width="24" height="9" viewBox="0 0 36 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-5 mt-1">
    <path d="M33.9229 6.10925C33.9227 3.94264 32.1667 2.18633 30 2.18633C27.8335 2.18658 26.0773 3.94279 26.0771 6.10925C26.0771 8.27592 27.8334 10.0319 30 10.0322V12.1093C26.6862 12.109 24 9.42306 24 6.10925C24.0002 2.79565 26.6864 0.109496 30 0.109253C33.3138 0.109253 35.9998 2.7955 36 6.10925C36 9.42321 33.314 12.1093 30 12.1093V10.0322C32.1668 10.0322 33.9229 8.27607 33.9229 6.10925Z" fill="#FC9231"/>
    <path d="M21 7.98169C21 7.98169 20.4 10.9817 17.9785 10.9817C15.5569 10.9817 15 10.1245 15 10.1245" stroke="#1241AA" strokeWidth="2" strokeLinecap="round"/>
    <path d="M15 4C15 4 15.6 1 18.0215 1C20.4431 1 21 1.85714 21 1.85714" stroke="#FC9231" strokeWidth="2" strokeLinecap="round"/>
    <path d="M9.92292 6.03638C9.92268 3.86977 8.16667 2.11346 6 2.11346C3.83354 2.1137 2.07732 3.86992 2.07708 6.03638C2.07708 8.20304 3.33339 9.95905 6 9.9593V12.0364C2.68625 12.0361 0 9.35018 0 6.03638C0.000243522 2.72278 2.6864 0.0366205 6 0.036377C9.31381 0.036377 11.9998 2.72263 12 6.03638C12 9.35033 9.31396 12.0364 6 12.0364V9.9593C8.16682 9.9593 9.92292 8.2032 9.92292 6.03638Z" fill="#1241AA"/>
  </svg>
);

const WhiteRepriseIcon: React.FC = () => (
    <svg width="24" height="9" viewBox="0 0 36 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-5 ml-4 mt-1">
      <path d="M33.9229 6.10925C33.9227 3.94264 32.1667 2.18633 30 2.18633C27.8335 2.18658 26.0773 3.94279 26.0771 6.10925C26.0771 8.27592 27.8334 10.0319 30 10.0322V12.1093C26.6862 12.109 24 9.42306 24 6.10925C24.0002 2.79565 26.6864 0.109496 30 0.109253C33.3138 0.109253 35.9998 2.7955 36 6.10925C36 9.42321 33.314 12.1093 30 12.1093V10.0322C32.1668 10.0322 33.9229 8.27607 33.9229 6.10925Z" fill="#ffffff"/>
      <path d="M21 7.98169C21 7.98169 20.4 10.9817 17.9785 10.9817C15.5569 10.9817 15 10.1245 15 10.1245" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
      <path d="M15 4C15 4 15.6 1 18.0215 1C20.4431 1 21 1.85714 21 1.85714" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9.92292 6.03638C9.92268 3.86977 8.16667 2.11346 6 2.11346C3.83354 2.1137 2.07732 3.86992 2.07708 6.03638C2.07708 8.20304 3.33339 9.95905 6 9.9593V12.0364C2.68625 12.0361 0 9.35018 0 6.03638C0.000243522 2.72278 2.6864 0.0366205 6 0.036377C9.31381 0.036377 11.9998 2.72263 12 6.03638C12 9.35033 9.31396 12.0364 6 12.0364V9.9593C8.16682 9.9593 9.92292 8.2032 9.92292 6.03638Z" fill="#ffffff"/>
    </svg>
  );

const StarRating: React.FC<{ rating: number; totalRatings: number; size?: 'sm' | 'md' }> = ({ 
  rating, 
  totalRatings, 
  size = 'md' 
}) => {
  const stars = [];
  const starSize = size === 'sm' ? 'text-xs' : 'text-sm';
  
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star
        key={i}
        size={size === 'sm' ? 12 : 16}
        className={`${i <= rating ? 'text-orange-400 fill-orange-400' : 'text-gray-300'}`}
      />
    );
  }
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex">{stars}</div>
      <span className={`text-gray-400 ml-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        ({totalRatings})
      </span>
    </div>
  );
};

const ImageGallery: React.FC<{ images: ProductImage[] }> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative">
      {/* Image principale */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-4">
        <img
          src={images[currentIndex]?.url}
          alt={images[currentIndex]?.alt}
          className="w-full h-full object-cover"
        />
        
        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronRight size={20} className="text-gray-700" />
            </button>
          </>
        )}

        {/* Indicateurs */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Miniatures */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                index === currentIndex ? 'border-blue-600' : 'border-gray-200'
              }`}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ProductDetails = () => {
  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <NavBar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-0.5 bg-gray-800"></div>
          <h1 className="text-2xl font-semibold text-gray-900">Détails du produit</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Galerie d'images */}
          <div>
            <ImageGallery images={product.images} />
          </div>

          {/* Informations du produit */}
          <div className="space-y-8">
            {/* Informations principales */}
            <div>
              <div className="text-sm text-gray-500 mb-2">{product.category}</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h2>
              <StarRating rating={product.rating} totalRatings={product.totalRatings} />
              <div className="text-2xl font-bold text-gray-900 mt-4">{product.price} DH</div>
            </div>

            {/* Section Reprise */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-lg font-semibold text-blue-600">reprise</span>
                <RepriseIcon />
              </div>
              
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Catégorie sélectionnée :</h3>
                <div className="flex items-center gap-2 text-gray-700">
                  {product.repriseCategory.icon}
                  <span>{product.repriseCategory.name}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Marques acceptées :</h4>
                <div className="flex flex-wrap gap-3">
                  {product.repriseCategory.brands.map((brand) => (
                    <div
                      key={brand.id}
                      className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200"
                    >
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="w-6 h-6 object-contain"
                      />
                      <span className="text-sm font-medium text-gray-700">{brand.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Profil du propriétaire */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Propriétaire</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={product.owner.avatar}
                    alt={product.owner.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{product.owner.name}</h4>
                    <StarRating 
                      rating={product.owner.rating} 
                      totalRatings={product.owner.totalReviews} 
                      size="sm" 
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Membre depuis {product.owner.joinedDate}
                    </p>
                  </div>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  <MessageCircle size={18} />
                  <span>Message</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton de reprise fixe */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <Plus size={24} className="text-gray-600" />
            </button>
            <span className="text-sm text-gray-600">Ajouter un produit à cette reprise</span>
          </div>
          <button className=" flex bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
            REPRISE
            <WhiteRepriseIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;