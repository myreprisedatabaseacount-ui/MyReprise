import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { SERVER_GATEWAY_DOMAIN } from '../BaseQuery';

export const reactionsApi = createApi({
  reducerPath: 'reactionsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${SERVER_GATEWAY_DOMAIN}/api/reactions`,
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
  tagTypes: ['Reactions'],
  endpoints: (builder) => ({
    // Toggle une réaction sur un message
    toggleReaction: builder.mutation({
      query: ({ messageId, reactionType }) => ({
        url: '/toggle',
        method: 'POST',
        body: { messageId, reactionType },
      }),
      invalidatesTags: ['Reactions'],
      transformResponse: (response) => response.data,
    }),

    // Récupérer les réactions d'un message
    getMessageReactions: builder.query({
      query: (messageId) => `/message/${messageId}`,
      providesTags: (result, error, messageId) => [
        { type: 'Reactions', id: messageId }
      ],
      transformResponse: (response) => response.data,
    }),

    // Supprimer toutes les réactions d'un message
    deleteMessageReactions: builder.mutation({
      query: (messageId) => ({
        url: `/message/${messageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reactions'],
      transformResponse: (response) => response.data,
    }),
  }),
});

export const {
  useToggleReactionMutation,
  useGetMessageReactionsQuery,
  useDeleteMessageReactionsMutation,
} = reactionsApi;
