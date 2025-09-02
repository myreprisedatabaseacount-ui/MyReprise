const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Address = sequelize.define('Address', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    sector: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [2, 100]
      }
    },
    addressName: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'address_name',
      validate: {
        notEmpty: true,
        len: [5, 500]
      }
    }
  }, {
    tableName: 'addresses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Méthodes statiques
  Address.findByCity = function(city) {
    return this.findAll({
      where: { city: city }
    });
  };

  Address.findByCityAndSector = function(city, sector) {
    return this.findAll({
      where: { 
        city: city,
        sector: sector 
      }
    });
  };

  return Address;
};