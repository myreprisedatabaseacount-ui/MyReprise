'use client';

import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Package, Car, Home, ShoppingBag } from 'lucide-react';
import { useProduct } from '../../services/hooks/useProduct';

interface CreateProductDialogProps {
  onClose?: () => void;
}

const CreateProductDialog: React.FC<CreateProductDialogProps> = ({ onClose }) => {
  const { setStep, setListingType, selectedListingType, currentStep } = useProduct();

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const handleTypeSelection = (listingType: 'item' | 'vehicle' | 'property') => {
    setListingType(listingType);
    setStep(2); // Passer à l'étape suivante
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-lg mx-4 p-6 relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Que voulez-vous vendre ?
          </h2>
        </div>

        {/* Content - Type Selection */}
        <div className="space-y-4 mb-6">
          {/* Véhicule */}
          <button
            onClick={() => handleTypeSelection('vehicle')}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Véhicule</h3>
                <p className="text-sm text-gray-600">Voiture, moto, camion, etc.</p>
              </div>
            </div>
          </button>

          {/* Article */}
          <button
            onClick={() => handleTypeSelection('item')}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <ShoppingBag className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Article</h3>
                <p className="text-sm text-gray-600">Électronique, vêtements, meubles, etc.</p>
              </div>
            </div>
          </button>

          {/* Immobilier */}
          <button
            onClick={() => handleTypeSelection('property')}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Home className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Immobilier</h3>
                <p className="text-sm text-gray-600">Maison, appartement, terrain, etc.</p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Annuler
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CreateProductDialog;
