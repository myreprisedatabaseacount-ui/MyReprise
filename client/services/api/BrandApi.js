import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../BaseQuery';

export const brandApi = createApi({
  reducerPath: 'brandApi',
  baseQuery: baseQuery,
  tagTypes: ['Brand'],
  endpoints: (builder) => ({
    // Récupérer toutes les marques
    getBrands: builder.query({
      query: ({ page = 1, limit = 10, language = 'fr', ...filters } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          language,
          ...filters
        });
        
        // Gérer les categoryIds multiples
        if (filters.categoryIds && Array.isArray(filters.categoryIds)) {
          params.set('categoryIds', filters.categoryIds.join(','));
        }
        
        return {
          url: `/api/brands?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Brand'],
    }),

    // Récupérer une marque par ID
    getBrandById: builder.query({
      query: ({ id, language = 'fr' }) => ({
        url: `/api/brands/${id}?language=${language}`,
        method: 'GET',
      }),
      providesTags: (result, error, { id }) => [{ type: 'Brand', id }],
    }),

    // Créer une nouvelle marque
    createBrand: builder.mutation({
      query: (brandData) => {
        console.log('🔍 BrandApi - Create données reçues:', brandData);
        
        // Si c'est déjà un FormData, l'utiliser directement
        if (brandData instanceof FormData) {
          return {
            url: '/api/brands',
            method: 'POST',
            body: brandData,
          };
        }
        
        // Sinon, créer un FormData
        const formData = new FormData();
        
        // Ajouter les champs texte
        if (brandData.nameAr) formData.append('nameAr', brandData.nameAr);
        if (brandData.nameFr) formData.append('nameFr', brandData.nameFr);
        if (brandData.descriptionAr) formData.append('descriptionAr', brandData.descriptionAr);
        if (brandData.descriptionFr) formData.append('descriptionFr', brandData.descriptionFr);
        
        // Ajouter les catégories
        if (brandData.categoryIds && brandData.categoryIds.length > 0) {
          formData.append('categoryIds', JSON.stringify(brandData.categoryIds));
        }
        
        // Ajouter le logo
        if (brandData.logo) {
          formData.append('logo', brandData.logo);
        }

        return {
          url: '/api/brands',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Brand'],
    }),

    // Mettre à jour une marque
    updateBrand: builder.mutation({
      query: ({ id, nameAr, nameFr, descriptionAr, descriptionFr, categoryIds, logo }) => {
        console.log('🔍 BrandApi - Update données reçues:', { id, nameAr, nameFr, descriptionAr, descriptionFr, categoryIds, logo });
        
        const formData = new FormData();
        
        // Ajouter les champs texte
        formData.append('nameAr', nameAr);
        formData.append('nameFr', nameFr);
        formData.append('descriptionAr', descriptionAr);
        formData.append('descriptionFr', descriptionFr);
        
        // Ajouter les catégories
        if (categoryIds && categoryIds.length > 0) {
          formData.append('categoryIds', JSON.stringify(categoryIds));
        }
        
        // Ajouter le logo seulement s'il a changé
        if (logo) {
          console.log('🔍 BrandApi - Ajout du nouveau logo au FormData');
          formData.append('logo', logo);
        }

        return {
          url: `/api/brands/${id}`,
          method: 'PUT',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Brand', id },
        'Brand'
      ],
    }),

    // Supprimer une marque
    deleteBrand: builder.mutation({
      query: (id) => ({
        url: `/api/brands/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Brand'],
    }),

    // Note: Les méthodes activateBrand et deactivateBrand ont été supprimées
    // car le champ isActive n'existe pas dans la base de données

    // Rechercher des marques
    searchBrands: builder.query({
      query: ({ searchTerm, language = 'fr', ...filters } = {}) => {
        const params = new URLSearchParams({
          searchTerm,
          language,
          ...filters
        });
        
        // Gérer les categoryIds multiples
        if (filters.categoryIds && Array.isArray(filters.categoryIds)) {
          params.set('categoryIds', filters.categoryIds.join(','));
        }
        
        return {
          url: `/api/brands/search?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Brand'],
    }),

    // Récupérer les marques populaires
    getPopularBrands: builder.query({
      query: ({ limit = 10, language = 'fr' } = {}) => ({
        url: `/api/brands/popular?limit=${limit}&language=${language}`,
        method: 'GET',
      }),
      providesTags: ['Brand'],
    }),

    // Récupérer les marques par catégorie
    getBrandsByCategory: builder.query({
      query: ({ categoryId, language = 'fr' }) => ({
        url: `/api/brands/category/${categoryId}?language=${language}`,
        method: 'GET',
      }),
      providesTags: ['Brand'],
    }),

    // Récupérer toutes les marques (alias pour getBrands)
    getAllBrands: builder.query({
      query: ({ language = 'fr' } = {}) => ({
        url: `/api/brands?language=${language}`,
        method: 'GET',
      }),
      providesTags: ['Brand'],
    }),

    // Récupérer les marques actives
    getActiveBrands: builder.query({
      query: ({ language = 'fr' } = {}) => ({
        url: `/api/brands/active?language=${language}`,
        method: 'GET',
      }),
      providesTags: ['Brand'],
    }),

    // Récupérer les marques inactives
    getInactiveBrands: builder.query({
      query: ({ language = 'fr' } = {}) => ({
        url: `/api/brands/inactive?language=${language}`,
        method: 'GET',
      }),
      providesTags: ['Brand'],
    }),

    // Récupérer les statistiques des marques
    getBrandStats: builder.query({
      query: () => ({
        url: '/api/brands/stats',
        method: 'GET',
      }),
      providesTags: ['Brand'],
    }),
  }),
});

// Export des hooks générés automatiquement
export const {
  useGetBrandsQuery,
  useGetAllBrandsQuery,
  useGetBrandByIdQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
  useSearchBrandsQuery,
  useGetPopularBrandsQuery,
  useGetBrandsByCategoryQuery,
  useGetActiveBrandsQuery,
  useGetInactiveBrandsQuery,
  useGetBrandStatsQuery,
} = brandApi;
