import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../BaseQuery';

export const RepriseOrderApi = createApi({
  reducerPath: 'RepriseOrderApi',
  baseQuery: baseQuery,
  tagTypes: ['RepriseOrder'],
  endpoints: (builder) => ({
    createRepriseOrder: builder.mutation({
      query: (payload) => ({
        url: '/api/reprise-orders',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['RepriseOrder'],
    }),
  }),
});

export const { useCreateRepriseOrderMutation } = RepriseOrderApi;


