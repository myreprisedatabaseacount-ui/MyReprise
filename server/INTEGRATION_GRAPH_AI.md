# 🔗 Intégration Graph Service - AI Service

## 📋 Vue d'ensemble

Cette intégration permet au service AI (Chatbot) de récupérer les préférences utilisateur en temps réel depuis le service Graph (Neo4j), créant une expérience de chatbot personnalisée basée sur l'historique d'interactions réelles de l'utilisateur.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   AI Service    │    │  Graph Service  │
│   (Chatbot UI)  │◄──►│   (Port 8001)   │◄──►│   (Port 8002)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              │                        ▼
                              │                ┌─────────────────┐
                              │                │     Neo4j       │
                              │                │   (Database)    │
                              │                └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   FAISS Index   │
                       │  (Embeddings)   │
                       └─────────────────┘
```

## 🔄 Flux de Données

### 1. **Récupération des Préférences**
```
Utilisateur → AI Service → Graph Service → Neo4j
     ↓              ↓            ↓
  Chatbot    Préférences    Relations
  Personnalisé   Temps Réel   Utilisateur
```

### 2. **Types de Préférences Récupérées**
- **Catégories préférées** : Basées sur les offres `LIKED` et `VIEWED`
- **Marques préférées** : Basées sur les interactions avec les marques
- **Gamme de prix** : Calculée à partir des offres consultées
- **Style de conversation** : Déterminé par le niveau d'activité
- **Statistiques d'interaction** : Vues, likes, recherches

## 🚀 Démarrage Rapide

### 1. **Démarrage Automatique**
```bash
# Windows
start_services.bat

# Linux/Mac
./start_services.sh
```

### 2. **Démarrage Manuel**

#### Graph Service (Port 8002)
```bash
cd server/graph-service
python main.py
```

#### AI Service (Port 8001)
```bash
cd server/ai-service/chatbot
python start_chatbot.py
```

### 3. **Test de l'Intégration**
```bash
cd server/ai-service/chatbot
python test_graph_integration.py
```

## 📡 API Endpoints

### **Graph Service - Préférences Utilisateur**

#### Récupérer les préférences complètes
```http
GET /user-preferences/{user_id}
```

#### Récupérer les catégories préférées
```http
GET /user-preferences/{user_id}/categories?limit=10
```

#### Récupérer les marques préférées
```http
GET /user-preferences/{user_id}/brands?limit=10
```

#### Récupérer la gamme de prix
```http
GET /user-preferences/{user_id}/price-range
```

#### Récupérer les statistiques d'interaction
```http
GET /user-preferences/{user_id}/interaction-stats
```

### **AI Service - Intégration Graph**

#### Récupérer les préférences (avec cache)
```http
GET /chatbot/users/{user_id}/preferences
```

#### Forcer la mise à jour depuis Graph Service
```http
GET /chatbot/users/{user_id}/preferences/refresh
```

#### Récupérer directement depuis Graph Service
```http
GET /chatbot/users/{user_id}/preferences/from-graph
```

#### Chat avec personnalisation
```http
POST /chatbot/chat
{
  "message": "Je cherche un iPhone",
  "user_id": 123
}
```

## 🔧 Configuration

### Variables d'Environnement

#### Graph Service
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=neo4j123
```

#### AI Service
```env
GRAPH_SERVICE_URL=http://localhost:8002
CACHE_TTL=300
```

## 📊 Exemples d'Utilisation

### 1. **Chat Personnalisé**

```python
import axios

# Chat avec utilisateur ayant des préférences
async def chat_with_user(user_id: int, message: str):
    response = await axios.post("http://localhost:8001/chatbot/chat", {
        "message": message,
        "user_id": user_id
    })
    return response.data

# Exemple
result = await chat_with_user(123, "Je cherche un téléphone")
print(result["data"]["message"])  # Réponse personnalisée
```

### 2. **Récupération des Préférences**

```python
# Récupérer les préférences depuis Graph Service
async def get_user_preferences(user_id: int):
    response = await axios.get(f"http://localhost:8002/user-preferences/{user_id}")
    return response.data

# Exemple
preferences = await get_user_preferences(123)
print(f"Catégories préférées: {preferences['preferred_categories']}")
print(f"Marques préférées: {preferences['preferred_brands']}")
print(f"Gamme de prix: {preferences['price_range']}")
```

### 3. **Mise à Jour des Préférences**

```python
# Forcer la mise à jour des préférences
async def refresh_preferences(user_id: int):
    response = await axios.get(f"http://localhost:8001/chatbot/users/{user_id}/preferences/refresh")
    return response.data

# Exemple
result = await refresh_preferences(123)
print(result["message"])  # "Préférences mises à jour depuis le Graph Service"
```

## 🧠 Intelligence des Préférences

### **Calcul des Scores de Préférence**

