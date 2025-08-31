const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
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
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['created_by']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Méthodes d'instance
Product.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  return values;
};

// Méthodes statiques
Product.findByCreator = function(userId) {
  return this.findAll({
    where: { createdBy: userId },
    order: [['createdAt', 'DESC']]
  });
};

Product.getRecentProducts = function(limit = 10) {
  return this.findAll({
    order: [['createdAt', 'DESC']],
    limit: limit
  });
};

module.exports = Product;
