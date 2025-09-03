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
        formData.append('nameAr', categoryData.titleAr);
        formData.append('nameFr', categoryData.titleFr);
        formData.append('descriptionAr', categoryData.descriptionAr);
        formData.append('descriptionFr', categoryData.descriptionFr);
        formData.append('gender', categoryData.targetGender);
        formData.append('ageMin', categoryData.ageRangeMin.toString());
        formData.append('ageMax', categoryData.ageRangeMax.toString());
        
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
          nameAr: categoryData.titleAr,
          nameFr: categoryData.titleFr,
          descriptionAr: categoryData.descriptionAr,
          descriptionFr: categoryData.descriptionFr,
          gender: categoryData.targetGender,
          ageMin: categoryData.ageRangeMin,
          ageMax: categoryData.ageRangeMax,
          parentId: categoryData.parentId || null,
          image: categoryData.image, // URL Cloudinary
          icon: categoryData.icon,   // URL Cloudinary
        },
      }),
      invalidatesTags: ['Category'],
    }),

    // Query pour récupérer toutes les catégories
    getCategories: builder.query({
      query: () => '/api/categories',
      providesTags: ['Category'],
    }),

    // Query pour récupérer une catégorie par ID
    getCategoryById: builder.query({
      query: (id) => `/api/categories/${id}`,
      providesTags: (result, error, id) => [{ type: 'Category', id }],
    }),

    // Mutation pour mettre à jour une catégorie
    updateCategory: builder.mutation({
      query: ({ id, ...categoryData }) => ({
        url: `/api/categories/${id}`,
        method: 'PUT',
        body: categoryData,
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
  useGetCategoryByIdQuery,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = CategoryApi;
