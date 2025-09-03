// ========================================
// EXEMPLE D'UTILISATION DE L'AUTHENTIFICATION MULTI-PROVIDER
// ========================================

import {
  useRegisterUserMutation,
  useLoginUserMutation,
  useLoginWithGoogleMutation,
  useLoginWithFacebookMutation,
  useLogoutUserMutation,
  useGetProfileQuery,
} from '../UserApi';

// ========================================
// EXEMPLE D'UTILISATION DANS UN COMPOSANT REACT
// ========================================

export const MultiAuthExample = () => {
  // ========================================
  // HOOKS D'AUTHENTIFICATION
  // ========================================
  
  const [registerUser] = useRegisterUserMutation();
  const [loginUser] = useLoginUserMutation();
  const [loginWithGoogle] = useLoginWithGoogleMutation();
  const [loginWithFacebook] = useLoginWithFacebookMutation();
  const [logoutUser] = useLogoutUserMutation();
  const { data: profile, isLoading } = useGetProfileQuery();

  // ========================================
  // AUTHENTIFICATION PAR TÉLÉPHONE (WHATSAPP)
  // ========================================
  
  const handlePhoneRegister = async () => {
    try {
      const result = await registerUser({
        firstName: 'John',
        lastName: 'Doe',
        phone: '+33123456789', // Identifiant principal
        password: 'SecurePassword123'
      }).unwrap();
      
      console.log('Inscription téléphone réussie:', result);
      // L'utilisateur aura authProvider: 'phone' et primaryIdentifier: '+33123456789'
    } catch (error) {
      console.error('Erreur inscription téléphone:', error);
    }
  };

  const handlePhoneLogin = async () => {
    try {
      const result = await loginUser({
        phone: '+33123456789', // Connexion par téléphone
        password: 'SecurePassword123'
      }).unwrap();
      
      console.log('Connexion téléphone réussie:', result);
    } catch (error) {
      console.error('Erreur connexion téléphone:', error);
    }
  };

  // ========================================
  // AUTHENTIFICATION GOOGLE
  // ========================================
  
  const handleGoogleLogin = async () => {
    try {
      // Simuler les données Google (en réalité, vous utiliseriez Google OAuth)
      const googleData = {
        googleId: 'google_123456789',
        email: 'john.doe@gmail.com', // Identifiant principal
        firstName: 'John',
        lastName: 'Doe',
        profilePicture: 'https://example.com/avatar.jpg'
      };

      const result = await loginWithGoogle(googleData).unwrap();
      
      console.log('Connexion Google réussie:', result);
      // L'utilisateur aura authProvider: 'google' et primaryIdentifier: 'john.doe@gmail.com'
    } catch (error) {
      console.error('Erreur connexion Google:', error);
    }
  };

  // ========================================
  // AUTHENTIFICATION FACEBOOK
  // ========================================
  
  const handleFacebookLogin = async () => {
    try {
      // Simuler les données Facebook (en réalité, vous utiliseriez Facebook SDK)
      const facebookData = {
        facebookId: 'facebook_987654321', // Identifiant principal
        email: 'john.doe@facebook.com', // Optionnel
        phone: '+33123456789', // Optionnel
        firstName: 'John',
        lastName: 'Doe',
        profilePicture: 'https://example.com/fb-avatar.jpg'
      };

      const result = await loginWithFacebook(facebookData).unwrap();
      
      console.log('Connexion Facebook réussie:', result);
      // L'utilisateur aura authProvider: 'facebook' et primaryIdentifier: 'facebook_987654321'
    } catch (error) {
      console.error('Erreur connexion Facebook:', error);
    }
  };

  // ========================================
  // DÉCONNEXION
  // ========================================
  
  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
      console.log('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  // ========================================
  // AFFICHAGE DES INFORMATIONS UTILISATEUR
  // ========================================
  
  const renderUserInfo = () => {
    if (isLoading) return <p>Chargement...</p>;
    if (!profile?.data?.user) return <p>Non connecté</p>;

    const user = profile.data.user;
    
    return (
      <div>
        <h2>Informations utilisateur</h2>
        <p><strong>Nom:</strong> {user.firstName} {user.lastName}</p>
        <p><strong>Provider:</strong> {user.authProvider}</p>
        <p><strong>Identifiant principal:</strong> {user.primaryIdentifier}</p>
        
        {/* Affichage conditionnel selon le provider */}
        {user.authProvider === 'phone' && (
          <div>
            <p><strong>Téléphone:</strong> {user.phone}</p>
            <p><strong>Email:</strong> {user.email || 'Non fourni'}</p>
          </div>
        )}
        
        {user.authProvider === 'google' && (
          <div>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Google ID:</strong> {user.googleId}</p>
          </div>
        )}
        
        {user.authProvider === 'facebook' && (
          <div>
            <p><strong>Facebook ID:</strong> {user.facebookId}</p>
            <p><strong>Email Facebook:</strong> {user.facebookEmail || 'Non fourni'}</p>
            <p><strong>Téléphone Facebook:</strong> {user.facebookPhone || 'Non fourni'}</p>
          </div>
        )}
        
        <p><strong>Vérifié:</strong> {user.isVerified ? 'Oui' : 'Non'}</p>
        <p><strong>Rôle:</strong> {user.role}</p>
      </div>
    );
  };

  // ========================================
  // RENDU DU COMPOSANT
  // ========================================
  
  return (
    <div>
      <h1>Authentification Multi-Provider</h1>
      
      {/* Affichage des informations utilisateur */}
      {renderUserInfo()}

      {/* Boutons d'authentification */}
      <div style={{ marginTop: '20px' }}>
        <h3>Authentification par Téléphone (WhatsApp)</h3>
        <button onClick={handlePhoneRegister}>
          S'inscrire avec téléphone
        </button>
        <button onClick={handlePhoneLogin}>
          Se connecter avec téléphone
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Authentification Google</h3>
        <button onClick={handleGoogleLogin}>
          Se connecter avec Google
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Authentification Facebook</h3>
        <button onClick={handleFacebookLogin}>
          Se connecter avec Facebook
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleLogout} style={{ backgroundColor: 'red', color: 'white' }}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

// ========================================
// HOOK PERSONNALISÉ POUR L'AUTHENTIFICATION MULTI-PROVIDER
// ========================================

export const useMultiAuth = () => {
  const [loginUser] = useLoginUserMutation();
  const [loginWithGoogle] = useLoginWithGoogleMutation();
  const [loginWithFacebook] = useLoginWithFacebookMutation();
  const [logoutUser] = useLogoutUserMutation();
  const { data: profile, isLoading } = useGetProfileQuery();

  const login = async (provider, credentials) => {
    try {
      let result;
      
      switch (provider) {
        case 'phone':
          result = await loginUser(credentials).unwrap();
          break;
        case 'google':
          result = await loginWithGoogle(credentials).unwrap();
          break;
        case 'facebook':
          result = await loginWithFacebook(credentials).unwrap();
          break;
        default:
          throw new Error('Provider non supporté');
      }
      
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error.data?.error || 'Erreur de connexion' 
      };
    }
  };

  const logout = async () => {
    try {
      await logoutUser().unwrap();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.data?.error || 'Erreur de déconnexion' 
      };
    }
  };

  const isAuthenticated = !!profile?.data?.user;
  const user = profile?.data?.user || null;
  const authProvider = user?.authProvider || null;
  const primaryIdentifier = user?.primaryIdentifier || null;

  return {
    login,
    logout,
    user,
    isAuthenticated,
    isLoading,
    authProvider,
    primaryIdentifier
  };
};

