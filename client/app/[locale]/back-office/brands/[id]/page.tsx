'use client'

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Edit3, Trash2, Award, Calendar, Tag, Image as ImageIcon, Globe } from 'lucide-react';
import { useGetBrandByIdQuery } from '@/services/api/BrandApi';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Category {
  id: number;
  nameFr: string;
  nameAr: string;
  image: string | null;
  descriptionFr: string;
  descriptionAr: string;
}

interface BrandDetailsPageProps {
  params: {
    id: string;
  };
}

const BrandDetailsPage: React.FC<BrandDetailsPageProps> = ({ params }) => {
  const router = useRouter();
  const brandId = parseInt(params.id);
  const [brand, setBrand] = useState<any>(null);

  // Récupération des données
  const { data: brandData, isLoading, error } = useGetBrandByIdQuery({ id: brandId });

  useEffect(() => {
    if (brandData && !isLoading) {
      setBrand(brandData?.data?.brand);
    }
  }, [brandData, isLoading]);

  // Actions
  const handleEdit = () => {
    router.push(`/back-office/brands/edit/${brandId}`);
  };

  console.log('brand', brandData);



  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette marque ?')) {
      // TODO: Implémenter la suppression
      toast.info('Suppression en cours...', {
        description: 'Cette fonctionnalité sera bientôt disponible'
      });
    }
  };

  const handleBack = () => {
    router.push('/back-office/brands');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la marque...</p>
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Award className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Marque non trouvée</h3>
          <p className="mt-1 text-gray-500">Cette marque n'existe pas ou a été supprimée.</p>
          <div className="mt-6">
            <button
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux marques
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour aux marques</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{brand.nameFr}</h1>
              <p className="text-xl text-gray-600 mb-4" dir="rtl">{brand.nameAr}</p>
              <p className="text-gray-600 max-w-3xl">{brand.descriptionFr}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 ml-6">
              <button
                onClick={handleEdit}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Edit3 className="w-4 h-4" />
                <span>Modifier</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Logo */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50">
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.nameFr}
                    className="w-full h-full object-contain p-8"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Award className="w-24 h-24 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Description détaillée */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description en français</h3>
                  <p className="text-gray-600 leading-relaxed">{brand.descriptionFr}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">الوصف بالعربية</h3>
                  <p className="text-gray-600 leading-relaxed" dir="rtl">{brand.descriptionAr}</p>
                </div>
              </div>
            </div>

            {/* Catégories associées */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Catégories associées</h2>
              {brand.categories && brand.categories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {brand.categories.map((category: Category) => (
                    <div
                      key={category.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.nameFr}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Tag className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {category.nameFr}
                        </h3>
                        <p className="text-xs text-gray-500 truncate" dir="rtl">
                          {category.nameAr}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Aucune catégorie associée</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informations générales */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Créé le</p>
                    <p className="text-sm text-gray-600">
                      {new Date(brand.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
              <div className="space-y-3">
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Modifier la marque</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer la marque</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandDetailsPage;
