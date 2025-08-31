const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Brand = sequelize.define('Brand', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  logo: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  nameAr: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'name_ar',
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  nameFr: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'name_fr',
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  descriptionAr: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'description_ar',
    validate: {
      len: [0, 1000]
    }
  },
  descriptionFr: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'description_fr',
    validate: {
      len: [0, 1000]
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
  tableName: 'brands',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['category_id']
    },
    {
      fields: ['name']
    },
    {
      unique: true,
      fields: ['name', 'category_id']
    }
  ]
});

// Méthodes d'instance
Brand.prototype.hasLogo = function() {
  return !!this.logo;
};

Brand.prototype.getName = function(language = 'fr') {
  return language === 'ar' ? this.nameAr : this.nameFr;
};

Brand.prototype.getDescription = function(language = 'fr') {
  return language === 'ar' ? this.descriptionAr : this.descriptionFr;
};

Brand.prototype.getDisplayName = function(language = 'fr') {
  return this.getName(language);
};

Brand.prototype.getLocalizedData = function(language = 'fr') {
  return {
    id: this.id,
    name: this.getName(language),
    description: this.getDescription(language),
    logo: this.logo,
    categoryId: this.categoryId,
    hasLogo: this.hasLogo()
  };
};

// Méthodes statiques
Brand.getBrandsByCategory = function(categoryId) {
  return this.findAll({
    where: {
      categoryId: categoryId
    },
    order: [['name', 'ASC']]
  });
};

Brand.getPopularBrands = async function(limit = 20) {
  // Compter le nombre total d'offres dans l'application
  const totalOffers = await require('./Offer').count({
    where: {
      status: 'available',
      isDeleted: false
    }
  });

  // Stratégie adaptative selon le volume d'offres
  if (totalOffers < 100) {
    // Phase de démarrage : classer par nombre de produits dans la marque
    return this.getBrandsByProductCount(limit);
  } else {
    // Phase mature : classer par nombre d'offres
    return this.getBrandsByOfferCount(limit);
  }
};

Brand.getBrandsByOfferCount = function(limit = 20) {
  return this.findAll({
    attributes: [
      'id',
      'name',
      'logo',
      'description',
      'categoryId',
      [sequelize.fn('COUNT', sequelize.col('Offers.id')), 'offerCount']
    ],
    include: [
      {
        model: require('./Offer'),
        as: 'Offers',
        attributes: [],
        where: {
          status: 'available',
          isDeleted: false
        },
        required: false
      },
      {
        model: require('./Category'),
        as: 'Category',
        attributes: ['name', 'icon']
      }
    ],
    group: ['Brand.id', 'Category.id'],
    order: [[sequelize.literal('offerCount'), 'DESC']],
    limit: limit
  });
};

Brand.getBrandsByProductCount = function(limit = 20) {
  return this.findAll({
    attributes: [
      'id',
      'name',
      'logo',
      'description',
      'categoryId',
      [sequelize.fn('COUNT', sequelize.col('Offers->Product.id')), 'productCount'],
      [sequelize.fn('COUNT', sequelize.col('Offers.id')), 'offerCount']
    ],
    include: [
      {
        model: require('./Offer'),
        as: 'Offers',
        attributes: [],
        where: {
          isDeleted: false
        },
        required: false,
        include: [
          {
            model: require('./Product'),
            as: 'Product',
            attributes: []
          }
        ]
      },
      {
        model: require('./Category'),
        as: 'Category',
        attributes: ['name', 'icon']
      }
    ],
    group: ['Brand.id', 'Category.id'],
    order: [
      [sequelize.literal('productCount'), 'DESC'],
      [sequelize.literal('offerCount'), 'DESC'],
      ['name', 'ASC']
    ],
    limit: limit
  });
};

Brand.searchBrands = function(query, language = 'fr') {
  const nameField = language === 'ar' ? 'nameAr' : 'nameFr';
  const descField = language === 'ar' ? 'descriptionAr' : 'descriptionFr';
  
  return this.findAll({
    where: {
      [sequelize.Op.or]: [
        {
          [nameField]: {
            [sequelize.Op.iLike]: `%${query}%`
          }
        },
        {
          [descField]: {
            [sequelize.Op.iLike]: `%${query}%`
          }
        }
      ]
    },
    include: [
      {
        model: require('./Category'),
        as: 'Category',
        attributes: ['nameAr', 'nameFr', 'icon']
      }
    ],
    order: [[nameField, 'ASC']],
    limit: 50
  });
};

// Méthode pour obtenir les marques avec leurs statistiques
Brand.getBrandsWithStats = function(categoryId = null) {
  const whereClause = categoryId ? { categoryId } : {};
  
  return this.findAll({
    where: whereClause,
    attributes: [
      'id',
      'name',
      'logo',
      'description',
      'categoryId',
      [sequelize.fn('COUNT', sequelize.col('Offers.id')), 'totalOffers'],
      [
        sequelize.fn('COUNT', 
          sequelize.literal(`CASE WHEN "Offers"."status" = 'available' THEN 1 END`)
        ), 
        'availableOffers'
      ],
      [
        sequelize.fn('AVG', sequelize.col('Offers.price')), 
        'averagePrice'
      ]
    ],
    include: [
      {
        model: require('./Offer'),
        as: 'Offers',
        attributes: [],
        where: {
          isDeleted: false
        },
        required: false
      },
      {
        model: require('./Category'),
        as: 'Category',
        attributes: ['name', 'icon']
      }
    ],
    group: ['Brand.id', 'Category.id'],
    order: [['name', 'ASC']]
  });
};

// Méthode pour obtenir les marques tendance (beaucoup de consultations récentes)
Brand.getTrendingBrands = function(days = 7, limit = 10) {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);
  
  return this.findAll({
    attributes: [
      'id',
      'name',
      'logo',
      'categoryId',
      [sequelize.fn('COUNT', sequelize.col('Offers.id')), 'recentOffers']
    ],
    include: [
      {
        model: require('./Offer'),
        as: 'Offers',
        attributes: [],
        where: {
          status: 'available',
          isDeleted: false,
          createdAt: {
            [sequelize.Op.gte]: dateLimit
          }
        },
        required: true
      },
      {
        model: require('./Category'),
        as: 'Category',
        attributes: ['name', 'icon']
      }
    ],
    group: ['Brand.id', 'Category.id'],
    having: sequelize.literal('COUNT("Offers"."id") > 0'),
    order: [[sequelize.literal('recentOffers'), 'DESC']],
    limit: limit
  });
};

// Méthode pour initialiser les marques populaires au Maroc (multilingue)
Brand.seedMoroccanBrands = async function() {
  const moroccanBrands = [
    {
      nameAr: 'آبل',
      nameFr: 'Apple',
      descriptionAr: 'شركة أمريكية متعددة الجنسيات للتكنولوجيا',
      descriptionFr: 'Entreprise technologique américaine multinationale',
      logo: 'https://example.com/logos/apple.png',
      categoryId: 1 // Electronics
    },
    {
      nameAr: 'سامسونغ',
      nameFr: 'Samsung',
      descriptionAr: 'مجموعة كورية جنوبية متعددة الجنسيات',
      descriptionFr: 'Conglomérat multinational sud-coréen',
      logo: 'https://example.com/logos/samsung.png',
      categoryId: 1 // Electronics
    },
    {
      nameAr: 'نايكي',
      nameFr: 'Nike',
      descriptionAr: 'شركة أمريكية متعددة الجنسيات للملابس الرياضية',
      descriptionFr: 'Entreprise américaine de vêtements de sport',
      logo: 'https://example.com/logos/nike.png',
      categoryId: 2 // Fashion
    },
    {
      nameAr: 'أديداس',
      nameFr: 'Adidas',
      descriptionAr: 'شركة ألمانية متعددة الجنسيات للملابس الرياضية',
      descriptionFr: 'Entreprise allemande de vêtements de sport',
      logo: 'https://example.com/logos/adidas.png',
      categoryId: 2 // Fashion
    }
  ];

  try {
    const createdBrands = [];
    for (const brand of moroccanBrands) {
      const [createdBrand, created] = await this.findOrCreate({
        where: { 
          nameFr: brand.nameFr,
          categoryId: brand.categoryId 
        },
        defaults: brand
      });
      createdBrands.push({ brand: createdBrand, created });
    }
    
    return {
      success: true,
      brands: createdBrands,
      message: 'Marques multilingues initialisées'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = Brand;
