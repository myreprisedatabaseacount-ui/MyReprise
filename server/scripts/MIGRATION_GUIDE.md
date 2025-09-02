# 🚀 Guide de Migration MySQL → Neo4j pour MyReprise

## 📋 Vue d'ensemble

Ce guide vous accompagne pour migrer les données de MyReprise depuis MySQL vers Neo4j et configurer les algorithmes de recommandation graphiques.

## 🛠️ Prérequis

- **Docker & Docker Compose** installés
- **Python 3.11+** pour les scripts de migration
- **MySQL** avec données MyReprise existantes
- **Neo4j** configuré via Docker

## 📦 Architecture finale

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MySQL         │    │   Neo4j         │    │ Graph Service   │
│   (Relations)   │───▶│   (Graphe)      │◀───│ (FastAPI)       │
│                 │    │                 │    │ Recommandations │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Node.js App    │
                    │  (Logique)      │
                    └─────────────────┘
```

## 🚀 Étapes de Migration

### 1. Préparation de l'environnement

```bash
# Naviguer vers le dossier serveur
cd server

# Créer le fichier .env si pas encore fait
cp env.example .env

# Modifier .env avec vos valeurs
NEO4J_PASSWORD=votre_mot_de_passe_neo4j
DB_USERNAME=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_DATABASE=myreprise
```

### 2. Démarrage des services

```bash
# Démarrer tous les services (MySQL, Neo4j, Graph Service)
docker-compose up -d

# Vérifier que Neo4j est accessible
curl http://localhost:7474
# Vous devriez voir l'interface Neo4j Browser

# Vérifier le service Graph
curl http://localhost:8002/health
# Devrait retourner {"status": "healthy"}
```

### 3. Migration des données

```bash
# Installer les dépendances Python pour la migration
pip install mysql-connector-python neo4j python-dotenv

# Exécuter la migration complète
python scripts/migrate_mysql_to_neo4j.py

# Suivre les logs pour voir la progression
tail -f migration.log
```

### 4. Test de la migration

```bash
# Tester l'intégrité des données migrées
python scripts/test_migration.py

# Vérifier les statistiques dans Neo4j Browser
# Ouvrir http://localhost:7474 et exécuter :
MATCH (n) RETURN labels(n), count(n)
```

### 5. Démarrage du service de synchronisation temps réel

```bash
# En arrière-plan
python scripts/realtime_sync_service.py &

# Ou avec systemd/supervisor en production
```

## 📊 Requêtes Cypher importantes

### Vérification des données migrées

```cypher
// Compter tous les nœuds par type
MATCH (n) 
RETURN labels(n) as nodeType, count(n) as count
ORDER BY count DESC

// Compter toutes les relations
MATCH ()-[r]->() 
RETURN type(r) as relationType, count(r) as count
ORDER BY count DESC

// Vérifier les utilisateurs avec leurs offres
MATCH (u:User)-[:SELLS]->(o:Offer)
RETURN u.firstName, u.lastName, count(o) as offerCount
ORDER BY offerCount DESC
LIMIT 10
```

### Test des recommandations

```cypher
// Recommandations trending (populaires)
MATCH (o:Offer)<-[interaction:VIEWED|LIKED]-(u:User)
WHERE datetime() - interaction.timestamp < duration({days: 7})
  AND o.status = 'available'
WITH o, count(interaction) as popularity
ORDER BY popularity DESC
LIMIT 10
RETURN o.title, o.price, popularity

// Chaînes d'échange d'un utilisateur
MATCH path = (start:Offer {sellerId: 1})-[:REPLACED_BY*]->(end:Offer)
WHERE NOT (end)-[:REPLACED_BY]->()
RETURN start.title as initial, end.title as current, 
       (end.price - start.price) as gain, length(path) as chainLength
```

## 🔧 API du Service Graph

### Endpoints principaux

| Endpoint | Description | Exemple |
|----------|-------------|---------|
| `GET /health` | Vérification santé du service | `curl localhost:8002/health` |
| `GET /recommendations/trending` | Offres populaires | `curl localhost:8002/recommendations/trending?limit=10` |
| `GET /recommendations/category/{user_id}` | Recommandations par catégorie | `curl localhost:8002/recommendations/category/1` |
| `GET /recommendations/collaborative/{user_id}` | Filtrage collaboratif | `curl localhost:8002/recommendations/collaborative/1` |
| `GET /recommendations/similar/{offer_id}` | Offres similaires | `curl localhost:8002/recommendations/similar/1` |
| `POST /interactions` | Enregistrer une interaction | Voir exemple ci-dessous |

### Enregistrer une interaction utilisateur

```bash
curl -X POST localhost:8002/interactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "offerId": 5,
    "interactionType": "VIEW",
    "duration": 45
  }'
