import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { SERVER_GATEWAY_DOMAIN } from '../BaseQuery';

export const conversationsApi = createApi({
  reducerPath: 'conversationsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${SERVER_GATEWAY_DOMAIN}/api/conversations`,
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
  tagTypes: ['Conversations', 'Conversation'],
  endpoints: (builder) => ({
    // Récupérer la liste des conversations
    getConversations: builder.query({
      query: () => '',
      providesTags: ['Conversations'],
      transformResponse: (response) => response.data,
    }),

    // Récupérer les informations d'une conversation spécifique
    getConversation: builder.query({
      query: (conversationId) => `/${conversationId}`,
      providesTags: (result, error, conversationId) => [{ type: 'Conversation', id: conversationId }],
      transformResponse: (response) => response.data.conversation,
    }),

    // Créer ou récupérer une conversation avec un utilisateur
    createConversation: builder.mutation({
      query: ({ friendId, type = 'chat' }) => ({
        url: `/${friendId}`,
        method: 'POST',
        body: { type },
      }),
      invalidatesTags: ['Conversations'],
      transformResponse: (response) => response.data.conversation,
    }),

    // Marquer tous les messages d'une conversation comme lus
    markConversationAsRead: builder.mutation({
      query: (conversationId) => ({
        url: `/${conversationId}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Conversations'],
      transformResponse: (response) => response.data,
    }),

    // Récupérer les messages d'une conversation
    getConversationMessages: builder.query({
      query: ({ conversationId, limit = 50, offset = 0 }) => 
        `/${conversationId}/messages?limit=${limit}&offset=${offset}`,
      providesTags: (result, error, { conversationId }) => [
        { type: 'Conversation', id: conversationId },
        { type: 'Messages', id: conversationId }
      ],
      transformResponse: (response) => response.data,
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetConversationQuery,
  useCreateConversationMutation,
  useMarkConversationAsReadMutation,
  useGetConversationMessagesQuery,
} = conversationsApi;