```cypher
// Catégories préférées
MATCH (u:User {id: $userId})-[:LIKED|VIEWED]->(o:Offer)-[:BELONGS_TO]->(cat:Category)
WITH cat, count(*) as interaction_count,
     max(CASE WHEN type(last(relationships(u))) = 'LIKED' THEN 1 ELSE 0 END) as likes_count,
     max(CASE WHEN type(last(relationships(u))) = 'VIEWED' THEN 1 ELSE 0 END) as views_count
WITH cat, interaction_count, likes_count, views_count,
     (likes_count * 2 + views_count) as preference_score
ORDER BY preference_score DESC
```

### **Détermination du Style de Conversation**

```python
def determine_conversation_style(stats):
    total_interactions = stats.get("total_views", 0) + stats.get("total_likes", 0)
    
    if total_interactions > 100:
        return "technical"  # Utilisateur expérimenté
    elif total_interactions > 20:
        return "casual"     # Utilisateur régulier
    else:
        return "formal"     # Nouvel utilisateur
```

## 🔍 Monitoring et Debug

### **Vérification de Santé**

```bash
# Graph Service
curl http://localhost:8002/health

# AI Service
curl http://localhost:8001/chatbot/health
```

### **Vérification avec Axios**

```python
import axios

# Vérifier la santé des services
async def check_services_health():
    try:
        # Graph Service
        graph_response = await axios.get("http://localhost:8002/health")
        print(f"Graph Service: {graph_response.status}")
        
        # AI Service
        ai_response = await axios.get("http://localhost:8001/chatbot/health")
        print(f"AI Service: {ai_response.status}")
        
        return graph_response.status == 200 and ai_response.status == 200
    except Exception as e:
        print(f"Erreur de santé: {e}")
        return False
```

### **Logs de Debug**

```python
# Activer les logs détaillés
import logging
logging.basicConfig(level=logging.DEBUG)
```

### **Test de Performance**

```python
# Test de latence
import time

start = time.time()
preferences = await get_user_preferences(123)
latency = time.time() - start
print(f"Latence: {latency:.2f}s")
```

## 🚨 Dépannage

### **Problèmes Courants**

1. **Graph Service non accessible**
   - Vérifier que Neo4j est démarré
   - Vérifier les credentials Neo4j
   - Vérifier la connectivité réseau

2. **Préférences non trouvées**
   - Vérifier que l'utilisateur existe dans Neo4j
   - Vérifier les relations utilisateur-offre
   - Vérifier les logs d'erreur

3. **Cache obsolète**
   - Utiliser l'endpoint `/refresh`
   - Vider le cache manuellement
   - Redémarrer le service

### **Commandes de Debug**

```bash
# Vérifier les relations dans Neo4j
MATCH (u:User {id: 123})-[r]->(o:Offer) RETURN u, r, o LIMIT 10

# Vérifier les catégories préférées
MATCH (u:User {id: 123})-[:LIKED]->(o:Offer)-[:BELONGS_TO]->(cat:Category)
RETURN cat.nameFr, count(*) as interactions
ORDER BY interactions DESC

# Vérifier les marques préférées
MATCH (u:User {id: 123})-[:LIKED]->(o:Offer)-[:IS_BRAND]->(brand:Brand)
RETURN brand.nameFr, count(*) as interactions
ORDER BY interactions DESC
```

## 📈 Métriques et Analytics

### **Métriques Disponibles**

- **Temps de réponse** des préférences
- **Taux de cache hit** des préférences
- **Nombre d'utilisateurs** avec préférences
- **Préférences les plus populaires**
- **Latence Graph Service**

### **Dashboard de Monitoring**

```python
# Récupérer les métriques
async def get_metrics():
    # Métriques AI Service
    ai_stats = await axios.get("http://localhost:8001/chatbot/stats")
    
    # Métriques Graph Service
    graph_health = await axios.get("http://localhost:8002/health")
    
    return {
        "ai_service": ai_stats.data,
        "graph_service": graph_health.data
    }
```

## 🔮 Évolutions Futures

### **Fonctionnalités Prévues**

1. **Préférences en temps réel** : Mise à jour automatique
2. **Apprentissage continu** : Amélioration des scores
3. **Prédiction de préférences** : ML pour nouveaux utilisateurs
4. **A/B Testing** : Optimisation des algorithmes
5. **Analytics avancées** : Tableaux de bord détaillés

### **Optimisations Techniques**

1. **Cache distribué** : Redis pour la scalabilité
2. **Streaming** : Mise à jour en temps réel
3. **Compression** : Optimisation des données
4. **CDN** : Cache géographique
5. **Load balancing** : Distribution de charge

---

**🎉 L'intégration Graph Service - AI Service est maintenant opérationnelle !**

Pour toute question ou problème, consultez les logs ou contactez l'équipe de développement.
