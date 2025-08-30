# 🚀 MyReprise Backend - Architecture Multi-Services

Une architecture backend moderne et robuste utilisant NGINX, Node.js, Spring Boot et FastAPI pour une application complète.

## 📋 Vue d'ensemble de l'architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          NGINX (Port 80/443)                    │
│                    Load Balancer & Reverse Proxy                │
└─────────────────────┬─────────────────┬─────────────────────────┘
                      │                 │
    ┌─────────────────▼─────────────────▼──────────────────┐
    │                 Node.js Services                     │
    │         (Port 3000/3001 - Logique Métier)          │
    └─────────────────┬─────────────────────────────────────┘
                      │
    ┌─────────────────▼─────────────────┐  ┌─────────────────────────┐
    │    Spring Boot Payment Service    │  │    FastAPI AI Service    │
    │         (Port 8080)              │  │       (Port 8000)        │
    │     • Stripe Integration         │  │  • Text Processing       │
    │     • PayPal Integration         │  │  • Image Analysis        │
    │     • Transaction Management     │  │  • Audio Processing      │
    └──────────────────────────────────┘  │  • ML Predictions        │
                                          │  • Chat AI               │
                                          └─────────────────────────┘
    ┌─────────────────────────────────────────────────────────────────┐
    │                    Infrastructure Services                      │
    │  PostgreSQL (5432) │ Redis (6379) │ Prometheus │ Grafana      │
    └─────────────────────────────────────────────────────────────────┘
```

## 🎯 Services et responsabilités

### 1. 🌐 NGINX - Reverse Proxy & Load Balancer
- **Port**: 80 (HTTP) / 443 (HTTPS)
- **Responsabilités**:
  - Load balancing entre les instances Node.js
  - Gestion SSL/TLS
  - Rate limiting
  - Compression Gzip
  - Routage intelligent vers les services
  - Sécurité (headers, CORS)

### 2. 🟢 Node.js - Service Principal
- **Ports**: 3000, 3001 (Load balanced)
- **Responsabilités**:
  - Logique métier complète de l'application
  - Authentification et autorisation (JWT)
  - API RESTful principale
  - Gestion des utilisateurs
  - WebSocket pour temps réel
  - Communication avec les autres services

### 3. ☕ Spring Boot - Service de Paiement
- **Port**: 8080
- **Responsabilités**:
  - Intégration Stripe et PayPal
  - Gestion des transactions
  - Webhooks de paiement
  - Sécurité des paiements
  - Rapports financiers
  - Gestion des remboursements

### 4. 🤖 FastAPI - Service IA
- **Port**: 8000
- **Responsabilités**:
  - Traitement de texte (NLP)
  - Analyse d'images (Computer Vision)
  - Traitement audio
  - Prédictions ML
  - Chat IA avec OpenAI
  - APIs IA asynchrones

## 🚀 Démarrage rapide

### Prérequis
- Docker & Docker Compose
- Git
- 8GB RAM minimum
- 20GB espace disque

### Installation

1. **Cloner le repository**
```bash
git clone <your-repo-url>
cd MyReprise/server
```

2. **Configuration des variables d'environnement**
```bash
cp env.example .env
# Éditez le fichier .env avec vos clés API
```

3. **Générer les certificats SSL (développement)**
```bash
chmod +x nginx/ssl/generate-ssl.sh
./nginx/ssl/generate-ssl.sh
```

4. **Démarrer tous les services**
```bash
docker-compose up -d
```

5. **Vérifier le statut des services**
```bash
docker-compose ps
```

### 🔍 URLs des services

| Service | URL | Description |
|---------|-----|-------------|
| NGINX | http://localhost | Point d'entrée principal |
| Node.js API | http://localhost/api | API principale |
| Payment API | http://localhost/payment | API de paiement |
| AI API | http://localhost/ai | API IA |
| Grafana | http://localhost:3001 | Monitoring |
| Prometheus | http://localhost:9090 | Métriques |

## 📁 Structure du projet

```
server/
├── docker-compose.yml          # Orchestration des services
├── env.example                 # Variables d'environnement
├── README.md                   # Documentation
│
├── nginx/                      # Configuration NGINX
│   ├── nginx.conf             # Configuration principale
│   └── ssl/                   # Certificats SSL
│
├── nodejs-service/            # Service principal Node.js
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── server.js         # Point d'entrée
│   │   ├── config/           # Configuration DB/Redis
│   │   ├── routes/           # Routes API
│   │   ├── middleware/       # Middleware custom
│   │   └── utils/            # Utilitaires
│   └── logs/                 # Logs applicatifs
│
├── payment-service/           # Service de paiement Spring Boot
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/myreprise/payment/
│       ├── PaymentServiceApplication.java
│       ├── controller/       # Contrôleurs REST
│       ├── service/          # Logique métier
│       ├── model/            # Entités JPA
│       └── config/           # Configuration Spring
│
├── ai-service/               # Service IA FastAPI
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py              # Point d'entrée FastAPI
│   ├── config/              # Configuration
│   ├── routers/             # Routes API
│   ├── models/              # Modèles ML
│   └── utils/               # Utilitaires IA
│
└── monitoring/              # Configuration monitoring
    ├── prometheus.yml
    └── grafana/
