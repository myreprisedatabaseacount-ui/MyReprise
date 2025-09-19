import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../BaseQuery';

export const RecommendationApi = createApi({
  reducerPath: 'RecommendationApi',
  baseQuery: baseQuery,
  tagTypes: ['Recommendation'],
  endpoints: (builder) => ({
    // Query pour récupérer les recommandations d'échange pour une offre
    getExchangeRecommendations: builder.query({
      query: ({ offerId, limit = 10 }) => ({
        url: `/api/recommendations/exchange/${offerId}`,
        params: { limit }
      }),
      providesTags: (result, error, { offerId }) => [
        { type: 'Recommendation', id: offerId }
      ],
    }),

    // Query pour récupérer toutes les recommandations d'un utilisateur
    getUserRecommendations: builder.query({
      query: ({ userId, limit = 20 }) => ({
        url: `/api/recommendations/user/${userId}`,
        params: { limit }
      }),
      providesTags: (result, error, { userId }) => [
        { type: 'Recommendation', id: `user-${userId}` }
      ],
    }),
  }),
});

export const {
  useGetExchangeRecommendationsQuery,
  useGetUserRecommendationsQuery,
} = RecommendationApi;
