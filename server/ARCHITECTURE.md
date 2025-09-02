# 🏗️ Architecture MyReprise - Plateforme d'Échange C2C

## 📋 Vue d'ensemble
MyReprise est une plateforme d'échange de produits entre particuliers (C2C) utilisant des algorithmes de graphes pour la personnalisation et les recommandations.

## 🏛️ Architecture Microservices

```
┌─────────────────────────────────────────────────────────────────┐
│                        NGINX (Port 80/443)                     │
│                    Reverse Proxy & Load Balancer               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Node.js   │ │   Spring    │ │   FastAPI   │
│   Logic     │ │   Boot      │ │   AI/Graph  │
│  (Port 3001)│ │  (Port 8080)│ │  (Port 8002)│
│             │ │             │ │             │
│ • API REST  │ │ • Paiements │ │ • Neo4j     │
│ • Auth      │ │ • Stripe    │ │ • ML/Graph  │
│ • Business  │ │ • PayPal    │ │ • Algos     │
└─────────────┘ └─────────────┘ └─────────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│    MySQL    │ │    Redis    │ │    Neo4j    │
│  (Port 3306)│ │  (Port 6379)│ │ (Port 7687) │
│             │ │             │ │             │
│ • Données   │ │ • Cache     │ │ • Graphes   │
│ • Relations │ │ • Sessions  │ │ • Relations │
│ • ACID      │ │ • Queue     │ │ • Algos     │
└─────────────┘ └─────────────┘ └─────────────┘
```

## 🗄️ Base de Données MySQL (Données Relationnelles)

### 📊 Modèles Principaux