// ========================================
// UTILITAIRES POUR L'AUTHENTIFICATION
// ========================================

export const AuthUtils = {
  /**
   * Détermine l'identifiant principal à afficher selon le provider
   */
  getDisplayIdentifier: (user) => {
    if (!user) return null;
    
    switch (user.authProvider) {
      case 'phone':
        return user.phone;
      case 'google':
        return user.email;
      case 'facebook':
        return user.facebookId;
      default:
        return user.primaryIdentifier;
    }
  },

  /**
   * Vérifie si l'utilisateur peut utiliser un provider spécifique
   */
  canUseProvider: (user, provider) => {
    if (!user) return false;
    return user.authProvider === provider;
  },

  /**
   * Obtient l'email de l'utilisateur selon son provider
   */
  getEmail: (user) => {
    if (!user) return null;
    
    switch (user.authProvider) {
      case 'phone':
        return user.email;
      case 'google':
        return user.email;
      case 'facebook':
        return user.facebookEmail;
      default:
        return null;
    }
  },

  /**
   * Obtient le téléphone de l'utilisateur selon son provider
   */
  getPhone: (user) => {
    if (!user) return null;
    
    switch (user.authProvider) {
      case 'phone':
        return user.phone;
      case 'google':
        return null; // Google n'a pas de téléphone par défaut
      case 'facebook':
        return user.facebookPhone;
      default:
        return null;
    }
  }
};

export default MultiAuthExample;
