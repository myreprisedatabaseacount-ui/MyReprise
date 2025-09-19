import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../BaseQuery';

export const OfferCategoryApi = createApi({
  reducerPath: 'OfferCategoryApi',
  baseQuery: baseQuery,
  tagTypes: ['OfferCategory'],
  endpoints: (builder) => ({
    // Mutation pour ajouter une catégorie à une offre
    addCategoryToOffer: builder.mutation({
      query: ({ offerId, categoryId }) => ({
        url: '/api/offer-categories/add',
        method: 'POST',
        body: { offerId, categoryId }
      }),
      invalidatesTags: (result, error, { offerId }) => [
        { type: 'OfferCategory', id: offerId },
        { type: 'OfferCategory', id: 'LIST' }
      ],
    }),

    // Mutation pour supprimer une catégorie d'une offre
    removeCategoryFromOffer: builder.mutation({
      query: ({ offerId, categoryId }) => ({
        url: '/api/offer-categories/remove',
        method: 'POST',
        body: { offerId, categoryId }
      }),
      invalidatesTags: (result, error, { offerId }) => [
        { type: 'OfferCategory', id: offerId },
        { type: 'OfferCategory', id: 'LIST' }
      ],
    }),

    // Query pour récupérer les catégories d'une offre
    getCategoriesByOffer: builder.query({
      query: (offerId) => `/api/offer-categories/offer/${offerId}`,
      providesTags: (result, error, offerId) => [
        { type: 'OfferCategory', id: offerId }
      ],
    }),

    // Query pour récupérer les offres d'une catégorie
    getOffersByCategory: builder.query({
      query: (categoryId) => `/api/offer-categories/category/${categoryId}`,
      providesTags: (result, error, categoryId) => [
        { type: 'OfferCategory', id: categoryId }
      ],
    }),

    // Query pour vérifier si une relation existe
    checkRelationExists: builder.query({
      query: ({ offerId, categoryId }) => ({
        url: '/api/offer-categories/exists',
        params: { offerId, categoryId }
      }),
    }),

    // Query pour récupérer les statistiques des relations
    getRelationStats: builder.query({
      query: () => '/api/offer-categories/stats',
      providesTags: ['OfferCategory'],
    }),
  }),
});

export const {
  useAddCategoryToOfferMutation,
  useRemoveCategoryFromOfferMutation,
  useGetCategoriesByOfferQuery,
  useGetOffersByCategoryQuery,
  useCheckRelationExistsQuery,
  useGetRelationStatsQuery,
} = OfferCategoryApi;
