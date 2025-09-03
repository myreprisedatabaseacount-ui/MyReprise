import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../lib/store';
import {
  openLoginModal,
  openSignUpModal,
  openForgotPasswordModal,
  closeLoginModal,
  closeSignUpModal,
  closeForgotPasswordModal,
  closeAllModals,
  switchToSignUp,
  switchToLogin,
  switchToForgotPassword,
  setAuthStatus,
  setAuthError,
  setCurrentStep,
  resetAuthState,
} from '../slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);

  return {
    // État
    ...authState,
    
    // Actions pour ouvrir les modales
    openLogin: () => dispatch(openLoginModal()),
    openSignUp: () => dispatch(openSignUpModal()),
    openForgotPassword: () => dispatch(openForgotPasswordModal()),
    
    // Actions pour fermer les modales
    closeLogin: () => dispatch(closeLoginModal()),
    closeSignUp: () => dispatch(closeSignUpModal()),
    closeForgotPassword: () => dispatch(closeForgotPasswordModal()),
    closeAll: () => dispatch(closeAllModals()),
    
    // Actions pour basculer entre les modales
    switchToSignUp: () => dispatch(switchToSignUp()),
    switchToLogin: () => dispatch(switchToLogin()),
    switchToForgotPassword: () => dispatch(switchToForgotPassword()),
    
    // Actions pour gérer le statut
    setStatus: (status: 'idle' | 'loading' | 'success' | 'error') => 
      dispatch(setAuthStatus(status)),
    setError: (error: string | null) => dispatch(setAuthError(error)),
    
    // Action pour gérer l'étape
    setStep: (step: number) => dispatch(setCurrentStep(step)),
    
    // Action pour réinitialiser
    reset: () => dispatch(resetAuthState()),
  };
};
