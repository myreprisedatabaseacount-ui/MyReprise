'use client';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../lib/store';
import {
  openCreateProductModal,
  openEditProductModal,
  openDeleteProductModal,
  closeCreateProductModal,
  closeEditProductModal,
  closeDeleteProductModal,
  closeAllProductModals,
  switchToEditProduct,
  switchToDeleteProduct,
  setProductStatus,
  setProductError,
  setProductCurrentStep,
  setSelectedListingType,
  updateProductData,
  clearProductData,
  resetProductState,
} from '../slices/productSlice';

export const useProduct = () => {
  const dispatch = useDispatch();
  const productState = useSelector((state: RootState) => state.product);

  return {
    // État
    ...productState,
    
    // Actions d'ouverture
    openCreateProduct: () => dispatch(openCreateProductModal()),
    openEditProduct: (product: any) => dispatch(openEditProductModal(product)),
    openDeleteProduct: (product: any) => dispatch(openDeleteProductModal(product)),
    
    // Actions de fermeture
    closeCreateProduct: () => dispatch(closeCreateProductModal()),
    closeEditProduct: () => dispatch(closeEditProductModal()),
    closeDeleteProduct: () => dispatch(closeDeleteProductModal()),
    closeAllProducts: () => dispatch(closeAllProductModals()),
    
    // Actions de basculement
    switchToEdit: (product: any) => dispatch(switchToEditProduct(product)),
    switchToDelete: (product: any) => dispatch(switchToDeleteProduct(product)),
    
    // Actions de gestion
    setStatus: (status: 'idle' | 'loading' | 'success' | 'error') => dispatch(setProductStatus(status)),
    setError: (error: string | null) => dispatch(setProductError(error)),
    setStep: (step: number) => dispatch(setProductCurrentStep(step)),
    setListingType: (type: 'item' | 'vehicle' | 'property') => dispatch(setSelectedListingType(type)),
    updateData: (data: any) => dispatch(updateProductData(data)),
    clearData: () => dispatch(clearProductData()),
    reset: () => dispatch(resetProductState()),
  };
};
