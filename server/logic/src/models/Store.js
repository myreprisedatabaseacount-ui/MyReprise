const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Store = sequelize.define('Store', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    unique: true  // Un utilisateur ne peut avoir qu'un seul store
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 200]
    }
  },
  coverImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'cover_image',
    validate: {
      isUrl: true
    }
  },
  primaryColor: {
    type: DataTypes.STRING(7),
    allowNull: true,
    field: 'primary_color',
    defaultValue: '#3498db',
    validate: {
      is: /^#[0-9A-F]{6}$/i  // Format hexadécimal #RRGGBB
    }
  },
  secondaryColor: {
    type: DataTypes.STRING(7),
    allowNull: true,
    field: 'secondary_color',
    defaultValue: '#2c3e50',
    validate: {
      is: /^#[0-9A-F]{6}$/i  // Format hexadécimal #RRGGBB
    }
  },
  logo: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'stores',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id']
    },
    {
      fields: ['name']
    }
  ]
});

// Méthodes d'instance
Store.prototype.getTheme = function() {
  return {
    primary: this.primaryColor,
    secondary: this.secondaryColor
  };
};

Store.prototype.hasCustomBranding = function() {
  return !!(this.logo || this.coverImage);
};

Store.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  return values;
};

// Méthodes statiques
Store.findByUserId = function(userId) {
  return this.findOne({
    where: { userId: userId }
  });
};

Store.findByName = function(name) {
  return this.findAll({
    where: { 
      name: {
        [sequelize.Op.iLike]: `%${name}%`
      }
    }
  });
};

Store.getActiveStores = function() {
  return this.findAll({
    include: [{
      model: require('./User'),
      where: { isVerified: true }
    }]
  });
};

module.exports = Store;
