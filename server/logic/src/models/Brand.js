const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Brand = sequelize.define('Brand', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    logo: {
      type: DataTypes.STRING(255),
      allowNull: true
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
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'category_id',
      references: {
        model: 'categories',
        key: 'id'
      }
    }
  }, {
    tableName: 'brands',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Méthodes statiques
  Brand.getPopularBrands = async function(limit = 10) {
    const totalOffers = await sequelize.models.Offer?.count() || 0;
    
    if (totalOffers < 100) {
      // Stratégie basée sur la diversité des produits
      return await this.findAll({
        include: [{
          model: sequelize.models.Product,
          as: 'Products',
          attributes: []
        }],
        group: ['Brand.id'],
        order: [[sequelize.fn('COUNT', sequelize.col('Products.id')), 'DESC']],
        limit
      });
    } else {
      // Stratégie basée sur le nombre d'offres
      return await this.findAll({
        include: [{
          model: sequelize.models.Offer,
          as: 'Offers',
          attributes: []
        }],
        group: ['Brand.id'],
        order: [[sequelize.fn('COUNT', sequelize.col('Offers.id')), 'DESC']],
        limit
      });
    }
  };

  return Brand;
};