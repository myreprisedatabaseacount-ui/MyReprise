// ========================================
// EXEMPLE D'UTILISATION DU SERVICE USER API
// ========================================

import {
  useRegisterUserMutation,
  useLoginUserMutation,
  useLogoutUserMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useVerifyUserMutation,
  useChangeUserRoleMutation,
  useGetVerifiedUsersQuery,
  useGetUnverifiedUsersQuery,
  useGetUsersByRoleQuery,
  useGetUserStatsQuery,
  useSendOTPMutation,
  useVerifyOTPMutation,
} from './UserApi';

// ========================================
// EXEMPLE D'UTILISATION DANS UN COMPOSANT REACT
// ========================================

export const UserApiExample = () => {
  // ========================================
  // AUTHENTIFICATION
  // ========================================
  
  // Inscription
  const [registerUser, { isLoading: isRegistering, error: registerError }] = useRegisterUserMutation();
  
  const handleRegister = async () => {
    try {
      const result = await registerUser({
        firstName: 'John',
        lastName: 'Doe',
        phone: '+33123456789', // Numéro de téléphone obligatoire
        email: 'john.doe@example.com', // Email optionnel
        password: 'SecurePassword123'
      }).unwrap();
      
      console.log('Inscription réussie:', result);
      // Les tokens sont automatiquement sauvegardés dans le localStorage
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
    }
  };

  // Connexion
  const [loginUser, { isLoading: isLoggingIn, error: loginError }] = useLoginUserMutation();
  
  const handleLogin = async () => {
    try {
      const result = await loginUser({
        phone: '+33123456789', // Connexion par téléphone
        password: 'SecurePassword123'
      }).unwrap();
      
      console.log('Connexion réussie:', result);
      // Les tokens sont automatiquement sauvegardés dans le localStorage
    } catch (error) {
      console.error('Erreur de connexion:', error);
    }
  };

  // Déconnexion
  const [logoutUser] = useLogoutUserMutation();
  
  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
      console.log('Déconnexion réussie');
      // Les tokens sont automatiquement supprimés du localStorage
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  // ========================================
  // PROFIL UTILISATEUR
  // ========================================
  
  // Récupérer le profil
  const { data: profile, isLoading: isLoadingProfile, error: profileError } = useGetProfileQuery();
  
  // Mettre à jour le profil
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  
  const handleUpdateProfile = async () => {
    try {
      const result = await updateProfile({
        firstName: 'John Updated',
        lastName: 'Doe Updated',
        phone: '+33123456789'
      }).unwrap();
      
      console.log('Profil mis à jour:', result);
    } catch (error) {
      console.error('Erreur de mise à jour du profil:', error);
    }
  };

  // Changer le mot de passe
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  
  const handleChangePassword = async () => {
    try {
      await changePassword({
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123'
      }).unwrap();
      
      console.log('Mot de passe changé avec succès');
    } catch (error) {
      console.error('Erreur de changement de mot de passe:', error);
    }
  };

  // ========================================
  // ADMINISTRATION
  // ========================================
  
  // Récupérer tous les utilisateurs avec pagination
  const { 
    data: usersData, 
    isLoading: isLoadingUsers, 
    error: usersError 
  } = useGetAllUsersQuery({
    page: 1,
    limit: 10,
    role: 'user', // Filtrer par rôle
    isVerified: true, // Filtrer par statut de vérification
    search: 'john' // Recherche textuelle
  });

  // Récupérer un utilisateur par ID
  const { 
    data: userData, 
    isLoading: isLoadingUser 
  } = useGetUserByIdQuery(1);

  // Mettre à jour un utilisateur (Admin)
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
  
  const handleUpdateUser = async () => {
    try {
      const result = await updateUser({
        id: 1,
        firstName: 'Updated Name',
        role: 'moderator'
      }).unwrap();
      
      console.log('Utilisateur mis à jour:', result);
    } catch (error) {
      console.error('Erreur de mise à jour de l\'utilisateur:', error);
    }
  };

  // Supprimer un utilisateur (Admin)
  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();
  
  const handleDeleteUser = async () => {
    try {
      await deleteUser(1).unwrap();
      console.log('Utilisateur supprimé');
    } catch (error) {
      console.error('Erreur de suppression de l\'utilisateur:', error);
    }
  };

  // Vérifier un utilisateur (Admin)
  const [verifyUser, { isLoading: isVerifyingUser }] = useVerifyUserMutation();
  
  const handleVerifyUser = async () => {
    try {
      await verifyUser(1).unwrap();
      console.log('Utilisateur vérifié');
    } catch (error) {
      console.error('Erreur de vérification de l\'utilisateur:', error);
    }
  };

  // Changer le rôle d'un utilisateur (Admin)
  const [changeUserRole, { isLoading: isChangingRole }] = useChangeUserRoleMutation();
  
  const handleChangeUserRole = async () => {
    try {
      await changeUserRole({ id: 1, role: 'admin' }).unwrap();
      console.log('Rôle changé');
    } catch (error) {
      console.error('Erreur de changement de rôle:', error);
    }
  };

  // ========================================
  // ROUTES SPÉCIALISÉES
  // ========================================
  
  // Utilisateurs vérifiés
  const { data: verifiedUsers } = useGetVerifiedUsersQuery({ page: 1, limit: 10 });
  
  // Utilisateurs non vérifiés
  const { data: unverifiedUsers } = useGetUnverifiedUsersQuery({ page: 1, limit: 10 });
  
  // Utilisateurs par rôle
  const { data: adminUsers } = useGetUsersByRoleQuery({ 
    role: 'admin', 
    page: 1, 
    limit: 10 
  });
  
  // Statistiques des utilisateurs
  const { data: userStats } = useGetUserStatsQuery();

  // ========================================
  // OTP (TODO - À IMPLÉMENTER)
  // ========================================
  
  // Envoyer OTP
  const [sendOTP, { isLoading: isSendingOTP }] = useSendOTPMutation();
  
  const handleSendOTP = async () => {
    try {
      await sendOTP().unwrap();
      console.log('OTP envoyé');
    } catch (error) {
      console.error('Erreur d\'envoi OTP:', error);
    }
  };

  // Vérifier OTP
  const [verifyOTP, { isLoading: isVerifyingOTP }] = useVerifyOTPMutation();
  
  const handleVerifyOTP = async () => {
    try {
      await verifyOTP({ otpCode: '123456' }).unwrap();
      console.log('OTP vérifié');
    } catch (error) {
      console.error('Erreur de vérification OTP:', error);
    }
  };

  // ========================================
  // RENDU DU COMPOSANT
  // ========================================
  
  return (
    <div>
      <h1>Exemple d'utilisation UserApi</h1>
      
      {/* Affichage des données */}
      {profile && (
        <div>
          <h2>Profil utilisateur</h2>
          <p>Nom: {profile.data.user.firstName} {profile.data.user.lastName}</p>
          <p>Téléphone: {profile.data.user.phone}</p>
          <p>Email: {profile.data.user.email || 'Non fourni'}</p>
          <p>Vérifié: {profile.data.user.isVerified ? 'Oui' : 'Non'}</p>
          <p>Rôle: {profile.data.user.role}</p>
        </div>
      )}

      {/* Boutons d'action */}
      <div>
        <button onClick={handleRegister} disabled={isRegistering}>
          {isRegistering ? 'Inscription...' : 'S\'inscrire'}
        </button>
        
        <button onClick={handleLogin} disabled={isLoggingIn}>
          {isLoggingIn ? 'Connexion...' : 'Se connecter'}
        </button>
        
        <button onClick={handleLogout}>
          Se déconnecter
        </button>
        
        <button onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
          {isUpdatingProfile ? 'Mise à jour...' : 'Mettre à jour le profil'}
        </button>
        
        <button onClick={handleChangePassword} disabled={isChangingPassword}>
          {isChangingPassword ? 'Changement...' : 'Changer le mot de passe'}
        </button>
      </div>

      {/* Affichage des erreurs */}
      {registerError && <p style={{color: 'red'}}>Erreur d'inscription: {registerError.data?.error}</p>}
      {loginError && <p style={{color: 'red'}}>Erreur de connexion: {loginError.data?.error}</p>}
      {profileError && <p style={{color: 'red'}}>Erreur de profil: {profileError.data?.error}</p>}
    </div>
  );
};

// ========================================
// EXEMPLE D'UTILISATION AVEC HOOKS PERSONNALISÉS
// ========================================

export const useAuth = () => {
  const [loginUser] = useLoginUserMutation();
  const [logoutUser] = useLogoutUserMutation();
  const { data: profile, isLoading } = useGetProfileQuery();

  const login = async (phone, password) => {
    try {
      const result = await loginUser({ phone, password }).unwrap();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.data?.error || 'Erreur de connexion' };
    }
  };

  const logout = async () => {
    try {
      await logoutUser().unwrap();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.data?.error || 'Erreur de déconnexion' };
    }
  };

  const isAuthenticated = !!profile?.data?.user;
  const user = profile?.data?.user || null;

  return {
    login,
    logout,
    user,
    isAuthenticated,
    isLoading
  };
};

export default UserApiExample;