```

## 🔧 Configuration

### Variables d'environnement principales

```bash
# Base de données
DATABASE_URL=postgresql://user:password@postgres:5432/myreprise
DB_USERNAME=myreprise_user
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your_super_secure_jwt_secret_64_chars_minimum

# Paiements
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=your_paypal_client_id

# IA
OPENAI_API_KEY=sk-...
HUGGINGFACE_API_KEY=hf_...

# Environnement
NODE_ENV=production
ENVIRONMENT=production
```

### Configuration NGINX

Le fichier `nginx/nginx.conf` configure :
- **Load balancing** : Round-robin entre les instances Node.js
- **Rate limiting** : Protection contre les attaques DDoS
- **SSL/TLS** : Redirection HTTPS obligatoire
- **Compression** : Gzip pour optimiser les performances
- **Sécurité** : Headers de sécurité, CORS

### Routes API

| Service | Route | Description |
|---------|-------|-------------|
| Node.js | `/api/auth/*` | Authentification |
| Node.js | `/api/users/*` | Gestion utilisateurs |
| Node.js | `/api/products/*` | Catalogue produits |
| Spring Boot | `/payment/*` | Paiements |
| FastAPI | `/ai/text/*` | Traitement texte |
| FastAPI | `/ai/image/*` | Analyse images |
| FastAPI | `/ai/chat/*` | Chat IA |

## 📊 Monitoring et observabilité

### Prometheus Métriques
- Nombre de requêtes HTTP
- Temps de réponse
- Taux d'erreur
- Utilisation CPU/Mémoire
- Métriques spécifiques aux services

### Grafana Dashboards
- Performance des services
- Santé de l'infrastructure
- Métriques business
- Alertes automatiques

### Logs structurés
- Format JSON pour tous les services
- Corrélation par trace ID
- Niveaux de log configurables
- Rotation automatique

## 🔒 Sécurité

### Authentification
- JWT avec rotation automatique
- Rate limiting par IP/utilisateur
- Blacklist de tokens
- Validation des permissions

### Chiffrement
- HTTPS obligatoire (TLS 1.2+)
- Chiffrement des données sensibles
- Hachage des mots de passe (bcrypt)
- Secrets stockés dans variables d'environnement

### Protection
- Headers de sécurité (HSTS, CSP, etc.)
- Validation stricte des inputs
- Protection CSRF
- Scan automatique des vulnérabilités

## 🚀 Déploiement en production

### 1. Configuration de production
```bash
# Modifier docker-compose.yml pour la production
docker-compose -f docker-compose.prod.yml up -d
```

### 2. SSL avec Let's Encrypt
```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir le certificat
sudo certbot --nginx -d votre-domaine.com
```

### 3. Surveillance
```bash
# Vérifier les logs
docker-compose logs -f

# Vérifier l'état des services
docker-compose ps
curl http://localhost/health
```

### 4. Backup
```bash
# Backup automatique de la DB
docker exec postgres pg_dump -U myreprise_user myreprise > backup.sql

# Backup des volumes
docker run --rm -v postgres_data:/backup alpine tar czf - /backup > postgres_backup.tar.gz
```

## 🧪 Tests

### Tests unitaires
```bash
# Node.js
cd nodejs-service && npm test

# Spring Boot
cd payment-service && mvn test

# FastAPI
cd ai-service && pytest
```

### Tests d'intégration
```bash
# Tests end-to-end
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

### Performance
```bash
# Test de charge avec Artillery
npm install -g artillery
artillery run load-test.yml
```

## 📈 Scaling et haute disponibilité

### Scaling horizontal
```bash
# Augmenter les instances Node.js
docker-compose up -d --scale nodejs-app=3

# Load balancer automatique NGINX
# Ajouter les nouvelles instances dans nginx.conf
```

### Cache distribué
- Redis pour les sessions
- Cache applicatif intelligent
- CDN pour les assets statiques

### Base de données
- Réplication master-slave PostgreSQL
- Connection pooling optimisé
- Backup automatique quotidien

## 🆘 Dépannage

### Problèmes courants

1. **Service ne démarre pas**
```bash
docker-compose logs service-name
docker system prune -a
```

2. **Erreur de connexion DB**
```bash
docker exec -it postgres psql -U myreprise_user -d myreprise
```

3. **Performance dégradée**
```bash
# Vérifier les métriques
curl http://localhost:9090/metrics
```

### Commandes utiles
```bash
# Redémarrer un service
docker-compose restart service-name

# Voir l'utilisation des ressources
docker stats

# Nettoyer les volumes
docker volume prune
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

- 📧 Email: support@myreprise.com
- 📱 Discord: [Serveur MyReprise](https://discord.gg/myreprise)
- 📚 Documentation: [docs.myreprise.com](https://docs.myreprise.com)

---

**Développé avec ❤️ par l'équipe MyReprise**