```
┌─────────────────────────────────────────────────────────────────┐
│                        MODÈLES CORE                             │
├─────────────────────────────────────────────────────────────────┤
│  👤 User                    🏠 Address                          │
│  ├─ id                     ├─ id                               │
│  ├─ first_name             ├─ city                             │
│  ├─ last_name              ├─ sector                           │
│  ├─ email                  ├─ address_name                     │
│  ├─ phone                  └─ created_at/updated_at            │
│  ├─ is_verified            │                                   │
│  ├─ role                   │                                   │
│  ├─ address_id (FK)        │                                   │
│  └─ created_at/updated_at  │                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      MODÈLES COMMERCE                           │
├─────────────────────────────────────────────────────────────────┤
│  🏪 Store                   📦 Product                          │
│  ├─ id                     ├─ id                               │
│  ├─ user_id (FK)           ├─ created_by (FK)                  │
│  ├─ name                   ├─ title                            │
│  ├─ description            ├─ price                            │
│  ├─ is_active              ├─ description                      │
│  └─ created_at/updated_at  ├─ product_condition                │
│                             ├─ replaced_by_product_id (FK)     │
│                             └─ created_at/updated_at           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      MODÈLES OFFRE                              │
├─────────────────────────────────────────────────────────────────┤
│  💼 Offer                   🖼️ OfferImage                       │
│  ├─ id                     ├─ id                               │
│  ├─ product_id (FK)        ├─ color                            │
│  ├─ seller_id (FK)         ├─ color_hex                        │
│  ├─ replaced_by_offer_id   ├─ is_main                          │
│  ├─ product_condition      ├─ image_url                        │
│  ├─ price                  ├─ offer_id (FK)                    │
│  ├─ title                  └─ created_at/updated_at            │
│  ├─ description            │                                   │
│  ├─ status                 │                                   │
│  ├─ is_deleted             │                                   │
│  └─ created_at/updated_at  │                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 🏷️ Modèles de Classification

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODÈLES CLASSIFICATION                       │
├─────────────────────────────────────────────────────────────────┤
│  📂 Category                🏷️ Brand                           │
│  ├─ id                     ├─ id                               │
│  ├─ parent_id (FK)         ├─ logo                             │
│  ├─ name_ar                ├─ name_ar                          │
│  ├─ name_fr                ├─ name_fr                          │
│  ├─ description_ar         ├─ description_ar                   │
│  ├─ description_fr         ├─ description_fr                   │
│  ├─ image                  ├─ category_id (FK)                 │
│  ├─ icon                   └─ created_at/updated_at            │
│  └─ created_at/updated_at  │                                   │
│                             │                                   │
│  📚 Subject                 🔗 SubjectCategory                 │
│  ├─ id                     ├─ id                               │
│  ├─ name_ar                ├─ subject_id (FK)                  │
│  ├─ name_fr                ├─ category_id (FK)                 │
│  ├─ description_ar         └─ created_at/updated_at            │
│  ├─ description_fr         │                                   │
│  ├─ image                  │                                   │
│  ├─ icon                   │                                   │
│  └─ created_at/updated_at  │                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 📋 Modèles de Commande

```
┌─────────────────────────────────────────────────────────────────┐
│                      MODÈLES COMMANDE                           │
├─────────────────────────────────────────────────────────────────┤
│  📋 Order                   👤 UserSnapshot                     │
│  ├─ id                     ├─ id                               │
│  ├─ order_number           ├─ order_id (FK)                    │
│  ├─ status                 ├─ name                             │
│  ├─ total_amount           ├─ email                            │
│  ├─ notes                  ├─ phone                            │
│  ├─ exchange_date          ├─ is_sender                        │
│  ├─ balance_amount         ├─ address_id (FK)                  │
│  ├─ balance_payer_id       ├─ user_id (FK)                     │
│  └─ created_at/updated_at  └─ created_at/updated_at            │
│                             │                                   │
│  📦 ProductSnapshot         │                                   │
│  ├─ id                     │                                   │
│  ├─ order_id (FK)          │                                   │
│  ├─ title                  │                                   │
│  ├─ price                  │                                   │
│  ├─ description            │                                   │
│  ├─ product_condition      │                                   │
│  ├─ replaced_by_product_id │                                   │
│  ├─ is_from_product        │                                   │
│  ├─ offer_id (FK)          │                                   │
│  └─ created_at/updated_at  │                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 🚚 Modèles de Livraison

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODÈLES LIVRAISON                            │
├─────────────────────────────────────────────────────────────────┤
│  🚚 DeliveryCompany         📦 DeliveryInfo                     │
│  ├─ id                     ├─ id                               │
│  ├─ name                   ├─ order_id (FK)                    │
│  └─ created_at/updated_at  ├─ company_id (FK)                  │
│                             ├─ delivery_status                  │
│                             ├─ delivery_comment                 │
│                             ├─ delivery_type                    │
│                             ├─ is_fragile                       │
│                             ├─ order_number                     │
│                             ├─ package_count                    │
│                             ├─ package_height                   │
│                             ├─ package_length                   │
│                             ├─ package_width                    │
│                             ├─ range_weight                     │
│                             ├─ status                           │
│                             ├─ subject                          │
│                             ├─ total_price                      │
│                             ├─ total_amount                     │
│                             ├─ total_weight                     │
│                             └─ created_at/updated_at            │
└─────────────────────────────────────────────────────────────────┘
```

### ⚙️ Modèles Système

```
┌─────────────────────────────────────────────────────────────────┐
│                      MODÈLES SYSTÈME                            │
├─────────────────────────────────────────────────────────────────┤
│  ⚙️ Setting                                                      │
│  ├─ id                                                          │
│  ├─ key                                                         │
│  ├─ value                                                       │
│  ├─ type                                                        │
│  ├─ description                                                 │
│  ├─ is_system                                                   │
│  └─ created_at/updated_at                                       │
└─────────────────────────────────────────────────────────────────┘
```

## 🕸️ Base de Données Neo4j (Graphes)

### 🔗 Nœuds (Nodes)

```
┌─────────────────────────────────────────────────────────────────┐
│                        NŒUDS NEO4J                              │
├─────────────────────────────────────────────────────────────────┤
│  👤 User                    📦 Product                          │
│  ├─ id                     ├─ id                               │
│  ├─ name                   ├─ title                            │
│  ├─ email                  ├─ price                            │
│  ├─ city                   ├─ condition                        │
│  └─ preferences            └─ category                         │
│                             │                                   │
│  📂 Category                🏷️ Brand                           │
│  ├─ id                     ├─ id                               │
│  ├─ name                   ├─ name                             │
│  └─ parent_id              └─ category_id                      │
└─────────────────────────────────────────────────────────────────┘
```

### 🔗 Relations (Edges)

```
┌─────────────────────────────────────────────────────────────────┐
│                      RELATIONS NEO4J                            │
├─────────────────────────────────────────────────────────────────┤
│  👤 User -[AIME]-> 📦 Product                                   │
│  👤 User -[CHERCHE]-> 📦 Product                               │
│  👤 User -[CONSULTE {temps, clics}]-> 📦 Product               │
│  📦 Product -[ÉCHANGÉ_AVEC {poids}]-> 📦 Product               │
│  📦 Product -[APPARTIENT_A]-> 📂 Category                       │
│  🏷️ Brand -[APPARTIENT_A]-> 📂 Category                        │
│  👤 User -[SIMILAIRE_A]-> 👤 User                              │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Flux de Données