```

### Analytics des échanges

```bash
# Patterns d'échange entre catégories
curl localhost:8002/analytics/exchange-patterns

# Catégories populaires
curl localhost:8002/analytics/popular-categories

# Chaîne d'investissement d'un utilisateur
curl localhost:8002/analytics/exchange-chain/1
```

## 🧠 Algorithmes Disponibles

### 1. **Content-Based Filtering**
- Basé sur les catégories et marques aimées
- Endpoint: `/recommendations/category/{user_id}`

### 2. **Collaborative Filtering**
- Utilisateurs aux goûts similaires
- Endpoint: `/recommendations/collaborative/{user_id}`

### 3. **Trending Detection**
- Offres populaires récemment
- Endpoint: `/recommendations/trending`

### 4. **Brand-Based Recommendations**
- Recommandations par marque
- Endpoint: `/recommendations/brand/{user_id}`

### 5. **Similarity Analysis**
- Offres similaires à une offre consultée
- Endpoint: `/recommendations/similar/{offer_id}`

## 🔄 Synchronisation en temps réel

Le service `realtime_sync_service.py` surveille les changements dans MySQL et met à jour Neo4j automatiquement :

- **Fréquence** : Toutes les 5 secondes
- **Tables surveillées** : users, offers, categories, brands, exchanges
- **Interactions** : VIEWED, LIKED, SEARCH enregistrées en temps réel

## 📈 Intégration avec Node.js

### Appeler les recommandations depuis Node.js

```javascript
// Dans votre route Express
const axios = require('axios');

app.get('/api/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'category', limit = 20 } = req.query;
    
    const response = await axios.get(
      `http://graph-service:8002/recommendations/${type}/${userId}?limit=${limit}`
    );
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur recommandations' });
  }
});
```

### Enregistrer les interactions

```javascript
// Middleware pour tracker les vues d'offres
app.get('/api/offers/:offerId', async (req, res) => {
  const { offerId } = req.params;
  const userId = req.user?.id; // Depuis votre système d'auth
  
  if (userId) {
    // Enregistrer la vue dans Neo4j
    axios.post('http://graph-service:8002/interactions', {
      userId,
      offerId: parseInt(offerId),
      interactionType: 'VIEW',
      duration: 0
    }).catch(console.error);
  }
  
  // Continuer avec la logique normale...
});
```

## 🐛 Dépannage

### Problèmes courants

1. **Neo4j ne démarre pas**
   ```bash
   # Vérifier les logs
   docker logs myreprise_neo4j
   
   # Redémarrer avec volumes fresh
   docker-compose down -v
   docker-compose up neo4j
   ```

2. **Service Graph ne se connecte pas à Neo4j**
   ```bash
   # Vérifier que Neo4j est accessible
   docker exec -it myreprise_neo4j cypher-shell
   
   # Vérifier les variables d'environnement
   docker exec -it myreprise_graph_service env | grep NEO4J
   ```

3. **Migration échoue**
   ```bash
   # Vérifier la connexion MySQL
   docker exec -it myreprise_mysql mysql -u root -p
   
   # Vérifier les logs de migration
   tail -f migration.log
   ```

### Logs utiles

```bash
# Logs du service Graph
docker logs -f myreprise_graph_service

# Logs de Neo4j
docker logs -f myreprise_neo4j

# Logs de synchronisation
tail -f sync_service.log
```

## 🎯 Performance et optimisation

### Index Neo4j recommandés

```cypher
// Index sur les propriétés fréquemment requêtées
CREATE INDEX user_id IF NOT EXISTS FOR (u:User) ON (u.id);
CREATE INDEX offer_status IF NOT EXISTS FOR (o:Offer) ON (o.status);
CREATE INDEX offer_seller IF NOT EXISTS FOR (o:Offer) ON (o.sellerId);
CREATE INDEX category_name IF NOT EXISTS FOR (c:Category) ON (c.nameFr);
```

### Monitoring

- **Neo4j Browser** : http://localhost:7474
- **Graph Service Health** : http://localhost:8002/health
- **Prometheus metrics** : Ajouter des métriques custom si besoin

## 🚀 Mise en production

1. **Sécurité** : Changer les mots de passe par défaut
2. **Backup** : Configurer les sauvegardes Neo4j
3. **Monitoring** : Mettre en place supervision
4. **SSL** : Activer HTTPS pour les APIs
5. **Rate limiting** : Limiter les appels API

## 📚 Ressources utiles

- [Neo4j Cypher Manual](https://neo4j.com/docs/cypher-manual/current/)
- [Graph Data Science Library](https://neo4j.com/docs/graph-data-science/current/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Graph Algorithms](https://neo4j.com/docs/graph-algorithms/current/)

---

✅ **Migration terminée !** Votre application MyReprise dispose maintenant d'un système de recommandation graphique puissant ! 🎉
