'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Package, Users, TrendingUp, ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useGetStoreInfoQuery } from '../../../../../services/api/UserStoreApi';

interface StoreStatisticsPageProps {
  params: {
    userId: string;
  };
}

const StoreStatisticsPage: React.FC<StoreStatisticsPageProps> = () => {
  const params = useParams();
  const userId = params.userId as string;
  
  // Récupérer les informations du store
  const { data: storeData, isLoading, error } = useGetStoreInfoQuery(userId, {
    skip: !userId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600">Impossible de charger les statistiques.</p>
        </div>
      </div>
    );
  }

  const stats = storeData?.data?.stats || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href={`/store/${userId}`}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Statistiques</h1>
                <p className="text-sm text-gray-500">Analysez les performances de votre store</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Produits</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOffers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Visiteurs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Commandes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Taux de conversion</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completionRate || 0}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Produits Actifs</h3>
            <p className="text-3xl font-bold text-green-600">{stats.activeOffers || 0}</p>
            <p className="text-sm text-gray-500 mt-2">Produits disponibles à la vente</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Commandes en Attente</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders || 0}</p>
            <p className="text-sm text-gray-500 mt-2">Commandes en cours de traitement</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreStatisticsPage;
