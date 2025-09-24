# 🤖 Service Chatbot MyReprise

Service d'intelligence artificielle conversationnelle pour la plateforme MyReprise. Ce service fournit un chatbot intelligent capable de comprendre les intentions utilisateur, de rechercher des offres pertinentes et de générer des réponses contextuelles personnalisées.

## 🏗️ Architecture

### Structure du Projet

```
chatbot/
├── services/                 # Services métier
│   ├── intent_classifier.py     # Classification d'intentions
│   ├── embedding_service.py     # Génération d'embeddings
│   ├── rag_service.py           # RAG (Retrieval-Augmented Generation)
│   ├── personalization_service.py # Personnalisation
│   ├── context_manager.py       # Gestion de contexte
│   └── response_generator.py    # Génération de réponses
├── models/                   # Modèles de données
│   └── chat_models.py           # Modèles Pydantic
├── controllers/              # Contrôleurs FastAPI
│   └── chatbot_controller.py   # Contrôleur principal
├── routes/                   # Routes API
│   └── chatbot_routes.py       # Routes du chatbot
├── utils/                    # Utilitaires
│   ├── embedding_utils.py      # Utilitaires d'embedding
│   ├── similarity_utils.py     # Calcul de similarité
│   └── response_templates.py   # Templates de réponse
├── main.py                   # Point d'entrée
├── requirements.txt          # Dépendances
├── Dockerfile               # Configuration Docker
└── README.md               # Documentation
```

## 🚀 Fonctionnalités

### 1. Classification d'Intentions
- **Intent Types Supportés :**
  - `product_search` : Recherche de produits
  - `page_navigation` : Navigation vers des pages
  - `price_inquiry` : Demande d'informations sur les prix
  - `availability_check` : Vérification de disponibilité
  - `recommendation_request` : Demande de recommandations
  - `general_question` : Questions générales
  - `account_help` : Aide avec le compte
  - `technical_support` : Support technique

### 2. Génération d'Embeddings
- **Modèles Supportés :**
  - Sentence-BERT multilingue
  - Support français/arabe/anglais
  - Embeddings normalisés pour similarité cosinus
- **Types d'Embeddings :**
  - Textes de requêtes utilisateur
  - Descriptions d'offres
  - Métadonnées enrichies

### 3. Recherche Sémantique (RAG)
- **Recherche Vectorielle :**
  - Index FAISS pour recherche rapide
  - Similarité cosinus
  - Filtres avancés
- **Contexte Enrichi :**
  - Historique conversationnel
  - Préférences utilisateur
  - Entités extraites

### 4. Personnalisation
- **Profil Utilisateur :**
  - Catégories préférées
  - Marques préférées
  - Gammes de prix
  - Style de conversation
- **Apprentissage :**
  - Analyse des interactions
  - Mise à jour des préférences
  - Recommandations adaptatives

### 5. Gestion de Contexte
- **Sessions de Conversation :**
  - Gestion multi-tours
  - Persistance du contexte
  - Cache Redis (optionnel)
- **Mémoire Conversationnelle :**
  - Historique des messages
  - Intent tracking
  - Entités persistantes

## 📡 API Endpoints

### Chat
- `POST /chatbot/chat` - Envoyer un message au chatbot
- `GET /chatbot/health` - Vérification de santé

### Sessions
- `POST /chatbot/sessions` - Créer une session
- `GET /chatbot/sessions/{session_id}` - Informations de session
- `PUT /chatbot/sessions/{session_id}/clear` - Vider le contexte
- `DELETE /chatbot/sessions/{session_id}` - Terminer une session

### Utilisateurs
- `PUT /chatbot/users/{user_id}/preferences` - Mettre à jour les préférences
- `GET /chatbot/users/{user_id}/preferences` - Récupérer les préférences

### Utilitaires
- `GET /chatbot/stats` - Statistiques du chatbot
- `GET /chatbot/intents` - Intents supportés
- `GET /chatbot/response-types` - Types de réponses

## 🔧 Installation et Configuration

### Prérequis
- Python 3.11+
- Redis (optionnel, pour le cache)
- MySQL (pour les données utilisateur)

### Installation

1. **Cloner le projet :**
```bash
cd server/ai-service/chatbot
```

2. **Installer les dépendances :**
```bash
pip install -r requirements.txt
```

3. **Configuration des variables d'environnement :**
```bash
# Créer un fichier .env
cp .env.example .env
```

