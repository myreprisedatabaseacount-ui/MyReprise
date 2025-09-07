const { DataTypes } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

const BrandCategory = sequelize.define('BrandCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  brandId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'brand_id',
    references: {
      model: 'brands',
      key: 'id'
    }
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'category_id',
    references: {
      model: 'categories',
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
  tableName: 'brand_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['brand_id', 'category_id']
    },
    {
      fields: ['brand_id']
    },
    {
      fields: ['category_id']
    }
  ]
});

module.exports = { BrandCategory };
