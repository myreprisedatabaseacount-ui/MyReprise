'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../lib/store';
import {
  openCreateProductModal,
  openEditProductModal,
  openDeleteProductModal,
  closeAllProductModals,
  setProductCurrentStep,
} from '../slices/productSlice';

export const useProductUrlSync = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { 
    isCreateProductOpen, 
    isEditProductOpen, 
    isDeleteProductOpen, 
    currentStep 
  } = useSelector((state: RootState) => state.product);
  
  // Ref pour éviter les boucles infinies
  const isInitialized = useRef(false);
  const lastUrlState = useRef({ product: '', step: '' });

  // Synchroniser l'URL vers Redux au chargement (une seule fois) - SANS STEPS
  useEffect(() => {
    if (isInitialized.current) return;
    
    const productModal = searchParams.get('product');

    // Mettre à jour la référence
    lastUrlState.current = { product: productModal || '', step: '' };

    if (productModal === 'create') {
      dispatch(openCreateProductModal());
      // Toujours commencer à l'étape 1
      dispatch(setProductCurrentStep(1));
    } else if (productModal === 'edit') {
      // TODO: Récupérer l'ID du produit depuis l'URL
      const productId = searchParams.get('id');
      if (productId) {
        dispatch(openEditProductModal({ id: productId }));
      }
    } else if (productModal === 'delete') {
      // TODO: Récupérer l'ID du produit depuis l'URL
      const productId = searchParams.get('id');
      if (productId) {
        dispatch(openDeleteProductModal({ id: productId }));
      }
    } else {
      dispatch(closeAllProductModals());
    }
    
    isInitialized.current = true;
  }, [searchParams, dispatch]);

  // Synchroniser Redux vers l'URL (seulement si l'état a changé) - SANS STEPS
  useEffect(() => {
    if (!isInitialized.current) return;

    const currentProduct = searchParams.get('product');
    
    // Vérifier si l'URL a déjà été mise à jour
    const expectedProduct = isCreateProductOpen ? 'create' : 
                           isEditProductOpen ? 'edit' : 
                           isDeleteProductOpen ? 'delete' : '';
    
    const urlNeedsUpdate = currentProduct !== expectedProduct;

    if (!urlNeedsUpdate) return;

    const params = new URLSearchParams(searchParams.toString());
    
    if (isCreateProductOpen) {
      params.set('product', 'create');
      // Supprimer le paramètre step
      params.delete('step');
    } else if (isEditProductOpen) {
      params.set('product', 'edit');
      // TODO: Ajouter l'ID du produit si nécessaire
      params.delete('step');
    } else if (isDeleteProductOpen) {
      params.set('product', 'delete');
      // TODO: Ajouter l'ID du produit si nécessaire
      params.delete('step');
    } else {
      params.delete('product');
      params.delete('step');
    }

    // Mettre à jour la référence avant de changer l'URL
    lastUrlState.current = { 
      product: params.get('product') || '', 
      step: '' 
    };

    router.replace(`?${params.toString()}`, { scroll: false });
  }, [isCreateProductOpen, isEditProductOpen, isDeleteProductOpen, searchParams, router]);

  return {
    isCreateProductOpen,
    isEditProductOpen,
    isDeleteProductOpen,
    currentStep,
  };
};
