# Guide de résolution - Problèmes avec la table Addresses

## 🚨 Problème rencontré

Erreur de validation lors de la synchronisation de la base de données après avoir supprimé les données de la table `addresses` et tenté de mettre à jour avec les nouvelles colonnes `latitude` et `longitude`.

## 🔍 Diagnostic

L'erreur `Validation error` indique que Sequelize rencontre des problèmes lors de la synchronisation des modèles avec la base de données. Cela peut être causé par :

1. **Colonnes manquantes** : Les nouvelles colonnes `latitude` et `longitude` n'existent pas dans la table
2. **Contraintes de validation** : Les contraintes CHECK pour les coordonnées ne sont pas correctement définies
3. **Index manquants** : L'index géographique `idx_addresses_coordinates` n'existe pas
4. **Conflits de synchronisation** : Sequelize ne peut pas appliquer les changements automatiquement

## 🛠️ Solutions

### Solution 1 : Script de correction automatique

Le serveur devrait maintenant exécuter automatiquement le script de correction. Si ce n'est pas le cas, exécutez manuellement :

```bash
cd server/logic
node src/scripts/fix-addresses-table.js
```

### Solution 2 : Migration SQL directe

Si le script automatique ne fonctionne pas, exécutez directement le SQL :

```bash
mysql -u root -p < server/logic/src/scripts/add-address-coordinates.sql
```

### Solution 3 : Réinitialisation complète (DÉVELOPPEMENT UNIQUEMENT)

⚠️ **ATTENTION** : Cette solution supprime toutes les données !

```sql
-- Se connecter à MySQL
mysql -u root -p

-- Supprimer et recréer la table addresses
DROP TABLE IF EXISTS addresses;
```

Puis redémarrer le serveur pour que Sequelize recrée la table.

### Solution 4 : Ajout manuel des colonnes

```sql
-- Se connecter à MySQL
mysql -u root -p

-- Ajouter les colonnes manuellement
ALTER TABLE addresses 
ADD COLUMN latitude DECIMAL(10, 8) NULL COMMENT 'Latitude en degrés décimaux (WGS84)',
ADD COLUMN longitude DECIMAL(11, 8) NULL COMMENT 'Longitude en degrés décimaux (WGS84)';

-- Ajouter l'index
CREATE INDEX idx_addresses_coordinates ON addresses (latitude, longitude);

-- Ajouter les contraintes
ALTER TABLE addresses 
ADD CONSTRAINT chk_latitude_range CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
ADD CONSTRAINT chk_longitude_range CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));
```

## 🧪 Vérification

Après avoir appliqué une solution, vérifiez que tout fonctionne :

### 1. Vérifier la structure de la table
```sql
DESCRIBE addresses;
```

Doit afficher les colonnes :
- `latitude` (DECIMAL(10,8))
- `longitude` (DECIMAL(11,8))

### 2. Vérifier les index
```sql
SHOW INDEX FROM addresses;
```

Doit inclure l'index `idx_addresses_coordinates`.

### 3. Tester le modèle Address
```bash
cd server/logic
node -e "
const { Address } = require('./src/models/Address.js');
console.log('✅ Modèle Address chargé avec succès');
console.log('Colonnes:', Object.keys(Address.rawAttributes));
"
```

### 4. Insérer des données de test
```bash
mysql -u root -p < server/logic/src/scripts/seed-addresses-with-coordinates.sql
```

## 🔄 Redémarrage du serveur

Après avoir appliqué une solution :

1. **Arrêter le serveur** : `Ctrl+C`
2. **Redémarrer** : `npm run dev`
3. **Vérifier les logs** : Le message `✅ Modèles initialisés avec succès` doit apparaître

## 📋 Logs à surveiller

### Logs de succès
```
✅ Configuration Cloudinary initialisée
✅ Configuration multer initialisée
🔄 Initialisation des modèles...
✅ Modèles initialisés avec succès
🚀 Serveur MyReprise démarré sur le port 3001
```

### Logs d'erreur à éviter
```
❌ Erreur synchronisation base de données: Validation error
❌ Erreur lors de la correction: ...
```

## 🚀 Prochaines étapes

Une fois le problème résolu :

1. **Vérifier que le serveur démarre sans erreur**
2. **Tester la création d'adresses avec coordonnées**
3. **Intégrer avec le modèle Offer**
4. **Tester les fonctionnalités géographiques**

## 📞 Support

Si le problème persiste :

1. Vérifiez les logs complets du serveur
2. Exécutez `DESCRIBE addresses;` dans MySQL
3. Vérifiez que les scripts de correction s'exécutent sans erreur
4. En dernier recours, utilisez la réinitialisation complète (développement uniquement)

---

**Note** : Ce guide est spécifique aux problèmes de synchronisation de la table `addresses` avec les nouvelles colonnes géographiques.
