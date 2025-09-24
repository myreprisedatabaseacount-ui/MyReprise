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
      // Ne pas mettre en cache si erreur d'authentification
      keepUnusedDataFor: 0,
    }),
    
    // Récupérer les informations complètes du store (avec statistiques)
    getStoreInfo: builder.query({
      query: (userId) => `/api/stores/${userId}/info`,
      providesTags: (result, error, userId) => [{ type: 'UserStore', id: `info-${userId}` }],
      // Ne pas mettre en cache si erreur d'authentification
      keepUnusedDataFor: 0,
    }),
    
    // Mettre à jour le store avec upload de fichiers
    updateStore: builder.mutation({
      query: ({ userId, storeData }) => {
        const formData = new FormData();

        // Ajouter les données textuelles
        formData.append('name', storeData.name);
        formData.append('description', storeData.description);
        formData.append('primaryColor', storeData.primaryColor);
        formData.append('secondaryColor', storeData.secondaryColor);

        // Ajouter les fichiers si ce sont des objets File
        if (storeData.logo && storeData.logo instanceof File) {
          formData.append('logo', storeData.logo);
        }

        if (storeData.banner && storeData.banner instanceof File) {
          formData.append('banner', storeData.banner);
        }

        return {
          url: `/api/stores/${userId}`,
          method: 'PUT',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { userId }) => [
        { type: 'UserStore', id: userId },
        { type: 'UserStore', id: `info-${userId}` }
      ],
    }),

    // Mettre à jour le store avec URLs Cloudinary (si les fichiers sont déjà uploadés)
    updateStoreWithUrls: builder.mutation({
      query: ({ userId, storeData }) => ({
        url: `/api/stores/${userId}/urls`,
        method: 'PUT',
        body: {
          name: storeData.name,
          description: storeData.description,
          primaryColor: storeData.primaryColor,
          secondaryColor: storeData.secondaryColor,
          logo: storeData.logo, // URL Cloudinary
          banner: storeData.banner, // URL Cloudinary
        },
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
  useUpdateStoreWithUrlsMutation,
  useCreateStoreMutation,
} = userStoreApi;
