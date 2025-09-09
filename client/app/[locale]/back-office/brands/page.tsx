'use client'

import React, { useMemo } from 'react';
import { Plus, Edit3, Trash2, Eye, Award, Calendar, Tag } from 'lucide-react';
import { useGetBrandsQuery } from '@/services/api/BrandApi';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Category {
  id: number;
  nameFr: string;
  nameAr: string;
  image: string | null;
}

// Interface pour les données de l'API
interface ApiBrand {
  id: number;
  name: string;
  description: string;
  logo: string | null;
  nameAr: string;
  nameFr: string;
  descriptionAr: string;
  descriptionFr: string;
  createdAt: string;
  updatedAt: string;
  categories?: Category[];
}

interface Brand {
  id: number;
  name: string;
  description: string;
  logo: string | null;
  nameAr: string;
  nameFr: string;
  descriptionAr: string;
  descriptionFr: string;
  createdAt: string;
  updatedAt: string;
  categories?: Category[];
}

const BrandsPage: React.FC = () => {
  const router = useRouter();

  // Récupération des données avec cache optimisé
  const { data: brandsResponse, isLoading: brandsLoading, error: brandsError, isFetching } = useGetBrandsQuery({
    page: 1,
    limit: 100,
    language: 'fr'
  }, {
    // Optimisations de cache
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: true
  });
  
  // Transformation des données
  const brands: Brand[] = useMemo(() => {
    if (!brandsResponse?.data?.brands) return [];
    return brandsResponse.data.brands.map((brand: ApiBrand) => ({
      ...brand,
      categories: brand.categories || []
    }));
  }, [brandsResponse]);

  // Actions
  const handleAddBrand = () => {
    router.push('/back-office/brands/add');
  };

  const handleEditBrand = (brandId: number) => {
    router.push(`/back-office/brands/edit/${brandId}`);
  };

  const handleViewBrand = (brandId: number) => {
    router.push(`/back-office/brands/${brandId}`);
  };

  const handleDeleteBrand = (brandId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette marque ?')) {
      // TODO: Implémenter la suppression
      toast.info('Suppression en cours...', {
        description: 'Cette fonctionnalité sera bientôt disponible'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">Marques</h1>
              {isFetching && !brandsLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
            <p className="text-gray-600">Gérez et organisez vos marques de produits</p>
          </div>
          <button
            onClick={handleAddBrand}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Créer la marque</span>
          </button>
        </div>
      </div>


      {/* Loading State avec Skeleton */}
      {brandsLoading && (
        <div className="space-y-4">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Chargement des marques...</span>
          </div>
          {/* Skeleton Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {brandsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Erreur lors du chargement des marques
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Impossible de charger les marques. Veuillez réessayer plus tard.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!brandsLoading && !brandsError && brands.length === 0 && (
        <div className="text-center py-12">
          <Award className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune marque</h3>
          <p className="mt-1 text-sm text-gray-500">Commencez par créer votre première marque.</p>
          <div className="mt-6">
            <button
              onClick={handleAddBrand}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer la marque
            </button>
          </div>
        </div>
      )}

      {/* Brands Grid */}
      {!brandsLoading && !brandsError && brands.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              onEdit={handleEditBrand}
              onView={handleViewBrand}
              onDelete={handleDeleteBrand}
            />
          ))}
        </div>
      )}

      {/* Stats */}
      {!brandsLoading && !brandsError && brands.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{brands.length}</div>
            <div className="text-sm text-gray-600">Total des marques</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant BrandCard
interface BrandCardProps {
  brand: Brand;
  onEdit: (brandId: number) => void;
  onView: (brandId: number) => void;
  onDelete: (brandId: number) => void;
}

const BrandCard: React.FC<BrandCardProps> = ({ brand, onEdit, onView, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group">
      {/* Logo */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-purple-50">
        {brand.logo ? (
          <img
            src={brand.logo}
            alt={brand.nameFr}
            className="w-full h-full object-contain p-4"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Award className="w-16 h-16 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* Note: Le badge de statut isActive a été supprimé car le champ n'existe pas dans la base de données */}
        
        {/* Actions */}
        <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onView(brand.id)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors duration-200"
            title="Voir les détails"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => onEdit(brand.id)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors duration-200"
            title="Modifier"
          >
            <Edit3 className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={() => onDelete(brand.id)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors duration-200"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Titre */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{brand.nameFr}</h3>
          <p className="text-sm text-gray-600" dir="rtl">{brand.nameAr}</p>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {brand.descriptionFr}
        </p>

        {/* Catégories */}
        {brand.categories && brand.categories.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {brand.categories.slice(0, 3).map((category) => (
                <span
                  key={category.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {category.nameFr}
                </span>
              ))}
              {brand.categories.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  +{brand.categories.length - 3} autres
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(brand.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandsPage;