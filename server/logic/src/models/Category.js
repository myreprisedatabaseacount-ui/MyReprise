const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'parent_id',
      references: {
        model: 'categories',
        key: 'id'
      }
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
    tableName: 'categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Méthodes statiques
  Category.getPopularCategories = async function(limit = 10) {
    const totalOffers = await sequelize.models.Offer?.count() || 0;
    
    if (totalOffers < 100) {
      // Stratégie basée sur la diversité des produits
      return await this.findAll({
        include: [{
          model: sequelize.models.Product,
          as: 'Products',
          attributes: []
        }],
        group: ['Category.id'],
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
        group: ['Category.id'],
        order: [[sequelize.fn('COUNT', sequelize.col('Offers.id')), 'DESC']],
        limit
      });
    }
  };

  return Category;
};