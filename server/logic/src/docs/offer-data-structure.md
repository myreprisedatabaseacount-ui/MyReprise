# Structure des données d'offres - Architecture flexible

## Vue d'ensemble

L'architecture utilise une approche flexible avec des données JSON pour les champs spécifiques à chaque type de listing.

## Structure de base de la table `offers`

```sql
CREATE TABLE offers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    status ENUM('available', 'exchanged', 'archived') DEFAULT 'available',
    product_condition ENUM('new', 'like_new', 'good', 'fair') DEFAULT 'good',
    listing_type ENUM('vehicle', 'property', 'item') NOT NULL,
    images TEXT, -- JSON array des URLs Cloudinary
    specific_data TEXT, -- JSON object avec données spécifiques
    location TEXT, -- JSON object avec données de localisation
    -- ... autres champs
);
```

## Exemples de données par type

### 1. Véhicule

```json
{
    "title": "Toyota Corolla 2020",
    "description": "Véhicule en excellent état, entretien régulier...",
    "price": 150000,
    "listing_type": "vehicle",
    "images": [
        "https://res.cloudinary.com/.../image1.jpg",
        "https://res.cloudinary.com/.../image2.jpg"
    ],
    "specific_data": {
        "vehicleType": "voiture-camion",
        "year": 2020,
        "brand": "Toyota",
        "model": "Corolla",
        "mileage": 50000,
        "fuel": "essence",
        "transmission": "manuelle",
        "color": "blanc",
        "engineSize": "1.6L",
        "doors": 4,
        "seats": 5,
        "previousOwners": 1,
        "accidentHistory": false,
        "serviceHistory": true,
        "warranty": false,
        "customsCleared": true,
        "registrationValid": true
    },
    "location": {
        "city": "Fès",
        "sector": "Zouagha",
        "latitude": 34.0181,
        "longitude": -4.9828,
        "address": "123 Rue Mohammed V"
    }
}
```

### 2. Propriété

```json
{
    "title": "Appartement 3 chambres centre Fès",
    "description": "Bel appartement moderne, bien situé...",
    "price": 800000,
    "listing_type": "property",
    "images": [
        "https://res.cloudinary.com/.../property1.jpg",
        "https://res.cloudinary.com/.../property2.jpg"
    ],
    "specific_data": {
        "propertyType": "appartement",
        "area": 120.5,
        "bedrooms": 3,
        "bathrooms": 2,
        "livingRooms": 1,
        "kitchen": true,
        "balcony": true,
        "terrace": false,
        "garage": true,
        "elevator": true,
        "floor": 4,
        "totalFloors": 6,
        "orientation": "sud",
        "heating": "central",
        "airConditioning": true,
        "furnished": false,
        "constructionYear": 2015,
        "renovationYear": 2020,
        "energyClass": "B",
        "parking": 1
    },
    "location": {
        "city": "Fès",
        "sector": "Centre",
        "latitude": 34.0181,
        "longitude": -4.9828,
        "address": "Avenue Hassan II",
        "nearby": ["école", "hôpital", "centre commercial"]
    }
}
```

### 3. Article

```json
{
    "title": "iPhone 14 Pro Max 256GB",
    "description": "Smartphone en excellent état, utilisé 6 mois...",
    "price": 8500,
    "listing_type": "item",
    "images": [
        "https://res.cloudinary.com/.../phone1.jpg",
        "https://res.cloudinary.com/.../phone2.jpg"
    ],
    "specific_data": {
        "itemType": "electronique",
        "category": "smartphone",
        "brand": "Apple",
        "model": "iPhone 14 Pro Max",
        "condition": "excellent",
        "color": "noir",
        "storage": "256GB",
        "warranty": true,
        "warrantyMonths": 12,
        "accessories": ["chargeur", "écouteurs", "étui"],
        "originalBox": true,
        "purchaseDate": "2023-06-01",
        "purchasePrice": 12000,
        "reasonForSelling": "upgrade",
        "usage": "normal",
        "damages": []
    },
    "location": {
        "city": "Fès",
        "sector": "Agdal",
        "latitude": 34.0181,
        "longitude": -4.9828,
        "address": "Rue Ibn Sina"
    }
}
```

## Avantages de cette architecture

### ✅ **Flexibilité**
- Ajout facile de nouveaux types de listings
- Extension des champs sans modification de schéma
- Support de données complexes et imbriquées

### ✅ **Performance**
- Pas de colonnes NULL inutiles
- Requêtes optimisées sur les champs essentiels
- Index sur les champs JSON si nécessaire

### ✅ **Maintenabilité**
- Code plus propre et organisé
- Logique métier centralisée
- Validation typée côté application

### ✅ **Évolutivité**
- Facile d'ajouter de nouveaux types
- Modification des champs sans migration
- Support des versions de données

## Utilisation côté application

### Frontend
```javascript
// Création d'une offre véhicule
const vehicleOffer = {
    title: "BMW X5 2021",
    listing_type: "vehicle",
    specific_data: {
        vehicleType: "voiture-camion",
        brand: "BMW",
        model: "X5",
        year: 2021,
        mileage: 25000
    }
};
```

### Backend
```javascript
// Validation selon le type
if (listingType === 'vehicle') {
    const required = ['vehicleType', 'brand', 'model', 'year'];
    const missing = required.filter(field => !specificData[field]);
    if (missing.length > 0) {
        throw new Error(`Champs manquants: ${missing.join(', ')}`);
    }
}
```

### Base de données
```sql
-- Recherche par type
SELECT * FROM offers WHERE listing_type = 'vehicle';

-- Recherche avec données JSON (MySQL 5.7+)
SELECT * FROM offers 
WHERE JSON_EXTRACT(specific_data, '$.brand') = 'Toyota'
AND JSON_EXTRACT(specific_data, '$.year') >= 2020;
```
