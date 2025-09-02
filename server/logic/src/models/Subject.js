const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subject = sequelize.define('Subject', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nameAr: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'name_ar'
    },
    nameFr: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'name_fr'
    },
    descriptionAr: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description_ar'
    },
    descriptionFr: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description_fr'
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    tableName: 'subjects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Subject;
};