### 📊 Migration MySQL → Neo4j

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    MySQL    │───▶│   Python    │───▶│    Neo4j    │
│             │    │   Script    │    │             │
│ • Relations │    │             │    │ • Graphes   │
│ • ACID      │    │ • Migration │    │ • Relations │
│ • Données   │    │ • Mapping   │    │ • Algos     │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 🔄 Synchronisation Temps Réel

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    MySQL    │───▶│   Events    │───▶│    Neo4j    │
│             │    │             │    │             │
│ • CRUD      │    │ • Webhooks  │    │ • Update    │
│ • Changes   │    │ • Queue     │    │ • Sync      │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 🧠 Algorithmes de Recommandation

### 📈 Types de Recommandations

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALGORITHMES GRAPHE                           │
├─────────────────────────────────────────────────────────────────┤
│  🔍 Content-based Filtering                                     │
│  ├─ Graph Traversal                                             │
│  ├─ Similarité de catégories                                    │
│  └─ Produits échangés ensemble                                  │
│                                                                 │
│  👥 Collaborative Filtering                                     │
│  ├─ Utilisateurs similaires                                     │
│  ├─ Comportements partagés                                      │
│  └─ Recommandations croisées                                    │
│                                                                 │
│  📊 Trending Detection                                          │
│  ├─ Produits populaires                                         │
│  ├─ Taux d'engagement                                           │
│  └─ Boost temporel                                              │
│                                                                 │
│  🎯 Hybrid Personalization                                      │
│  ├─ Graph Neural Networks                                       │
│  ├─ Node2Vec / DeepWalk                                         │
│  └─ Community Detection                                         │
└─────────────────────────────────────────────────────────────────┘
```

## 🌐 API Endpoints

### 🔗 Node.js Logic Service (Port 3001)

```
┌─────────────────────────────────────────────────────────────────┐
│                        API ENDPOINTS                            │
├─────────────────────────────────────────────────────────────────┤
│  🔐 Auth Routes                                                 │
│  ├─ POST /api/auth/register                                     │
│  ├─ POST /api/auth/login                                        │
│  └─ POST /api/auth/logout                                       │
│                                                                 │
│  👤 User Routes                                                 │
│  ├─ GET /api/users/profile                                      │
│  ├─ PUT /api/users/profile                                      │
│  └─ GET /api/users/:id                                          │
│                                                                 │
│  📦 Product Routes                                              │
│  ├─ GET /api/products                                           │
│  ├─ POST /api/products                                          │
│  ├─ GET /api/products/:id                                       │
│  └─ PUT /api/products/:id                                       │
│                                                                 │
│  💼 Offer Routes                                                │
│  ├─ GET /api/offers                                             │
│  ├─ POST /api/offers                                            │
│  ├─ GET /api/offers/:id                                         │
│  └─ PUT /api/offers/:id                                         │
│                                                                 │
│  📋 Order Routes                                                │
│  ├─ GET /api/orders                                             │
│  ├─ POST /api/orders                                            │
│  └─ GET /api/orders/:id                                         │
│                                                                 │
│  🏷️ Category/Brand Routes                                       │
│  ├─ GET /api/categories                                         │
│  ├─ GET /api/brands                                             │
│  └─ GET /api/subjects                                           │
└─────────────────────────────────────────────────────────────────┘
```

### 💳 Payment Service (Port 8080)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT ENDPOINTS                            │
├─────────────────────────────────────────────────────────────────┤
│  💳 Payment Routes                                              │
│  ├─ POST /api/payments/create                                   │
│  ├─ POST /api/payments/confirm                                  │
│  └─ GET /api/payments/:id                                       │
│                                                                 │
│  🔄 Exchange Routes                                             │
│  ├─ POST /api/exchanges/initiate                                │
│  ├─ POST /api/exchanges/confirm                                 │
│  └─ GET /api/exchanges/:id                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 🧠 Graph Service (Port 8002)

```
┌─────────────────────────────────────────────────────────────────┐
│                    GRAPH ENDPOINTS                              │
├─────────────────────────────────────────────────────────────────┤
│  🔍 Recommendation Routes                                       │
│  ├─ GET /api/recommendations/user/:id                           │
│  ├─ GET /api/recommendations/product/:id                        │
│  └─ GET /api/recommendations/trending                           │
│                                                                 │
│  📊 Analytics Routes                                            │
│  ├─ GET /api/analytics/user/:id                                 │
│  ├─ GET /api/analytics/product/:id                              │
│  └─ GET /api/analytics/trends                                   │
│                                                                 │
│  🔄 Graph Management                                            │
│  ├─ POST /api/graph/sync                                        │
│  ├─ GET /api/graph/stats                                        │
│  └─ POST /api/graph/rebuild                                     │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Déploiement

### 🐳 Docker Compose

