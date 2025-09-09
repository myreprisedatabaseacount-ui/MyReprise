# 🔗 Intégration WhatsApp OTP - Frontend

## 📋 **Vue d'ensemble**

Cette intégration connecte le frontend React/Next.js avec le backend Node.js pour la vérification OTP via WhatsApp Business API.

## 🏗️ **Architecture**

### **Composants Frontend**
- **`SignUp.tsx`** : Processus d'inscription en 3 étapes avec vérification OTP
- **`Login.tsx`** : Connexion simple (sans OTP)
- **`useAuth.ts`** : Hook personnalisé pour gérer l'authentification
- **`authApi.ts`** : Service API pour communiquer avec le backend

### **Flux d'inscription**
1. **Étape 1** : Saisie des informations personnelles + envoi OTP
2. **Étape 2** : Définition du mot de passe
3. **Étape 3** : Vérification OTP + création du compte

## 🔧 **Configuration requise**

### **Variables d'environnement**
Créez un fichier `.env.local` dans le dossier `client/` :

```env
# Configuration de l'API Backend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Configuration des services externes (optionnel)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
```

### **Dépendances nécessaires**
```bash
npm install sonner  # Pour les notifications toast
```

## 📱 **Fonctionnalités implémentées**

### **1. Envoi d'OTP**
- Envoi automatique lors de l'étape 1 du SignUp
- Gestion des erreurs et notifications
- Support multi-pays avec codes de langue

### **2. Vérification OTP**
- Vérification du code saisi par l'utilisateur
- Gestion des tentatives et limitations
- Messages d'erreur contextuels

### **3. Renvoi d'OTP**
- Bouton "Renvoyer le code" dans l'étape 3
- Protection contre le spam (rate limiting)
- Indicateur de chargement

### **4. Gestion d'état**
- Stockage temporaire des données entre les étapes
- Gestion des erreurs par étape
- États de chargement granulaires

## 🎯 **Endpoints utilisés**

### **Backend API**
- `POST /api/users/send-otp` : Envoi d'OTP
- `POST /api/users/verify-otp` : Vérification d'OTP
- `POST /api/auth/register` : Inscription complète
- `POST /api/auth/login` : Connexion

### **Paramètres OTP**
```typescript
// Envoi d'OTP
{
  phone: string;
  country: string;
  purpose: 'verification' | 'reset_password' | 'login';
}

// Vérification d'OTP
{
  phone: string;
  otpCode: string;
  country: string;
  purpose: 'verification' | 'reset_password' | 'login';
}
```

## 🚀 **Utilisation**

### **1. Dans SignUp.tsx**
```typescript
const {
  isSendingOTP,
  isVerifyingOTP,
  isSigningUp,
  error,
  otpError,
  sendOTPCode,
  verifyOTPCode,
  completeSignUp
} = useAuth();

// Envoi d'OTP
const otpResult = await sendOTPCode(phone, country, 'verification');

// Vérification d'OTP
const verifyResult = await verifyOTPCode(phone, otpCode, country, 'verification');

// Inscription complète
const signUpResult = await completeSignUp(step1Data, step2Data);
```

### **2. Dans Login.tsx**
```typescript
const {
  isLoggingIn,
  error,
  performLogin
} = useAuth();

// Connexion
const loginResult = await performLogin(loginData);
```

## 🎨 **Interface utilisateur**

### **États de chargement**
- **Envoi OTP** : "Envoi du code..."
- **Vérification OTP** : "Vérification..."
- **Création compte** : "Création du compte..."
- **Connexion** : "Connexion..."

### **Messages d'erreur**
- Erreurs spécifiques par étape
- Messages contextuels pour l'utilisateur
- Gestion des codes d'erreur du backend

### **Notifications**
- Toast de succès/erreur avec Sonner
- Messages informatifs pour l'utilisateur
- Feedback visuel pour les actions

## 🔒 **Sécurité**

### **Validation côté client**
- Schémas Yup pour chaque étape
- Validation en temps réel
- Protection contre les injections

### **Gestion des tokens**
- Stockage sécurisé des tokens JWT
- Gestion des refresh tokens
- Nettoyage automatique des données temporaires

## 🧪 **Test**

### **Test manuel**
1. Démarrer le backend : `npm run dev` (dossier server/logic)
2. Démarrer le frontend : `npm run dev` (dossier client)
3. Tester le processus d'inscription complet
4. Vérifier les notifications et messages d'erreur

### **Test avec simulation**
- En mode développement, l'OTP est simulé
- Vérifiez les logs du backend pour voir les codes générés
- Testez avec différents numéros de téléphone

## 📝 **Notes importantes**

1. **Pas de vérification OTP dans Login** : Conformément aux exigences
2. **Mot de passe oublié** : Non implémenté (développement ultérieur)
3. **Connexions sociales** : Intégrées mais non testées
4. **Gestion d'erreurs** : Complète avec fallbacks

## 🔄 **Prochaines étapes**

1. **Test complet** avec de vrais numéros WhatsApp
2. **Intégration des connexions sociales** (Google/Facebook)
3. **Gestion des tokens** avec un store global (Redux/Zustand)
4. **Tests automatisés** pour les flux d'authentification
5. **Optimisation** des performances et UX

## 🆘 **Dépannage**

### **Erreurs communes**
- **CORS** : Vérifiez la configuration du backend
- **API URL** : Vérifiez `NEXT_PUBLIC_API_URL`
- **Tokens** : Vérifiez la configuration WhatsApp Business API
- **Validation** : Vérifiez les schémas Yup

### **Logs utiles**
- Console du navigateur pour les erreurs frontend
- Logs du backend pour les erreurs API
- Network tab pour les requêtes HTTP
