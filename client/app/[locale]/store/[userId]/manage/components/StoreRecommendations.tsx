import React from 'react';
import { FileText, TrendingUp, Users, Target, BarChart3 } from 'lucide-react';

interface StoreRecommendationsProps {
  userId: string;
}

const StoreRecommendations: React.FC<StoreRecommendationsProps> = ({ userId }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recommandations</h2>
          <p className="text-gray-600">Optimisez votre store avec nos recommandations</p>
        </div>
      </div>

      {/* Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Recommendations */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">✓ Images optimisées</p>
              <p className="text-xs text-green-600">Toutes vos images sont compressées</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-yellow-800">⚠ Améliorer les descriptions</p>
              <p className="text-xs text-yellow-600">Ajoutez plus de détails à vos produits</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-800">✗ Mise à jour des prix</p>
              <p className="text-xs text-red-600">Certains prix n'ont pas été mis à jour</p>
            </div>
          </div>
        </div>

        {/* SEO Recommendations */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">SEO</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">✓ Mots-clés optimisés</p>
              <p className="text-xs text-green-600">Vos descriptions contiennent des mots-clés</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-yellow-800">⚠ Ajouter des tags</p>
              <p className="text-xs text-yellow-600">Utilisez plus de tags pour vos produits</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">✓ Images avec alt text</p>
              <p className="text-xs text-green-600">Toutes vos images ont des descriptions</p>
            </div>
          </div>
        </div>

        {/* Customer Engagement */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Engagement</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-yellow-800">⚠ Répondre aux messages</p>
              <p className="text-xs text-yellow-600">3 messages en attente de réponse</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">✓ Temps de réponse rapide</p>
              <p className="text-xs text-green-600">Moyenne: 2h 30min</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-800">✗ Mettre à jour le stock</p>
              <p className="text-xs text-red-600">5 produits en rupture de stock</p>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">✓ Vues en hausse</p>
              <p className="text-xs text-green-600">+15% ce mois</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-yellow-800">⚠ Taux de conversion</p>
              <p className="text-xs text-yellow-600">3.2% - Peut être amélioré</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">✓ Temps sur la page</p>
              <p className="text-xs text-green-600">2m 45s - Bon engagement</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions prioritaires</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
            <div>
              <p className="text-sm font-medium text-red-800">Mettre à jour les prix</p>
              <p className="text-xs text-red-600">5 produits nécessitent une mise à jour des prix</p>
            </div>
            <button className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
              Corriger
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div>
              <p className="text-sm font-medium text-yellow-800">Répondre aux messages</p>
              <p className="text-xs text-yellow-600">3 messages clients en attente</p>
            </div>
            <button className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700">
              Répondre
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="text-sm font-medium text-blue-800">Ajouter des tags</p>
              <p className="text-xs text-blue-600">Améliorez la visibilité de vos produits</p>
            </div>
            <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              Optimiser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreRecommendations;
