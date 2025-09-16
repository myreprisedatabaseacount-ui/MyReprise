import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../BaseQuery';

export const AddressApi = createApi({
  reducerPath: 'AddressApi',
  baseQuery: baseQuery,
  tagTypes: ['Address'],
  endpoints: (builder) => ({
    // Query pour rechercher des localisations par terme de recherche
    searchLocations: builder.mutation({
      query: (searchTerm) => ({
        url: '/api/addresses/search',
        method: 'POST',
        body: { searchedTerm: searchTerm },
      }),
      invalidatesTags: ['Address'],
    }),

    // Query pour récupérer une adresse par ID
    getAddressById: builder.query({
      query: (id) => `/api/addresses/${id}`,
      providesTags: (result, error, id) => [{ type: 'Address', id }],
    }),

    // Query pour récupérer toutes les adresses (avec pagination)
    getAllAddresses: builder.query({
      query: (params = {}) => ({
        url: '/api/addresses',
        params: params
      }),
      providesTags: ['Address'],
    }),
  }),
});

export const {
  useSearchLocationsMutation,
  useGetAddressByIdQuery,
  useGetAllAddressesQuery,
} = AddressApi;
