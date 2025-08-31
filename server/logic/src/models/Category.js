const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
      len: [0, 500]
    }
  },
  descriptionFr: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'description_fr',
    validate: {
      len: [0, 500]
    }
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  icon: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [1, 100]
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
  tableName: 'categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['parent_id']
    },
    {
      fields: ['name']
    },
    {
      unique: true,
      fields: ['name', 'parent_id']
    }
  ]
});

// Méthodes d'instance
Category.prototype.getName = function(language = 'fr') {
  return language === 'ar' ? this.nameAr : this.nameFr;
};

Category.prototype.getDescription = function(language = 'fr') {
  return language === 'ar' ? this.descriptionAr : this.descriptionFr;
};

Category.prototype.getLocalizedData = function(language = 'fr') {
  return {
    id: this.id,
    name: this.getName(language),
    description: this.getDescription(language),
    image: this.image,
    icon: this.icon,
    parentId: this.parentId
  };
};

Category.prototype.getFullPath = async function(language = 'fr') {
  const path = [this.getName(language)];
  let current = this;
  
  while (current.parentId) {
    const parent = await Category.findByPk(current.parentId);
    if (parent) {
      path.unshift(parent.getName(language));
      current = parent;
    } else {
      break;
    }
  }
  
  return path.join(' > ');
};

Category.prototype.isRoot = function() {
  return this.parentId === null;
};

Category.prototype.getLevel = async function() {
  let level = 0;
  let current = this;
  
  while (current.parentId) {
    level++;
    const parent = await Category.findByPk(current.parentId);
    if (parent) {
      current = parent;
    } else {
      break;
    }
  }
  
  return level;
};

// Méthodes statiques
Category.getRootCategories = function() {
  return this.findAll({
    where: {
      parentId: null
    },
    order: [['name', 'ASC']]
  });
};

Category.getSubCategories = function(parentId) {
  return this.findAll({
    where: {
      parentId: parentId
    },
    order: [['name', 'ASC']]
  });
};

Category.getCategoryTree = async function(language = 'fr') {
  const rootCategories = await this.getRootCategories();
  
  const buildTree = async (categories) => {
    const tree = [];
    
    for (const category of categories) {
      const subCategories = await this.getSubCategories(category.id);
      const categoryNode = {
        id: category.id,
        name: category.getName(language),
        description: category.getDescription(language),
        image: category.image,
        icon: category.icon,
        children: subCategories.length > 0 ? await buildTree(subCategories) : []
      };
      tree.push(categoryNode);
    }
    
    return tree;
  };
  
  return await buildTree(rootCategories);
};

Category.findByPath = async function(path) {
  const pathArray = path.split(' > ');
  let currentCategory = null;
  
  for (const categoryName of pathArray) {
    const whereClause = {
      name: categoryName,
      parentId: currentCategory ? currentCategory.id : null
    };
    
    currentCategory = await this.findOne({
      where: whereClause
    });
    
    if (!currentCategory) {
      return null;
    }
  }
  
  return currentCategory;
};

// Méthode pour obtenir les catégories populaires (stratégie adaptative)
Category.getPopularCategories = async function(limit = 10) {
  // Compter le nombre total d'offres dans l'application
  const totalOffers = await require('./Offer').count({
    where: {
      status: 'available',
      isDeleted: false
    }
  });

  // Stratégie adaptative selon le volume d'offres
  if (totalOffers < 100) {
    // Phase de démarrage : classer par diversité de produits
    return this.getCategoriesByProductDiversity(limit);
  } else {
    // Phase mature : classer par nombre d'offres
    return this.getCategoriesByOfferCount(limit);
  }
};

Category.getCategoriesByOfferCount = function(limit = 10) {
  return this.findAll({
    attributes: [
      'id',
      'name',
      'description',
      'image',
      'icon',
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
      }
    ],
    group: ['Category.id'],
    order: [[sequelize.literal('offerCount'), 'DESC']],
    limit: limit
  });
};

Category.getCategoriesByProductDiversity = function(limit = 10) {
  return this.findAll({
    attributes: [
      'id',
      'name',
      'description',
      'image',
      'icon',
      [sequelize.fn('COUNT', sequelize.literal('DISTINCT "Offers->Product"."id"')), 'productCount'],
      [sequelize.fn('COUNT', sequelize.literal('DISTINCT "Offers"."brand_id"')), 'brandCount'],
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
      }
    ],
    group: ['Category.id'],
    order: [
      [sequelize.literal('productCount'), 'DESC'],
      [sequelize.literal('brandCount'), 'DESC'],
      [sequelize.literal('offerCount'), 'DESC'],
      ['name', 'ASC']
    ],
    limit: limit
  });
};

module.exports = Category;
