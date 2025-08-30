# 📁 Modèles Sequelize

Ce dossier contient tous les modèles de données pour le service Node.js utilisant Sequelize ORM.

## 📋 Structure recommandée

### Exemple de modèle User.js :

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'last_name',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified',
    },
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
  });

  // Associations
  User.associate = (models) => {
    User.hasMany(models.Order, {
      foreignKey: 'user_id',
      as: 'orders',
    });
  };

  return User;
};
```

## 🔗 Configuration des associations

Les associations entre modèles doivent être définies dans la méthode `associate` de chaque modèle :

```javascript
// Dans User.js
User.associate = (models) => {
  User.hasMany(models.Order, { foreignKey: 'user_id' });
  User.belongsToMany(models.Role, { 
    through: 'user_roles',
    foreignKey: 'user_id' 
  });
};

// Dans Order.js
Order.associate = (models) => {
  Order.belongsTo(models.User, { foreignKey: 'user_id' });
  Order.hasMany(models.OrderItem, { foreignKey: 'order_id' });
};
```

## 🚀 Utilisation

```javascript
// Import du modèle
const { User } = require('../models');

// Créer un utilisateur
const user = await User.create({
  email: 'test@example.com',
  password: 'hashedpassword',
  firstName: 'John',
  lastName: 'Doe',
});

// Recherche avec associations
const userWithOrders = await User.findByPk(userId, {
  include: [{ model: Order, as: 'orders' }]
});
```

## 📚 Bonnes pratiques

1. **Nommage** : Utilisez PascalCase pour les noms de modèles
2. **Champs** : Utilisez snake_case pour les noms de colonnes
3. **Validations** : Ajoutez des validations Sequelize appropriées
4. **Index** : Définissez les index nécessaires pour les performances
5. **Hooks** : Utilisez les hooks Sequelize pour la logique métier
6. **Transactions** : Utilisez les transactions pour les opérations critiques

## 🔧 Types de données couramment utilisés

- `DataTypes.UUID` - Identifiants uniques
- `DataTypes.STRING` - Chaînes de caractères
- `DataTypes.TEXT` - Texte long
- `DataTypes.INTEGER` - Nombres entiers
- `DataTypes.DECIMAL(10,2)` - Montants avec 2 décimales
- `DataTypes.BOOLEAN` - Valeurs booléennes
- `DataTypes.DATE` - Dates et heures
- `DataTypes.JSON` - Données JSON (MySQL 5.7+)
- `DataTypes.ENUM` - Valeurs énumérées
