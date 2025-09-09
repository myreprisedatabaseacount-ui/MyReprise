import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Interface pour les informations de l'utilisateur connecté
export interface CurrentUser {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  primaryIdentifier: string;
  authProvider: string;
  role: 'admin' | 'client' | 'moderator';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface pour l'état du slice
export interface UserState {
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

// État initial
const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  lastFetch: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Action pour définir l'utilisateur connecté
    setCurrentUser: (state, action: PayloadAction<CurrentUser>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
      state.error = null;
      state.lastFetch = Date.now();
    },

    // Action pour effacer l'utilisateur (déconnexion)
    clearCurrentUser: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.error = null;
      state.lastFetch = null;
    },

    // Action pour définir l'état de chargement
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Action pour définir une erreur
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    // Action pour mettre à jour les informations de l'utilisateur
    updateUserInfo: (state, action: PayloadAction<Partial<CurrentUser>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
        state.lastFetch = Date.now();
      }
    },

    // Action pour marquer l'utilisateur comme vérifié
    markUserAsVerified: (state) => {
      if (state.currentUser) {
        state.currentUser.isVerified = true;
        state.lastFetch = Date.now();
      }
    },

    // Action pour réinitialiser l'état
    resetUserState: (state) => {
      return initialState;
    },
  },
});

// Export des actions
export const {
  setCurrentUser,
  clearCurrentUser,
  setLoading,
  setError,
  updateUserInfo,
  markUserAsVerified,
  resetUserState,
} = userSlice.actions;

// Sélecteurs
export const selectCurrentUser = (state: { user: UserState }) => state.user.currentUser;
export const selectIsAuthenticated = (state: { user: UserState }) => state.user.isAuthenticated;
export const selectIsLoading = (state: { user: UserState }) => state.user.isLoading;
export const selectUserError = (state: { user: UserState }) => state.user.error;
export const selectUserRole = (state: { user: UserState }) => state.user.currentUser?.role;
export const selectIsVerified = (state: { user: UserState }) => state.user.currentUser?.isVerified;
export const selectIsAdmin = (state: { user: UserState }) => state.user.currentUser?.role === 'admin';
export const selectIsModerator = (state: { user: UserState }) => 
  state.user.currentUser?.role === 'moderator' || state.user.currentUser?.role === 'admin';

// Sélecteur pour vérifier si les données sont récentes (moins de 5 minutes)
export const selectIsDataFresh = (state: { user: UserState }) => {
  if (!state.user.lastFetch) return false;
  return Date.now() - state.user.lastFetch < 5 * 60 * 1000; // 5 minutes
};

// Sélecteur pour obtenir le nom complet de l'utilisateur
export const selectFullName = (state: { user: UserState }) => {
  const user = state.user.currentUser;
  if (!user) return '';
  return `${user.firstName} ${user.lastName}`.trim();
};

// Sélecteur pour obtenir l'identifiant principal formaté
export const selectFormattedIdentifier = (state: { user: UserState }) => {
  const user = state.user.currentUser;
  if (!user) return '';
  
  switch (user.authProvider) {
    case 'phone':
      return user.phone;
    case 'email':
      return user.email || '';
    case 'google':
      return user.email || '';
    case 'facebook':
      return user.email || '';
    default:
      return user.primaryIdentifier;
  }
};

export default userSlice.reducer;
