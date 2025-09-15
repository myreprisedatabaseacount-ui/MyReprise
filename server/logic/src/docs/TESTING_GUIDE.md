# Guide de test - Système de gestion d'images pour véhicules

## 🎯 Objectif
Tester l'implémentation complète du système de gestion d'images pour la création d'offres véhicules avec l'architecture flexible.

## 📋 Prérequis
1. Base de données MySQL configurée
2. Backend Node.js démarré
3. Frontend Next.js démarré
4. Cloudinary configuré

## 🗄️ 1. Migration de la base de données

### Exécuter la migration
```bash
# Se connecter à MySQL
mysql -u root -p

# Exécuter le script de migration
source server/logic/src/scripts/add-offer-flexible-columns.sql;
```

### Vérifier la migration
```sql
-- Vérifier que les nouvelles colonnes existent
DESCRIBE offers;

-- Doit afficher les colonnes :
-- images (TEXT)
-- specific_data (TEXT) 
-- location (TEXT)
```

## 🧪 2. Test des données de base

### Exécuter les tests SQL
```bash
# Se connecter à MySQL
mysql -u root -p

# Exécuter le script de test
source server/logic/src/scripts/test-offer-creation.sql;
```

### Vérifier les données
```sql
-- Vérifier les offres créées
SELECT 
    id, title, listing_type, price,
    JSON_EXTRACT(specific_data, '$.brand') as brand,
    JSON_EXTRACT(specific_data, '$.year') as year,
    JSON_EXTRACT(location, '$.city') as city
FROM offers 
WHERE listing_type IN ('vehicle', 'property', 'item')
ORDER BY created_at DESC;
```

## 🖥️ 3. Test du backend

### Démarrer le backend
```bash
cd server/logic
npm run dev
```

### Tester l'API avec curl
```bash
# Test de création d'offre véhicule (sans images pour commencer)
curl -X POST http://localhost:3000/api/offers/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "BMW X5 2021",
    "description": "Véhicule de luxe en excellent état",
    "price": 250000,
    "status": "available",
    "productCondition": "excellent",
    "listingType": "vehicle",
    "specificData": {
      "vehicleType": "voiture-camion",
      "year": 2021,
      "brand": "BMW",
      "model": "X5",
      "mileage": 25000,
      "fuel": "essence",
      "transmission": "automatique"
    },
    "location": {
      "city": "Casablanca",
      "sector": "Maarif",
      "latitude": 33.5731,
      "longitude": -7.5898
    }
  }'
```

### Réponse attendue
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "BMW X5 2021"
  },
  "message": "Offre créée avec succès"
}
```

## 🎨 4. Test du frontend

### Démarrer le frontend
```bash
cd client
npm run dev
```

### Tester le formulaire véhicule
1. Naviguer vers la page de création d'offre
2. Sélectionner "Véhicule"
3. Remplir le formulaire :
   - Type : Voiture/Camion
   - Année : 2021
   - Marque : BMW
   - Modèle : X5
   - Kilométrage : 25000
   - Valeur : 250000
   - Description : "Véhicule de luxe..."

### Tester l'upload d'images
1. Cliquer sur "Ajouter des photos"
2. Sélectionner 2-3 images (JPG/PNG)
3. Vérifier :
   - Compression automatique
   - Preview avec slider
   - Miniatures
   - Messages de toast

### Soumettre le formulaire
1. Cliquer sur "Suivant"
2. Vérifier :
   - Loading state
   - Message de succès
   - Redirection ou fermeture

## 🔍 5. Vérifications complètes

### Backend - Logs
```bash
# Vérifier les logs du serveur
tail -f server/logic/logs/app.log

# Doit afficher :
# ✅ Configuration multer pour offres initialisée
# 📥 Données reçues pour création d'offre
# 🖼️ Upload images vers Cloudinary
# 💾 Sauvegarde en base de données
# ✅ Offre créée avec succès
```

### Base de données - Vérification
```sql
-- Vérifier la nouvelle offre
SELECT 
    id, title, listing_type, price,
    images,
    specific_data,
    location,
    created_at
FROM offers 
WHERE title LIKE '%BMW%'
ORDER BY created_at DESC 
LIMIT 1;
```

### Cloudinary - Vérification
1. Se connecter au dashboard Cloudinary
2. Vérifier le dossier `offers/images/`
3. Confirmer que les images sont uploadées
4. Vérifier les transformations appliquées

## 🐛 6. Tests d'erreur

### Test sans images
1. Remplir le formulaire sans ajouter d'images
2. Cliquer sur "Suivant"
3. Vérifier le message d'erreur : "Au moins une photo est obligatoire"

### Test avec trop d'images
1. Ajouter plus de 10 images
2. Vérifier le message : "Maximum 10 images autorisées"

### Test avec fichier non-image
1. Essayer d'uploader un fichier PDF
2. Vérifier le message d'erreur approprié

## 📊 7. Tests de performance

### Compression d'images
1. Uploader une image de 5MB
2. Vérifier qu'elle est compressée à ~512KB
3. Vérifier la qualité visuelle

### Upload multiple
1. Uploader 10 images simultanément
2. Vérifier le temps de traitement
3. Vérifier que toutes sont uploadées

## ✅ 8. Checklist de validation

- [ ] Migration DB exécutée avec succès
- [ ] Colonnes `images`, `specific_data`, `location` créées
- [ ] Backend démarre sans erreur
- [ ] API `/api/offers/create` répond
- [ ] Frontend charge le formulaire véhicule
- [ ] Upload d'images fonctionne
- [ ] Compression automatique active
- [ ] Preview avec slider fonctionnel
- [ ] Soumission formulaire réussie
- [ ] Données sauvegardées en DB
- [ ] Images uploadées sur Cloudinary
- [ ] Messages d'erreur appropriés
- [ ] Validation côté client et serveur

## 🚀 9. Tests avancés

### Test avec différents types
1. Tester véhicule (moto, voiture, camion)
2. Tester propriété (appartement, maison)
3. Tester article (électronique, vêtement)

### Test de recherche
```sql
-- Rechercher par type
SELECT * FROM offers WHERE listing_type = 'vehicle';

-- Rechercher par données JSON
SELECT * FROM offers 
WHERE JSON_EXTRACT(specific_data, '$.brand') = 'BMW';

-- Rechercher par localisation
SELECT * FROM offers 
WHERE JSON_EXTRACT(location, '$.city') = 'Casablanca';
```

## 📝 10. Rapport de test

Après chaque test, documenter :
- ✅ Succès ou ❌ Échec
- Temps de réponse
- Erreurs rencontrées
- Suggestions d'amélioration

---

**Note** : Ce guide de test couvre l'implémentation complète du système de gestion d'images avec l'architecture flexible proposée par l'utilisateur.
