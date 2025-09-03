# 🏗️ Architecture d'Authentification Multi-Provider

## 📋 Vue d'ensemble

Cette architecture permet de gérer 3 types d'authentification de manière unifiée :
- **Téléphone** (WhatsApp) - Identifiant principal : numéro de téléphone
- **Google** (Gmail) - Identifiant principal : email
- **Facebook** - Identifiant principal : Facebook ID

## 🎯 Concept Clé : Primary Identifier

Chaque utilisateur a un **identifiant principal unique** qui varie selon son provider :

| Provider | Primary Identifier | Champs uniques |
|----------|-------------------|----------------|
| `phone` | Numéro de téléphone | `phone`, `primaryIdentifier` |
| `google` | Email | `email`, `googleId`, `primaryIdentifier` |
| `facebook` | Facebook ID | `facebookId`, `primaryIdentifier` |

## 🗄️ Structure de la Base de Données

### Modèle User

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    
    -- Champs optionnels selon le provider
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    
    -- Champs d'authentification multi-provider
    auth_provider ENUM('phone', 'google', 'facebook') NOT NULL,
    primary_identifier VARCHAR(255) UNIQUE NOT NULL,
    
    -- Champs pour les providers externes
    google_id VARCHAR(255) UNIQUE,
    facebook_id VARCHAR(255) UNIQUE,
    facebook_email VARCHAR(255),
    facebook_phone VARCHAR(20),
    
    -- Champs communs
    password VARCHAR(255), -- Seulement pour phone
    is_verified BOOLEAN DEFAULT FALSE,
    role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Index et Contraintes

```sql
-- Index uniques
UNIQUE KEY unique_primary_identifier (primary_identifier),
UNIQUE KEY unique_phone (phone),
UNIQUE KEY unique_email (email),
UNIQUE KEY unique_google_id (google_id),
UNIQUE KEY unique_facebook_id (facebook_id),

-- Index de recherche
KEY idx_auth_provider (auth_provider),
KEY idx_role (role),
KEY idx_is_verified (is_verified)
```

## 🔧 Services Backend

### AuthService

Le service centralisé gère toutes les authentifications :

```javascript
// Authentification par téléphone
AuthService.authenticateWithPhone(phone, password)

// Authentification Google
AuthService.authenticateWithGoogle({
  googleId, email, firstName, lastName, profilePicture
})

// Authentification Facebook
AuthService.authenticateWithFacebook({
  facebookId, email, phone, firstName, lastName, profilePicture
})
```

### Logique de Validation

1. **Vérification d'unicité** : Chaque identifiant doit être unique
2. **Prévention des conflits** : Un email/téléphone ne peut pas être utilisé par plusieurs providers
3. **Création automatique** : Les utilisateurs Google/Facebook sont créés automatiquement
4. **Vérification automatique** : Google/Facebook sont considérés comme vérifiés

## 🌐 API Endpoints

### Authentification

```http
# Inscription par téléphone
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe", 
  "phone": "+33123456789",
  "password": "SecurePassword123"
}

# Connexion par téléphone
POST /api/auth/login
{
  "phone": "+33123456789",
  "password": "SecurePassword123"
}

# Connexion Google
POST /api/auth/google
{
  "googleId": "google_123456789",
  "email": "john.doe@gmail.com",
  "firstName": "John",
  "lastName": "Doe",
  "profilePicture": "https://example.com/avatar.jpg"
}

# Connexion Facebook
POST /api/auth/facebook
{
  "facebookId": "facebook_987654321",
  "email": "john.doe@facebook.com", // Optionnel
  "phone": "+33123456789", // Optionnel
  "firstName": "John",
  "lastName": "Doe",
  "profilePicture": "https://example.com/fb-avatar.jpg"
}
```

### Réponse Standard

