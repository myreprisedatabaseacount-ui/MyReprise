import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const SERVER_GATEWAY_DOMAIN =
  process.env.NEXT_PUBLIC_SERVER_GATEWAY_DOMAIN || 'http://localhost:8083';

const baseQuery = fetchBaseQuery({
  baseUrl: SERVER_GATEWAY_DOMAIN + '/api/',
  credentials: 'include',
  prepareHeaders: async (headers, { getState }) => {
    return headers;
  },
});

export default baseQuery;

