import React from 'react';
import { BarChart3, TrendingUp, Users, Eye, ShoppingBag, Star, Package, DollarSign } from 'lucide-react';

interface StoreStatisticsProps {
  userId: string;
  store?: any;
  stats?: any;
}

const StoreStatistics: React.FC<StoreStatisticsProps> = ({ userId, store, stats }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Statistiques</h2>
          <p className="text-gray-600">Analysez les performances de votre store</p>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Produits</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalOffers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Vues</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalViews || 0}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats?.completionRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Ventes mensuelles</h3>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Graphique des ventes</p>
              <p className="text-sm text-gray-500">Données en cours de collecte</p>
            </div>
          </div>
        </div>

        {/* Traffic Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Trafic</h3>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Graphique du trafic</p>
              <p className="text-sm text-gray-500">Données en cours de collecte</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produits populaires</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div>
                  <p className="text-sm font-medium">iPhone 13 Pro</p>
                  <p className="text-xs text-gray-500">25 vues</p>
                </div>
              </div>
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div>
                  <p className="text-sm font-medium">MacBook Air</p>
                  <p className="text-xs text-gray-500">18 vues</p>
                </div>
              </div>
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div>
                  <p className="text-sm font-medium">Samsung Galaxy</p>
                  <p className="text-xs text-gray-500">12 vues</p>
                </div>
              </div>
              <Star className="w-4 h-4 text-gray-300" />
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenus</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Ce mois</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">2,450 DH</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Mois dernier</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">1,890 DH</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Croissance</span>
              </div>
              <span className="text-lg font-semibold text-green-600">+29.6%</span>
            </div>
          </div>
        </div>

        {/* Customer Insights */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights clients</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Clients actifs</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">45</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-gray-600">Note moyenne</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">4.8/5</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600">Panier moyen</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">180 DH</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé des performances</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">+15%</p>
            <p className="text-sm text-gray-600">Vues ce mois</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">+8%</p>
            <p className="text-sm text-gray-600">Nouveaux clients</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">+22%</p>
            <p className="text-sm text-gray-600">Revenus</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">+5%</p>
            <p className="text-sm text-gray-600">Taux de conversion</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreStatistics;