```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "authProvider": "phone", // ou "google" ou "facebook"
      "primaryIdentifier": "+33123456789", // ou email ou facebookId
      "phone": "+33123456789", // Selon le provider
      "email": "john@example.com", // Selon le provider
      "isVerified": true,
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

## 🎨 Frontend - Redux Toolkit Query

### Hooks Disponibles

```javascript
// Authentification
const [loginUser] = useLoginUserMutation();
const [loginWithGoogle] = useLoginWithGoogleMutation();
const [loginWithFacebook] = useLoginWithFacebookMutation();

// Profil
const { data: profile } = useGetProfileQuery();
```

### Hook Personnalisé

```javascript
const { login, logout, user, authProvider, primaryIdentifier } = useMultiAuth();

// Utilisation
await login('phone', { phone: '+33123456789', password: 'password' });
await login('google', googleData);
await login('facebook', facebookData);
```

## 🔐 Gestion des Tokens JWT

### Payload du Token

```javascript
{
  userId: 1,
  primaryIdentifier: "+33123456789", // ou email ou facebookId
  authProvider: "phone", // ou "google" ou "facebook"
  role: "user"
}
```

### Refresh Automatique

Le `BaseQuery` gère automatiquement :
- Injection du token dans les headers
- Refresh automatique en cas d'expiration
- Nettoyage des tokens en cas d'échec

## 📱 Intégration Frontend

### Google OAuth

```javascript
// 1. Intégrer Google OAuth SDK
// 2. Récupérer les données utilisateur
// 3. Appeler l'API backend

const handleGoogleLogin = async () => {
  const googleUser = await googleAuth.signIn();
  const googleData = {
    googleId: googleUser.id,
    email: googleUser.email,
    firstName: googleUser.given_name,
    lastName: googleUser.family_name,
    profilePicture: googleUser.picture
  };
  
  await loginWithGoogle(googleData);
};
```

### Facebook SDK

```javascript
// 1. Intégrer Facebook SDK
// 2. Récupérer les données utilisateur
// 3. Appeler l'API backend

const handleFacebookLogin = async () => {
  const facebookUser = await facebookAuth.login();
  const facebookData = {
    facebookId: facebookUser.id,
    email: facebookUser.email, // Optionnel
    phone: facebookUser.phone, // Optionnel
    firstName: facebookUser.first_name,
    lastName: facebookUser.last_name,
    profilePicture: facebookUser.picture.data.url
  };
  
  await loginWithFacebook(facebookData);
};
```

## 🛡️ Sécurité

### Validations

1. **Unicité des identifiants** : Chaque identifiant ne peut être utilisé que par un provider
2. **Validation des providers** : Vérification que l'utilisateur utilise le bon provider
3. **Rate limiting** : Protection contre les attaques par force brute
4. **Validation des données** : Validation stricte des données d'entrée

### Gestion des Conflits

```javascript
// Exemple de conflit détecté
{
  "success": false,
  "error": "Un compte avec cet email existe déjà avec un autre provider"
}
```

## 🚀 Avantages de cette Architecture

1. **Flexibilité** : Support de multiples providers d'authentification
2. **Unicité** : Chaque utilisateur a un identifiant principal unique
3. **Évolutivité** : Facile d'ajouter de nouveaux providers
4. **Cohérence** : Interface unifiée pour tous les providers
5. **Sécurité** : Prévention des conflits entre providers
6. **Performance** : Index optimisés pour les recherches rapides

## 📋 Prochaines Étapes

1. **Implémenter OTP** pour la vérification téléphone
2. **Intégrer Google OAuth** dans le frontend
3. **Intégrer Facebook SDK** dans le frontend
4. **Ajouter la gestion des avatars** de profil
5. **Implémenter la liaison de comptes** (optionnel)

## 🔧 Migration

Pour migrer les utilisateurs existants :

```sql
-- Mettre à jour les utilisateurs existants
UPDATE users 
SET 
  auth_provider = 'phone',
  primary_identifier = phone
WHERE phone IS NOT NULL;
```

Cette architecture garantit une expérience utilisateur fluide tout en maintenant la sécurité et la flexibilité nécessaires pour une application moderne.
