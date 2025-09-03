# 🔐 Guide d'Authentification MyReprise

## 📋 Vue d'ensemble

Le système d'authentification de MyReprise utilise **JWT (JSON Web Tokens)** pour sécuriser les API et gérer les sessions utilisateur. Il inclut également une structure pour la vérification OTP par téléphone (à implémenter).

## 🏗️ Architecture

### Backend (Node.js)
- **Modèle User** : Gestion des utilisateurs avec champ `isVerified` pour OTP
- **Contrôleur User** : CRUD complet + authentification JWT
- **Middleware Auth** : Vérification des tokens et permissions
- **Routes API** : Endpoints sécurisés avec validation

### Frontend (Next.js)
- **Service UserApi** : Appels API avec gestion des tokens
- **Composants Auth** : Formulaires de connexion/inscription
- **Gestion d'état** : Stockage local des tokens et données utilisateur

## 🔑 Authentification JWT

### Configuration
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = '24h';
const JWT_REFRESH_EXPIRES_IN = '7d';
```

### Flux d'authentification
1. **Inscription/Connexion** → Génération des tokens
2. **Stockage** → Tokens sauvés dans localStorage
3. **Requêtes API** → Token envoyé dans l'en-tête Authorization
4. **Vérification** → Middleware vérifie le token
5. **Rafraîchissement** → Refresh token pour renouveler l'accès

## 📱 Vérification OTP (TODO)

### Structure préparée
```javascript
// Champs dans le modèle User
isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified'
}

// Méthodes dans le contrôleur (à implémenter)
sendOTP()    // Envoi du code OTP
verifyOTP()  // Vérification du code
```

### À implémenter
1. **Génération OTP** : Code à 6 chiffres avec expiration (5 min)
2. **Envoi SMS/WhatsApp** : Intégration service de messagerie
3. **Stockage temporaire** : Redis pour les codes OTP
4. **Interface utilisateur** : Composants de saisie OTP

## 🛡️ Sécurité

### Middleware de protection
- **authenticateToken** : Vérification JWT obligatoire
- **requireRole** : Vérification des rôles (user/admin/moderator)
- **requireVerified** : Accès limité aux utilisateurs vérifiés
- **rateLimitByUser** : Limitation des requêtes par utilisateur

### Validation des données
- **express-validator** : Validation côté serveur
- **Validation côté client** : Vérification avant envoi
- **Sanitisation** : Nettoyage des entrées utilisateur

## 📊 Rôles et Permissions

### Hiérarchie des rôles
```
admin > moderator > user
```

### Permissions par rôle
- **user** : Gestion de son profil, échanges
- **moderator** : Gestion des utilisateurs, vérification
- **admin** : Accès complet, gestion des rôles

## 🚀 Utilisation

### Backend - Routes disponibles

#### Authentification
```javascript
POST /api/auth/register     // Inscription
POST /api/auth/login        // Connexion
POST /api/auth/refresh      // Rafraîchissement token
POST /api/auth/logout       // Déconnexion
```

#### Profil utilisateur
```javascript
GET  /api/users/profile           // Récupérer son profil
PUT  /api/users/profile           // Modifier son profil
PUT  /api/users/change-password   // Changer mot de passe
```

#### OTP (TODO)
```javascript
POST /api/users/send-otp    // Envoyer code OTP
POST /api/users/verify-otp  // Vérifier code OTP
```

#### Administration
```javascript
GET    /api/users              // Liste des utilisateurs
GET    /api/users/:id          // Utilisateur par ID
PUT    /api/users/:id          // Modifier utilisateur
DELETE /api/users/:id          // Supprimer utilisateur
PUT    /api/users/:id/verify   // Vérifier utilisateur
PUT    /api/users/:id/role     // Changer rôle
GET    /api/users/stats        // Statistiques
```

### Frontend - Utilisation des composants

#### Connexion
```tsx
import LoginForm from '@/components/auth/LoginForm';

<LoginForm 
    onSuccess={(user) => console.log('Connecté:', user)}
    onError={(error) => console.error('Erreur:', error)}
    redirectTo="/dashboard"
/>
```

#### Inscription
```tsx
import RegisterForm from '@/components/auth/RegisterForm';

<RegisterForm 
    onSuccess={(user) => console.log('Inscrit:', user)}
    redirectTo="/profile"
/>
```

#### Profil utilisateur
```tsx
import UserProfile from '@/components/auth/UserProfile';

<UserProfile 
    isEditable={true}
    onUpdate={(user) => console.log('Profil mis à jour:', user)}
/>
```

#### Gestion administrateur
```tsx
import UserManagement from '@/components/admin/UserManagement';

<UserManagement isAdmin={true} />
```

### Service API - Exemples d'utilisation

```javascript
import { userApi } from '@/services/UserApi';

// Connexion
const response = await userApi.login({
    email: 'user@example.com',
    password: 'password123'
});

// Récupérer le profil
const profile = await userApi.getProfile();

// Vérifier l'authentification
if (userApi.isAuthenticated()) {
    const user = userApi.getCurrentUser();
    console.log('Utilisateur connecté:', user);
}

// Vérifier les rôles
if (userApi.isAdmin()) {
    // Actions d'administrateur
}

// Déconnexion
await userApi.logout();
```

## 🔧 Configuration

### Variables d'environnement
```bash
# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Base de données
DATABASE_URL=mysql://user:password@localhost:3306/myreprise
DB_USERNAME=myreprise_user
DB_PASSWORD=secure_password

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Middleware dans Next.js
```javascript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token');
    
    if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    return NextResponse.next();
}
```

## 📝 Prochaines étapes

### Implémentation OTP
1. **Service SMS/WhatsApp** : Intégration Twilio ou équivalent
2. **Stockage Redis** : Codes OTP avec expiration
3. **Interface utilisateur** : Composants de saisie OTP
4. **Tests** : Validation du flux complet

### Améliorations sécurité
1. **Blacklist tokens** : Invalidation des tokens lors de la déconnexion
2. **2FA** : Authentification à deux facteurs
3. **Audit logs** : Traçabilité des actions sensibles
4. **Rate limiting** : Protection contre les attaques par force brute

### Fonctionnalités avancées
1. **SSO** : Authentification unique avec Google/Facebook
2. **Biométrie** : Authentification par empreinte/visage
3. **Sessions multiples** : Gestion des connexions simultanées
4. **Géolocalisation** : Détection des connexions suspectes

## 🐛 Dépannage

### Problèmes courants

#### Token expiré
```javascript
// Vérifier l'expiration
const token = userApi.getToken();
if (token) {
    const decoded = jwt.decode(token);
    if (decoded.exp < Date.now() / 1000) {
        // Token expiré, rafraîchir
        await userApi.refreshToken();
    }
}
```

#### Erreur 401 (Non autorisé)
```javascript
// Vérifier l'authentification
if (!userApi.isAuthenticated()) {
    // Rediriger vers la connexion
    router.push('/auth/login');
}
```

#### Erreur 403 (Permissions insuffisantes)
```javascript
// Vérifier les rôles
if (!userApi.hasRole('admin')) {
    // Afficher message d'erreur
    setError('Permissions insuffisantes');
}
```

## 📚 Ressources

- [JWT.io](https://jwt.io/) - Documentation JWT
- [Next.js Authentication](https://nextjs.org/docs/authentication) - Guide Next.js
- [Express Validator](https://express-validator.github.io/docs/) - Validation
- [Bcrypt](https://www.npmjs.com/package/bcryptjs) - Hachage des mots de passe

---

**Développé avec ❤️ pour MyReprise**
