'use client';

import React from 'react';
import { useDispatch } from 'react-redux';
import { closeAllProductModals } from '../../services/slices/productSlice';
import { useProductUrlSync } from '../../services/hooks/useProductUrlSync';
import { useProduct } from '../../services/hooks/useProduct';
import CreateProductDialog from './CreateProductDialog';
import VehicleForm from './VehicleForm';
import ItemForm from './ItemForm';
import PropertyForm from './PropertyForm';

const ProductProvider: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    isCreateProductOpen, 
    isEditProductOpen, 
    isDeleteProductOpen 
  } = useProductUrlSync();
  
  const { 
    selectedListingType, 
    currentStep, 
    setStep 
  } = useProduct();

  const handleCloseCreateProduct = () => {
    dispatch(closeAllProductModals());
  };

  const handleCloseEditProduct = () => {
    dispatch(closeAllProductModals());
  };

  const handleCloseDeleteProduct = () => {
    dispatch(closeAllProductModals());
  };

  const handleBackToTypeSelection = () => {
    setStep(1);
  };

  // Rendu conditionnel des modales de création
  const renderCreateProductModal = () => {
    if (!isCreateProductOpen) return null;

    // Étape 1: Sélection du type
    if (currentStep === 1) {
      return (
        <CreateProductDialog 
          onClose={handleCloseCreateProduct}
        />
      );
    }

    // Étape 2: Formulaire selon le type sélectionné
    if (currentStep === 2) {
      switch (selectedListingType) {
        case 'vehicle':
          return (
            <VehicleForm 
              onBack={handleBackToTypeSelection}
              onClose={handleCloseCreateProduct}
            />
          );
        case 'item':
          return (
            <ItemForm 
              onBack={handleBackToTypeSelection}
              onClose={handleCloseCreateProduct}
            />
          );
        case 'property':
          return (
            <PropertyForm 
              onBack={handleBackToTypeSelection}
              onClose={handleCloseCreateProduct}
            />
          );
        default:
          return (
            <CreateProductDialog 
              onClose={handleCloseCreateProduct}
            />
          );
      }
    }

    // Étape 3: Confirmation/Photos (à implémenter)
    if (currentStep === 3) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-semibold mb-4">Étape suivante</h2>
            <p className="text-gray-600 mb-4">
              Type: {selectedListingType}<br/>
              Étape: {currentStep}
            </p>
            <p className="text-sm text-gray-500">
              Ici sera implémentée l'étape de confirmation et d'ajout de photos.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleBackToTypeSelection}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Retour
              </button>
              <button
                onClick={handleCloseCreateProduct}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {renderCreateProductModal()}
      
      {isEditProductOpen && (
        <div>
          {/* TODO: Implémenter EditProductDialog */}
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg">
              <h2>Édition de produit (à implémenter)</h2>
              <button onClick={handleCloseEditProduct}>Fermer</button>
            </div>
          </div>
        </div>
      )}
      {isDeleteProductOpen && (
        <div>
          {/* TODO: Implémenter DeleteProductDialog */}
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg">
              <h2>Suppression de produit (à implémenter)</h2>
              <button onClick={handleCloseDeleteProduct}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductProvider;
