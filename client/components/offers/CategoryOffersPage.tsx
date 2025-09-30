'use client'

import React, { useState } from 'react';
import { useGetCategoryByIdQuery } from '@/services/api/CategoryApi';
import { useGetOffersQuery } from '@/services/api/OfferApi';
import { ChevronLeft, Package, Users, Calendar, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface OfferImage {
  id: number;
  imageUrl: string;
  isMain: boolean;
  color: string | null;
  colorHex: string | null;
}

interface Offer {
  id: number;
  productId: number;
  title: string;
  description: string;
  price: number;
  status: string;
  productCondition: string;
  listingType: string;
  sellerId: number;
  categoryId: number;
  brandId: number | null;
  subjectId: number | null;
  addressId: number | null;
  specificData: any;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  images: OfferImage[];
  category: {
    id: number;
    nameFr: string;
    nameAr: string;
  } | null;
  brand: {
    id: number;
    nameFr: string;
    nameAr: string;
  } | null;
  seller: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  address: {
    id: number;
    city: string;
  } | null;
}

interface CategoryOffersPageProps {
  categoryId: number;
  locale: string;
  title: string;
}

// Composant de carte de produit (identique à la page boutique)
const ProductCard: React.FC<{ offer: Offer }> = ({ offer }) => {
  const mainImage = offer.images?.find(img => img.isMain) || offer.images?.[0];
  const imageUrl = mainImage?.imageUrl || '/placeholder-image.jpg';

  return (
    <Link href={`/product/${offer.id}`} className="block group">
      <div className="bg-white rounded-lg transition-all duration-200 overflow-hidden">
        {/* Image */}
        <div className="aspect-square overflow-hidden">
          <img
            src={imageUrl}
            alt={offer.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>

        {/* Contenu */}
        <div className="p-3">
          {/* Titre */}
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
            {offer.title}
          </h3>

          {/* Description */}
          <div className="h-7 text-sm text-gray-500 rounded-md overflow-hidden">
            {typeof offer.description === 'string' ? offer.description.slice(0, 28) + '...' : offer.description}
          </div>

          {/* Call to action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-blue-600">Demander reprise</span>
              <Image src="/icon/logo.png" alt="Demander reprise" width={20} height={20} />
            </div>
            {offer.address && (
              <span className="text-xs text-gray-500">{typeof offer.address.city === 'string' ? offer.address.city.slice(0, 5) + '...' : offer.address.city}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

const CategoryOffersPage: React.FC<CategoryOffersPageProps> = ({ 
  categoryId, 
  locale, 
  title 
}) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const limit = 10;

  // Récupérer les détails de la catégorie
  const { 
    data: categoryData, 
    isLoading: categoryLoading, 
    error: categoryError 
  } = useGetCategoryByIdQuery(categoryId);

  // Récupérer les offres de la catégorie
  const { 
    data: offersData, 
    isLoading: offersLoading, 
    error: offersError 
  } = useGetOffersQuery({
    categoryId,
    page: currentPage,
    limit,
    language: locale
  });

  const category = categoryData?.data;
  const offers = offersData?.data || [];
  const totalPages = offersData?.totalPages || 1;

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          {/* Hero de loading */}
          <div className="h-96 bg-gray-300"></div>
          {/* Content de loading */}
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (categoryError || !category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Catégorie non trouvée</h1>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero avec image de la catégorie */}
      <div className="relative h-96 overflow-hidden">
        {category.image ? (
          <div className="relative w-full h-full">
            {/* Image floue en arrière-plan pour remplir les espaces */}
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat scale-110"
              style={{ 
                backgroundImage: `url(${category.image})`,
                filter: 'blur(12px) brightness(0.6)',
                transform: 'scale(1.1)'
              }}
            />
            
            {/* Image principale centrée */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={category.image}
                alt={category.nameFr || category.nameAr}
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: '100%', maxWidth: '100%' }}
              />
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
        )}
        
        {/* Overlay sombre */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        
        {/* Bouton retour */}
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
      </div>

      {/* Contenu principal */}
      <div className="w-full px-2 xs:px-3 sm:px-4 md:px-6 py-8">
        {/* Informations détaillées de la catégorie */}
        <div className="bg-white rounded-2xl shadow-lg p-2 xs:p-3 sm:p-4 md:p-6 mb-8">
          <div className="flex flex-col items-center gap-3 xs:gap-4 sm:gap-6">
            {/* Nom et section détails */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {category.nameFr || category.nameAr}
              </h1>
              
              {/* Section détails avec icône */}
              <div className="flex items-center gap-3">
                {/* Icône de la catégorie */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center shadow-md">
                  {category.icon ? (
                    <img
                      src={category.icon}
                      alt={category.nameFr || category.nameAr}
                      className="w-8 h-8"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                
                {/* Bouton toggle */}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {showDetails ? 'Masquer détails' : 'Afficher détails'}
                  {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {/* Informations supplémentaires - Collapsible */}
            {showDetails && (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Type de listing */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Tag className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="font-semibold text-gray-900 text-sm capitalize truncate">
                      {category.listingType === 'item' ? 'Article' : 
                       category.listingType === 'vehicle' ? 'Véhicule' : 
                       category.listingType === 'property' ? 'Propriété' : 
                       category.listingType}
                    </p>
                  </div>
                </div>

                {/* Tranche d'âge */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Tranche d'âge</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {category.ageMin}-{category.ageMax} ans
                    </p>
                  </div>
                </div>

                {/* Genre */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Genre</p>
                    <p className="font-semibold text-gray-900 text-sm capitalize truncate">
                      {category.gender === 'male' ? 'Homme' : 
                       category.gender === 'female' ? 'Femme' : 
                       'Mixte'}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {category.descriptionFr && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl sm:col-span-2 lg:col-span-1">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Description</p>
                      <p className="font-semibold text-gray-900 text-xs leading-relaxed line-clamp-3">
                        {category.descriptionFr}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filtres et pagination */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600">
            {offersData?.pagination?.totalCount || 0} offres trouvées
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage} sur {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          )}
        </div>

        {/* Grille des offres */}
        {offersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : offersError ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Erreur lors du chargement des offres</p>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-800"
            >
              Réessayer
            </button>
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Aucune offre disponible pour cette catégorie</p>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Retour
            </button>
          </div>
        ) : (
          <div className="px-1 xs:px-2 sm:px-0">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 md:gap-6 lg:gap-9">
              {offers.map((offer) => (
                <ProductCard key={offer.id} offer={offer} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryOffersPage;
