'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../lib/store';
import {
  openLoginModal,
  openSignUpModal,
  openForgotPasswordModal,
  closeAllModals,
  setCurrentStep,
} from '../slices/authSlice';

export const useAuthUrlSync = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { isLoginOpen, isSignUpOpen, isForgotPasswordOpen, currentStep } = useSelector((state: RootState) => state.auth);
  
  // Ref pour éviter les boucles infinies
  const isInitialized = useRef(false);
  const lastUrlState = useRef({ auth: '', step: '' });

  // Synchroniser l'URL vers Redux au chargement (une seule fois)
  useEffect(() => {
    if (isInitialized.current) return;
    
    const authModal = searchParams.get('auth');
    const step = searchParams.get('step');

    // Mettre à jour la référence
    lastUrlState.current = { auth: authModal || '', step: step || '' };

    if (authModal === 'login') {
      dispatch(openLoginModal());
      if (step) {
        dispatch(setCurrentStep(parseInt(step)));
      }
    } else if (authModal === 'signup') {
      dispatch(openSignUpModal());
    } else if (authModal === 'forgot-password') {
      dispatch(openForgotPasswordModal());
    } else {
      dispatch(closeAllModals());
    }
    
    isInitialized.current = true;
  }, [searchParams, dispatch]);

  // Synchroniser Redux vers l'URL (seulement si l'état a changé)
  useEffect(() => {
    if (!isInitialized.current) return;

    const currentAuth = searchParams.get('auth');
    const currentStepParam = searchParams.get('step');
    
    // Vérifier si l'URL a déjà été mise à jour
    const expectedAuth = isLoginOpen ? 'login' : isSignUpOpen ? 'signup' : isForgotPasswordOpen ? 'forgot-password' : '';
    const expectedStep = isLoginOpen && currentStep > 1 ? currentStep.toString() : '';
    
    const urlNeedsUpdate = 
      currentAuth !== expectedAuth || 
      currentStepParam !== expectedStep;

    if (!urlNeedsUpdate) return;

    const params = new URLSearchParams(searchParams.toString());
    
    if (isLoginOpen) {
      params.set('auth', 'login');
      if (currentStep > 1) {
        params.set('step', currentStep.toString());
      } else {
        params.delete('step');
      }
    } else if (isSignUpOpen) {
      params.set('auth', 'signup');
      params.delete('step');
    } else {
      params.delete('auth');
      params.delete('step');
    }

    // Mettre à jour la référence avant de changer l'URL
    lastUrlState.current = { 
      auth: params.get('auth') || '', 
      step: params.get('step') || '' 
    };

    router.replace(`?${params.toString()}`, { scroll: false });
  }, [isLoginOpen, isSignUpOpen, isForgotPasswordOpen, currentStep, searchParams, router]);

  return {
    isLoginOpen,
    isSignUpOpen,
    isForgotPasswordOpen,
    currentStep,
  };
};
