import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const SERVER_GATEWAY_DOMAIN =
  process.env.NEXT_PUBLIC_SERVER_DOMAIN || 'http://localhost:3001';

const baseQuery = fetchBaseQuery({
  baseUrl: SERVER_GATEWAY_DOMAIN,
  credentials: 'include',
  prepareHeaders: async (headers, { getState }) => {
    return headers;
  },
});

export default baseQuery;

