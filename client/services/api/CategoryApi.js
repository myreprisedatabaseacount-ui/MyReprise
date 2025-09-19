import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../BaseQuery';

export const CategoryApi = createApi({
  reducerPath: 'CategoryApi',
  baseQuery: baseQuery,
  tagTypes: ['Category'],
  endpoints: (builder) => ({
    // Query pour récupérer les catégories par type de listing
    getCategoriesByListingType: builder.query({
      query: (listingType) => `/api/categories/listing-type/${listingType}`,
      providesTags: (result, error, listingType) => [{ type: 'Category', id: listingType }],
    }),

    // Query pour récupérer toutes les catégories
    getAllCategories: builder.query({
      query: (params = {}) => ({
        url: '/api/categories',
        params: params
      }),
      providesTags: ['Category'],
    }),
  }),
});

export const {
  useGetCategoriesByListingTypeQuery,
  useGetAllCategoriesQuery,
} = CategoryApi;