import React from 'react';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface StoreRepriseRequestsProps {
  userId: string;
}

const StoreRepriseRequests: React.FC<StoreRepriseRequestsProps> = ({ userId }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Demandes reprise</h2>
          <p className="text-gray-600">Gérez les demandes de reprise de vos produits</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">En attente</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Acceptées</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Refusées</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">20</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 text-center">
        <RefreshCw className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Demandes reprise</h3>
        <p className="text-gray-600 mb-6">Contenu de la page de gestion des demandes de reprise</p>
        
        {/* Placeholder content */}
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg text-left">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Demande #001</h4>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">En attente</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">Produit: iPhone 13 Pro</p>
            <p className="text-sm text-gray-500">Demandé par: John Doe</p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg text-left">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Demande #002</h4>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Acceptée</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">Produit: MacBook Air</p>
            <p className="text-sm text-gray-500">Demandé par: Jane Smith</p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg text-left">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Demande #003</h4>
              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Refusée</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">Produit: Samsung Galaxy S21</p>
            <p className="text-sm text-gray-500">Demandé par: Bob Johnson</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreRepriseRequests;
