'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useGetOffersQuery } from '../../../services/api/OfferApi';
import { useGetAllCategoriesQuery } from '../../../services/api/CategoryApi';
import CategoryFiltersBar from '../../../components/common/CategoryFiltersBar';
import { Search, Filter, Package, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

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

// Fonction pour obtenir le texte de l'état du produit
const getProductConditionText = (condition: string) => {
  switch (condition) {
    case 'new':
      return 'Neuf';
    case 'like_new':
      return 'Comme neuf';
    case 'good':
      return 'Bon état';
    case 'fair':
      return 'État correct';
    default:
      return condition;
  }
};

// Fonction pour obtenir la couleur de l'état du produit
const getProductConditionColor = (condition: string) => {
  switch (condition) {
    case 'new':
      return 'bg-green-100 text-green-800';
    case 'like_new':
      return 'bg-blue-100 text-blue-800';
    case 'good':
      return 'bg-yellow-100 text-yellow-800';
    case 'fair':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Composant de carte de produit
const ProductCard: React.FC<{ offer: Offer }> = ({ offer }) => {
  const mainImage = offer.images?.find(img => img.isMain) || offer.images?.[0];
  const imageUrl = mainImage?.imageUrl || '/placeholder-image.jpg';

  return (
    <Link href={`/product/${offer.id}`} className="block group">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 overflow-hidden">
        {/* Image */}
        <div className="aspect-square overflow-hidden">
          <img
            src={imageUrl}
            alt={offer.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
        
        {/* Contenu */}
        <div className="p-4">
          {/* Titre */}
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
            {offer.title}
          </h3>
          
          {/* État du produit */}
          <div className="mb-3">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getProductConditionColor(offer.productCondition)}`}>
              {getProductConditionText(offer.productCondition)}
            </span>
          </div>
          
          {/* Prix */}
          <div className="text-xl font-bold text-blue-600 mb-3">
            {offer.price.toLocaleString()} DH
          </div>
          
          {/* Call to action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-600">Demander reprise</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                <path d="M19 15L20.09 21.26L27 22L20.09 22.74L19 29L17.91 22.74L11 22L17.91 21.26L19 15Z" fill="currentColor"/>
              </svg>
            </div>
            {offer.address && (
              <span className="text-xs text-gray-500">{offer.address.city}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

// Composant de carte de chargement
const LoadingCard: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-200"></div>
    <div className="p-4">
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
      <div className="flex justify-between">
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);

const BoutiquePage: React.FC = () => {
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // États pour les catégories
  const [categorySearchTerm, setCategorySearchTerm] = useState<string>('');
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryLimit, setCategoryLimit] = useState(10);

  const queryArgs = {
    page,
    limit: 10,
    search: searchTerm ? searchTerm.trim() : undefined,
    categoryId: categoryFilter !== 'all' ? Number(categoryFilter) : undefined,
  };
  // la clé inclut explicitement la catégorie et la recherche
  const { data: offersData, isLoading, error, refetch } = useGetOffersQuery(queryArgs);
  

  // Récupérer les catégories
  const { data: categoriesData, isLoading: isLoadingCategories } = useGetAllCategoriesQuery({
    search: categorySearchTerm || undefined,
    page: categoryPage,
    limit: categoryLimit,
    language: 'fr'
  });

  const categories = categoriesData?.data || [];

  // Mettre à jour la liste des offres
  useEffect(() => {
    if (offersData?.data) {
      console.log('Données reçues:', {
        page,
        offersCount: offersData.data.length,
        categoryFilter,
        categoryId: categoryFilter !== 'all' ? parseInt(categoryFilter) : undefined,
        searchTerm: searchTerm.trim(),
        totalOffers: offersData.pagination?.totalCount || 'N/A'
      });
      
      if (page === 1) {
        setAllOffers(offersData.data);
      } else {
        setAllOffers(prev => [...prev, ...offersData.data]);
      }
      setHasMore(offersData.data.length === 10);
    }
  }, [offersData, page, categoryFilter, searchTerm]);

  useEffect(() => {
    setPage(1);
    setAllOffers([]);
    setHasMore(true);
  }, [searchTerm, categoryFilter]);
  
  // Fonction pour charger plus d'offres
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      console.log(`Chargement de la page ${page + 1}...`);
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
    }
  }, [isLoadingMore, hasMore, isLoading, page]);

  // Observer pour le scroll infini - se déclenche à 80% de la page
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          console.log('Scroll infini déclenché - chargement de la page suivante');
          loadMore();
        }
      },
      { 
        threshold: 0.2, // Se déclenche quand 20% du sentinel est visible (soit 80% de la page)
        rootMargin: '100px' // Déclenche 100px avant d'atteindre le sentinel
      }
    );

    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [loadMore, hasMore, isLoadingMore]);

  // Gestion des changements de catégorie
  const handleCategorySearchChange = (search: string) => {
    setCategorySearchTerm(search);
    setCategoryPage(1);
  };

  const handleCategoryPageChange = (newPage: number) => {
    setCategoryPage(newPage);
  };

  const handleCategoryLimitChange = (newLimit: number) => {
    setCategoryLimit(newLimit);
    setCategoryPage(1);
  };

  // Reset du loading quand les données arrivent
  useEffect(() => {
    if (offersData && isLoadingMore) {
      console.log('Données reçues, arrêt du loading');
      setIsLoadingMore(false);
    }
  }, [offersData, isLoadingMore]);

  if (isLoading && page === 1) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Chargement des offres...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-red-600 mb-4">Erreur lors du chargement des offres</p>
              <p className="text-gray-600 text-sm">Veuillez réessayer plus tard</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Boutique</h1>
              <p className="text-gray-600">Découvrez toutes nos offres disponibles</p>
            </div>
            <button
              onClick={() => {
                setPage(1);
                setAllOffers([]);
                setHasMore(true);
                refetch();
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Actualiser les offres"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          {/* Recherche */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher une offre
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Titre, description, prix..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    // Force le reset si on appuie sur Entrée avec une chaîne vide
                    if (!e.currentTarget.value.trim()) {
                      setSearchTerm('');
                    }
                  }
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtres de catégories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrer par catégorie
            </label>
            <CategoryFiltersBar
              searchTerm={categorySearchTerm}
              currentPage={categoryPage}
              totalPages={categoriesData?.totalPages || 0}
              limit={categoryLimit}
              onSearchChange={handleCategorySearchChange}
              onPageChange={handleCategoryPageChange}
              onLimitChange={handleCategoryLimitChange}
              totalCount={categoriesData?.totalCount || 0}
              isLoading={isLoadingCategories}
            />
            
            {/* Liste des catégories */}
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    categoryFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Toutes les catégories
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setCategoryFilter(category.id.toString())}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      categoryFilter === category.id.toString()
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <img src={category.icon} alt={category.name} className="w-4 h-4" />
                    {category.nameFr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Liste des offres */}
        {allOffers.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune offre trouvée</h3>
            <p className="text-gray-600">
              {searchTerm.trim() || categoryFilter !== 'all'
                ? 'Aucune offre ne correspond à vos critères de recherche.'
                : 'Aucune offre disponible pour le moment.'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allOffers.map((offer) => (
                <ProductCard key={offer.id} offer={offer} />
              ))}
            </div>

            {/* Sentinel pour le scroll infini */}
            <div id="scroll-sentinel" className="h-10 flex items-center justify-center">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Chargement de plus d'offres...</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BoutiquePage;
