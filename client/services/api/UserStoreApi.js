import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseQuery from "../BaseQuery";

export const userStoreApi = createApi({
  reducerPath: 'userStoreApi',
  baseQuery: baseQuery,
  tagTypes: ['UserStore'],
  endpoints: (builder) => ({
    // Récupérer le store d'un utilisateur
    getStoreByUser: builder.query({
      query: (userId) => `/api/stores/${userId}`,
      providesTags: (result, error, userId) => [{ type: 'UserStore', id: userId }],
    }),
    
    // Récupérer les informations complètes du store (avec statistiques)
    getStoreInfo: builder.query({
      query: (userId) => `/api/stores/${userId}/info`,
      providesTags: (result, error, userId) => [{ type: 'UserStore', id: `info-${userId}` }],
    }),
    
    // Mettre à jour le store
    updateStore: builder.mutation({
      query: ({ userId, ...storeData }) => ({
        url: `/api/stores/${userId}`,
        method: 'PUT',
        body: storeData,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'UserStore', id: userId },
        { type: 'UserStore', id: `info-${userId}` }
      ],
    }),
    
    // Créer un store
    createStore: builder.mutation({
      query: (storeData) => ({
        url: '/api/stores',
        method: 'POST',
        body: storeData,
      }),
      invalidatesTags: ['UserStore'],
    }),
  }),
});

export const {
  useGetStoreByUserQuery,
  useGetStoreInfoQuery,
  useUpdateStoreMutation,
  useCreateStoreMutation,
} = userStoreApi;
