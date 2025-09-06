const { DataTypes } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

const SubjectCategory = sequelize.define('SubjectCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'subject_id',
    references: {
      model: 'subjects',
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
  tableName: 'subject_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = { SubjectCategory };