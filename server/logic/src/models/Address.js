const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
  tableName: 'addresses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['city']
    },
    {
      fields: ['sector']
    },
    {
      fields: ['city', 'sector']
    }
  ]
});

// Méthodes d'instance
Address.prototype.getFullAddress = function() {
  return this.addressName 
    ? `${this.city}, ${this.sector}, ${this.addressName}`
    : `${this.city}, ${this.sector}`;
};

Address.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  return values;
};

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

module.exports = Address;
