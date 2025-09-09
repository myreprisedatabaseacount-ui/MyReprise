'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetCurrentUserQuery } from '../api/UserApi';
import {
  setCurrentUser,
  clearCurrentUser,
  setLoading,
  setError,
  selectCurrentUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectUserError,
  selectIsDataFresh,
  UserState,
} from '../slices/userSlice';

// Hook personnalisé pour gérer l'utilisateur connecté
export const useCurrentUser = () => {
  const dispatch = useDispatch();
  
  // Sélecteurs Redux
  const currentUser = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectUserError);
  const isDataFresh = useSelector(selectIsDataFresh);

  // RTK Query pour récupérer l'utilisateur actuel
  const {
    data: userData,
    error: queryError,
    isLoading: queryLoading,
    refetch,
  } = useGetCurrentUserQuery(undefined, {
    // Ne pas exécuter automatiquement si on a des données fraîches
    skip: isDataFresh,
  });

  // Effet pour synchroniser les données RTK Query avec Redux
  useEffect(() => {
    if (queryLoading) {
      dispatch(setLoading(true));
    } else {
      dispatch(setLoading(false));
    }

    if (queryError) {
      const errorMessage = (queryError as any)?.data?.error || 'Erreur lors de la récupération de l\'utilisateur';
      dispatch(setError(errorMessage));
      
      // Si erreur 401, déconnecter l'utilisateur
      if ((queryError as any)?.status === 401) {
        dispatch(clearCurrentUser());
      }
    } else if (userData?.success && userData.data?.user) {
      dispatch(setCurrentUser(userData.data.user));
    }
  }, [userData, queryError, queryLoading, dispatch]);

  // Fonction pour forcer le rafraîchissement des données
  const refreshUser = () => {
    refetch();
  };

  // Fonction pour déconnecter l'utilisateur
  const logout = () => {
    dispatch(clearCurrentUser());
  };

  return {
    // Données utilisateur
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    isDataFresh,
    
    // Actions
    refreshUser,
    logout,
    
    // Données brutes de RTK Query (pour debug)
    userData,
    queryError,
    queryLoading,
  };
};

// Hook pour vérifier les permissions
export const useUserPermissions = () => {
  const currentUser = useSelector(selectCurrentUser);
  
  const isAdmin = currentUser?.role === 'admin';
  const isModerator = currentUser?.role === 'moderator' || currentUser?.role === 'admin';
  const isClient = currentUser?.role === 'client';
  const isVerified = currentUser?.isVerified || false;
  
  const hasRole = (role: string) => currentUser?.role === role;
  const hasAnyRole = (roles: string[]) => roles.includes(currentUser?.role || '');
  
  return {
    isAdmin,
    isModerator,
    isClient,
    isVerified,
    hasRole,
    hasAnyRole,
    userRole: currentUser?.role,
  };
};

// Hook pour les informations d'affichage de l'utilisateur
export const useUserDisplay = () => {
  const currentUser = useSelector(selectCurrentUser);
  
  const fullName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : '';
  const initials = currentUser 
    ? `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase()
    : '';
  
  const displayName = fullName || currentUser?.primaryIdentifier || 'Utilisateur';
  
  const formattedPhone = currentUser?.phone ? 
    currentUser.phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5') : '';
  
  return {
    fullName,
    initials,
    displayName,
    formattedPhone,
    email: currentUser?.email,
    phone: currentUser?.phone,
  };
};
