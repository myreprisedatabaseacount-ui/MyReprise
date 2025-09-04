import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthModalState {
  isLoginOpen: boolean;
  isSignUpOpen: boolean;
  isForgotPasswordOpen: boolean;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  currentStep: number; // Pour garder l'étape OTP
}

const initialState: AuthModalState = {
  isLoginOpen: false,
  isSignUpOpen: false,
  isForgotPasswordOpen: false,
  status: 'idle',
  error: null,
  currentStep: 1,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Actions pour ouvrir les modales
    openLoginModal: (state) => {
      state.isLoginOpen = true;
      state.isSignUpOpen = false;
      state.isForgotPasswordOpen = false;
      state.error = null;
    },
    openSignUpModal: (state) => {
      state.isSignUpOpen = true;
      state.isLoginOpen = false;
      state.isForgotPasswordOpen = false;
      state.error = null;
    },
    openForgotPasswordModal: (state) => {
      state.isForgotPasswordOpen = true;
      state.isLoginOpen = false;
      state.isSignUpOpen = false;
      state.error = null;
    },
    
    // Actions pour fermer les modales
    closeLoginModal: (state) => {
      state.isLoginOpen = false;
      state.error = null;
    },
    closeSignUpModal: (state) => {
      state.isSignUpOpen = false;
      state.error = null;
    },
    closeForgotPasswordModal: (state) => {
      state.isForgotPasswordOpen = false;
      state.error = null;
    },
    
    // Action pour fermer toutes les modales
    closeAllModals: (state) => {
      state.isLoginOpen = false;
      state.isSignUpOpen = false;
      state.isForgotPasswordOpen = false;
      state.error = null;
    },
    
    // Actions pour basculer entre les modales
    switchToSignUp: (state) => {
      state.isLoginOpen = false;
      state.isSignUpOpen = true;
      state.isForgotPasswordOpen = false;
      state.error = null;
    },
    switchToLogin: (state) => {
      state.isSignUpOpen = false;
      state.isLoginOpen = true;
      state.isForgotPasswordOpen = false;
      state.error = null;
    },
    switchToForgotPassword: (state) => {
      state.isLoginOpen = false;
      state.isSignUpOpen = false;
      state.isForgotPasswordOpen = true;
      state.error = null;
    },
    
    // Actions pour gérer le statut
    setAuthStatus: (state, action: PayloadAction<'idle' | 'loading' | 'success' | 'error'>) => {
      state.status = action.payload;
    },
    
    // Action pour gérer les erreurs
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.status = 'error';
    },
    
    // Action pour gérer l'étape (OTP)
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    
    // Action pour réinitialiser l'état
    resetAuthState: (state) => {
      state.isLoginOpen = false;
      state.isSignUpOpen = false;
      state.isForgotPasswordOpen = false;
      state.status = 'idle';
      state.error = null;
      state.currentStep = 1;
    },
  },
});

export const {
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
} = authSlice.actions;

export default authSlice.reducer;