```
┌─────────────────────────────────────────────────────────────────┐
│                        SERVICES DOCKER                          │
├─────────────────────────────────────────────────────────────────┤
│  🌐 nginx                                                       │
│  ├─ Port: 80, 443                                              │
│  ├─ SSL/TLS                                                    │
│  └─ Load Balancing                                             │
│                                                                 │
│  🟢 nodejs-app (Logic)                                         │
│  ├─ Port: 3001                                                 │
│  ├─ Build: ./logic                                             │
│  └─ Dependencies: MySQL, Redis                                 │
│                                                                 │
│  🟢 nodejs-app-2 (Logic Backup)                                │
│  ├─ Port: 3002                                                 │
│  ├─ Build: ./logic                                             │
│  └─ Dependencies: MySQL, Redis                                 │
│                                                                 │
│  🔵 payment-service                                             │
│  ├─ Port: 8080                                                 │
│  ├─ Build: ./payment-service                                    │
│  └─ Dependencies: MySQL                                        │
│                                                                 │
│  🟡 graph-service                                               │
│  ├─ Port: 8002                                                 │
│  ├─ Build: ./graph-service                                      │
│  └─ Dependencies: Neo4j                                        │
│                                                                 │
│  🟠 ai-service                                                  │
│  ├─ Port: 8001                                                 │
│  ├─ Build: ./ai-service                                         │
│  └─ Dependencies: MySQL, Neo4j                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Configuration

### 📁 Structure des Fichiers

```
server/
├── docker-compose.yml          # Orchestration des services
├── nginx/
│   ├── nginx.conf              # Configuration reverse proxy
│   └── ssl/                    # Certificats SSL
├── logic/                      # Service Node.js principal
│   ├── src/
│   │   ├── models/             # Modèles Sequelize
│   │   ├── routes/             # Routes API
│   │   ├── middleware/         # Middleware auth
│   │   ├── config/             # Configuration DB
│   │   └── utils/              # Utilitaires
│   ├── package.json
│   └── Dockerfile
├── payment-service/            # Service Spring Boot
│   ├── src/main/java/
│   ├── pom.xml
│   └── Dockerfile
├── graph-service/              # Service FastAPI
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── ai-service/                 # Service IA
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
└── scripts/                    # Scripts utilitaires
    ├── migrate_mysql_to_neo4j.py
    ├── seed_test_data_utf8.sql
    └── clear_database.sql
```

## 🌍 Support Multilingue

### 🔤 Modèles Multilingues

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPPORT MULTILINGUE                          │
├─────────────────────────────────────────────────────────────────┤
│  📂 Category, 🏷️ Brand, 📚 Subject                             │
│  ├─ name_ar (Arabe)                                            │
│  ├─ name_fr (Français)                                         │
│  ├─ description_ar (Arabe)                                     │
│  └─ description_fr (Français)                                  │
│                                                                 │
│  ⚙️ Setting: currentLanguage                                    │
│  ├─ Valeurs: 'fr', 'ar'                                        │
│  └─ Défaut: 'fr'                                               │
│                                                                 │
│  🔄 LocalizationManager                                         │
│  ├─ getLocalizedData()                                         │
│  ├─ getCurrentLanguage()                                       │
│  └─ switchLanguage()                                           │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Métriques et Monitoring

### 📈 KPIs Principaux

```
┌─────────────────────────────────────────────────────────────────┐
│                        MÉTRIQUES                                │
├─────────────────────────────────────────────────────────────────┤
│  👥 Utilisateurs                                               │
│  ├─ Inscriptions/jour                                          │
│  ├─ Utilisateurs actifs                                        │
│  └─ Taux de rétention                                          │
│                                                                 │
│  📦 Produits                                                   │
│  ├─ Offres créées/jour                                         │
│  ├─ Taux d'échange                                             │
│  └─ Produits populaires                                        │
│                                                                 │
│  💰 Business                                                   │
│  ├─ Revenus par échange                                        │
│  ├─ ROI utilisateurs                                           │
│  └─ Chaînes d'investissement                                   │
│                                                                 │
│  🧠 Algorithmes                                                │
│  ├─ Précision recommandations                                  │
│  ├─ Temps de réponse                                           │
│  └─ Taux de conversion                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Prochaines Étapes

1. **Compléter les données de test** - Ajouter tous les produits, offres, commandes
2. **Tester la migration Neo4j** - Valider la synchronisation des données
3. **Implémenter les algorithmes** - Développer les recommandations
4. **API Frontend** - Connecter avec Next.js
5. **Tests et déploiement** - Validation complète du système

---

*Architecture conçue pour une plateforme d'échange C2C moderne avec intelligence artificielle et personnalisation avancée.*
