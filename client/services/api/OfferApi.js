import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../BaseQuery';

export const OfferApi = createApi({
  reducerPath: 'OfferApi',
  baseQuery: baseQuery,
  tagTypes: ['Offer'],
  endpoints: (builder) => ({
    // Mutation pour créer une offre avec uploads de fichiers
    createOffer: builder.mutation({
      query: (offerData) => {
        const formData = new FormData();
        
        // Ajouter les données textuelles
        formData.append('title', offerData.title);
        formData.append('description', offerData.description);
        formData.append('price', offerData.price.toString());
        formData.append('status', offerData.status || 'available');
        formData.append('productCondition', offerData.productCondition || 'good');
        formData.append('listingType', offerData.listingType);
        
        // Ajouter les IDs de référence
        if (offerData.sellerId) formData.append('sellerId', offerData.sellerId.toString());
        if (offerData.categoryId) formData.append('categoryId', offerData.categoryId.toString());
        if (offerData.brandId) formData.append('brandId', offerData.brandId.toString());
        if (offerData.subjectId) formData.append('subjectId', offerData.subjectId.toString());
        if (offerData.addressId) formData.append('addressId', offerData.addressId.toString());
        
        // Ajouter les données spécifiques au type de listing (structure flexible)
        if (offerData.specificData) {
          formData.append('specificData', JSON.stringify(offerData.specificData));
        }
        
        // Ajouter la localisation
        if (offerData.location) {
          formData.append('location', JSON.stringify(offerData.location));
        }
        
        // Ajouter les fichiers images
        if (offerData.images && offerData.images.length > 0) {
          offerData.images.forEach((image, index) => {
            if (image instanceof File) {
              formData.append(`images`, image);
            }
          });
        }
        
        return {
          url: '/api/offers/create',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Offer'],
    }),

    // Mutation pour créer une offre avec URLs Cloudinary (si les fichiers sont déjà uploadés)
    createOfferWithUrls: builder.mutation({
      query: (offerData) => ({
        url: '/api/offers/create-with-urls',
        method: 'POST',
        body: {
          title: offerData.title,
          description: offerData.description,
          price: offerData.price,
          status: offerData.status || 'available',
          productCondition: offerData.productCondition || 'good',
          listingType: offerData.listingType,
          sellerId: offerData.sellerId,
          categoryId: offerData.categoryId,
          brandId: offerData.brandId,
          subjectId: offerData.subjectId,
          images: offerData.images, // URLs Cloudinary
          // Données spécifiques
          vehicleType: offerData.vehicleType,
          year: offerData.year,
          brand: offerData.brand,
          model: offerData.model,
          mileage: offerData.mileage,
          propertyType: offerData.propertyType,
          area: offerData.area,
          bedrooms: offerData.bedrooms,
          bathrooms: offerData.bathrooms,
          itemType: offerData.itemType,
          condition: offerData.condition,
          location: offerData.location,
        },
      }),
      invalidatesTags: ['Offer'],
    }),

    // Query pour récupérer toutes les offres avec filtres
    getOffers: builder.query({
      query: (params = {}) => ({
        url: '/api/offers',
        params: params
      }),
      providesTags: ['Offer'],
    }),

    // Query pour récupérer les offres par vendeur
    getOffersBySeller: builder.query({
      query: ({ sellerId, page = 1, limit = 10, search, status, category }) => ({
        url: `/api/offers/seller/${sellerId}`,
        params: { 
          page, 
          limit,
          ...(search && { search }),
          ...(status && { status }),
          ...(category && { category })
        }
      }),
      providesTags: (result, error, { sellerId }) => [{ type: 'Offer', id: sellerId }],
    }),

    // Query pour récupérer les offres par catégorie
    getOffersByCategory: builder.query({
      query: (categoryId) => `/api/offers/category/${categoryId}`,
      providesTags: (result, error, categoryId) => [{ type: 'Offer', id: categoryId }],
    }),

    // Query pour récupérer une offre par ID
    getOfferById: builder.query({
      query: (id) => `/api/offers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Offer', id }],
    }),

    // Mutation pour mettre à jour une offre avec upload de fichiers
    updateOffer: builder.mutation({
      query: ({ id, ...offerData }) => {
        const formData = new FormData();
        
        // Ajouter les données textuelles
        formData.append('title', offerData.title);
        formData.append('description', offerData.description);
        formData.append('price', offerData.price.toString());
        formData.append('status', offerData.status || 'available');
        formData.append('productCondition', offerData.productCondition || 'good');
        formData.append('listingType', offerData.listingType);
        
        // Ajouter les IDs de référence
        if (offerData.sellerId) formData.append('sellerId', offerData.sellerId.toString());
        if (offerData.categoryId) formData.append('categoryId', offerData.categoryId.toString());
        if (offerData.brandId) formData.append('brandId', offerData.brandId.toString());
        if (offerData.subjectId) formData.append('subjectId', offerData.subjectId.toString());
        
        // Ajouter les fichiers si ce sont des objets File
        if (offerData.images && offerData.images.length > 0) {
          offerData.images.forEach((image) => {
            if (image instanceof File) {
              formData.append('images', image);
            }
          });
        }
        
        return {
          url: `/api/offers/${id}`,
          method: 'PUT',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'Offer', id }],
    }),

    // Mutation pour mettre à jour une offre avec URLs Cloudinary
    updateOfferWithUrls: builder.mutation({
      query: ({ id, ...offerData }) => ({
        url: `/api/offers/${id}/urls`,
        method: 'PUT',
        body: {
          title: offerData.title,
          description: offerData.description,
          price: offerData.price,
          status: offerData.status || 'available',
          productCondition: offerData.productCondition || 'good',
          listingType: offerData.listingType,
          sellerId: offerData.sellerId,
          categoryId: offerData.categoryId,
          brandId: offerData.brandId,
          subjectId: offerData.subjectId,
          images: offerData.images, // URLs Cloudinary
        },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Offer', id }],
    }),

    // Mutation pour supprimer une offre
    deleteOffer: builder.mutation({
      query: (id) => ({
        url: `/api/offers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Offer'],
    }),

    // Mutation pour archiver une offre
    archiveOffer: builder.mutation({
      query: (id) => ({
        url: `/api/offers/${id}/archive`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Offer', id }],
    }),

    // Mutation pour échanger une offre
    exchangeOffer: builder.mutation({
      query: ({ id, replacedByOfferId }) => ({
        url: `/api/offers/${id}/exchange`,
        method: 'PUT',
        body: { replacedByOfferId },
      }),
      invalidatesTags: ['Offer'],
    }),

    // Query pour rechercher des offres
    searchOffers: builder.query({
      query: ({ searchTerm, filters = {} }) => ({
        url: '/api/offers/search',
        params: { search: searchTerm, ...filters }
      }),
      providesTags: ['Offer'],
    }),

    // Query pour récupérer les offres de l'utilisateur connecté
    getMyOffers: builder.query({
      query: () => ({
        url: '/api/offers/my-offers',
      }),
      providesTags: ['Offer'],
    }),

    // Mutation pour changer le statut d'une offre
    updateOfferStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/api/offers/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Offer', id }],
    }),

  }),
});

export const {
  useCreateOfferMutation,
  useCreateOfferWithUrlsMutation,
  useGetOffersQuery,
  useGetOffersBySellerQuery,
  useGetOffersByCategoryQuery,
  useGetOfferByIdQuery,
  useUpdateOfferMutation,
  useUpdateOfferWithUrlsMutation,
  useDeleteOfferMutation,
  useArchiveOfferMutation,
  useExchangeOfferMutation,
  useSearchOffersQuery,
  useUpdateOfferStatusMutation,
  useGetMyOffersQuery,
} = OfferApi;
