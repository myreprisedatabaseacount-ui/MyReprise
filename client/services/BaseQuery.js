import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const SERVER_GATEWAY_DOMAIN =
  process.env.NEXT_PUBLIC_SERVER_DOMAIN || 'http://localhost:3001';

const baseQuery = fetchBaseQuery({
  baseUrl: SERVER_GATEWAY_DOMAIN,
  credentials: 'include',
  prepareHeaders: async (headers, { getState, endpoint }) => {
    // Récupérer le token depuis le localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // Ajouter le token d'authentification si disponible
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    // Ne pas ajouter Content-Type pour FormData (laisser le navigateur le gérer)
    if (headers.get('content-type')?.includes('multipart/form-data')) {
      headers.delete('content-type');
    }
    
    return headers;
  },
});

// BaseQuery avec retry automatique et gestion des erreurs 401
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // Si on reçoit une erreur 401 (non autorisé)
  if (result.error && result.error.status === 401) {
    // Essayer de rafraîchir le token
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    
    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/api/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      );
      
      if (refreshResult.data) {
        // Sauvegarder le nouveau token
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', refreshResult.data.token);
        }
        
        // Retry la requête originale avec le nouveau token
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Si le refresh échoue, supprimer les tokens et rediriger vers login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }
    } else {
      // Pas de refresh token, supprimer les tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
  }
  
  return result;
};

export default baseQueryWithReauth;

