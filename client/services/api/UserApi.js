import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseQuery from "../BaseQuery";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: baseQuery,
  tagTypes: ['User', 'Users'],
  endpoints: (builder) => ({
    // ========================================
    // AUTHENTIFICATION
    // ========================================
    
    // Inscription d'un nouvel utilisateur
    registerUser: builder.mutation({
      query: (userData) => ({
        url: "/api/auth/register",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ['Users'],
    }),

    // Connexion d'un utilisateur par téléphone
    loginUser: builder.mutation({
      query: (credentials) => ({
        url: "/api/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    // Connexion avec Google
    loginWithGoogle: builder.mutation({
      query: (googleData) => ({
        url: "/api/auth/google",
        method: "POST",
        body: googleData,
      }),
    }),

    // Connexion avec Facebook
    loginWithFacebook: builder.mutation({
      query: (facebookData) => ({
        url: "/api/auth/facebook",
        method: "POST",
        body: facebookData,
      }),
    }),

    // Rafraîchissement du token
    refreshToken: builder.mutation({
      query: (refreshToken) => ({
        url: "/api/auth/refresh",
        method: "POST",
        body: { refreshToken },
      }),
    }),

    // Déconnexion d'un utilisateur
    logoutUser: builder.mutation({
      query: () => ({
        url: "/api/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ['User'],
    }),

    // ========================================
    // PROFIL UTILISATEUR
    // ========================================

    // Récupérer le profil de l'utilisateur connecté
    getProfile: builder.query({
      query: () => ({
        url: "/api/users/profile",
        credentials: "include",
      }),
      providesTags: ['User'],
    }),

    // Mettre à jour le profil de l'utilisateur connecté
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: "/api/users/profile",
        method: "PUT",
        body: profileData,
      }),
      invalidatesTags: ['User'],
    }),

    // Changer le mot de passe
    changePassword: builder.mutation({
      query: (passwordData) => ({
        url: "/api/users/change-password",
        method: "PUT",
        body: passwordData,
      }),
    }),

    // ========================================
    // ADMINISTRATION
    // ========================================

    // Récupérer tous les utilisateurs (avec pagination)
    getAllUsers: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return {
          url: queryParams ? `/api/users?${queryParams}` : "/api/users",
          credentials: "include",
        };
      },
      providesTags: ['Users'],
    }),

    // Récupérer un utilisateur par ID
    getUserById: builder.query({
      query: (id) => ({
        url: `/api/users/${id}`,
        credentials: "include",
      }),
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    // Mettre à jour un utilisateur (Admin)
    updateUser: builder.mutation({
      query: ({ id, ...userData }) => ({
        url: `/api/users/${id}`,
        method: "PUT",
        body: userData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        'Users'
      ],
    }),

    // Supprimer un utilisateur (Admin)
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/api/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ['Users'],
    }),

    // Vérifier un utilisateur (Admin)
    verifyUser: builder.mutation({
      query: (id) => ({
        url: `/api/users/${id}/verify`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'User', id },
        'Users'
      ],
    }),

    // Changer le rôle d'un utilisateur (Admin)
    changeUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/api/users/${id}/role`,
        method: "PUT",
        body: { role },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        'Users'
      ],
    }),

    // ========================================
    // ROUTES SPÉCIALISÉES
    // ========================================

    // Récupérer tous les utilisateurs vérifiés
    getVerifiedUsers: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return {
          url: queryParams ? `/api/users/verified?${queryParams}` : "/api/users/verified",
          credentials: "include",
        };
      },
      providesTags: ['Users'],
    }),

    // Récupérer tous les utilisateurs non vérifiés
    getUnverifiedUsers: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return {
          url: queryParams ? `/api/users/unverified?${queryParams}` : "/api/users/unverified",
          credentials: "include",
        };
      },
      providesTags: ['Users'],
    }),

    // Récupérer les utilisateurs par rôle
    getUsersByRole: builder.query({
      query: ({ role, ...params }) => {
        const queryParams = new URLSearchParams(params).toString();
        return {
          url: queryParams ? `/api/users/role/${role}?${queryParams}` : `/api/users/role/${role}`,
          credentials: "include",
        };
      },
      providesTags: ['Users'],
    }),

    // Récupérer les statistiques des utilisateurs
    getUserStats: builder.query({
      query: () => ({
        url: "/api/users/stats",
        credentials: "include",
      }),
    }),

    // ========================================
    // OTP (TODO - À IMPLÉMENTER)
    // ========================================

    // Envoyer le code OTP pour vérification du téléphone
    sendOTP: builder.mutation({
      query: () => ({
        url: "/api/users/send-otp",
        method: "POST",
      }),
    }),

    // Vérifier le code OTP
    verifyOTP: builder.mutation({
      query: (otpData) => ({
        url: "/api/users/verify-otp",
        method: "POST",
        body: otpData,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

// Export des hooks générés automatiquement
export const {
  // Authentification
  useRegisterUserMutation,
  useLoginUserMutation,
  useLoginWithGoogleMutation,
  useLoginWithFacebookMutation,
  useRefreshTokenMutation,
  useLogoutUserMutation,
  
  // Profil utilisateur
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  
  // Administration
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useVerifyUserMutation,
  useChangeUserRoleMutation,
  
  // Routes spécialisées
  useGetVerifiedUsersQuery,
  useGetUnverifiedUsersQuery,
  useGetUsersByRoleQuery,
  useGetUserStatsQuery,
  
  // OTP (TODO)
  useSendOTPMutation,
  useVerifyOTPMutation,
} = userApi;

// Export de l'API pour l'utiliser dans le store
export default userApi;