import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Configuration de base pour l'API
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  prepareHeaders: (headers, { getState }) => {
    // Ajouter le token d'authentification si disponible
    const token = getState()?.auth?.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Wrapper personnalisé pour gérer les réponses avec champ 'success'
const baseQueryWithResponseHandler = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  
  console.log('🔍 BaseQuery result:', result);
  
  // Si la requête a réussi (status 200-299)
  if (result.data) {
    // Vérifier si la réponse contient un champ 'success'
    if (typeof result.data === 'object' && 'success' in result.data) {
      // Si success est false, traiter comme une erreur
      if (result.data.success === false) {
        console.log('❌ Success false, traité comme erreur:', result.data);
        return {
          error: {
            status: result.meta?.response?.status || 400,
            data: result.data
          }
        };
      } else {
        console.log('✅ Success true, traité comme succès:', result.data);
      }
    }
  }
  
  return result;
};

// Configuration des tags pour le cache
const tagTypes = ['Subject'];

export const subjectApi = createApi({
  reducerPath: 'subjectApi',
  baseQuery: baseQueryWithResponseHandler,
  tagTypes,
  endpoints: (builder) => ({
    // Récupérer tous les sujets
    getSubjects: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        
        // Ajouter les paramètres de requête
        if (params.language) searchParams.append('language', params.language);
        
        const queryString = searchParams.toString();
        return {
          url: `/subjects${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: ['Subject'],
      transformResponse: (response) => {
        return response.data || response;
      },
    }),

    // Récupérer tous les sujets (alias pour getSubjects)
    getAllSubjects: builder.query({
      query: ({ language = 'fr' } = {}) => ({
        url: `/subjects?language=${language}`,
        method: 'GET',
      }),
      providesTags: ['Subject'],
      transformResponse: (response) => {
        return response.data || response;
      },
    }),

    // Récupérer un sujet par ID
    getSubjectById: builder.query({
      query: (id) => ({
        url: `/subjects/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Subject', id }],
      transformResponse: (response) => {
        return response.data || response;
      },
    }),

    // Créer un nouveau sujet
    createSubject: builder.mutation({
      query: (subjectData) => {
        console.log('🔍 SubjectApi - Données reçues:', subjectData);
        console.log('🔍 SubjectApi - Image file:', subjectData.image);
        
        const formData = new FormData();
        
        // Ajouter les champs texte
        formData.append('nameFr', subjectData.nameFr);
        formData.append('nameAr', subjectData.nameAr);
        formData.append('descriptionFr', subjectData.descriptionFr);
        formData.append('descriptionAr', subjectData.descriptionAr);
        
        // Ajouter les catégories sélectionnées
        if (subjectData.categoryIds && subjectData.categoryIds.length > 0) {
          subjectData.categoryIds.forEach((categoryId, index) => {
            formData.append(`categoryIds[${index}]`, categoryId);
          });
        }
        
        // Ajouter l'image si elle existe
        if (subjectData.image) {
          console.log('🔍 SubjectApi - Ajout de l\'image au FormData');
          formData.append('image', subjectData.image);
        } else {
          console.log('❌ SubjectApi - Aucune image trouvée dans les données');
        }

        return {
          url: '/subjects/create',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Subject'],
      transformResponse: (response) => {
        console.log('🔍 SubjectApi - Réponse brute:', response);
        return response.data || response;
      },
      transformErrorResponse: (response) => {
        console.log('🔍 SubjectApi - Erreur brute:', response);
        return response.data || response;
      },
    }),

    // Mettre à jour un sujet
    updateSubject: builder.mutation({
      query: ({ id, data, hasImageChanged }) => {
        console.log('🔍 SubjectApi - Update données reçues:', { id, data, hasImageChanged });
        
        const formData = new FormData();
        
        // Ajouter les champs texte
        formData.append('nameFr', data.nameFr);
        formData.append('nameAr', data.nameAr);
        formData.append('descriptionFr', data.descriptionFr);
        formData.append('descriptionAr', data.descriptionAr);
        
        // Ajouter les catégories
        if (data.categoryIds && data.categoryIds.length > 0) {
          data.categoryIds.forEach((categoryId, index) => {
            formData.append(`categoryIds[${index}]`, categoryId);
          });
        }
        
        // Ajouter l'image seulement si elle a changé
        if (hasImageChanged && data.image) {
          console.log('🔍 SubjectApi - Ajout de la nouvelle image au FormData');
          formData.append('image', data.image);
        }

        return {
          url: `/subjects/${id}`,
          method: 'PUT',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Subject', id },
        { type: 'Subject', id: 'LIST' }
      ],
      transformResponse: (response) => {
        console.log('🔍 SubjectApi - updateSubject response:', response);
        return response.data || response;
      },
      transformErrorResponse: (response) => {
        console.log('🔍 SubjectApi - updateSubject error:', response);
        return response.data || response;
      },
    }),

    // Supprimer un sujet
    deleteSubject: builder.mutation({
      query: (id) => ({
        url: `/subjects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Subject'],
      transformResponse: (response) => {
        return response.data || response;
      },
    }),
  }),
});

// Export des hooks générés automatiquement
export const {
  useGetSubjectsQuery,
  useGetAllSubjectsQuery,
  useGetSubjectByIdQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
} = subjectApi;
