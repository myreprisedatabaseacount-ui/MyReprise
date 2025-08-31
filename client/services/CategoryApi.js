import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from './BaseQuery';

export const CategoryApi = createApi({
  reducerPath: 'CategoryApi',
  baseQuery: baseQuery,
  endpoints: (builder) => ({
    // Mutation pour ajouter une catégorie
    insertCategory: builder.mutation({
      query: (categoryData) => ({
        url: '/categories',
        method: 'POST',
        body: {
          ...categoryData,
          imageUrl: categoryData.imageUrl,
        },
      }),
      invalidatesTags: ['Category'],
    }),
  }),
});

export const {
  useInsertCategoryMutation,
} = CategoryApi;