4. **Démarrer le service :**
```bash
python main.py
```

### Configuration Docker

```bash
# Construire l'image
docker build -t myreprise-chatbot .

# Démarrer le conteneur
docker run -p 8001:8001 myreprise-chatbot
```

## 💡 Exemples d'Utilisation

### 1. Chat Simple

```python
import httpx

# Envoyer un message
response = httpx.post("http://localhost:8001/chatbot/chat", json={
    "message": "Je cherche un iPhone pas cher",
    "user_id": 123
})

print(response.json())
```

### 2. Création de Session

```python
# Créer une session
response = httpx.post("http://localhost:8001/chatbot/sessions", json={
    "user_id": 123,
    "language": "fr"
})

session_id = response.json()["session_id"]
```

### 3. Mise à jour des Préférences

```python
# Mettre à jour les préférences
response = httpx.put("http://localhost:8001/chatbot/users/123/preferences", json={
    "preferred_categories": ["Smartphones", "Laptops"],
    "preferred_brands": ["Apple", "Samsung"],
    "price_range": {"min": 500, "max": 2000}
})
```

## 🧠 Intelligence Artificielle

### Pipeline de Traitement

1. **Réception du Message** → Classification d'intent
2. **Extraction d'Entités** → Marques, catégories, prix
3. **Génération d'Embedding** → Vectorisation sémantique
4. **Recherche Vectorielle** → Offres similaires
5. **Personnalisation** → Adaptation aux préférences
6. **Génération de Réponse** → Texte contextuel
7. **Apprentissage** → Mise à jour du profil

### Modèles Utilisés

- **Classification :** Patterns regex + ML (optionnel)
- **Embeddings :** sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
- **Recherche :** FAISS (Facebook AI Similarity Search)
- **Similarité :** Cosinus, Jaccard, Levenshtein

## 📊 Monitoring et Métriques

### Statistiques Disponibles
- Nombre de sessions actives
- Messages traités
- Moyenne de messages par session
- Intents les plus fréquents
- Temps de réponse

### Logs
- Logs structurés avec timestamps
- Niveaux : INFO, WARNING, ERROR
- Traçabilité des requêtes
- Métriques de performance

## 🔒 Sécurité

### Authentification
- Support des tokens JWT
- Validation des utilisateurs
- Sessions sécurisées

### Validation des Données
- Validation Pydantic
- Sanitisation des entrées
- Limitation de taille des messages

### Confidentialité
- Pas de stockage de données sensibles
- Chiffrement des communications
- Conformité RGPD

## 🚀 Déploiement

### Environnement de Développement
```bash
uvicorn chatbot.main:app --reload --port 8001
```

### Environnement de Production
```bash
gunicorn chatbot.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

### Docker Compose
```yaml
version: '3.8'
services:
  chatbot:
    build: ./chatbot
    ports:
      - "8001:8001"
    environment:
      - REDIS_URL=redis://redis:6379
      - MYSQL_URL=mysql://user:pass@mysql:3306/myreprise
    depends_on:
      - redis
      - mysql
```

## 🧪 Tests

### Tests Unitaires
```bash
pytest tests/ -v
```

### Tests d'Intégration
```bash
pytest tests/integration/ -v
```

### Tests de Performance
```bash
pytest tests/performance/ -v
```

## 📈 Roadmap

### Version 1.1
- [ ] Support multilingue avancé
- [ ] Intégration avec des LLM externes
- [ ] Analyse de sentiment
- [ ] Recommandations prédictives

### Version 1.2
- [ ] Support vocal (Speech-to-Text)
- [ ] Génération d'images
- [ ] Intégration avec des APIs externes
- [ ] Dashboard d'analytics

### Version 2.0
- [ ] Apprentissage fédéré
- [ ] Modèles personnalisés
- [ ] Intégration IoT
- [ ] Réalité augmentée

## 🤝 Contribution

### Guidelines
1. Suivre les conventions de code Python
2. Ajouter des tests pour les nouvelles fonctionnalités
3. Documenter les nouvelles APIs
4. Respecter les standards de sécurité

### Processus
1. Fork du projet
2. Créer une branche feature
3. Développer et tester
4. Créer une Pull Request

## 📞 Support

- **Documentation :** [Lien vers la documentation complète]
- **Issues :** [Lien vers le système d'issues]
- **Email :** support@myreprise.com
- **Discord :** [Lien vers le serveur Discord]

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

**Développé avec ❤️ par l'équipe MyReprise**
