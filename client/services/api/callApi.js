import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { SERVER_GATEWAY_DOMAIN } from '../BaseQuery';

export const callApi = createApi({
  reducerPath: 'callApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${SERVER_GATEWAY_DOMAIN}/api/calls`,
    credentials: 'include',
    prepareHeaders: async (headers, { getState, endpoint }) => {
      // Récupérer le token depuis le localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // Ajouter le token d'authentification si disponible
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
        headers.set('token', token); // Support pour le header 'token' aussi
      }
      
      return headers;
    },
  }),
  tagTypes: ['Calls'],
  endpoints: (builder) => ({
    getStreamToken: builder.query({
      query: () => '/token',
      transformResponse: (response) => response,
    }),
  }),
});

export const {
  useGetStreamTokenQuery,
} = callApi;
