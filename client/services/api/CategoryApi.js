import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../BaseQuery';

export const CategoryApi = createApi({
  reducerPath: 'CategoryApi',
  baseQuery: baseQuery,
  tagTypes: ['Category'],
  endpoints: (builder) => ({
    // Mutation pour ajouter une catégorie avec uploads de fichiers
    insertCategory: builder.mutation({
      query: (categoryData) => {
        const formData = new FormData();
        
        // Ajouter les données textuelles
        formData.append('nameAr', categoryData.nameAr);
        formData.append('nameFr', categoryData.nameFr);
        formData.append('descriptionAr', categoryData.descriptionAr);
        formData.append('descriptionFr', categoryData.descriptionFr);
        formData.append('gender', categoryData.gender);
        formData.append('ageMin', categoryData.ageMin.toString());
        formData.append('ageMax', categoryData.ageMax.toString());
        formData.append('listingType', categoryData.listingType || '');
        
        if (categoryData.parentId) {
          formData.append('parentId', categoryData.parentId);
        }
        
        // Ajouter les fichiers si ce sont des objets File
        if (categoryData.image && categoryData.image instanceof File) {
          formData.append('image', categoryData.image);
        }
        
        if (categoryData.icon && categoryData.icon instanceof File) {
          formData.append('icon', categoryData.icon);
        }
        
        return {
          url: '/api/categories/create',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Category'],
    }),

    // Mutation pour ajouter une catégorie avec URLs Cloudinary (si les fichiers sont déjà uploadés)
    insertCategoryWithUrls: builder.mutation({
      query: (categoryData) => ({
        url: '/api/categories/create-with-urls',
        method: 'POST',
        body: {
          nameAr: categoryData.nameAr,
          nameFr: categoryData.nameFr,
          descriptionAr: categoryData.descriptionAr,
          descriptionFr: categoryData.descriptionFr,
          gender: categoryData.gender,
          ageMin: categoryData.ageMin,
          ageMax: categoryData.ageMax,
          parentId: categoryData.parentId || null,
          listingType: categoryData.listingType || null,
          image: categoryData.image, // URL Cloudinary
          icon: categoryData.icon,   // URL Cloudinary
        },
      }),
      invalidatesTags: ['Category'],
    }),

    // Query pour récupérer toutes les catégories
    getCategories: builder.query({
      query: (params = {}) => ({
        url: '/api/categories',
        params: params
      }),
      providesTags: ['Category'],
    }),

    // Query pour récupérer la hiérarchie des catégories
    getCategoriesHierarchy: builder.query({
      query: (language = 'fr') => ({
        url: '/api/categories',
        params: { hierarchy: 'true', language }
      }),
      providesTags: ['Category'],
    }),

    // Query pour récupérer une catégorie par ID
    getCategoryById: builder.query({
      query: (id) => `/api/categories/${id}`,
      providesTags: (result, error, id) => [{ type: 'Category', id }],
    }),

    // Mutation pour mettre à jour une catégorie avec upload de fichiers
    updateCategory: builder.mutation({
      query: ({ id, ...categoryData }) => {
        const formData = new FormData();
        
        // Ajouter les données textuelles
        formData.append('nameAr', categoryData.nameAr);
        formData.append('nameFr', categoryData.nameFr);
        formData.append('descriptionAr', categoryData.descriptionAr);
        formData.append('descriptionFr', categoryData.descriptionFr);
        formData.append('gender', categoryData.gender);
        formData.append('ageMin', categoryData.ageMin.toString());
        formData.append('ageMax', categoryData.ageMax.toString());
        formData.append('listingType', categoryData.listingType || '');
        
        if (categoryData.parentId) {
          formData.append('parentId', categoryData.parentId);
        }
        
        // Ajouter les fichiers si ce sont des objets File
        if (categoryData.image && categoryData.image instanceof File) {
          formData.append('image', categoryData.image);
        }
        
        if (categoryData.icon && categoryData.icon instanceof File) {
          formData.append('icon', categoryData.icon);
        }
        
        return {
          url: `/api/categories/${id}`,
          method: 'PUT',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'Category', id }],
    }),

    // Mutation pour mettre à jour une catégorie avec URLs Cloudinary (si les fichiers sont déjà uploadés)
    updateCategoryWithUrls: builder.mutation({
      query: ({ id, ...categoryData }) => ({
        url: `/api/categories/${id}/urls`,
        method: 'PUT',
        body: {
          nameAr: categoryData.nameAr,
          nameFr: categoryData.nameFr,
          descriptionAr: categoryData.descriptionAr,
          descriptionFr: categoryData.descriptionFr,
          gender: categoryData.gender,
          ageMin: categoryData.ageMin,
          ageMax: categoryData.ageMax,
          parentId: categoryData.parentId || null,
          listingType: categoryData.listingType || null,
          image: categoryData.image, // URL Cloudinary
          icon: categoryData.icon,   // URL Cloudinary
        },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Category', id }],
    }),

    // Mutation pour supprimer une catégorie
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/api/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),
  }),
});

export const {
  useInsertCategoryMutation,
  useInsertCategoryWithUrlsMutation,
  useGetCategoriesQuery,
  useGetCategoriesHierarchyQuery,
  useGetCategoryByIdQuery,
  useUpdateCategoryMutation,
  useUpdateCategoryWithUrlsMutation,
  useDeleteCategoryMutation,
} = CategoryApi;
