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
    listReceivedOrdersOnMyOffers: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: `/api/reprise-orders/received-orders-on-my-offers?page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['RepriseOrder'],
      keepUnusedDataFor: 60,
    }),
    listSendedOrdersOnMyOffers: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: `/api/reprise-orders/sended-orders-on-my-offers?page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['RepriseOrder'],
      keepUnusedDataFor: 60,
    }),
    getOrderDetails: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams();
        if (params.offerId) qs.set('offerId', params.offerId);
        if (params.month) qs.set('month', params.month);
        if (params.senderId) qs.set('senderId', params.senderId);
        if (params.page) qs.set('page', String(params.page));
        if (params.limit) qs.set('limit', String(params.limit));
        const queryString = qs.toString();
        return {
          url: `/api/reprise-orders/order-details${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: ['RepriseOrder'],
      keepUnusedDataFor: 60,
    }),
    getNegotiationInitByOrderId: builder.query({
      query: (orderId) => ({
        url: `/api/reprise-orders/negotiation-init/${orderId}`,
        method: 'GET',
      }),
      providesTags: ['RepriseOrder'],
      keepUnusedDataFor: 60,
    }),
  }),
});

export const { useCreateRepriseOrderMutation, useListReceivedOrdersOnMyOffersQuery, useListSendedOrdersOnMyOffersQuery, useGetOrderDetailsQuery, useGetNegotiationInitByOrderIdQuery } = RepriseOrderApi;


