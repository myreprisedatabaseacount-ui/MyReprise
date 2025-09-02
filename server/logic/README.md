# 🚀 MyReprise Logic Service

Service principal Node.js contenant toute la logique métier de MyReprise.

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env` basé sur `env.local.example` :

```bash
cp env.local.example .env
```

Variables importantes :
- `PORT=8080` - Port du serveur (défaut: 8080)
- `DB_HOST=localhost` - Host MySQL
- `DB_USERNAME=root` - Utilisateur MySQL  
- `DB_DATABASE=myreprise` - Base de données
- `REDIS_HOST=localhost` - Host Redis
- `JWT_SECRET=...` - Secret pour les tokens JWT

## ⚙️ Installation et démarrage

### Installation des dépendances
```bash
npm install
```

### Démarrage en développement
```bash
# Avec le port par défaut (8080)
npm run dev

# Forcer le port 8080 
npm run dev:8080

# Ou directement avec la variable
PORT=8080 npm run dev
```

### Démarrage en production
```bash
# Avec le port par défaut (8080)
npm start

# Forcer le port 8080
npm run start:8080

# Ou directement avec la variable
PORT=8080 npm start
```

## 🌐 URLs du service

Une fois démarré, le service sera accessible sur :

- **API principale** : `http://localhost:8080`
- **Health check** : `http://localhost:8080/health`
- **Documentation API** : `http://localhost:8080/api-docs`

### Endpoints principaux

```
GET  /api/offers          - Liste des offres avec recommandations
POST /api/offers          - Créer une nouvelle offre
GET  /api/offers/investment/:userId - Analyse d'investissement utilisateur

GET  /api/categories      - Catégories (multilingue)
GET  /api/brands          - Marques (multilingue)
GET  /api/subjects        - Matières (multilingue)

GET  /api/users/profile   - Profil utilisateur
POST /api/auth/login      - Authentification
POST /api/auth/register   - Inscription

GET  /api/orders          - Commandes avec snapshots
POST /api/orders          - Créer une commande

POST /api/settings/language - Changer langue globale (ar/fr)
```

## 🏗️ Architecture

### Modèles Sequelize
- **User**, **Address**, **Store** - Gestion utilisateurs
- **Offer**, **Product**, **Exchange** - Système d'échanges
- **Category**, **Brand**, **Subject** - Classification (multilingue)
- **Order**, **UserSnapshot**, **ProductSnapshot** - Commandes et historique
- **DeliveryInfo**, **DeliveryCompany** - Livraison
- **Setting** - Configuration application

### Fonctionnalités clés
- ✅ **Multilinguisme automatique** (Arabe/Français)
- ✅ **Chaînes d'investissement** par échanges
- ✅ **Algorithmes adaptatifs** (startup vs mature)
- ✅ **Snapshots historiques** pour analytics
- ✅ **Livraison multi-transporteurs** Maroc

## 🔄 Services dépendants

Le service nécessite :

### MySQL (port 3306)
```bash
# Via Docker
docker run -d --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root mysql:8.0

# Ou service complet
docker-compose up -d mysql
```

### Redis (port 6379)
```bash
# Via Docker  
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Ou service complet
docker-compose up -d redis
```

## 🧪 Tests et développement

```bash
# Tests unitaires
npm test

# Tests en mode watch
npm run test:watch

# Linter
npm run lint
npm run lint:fix
```

## 🐳 Docker

```bash
# Construction image
npm run docker:build

# Démarrage conteneur
npm run docker:run
```

## 📊 Intégration avec les autres services

### Appels vers Graph Service (Neo4j)
```javascript
// Recommandations utilisateur
const recommendations = await axios.get(`${process.env.GRAPH_SERVICE_URL}/recommendations/category/1`);

// Enregistrer une interaction
await axios.post(`${process.env.GRAPH_SERVICE_URL}/interactions`, {
  userId: 1, offerId: 5, interactionType: 'VIEW'
});
```

### Appels vers AI Service
```javascript
// Analyse d'image
const analysis = await axios.post(`${process.env.AI_SERVICE_URL}/analyze-image`, formData);
```

## 🔗 Frontend Next.js

Le frontend peut appeler ce service via :

```javascript
const API_BASE_URL = 'http://localhost:8080';

// Exemples d'appels
fetch(`${API_BASE_URL}/api/offers`)
fetch(`${API_BASE_URL}/api/categories`)
fetch(`${API_BASE_URL}/api/users/profile`)
```

---

**Service principal MyReprise prêt sur le port 8080 ! 🎯**
