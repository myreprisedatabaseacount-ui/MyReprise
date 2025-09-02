const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DeliveryCompany = sequelize.define('DeliveryCompany', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    contact: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'delivery_companies',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Méthode pour seed des compagnies marocaines
  DeliveryCompany.seedMoroccanCompanies = async function() {
    const companies = [
      { name: 'Amana', contact: '0801000000', website: 'https://amana.ma' },
      { name: 'CTM', contact: '0522458080', website: 'https://ctm.ma' },
      { name: 'Chrono Post', contact: '0522303030', website: 'https://chronopost.ma' },
      { name: 'DHL', contact: '0522976565', website: 'https://dhl.ma' },
      { name: 'Fedex', contact: '0522484848', website: 'https://fedex.com' }
    ];

    for (const company of companies) {
      await this.findOrCreate({
        where: { name: company.name },
        defaults: company
      });
    }
  };

  return DeliveryCompany;
};