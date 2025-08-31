const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductSnapshot = sequelize.define('ProductSnapshot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 255]
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 2000]
    }
  },
  productCondition: {
    type: DataTypes.ENUM('new', 'like_new', 'good', 'fair'),
    allowNull: false,
    field: 'product_condition',
    defaultValue: 'good'
  },
  replacedByProductId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'replaced_by_product_id',
    references: {
      model: 'product_snapshots',
      key: 'id'
    }
  },
  isFromProduct: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'is_from_product',
    defaultValue: false
  },
  offerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'offer_id',
    references: {
      model: 'offers',
      key: 'id'
    }
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'order_id',
    references: {
      model: 'orders',
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
  tableName: 'product_snapshots',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['order_id']
    },
    {
      fields: ['offer_id']
    },
    {
      fields: ['is_from_product']
    },
    {
      fields: ['product_condition']
    },
    {
      fields: ['order_id', 'is_from_product']
    },
    {
      fields: ['replaced_by_product_id']
    }
  ]
});

// Méthodes d'instance
ProductSnapshot.prototype.isFromProductUser = function() {
  return this.isFromProduct === true;
};

ProductSnapshot.prototype.isToProductUser = function() {
  return this.isFromProduct === false;
};

ProductSnapshot.prototype.getConditionLabel = function() {
  const conditionLabels = {
    'new': 'Neuf',
    'like_new': 'Comme neuf',
    'good': 'Bon état',
    'fair': 'État correct'
  };
  return conditionLabels[this.productCondition] || this.productCondition;
};

ProductSnapshot.prototype.hasDescription = function() {
  return !!this.description && this.description.trim().length > 0;
};

ProductSnapshot.prototype.getDisplayPrice = function() {
  return this.price ? `${this.price}€` : 'Prix non spécifié';
};

// Méthodes statiques
ProductSnapshot.getProductsForOrder = function(orderId) {
  return this.findAll({
    where: {
      orderId: orderId
    },
    include: [
      {
        model: require('./Offer'),
        as: 'Offer',
        attributes: ['id', 'categoryId', 'brandId', 'sellerId'],
        include: [
          {
            model: require('./Category'),
            as: 'Category',
            attributes: ['name', 'icon']
          },
          {
            model: require('./Brand'),
            as: 'Brand',
            attributes: ['name', 'logo']
          }
        ]
      }
    ],
    order: [['isFromProduct', 'DESC']] // Produit envoyé en premier
  });
};

ProductSnapshot.getFromProductForOrder = function(orderId) {
  return this.findOne({
    where: {
      orderId: orderId,
      isFromProduct: true
    },
    include: [
      {
        model: require('./Offer'),
        as: 'Offer',
        include: [
          {
            model: require('./Category'),
            as: 'Category'
          },
          {
            model: require('./Brand'),
            as: 'Brand'
          }
        ]
      }
    ]
  });
};

ProductSnapshot.getToProductForOrder = function(orderId) {
  return this.findOne({
    where: {
      orderId: orderId,
      isFromProduct: false
    },
    include: [
      {
        model: require('./Offer'),
        as: 'Offer',
        include: [
          {
            model: require('./Category'),
            as: 'Category'
          },
          {
            model: require('./Brand'),
            as: 'Brand'
          }
        ]
      }
    ]
  });
};

ProductSnapshot.createFromOffer = async function(offer, orderId, isFromProduct = false) {
  try {
    // Récupérer l'offre complète avec ses détails
    const fullOffer = await require('./Offer').findByPk(offer.id, {
      include: [
        {
          model: require('./Category'),
          as: 'Category'
        },
        {
          model: require('./Brand'),
          as: 'Brand'
        }
      ]
    });

    if (!fullOffer) {
      throw new Error('Offre introuvable');
    }

    const snapshot = await this.create({
      title: fullOffer.title,
      price: fullOffer.price,
      description: fullOffer.description,
      productCondition: fullOffer.productCondition,
      isFromProduct: isFromProduct,
      offerId: fullOffer.id,
      orderId: orderId
    });

    return {
      success: true,
      snapshot: snapshot,
      message: 'Snapshot produit créé'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Méthode pour obtenir l'historique des échanges d'une offre
ProductSnapshot.getOfferExchangeHistory = function(offerId, limit = 20) {
  return this.findAll({
    where: {
      offerId: offerId
    },
    include: [
      {
        model: require('./Order'),
        as: 'Order',
        attributes: ['id', 'status', 'createdAt']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: limit
  });
};

// Méthode pour obtenir les échanges par condition de produit
ProductSnapshot.getExchangesByCondition = function(condition, limit = 50) {
  return this.findAll({
    where: {
      productCondition: condition
    },
    include: [
      {
        model: require('./Order'),
        as: 'Order',
        attributes: ['id', 'status', 'createdAt']
      },
      {
        model: require('./Offer'),
        as: 'Offer',
        attributes: ['id', 'title'],
        include: [
          {
            model: require('./Category'),
            as: 'Category',
            attributes: ['name']
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: limit
  });
};

// Méthode pour analyser les échanges par catégorie
ProductSnapshot.getExchangeStatsByCategory = function() {
  return this.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('ProductSnapshot.id')), 'exchangeCount'],
      [sequelize.fn('AVG', sequelize.col('ProductSnapshot.price')), 'averagePrice'],
      [sequelize.fn('MIN', sequelize.col('ProductSnapshot.price')), 'minPrice'],
      [sequelize.fn('MAX', sequelize.col('ProductSnapshot.price')), 'maxPrice']
    ],
    include: [
      {
        model: require('./Offer'),
        as: 'Offer',
        attributes: [],
        include: [
          {
            model: require('./Category'),
            as: 'Category',
            attributes: ['id', 'name', 'icon']
          }
        ]
      }
    ],
    group: ['Offer->Category.id', 'Offer->Category.name', 'Offer->Category.icon'],
    order: [[sequelize.literal('exchangeCount'), 'DESC']]
  });
};

// Méthode pour obtenir les produits les plus échangés
ProductSnapshot.getMostExchangedProducts = function(limit = 20) {
  return this.findAll({
    attributes: [
      'title',
      'productCondition',
      [sequelize.fn('COUNT', sequelize.col('ProductSnapshot.id')), 'exchangeCount'],
      [sequelize.fn('AVG', sequelize.col('ProductSnapshot.price')), 'averagePrice']
    ],
    include: [
      {
        model: require('./Offer'),
        as: 'Offer',
        attributes: [],
        include: [
          {
            model: require('./Category'),
            as: 'Category',
            attributes: ['name']
          },
          {
            model: require('./Brand'),
            as: 'Brand',
            attributes: ['name']
          }
        ]
      }
    ],
    group: [
      'ProductSnapshot.title',
      'ProductSnapshot.productCondition',
      'Offer->Category.name',
      'Offer->Brand.name'
    ],
    order: [[sequelize.literal('exchangeCount'), 'DESC']],
    limit: limit
  });
};

// Méthode pour rechercher des snapshots de produits
ProductSnapshot.searchProductSnapshots = function(searchQuery, orderId = null) {
  const whereClause = {
    [sequelize.Op.or]: [
      {
        title: {
          [sequelize.Op.iLike]: `%${searchQuery}%`
        }
      },
      {
        description: {
          [sequelize.Op.iLike]: `%${searchQuery}%`
        }
      }
    ]
  };

  if (orderId) {
    whereClause.orderId = orderId;
  }

  return this.findAll({
    where: whereClause,
    include: [
      {
        model: require('./Offer'),
        as: 'Offer',
        include: [
          {
            model: require('./Category'),
            as: 'Category'
          },
          {
            model: require('./Brand'),
            as: 'Brand'
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: 100
  });
};

// Méthode pour calculer la valeur d'un échange
ProductSnapshot.calculateExchangeValue = async function(orderId) {
  const products = await this.getProductsForOrder(orderId);
  
  if (products.length !== 2) {
    return {
      success: false,
      message: 'Échange incomplet - 2 produits requis'
    };
  }

  const fromProduct = products.find(p => p.isFromProduct);
  const toProduct = products.find(p => !p.isFromProduct);

  const valueGain = (toProduct.price || 0) - (fromProduct.price || 0);
  const percentageGain = fromProduct.price > 0 ? 
    ((valueGain / fromProduct.price) * 100).toFixed(1) : 0;

  return {
    success: true,
    fromProduct: {
      title: fromProduct.title,
      price: fromProduct.price,
      condition: fromProduct.getConditionLabel()
    },
    toProduct: {
      title: toProduct.title,
      price: toProduct.price,
      condition: toProduct.getConditionLabel()
    },
    exchange: {
      valueGain: valueGain,
      percentageGain: percentageGain,
      isProfit: valueGain > 0,
      isLoss: valueGain < 0,
      isNeutral: valueGain === 0
    }
  };
};

// Méthode pour obtenir les produits les plus DEMANDÉS (isFromProduct: false)
ProductSnapshot.getMostWantedProducts = function(limit = 20) {
  return this.findAll({
    where: { 
      isFromProduct: false // Produits REÇUS (donc demandés)
    },
    attributes: [
      'title',
      'productCondition',
      [sequelize.fn('COUNT', sequelize.col('ProductSnapshot.id')), 'nombreDemandes'],
      [sequelize.fn('AVG', sequelize.col('ProductSnapshot.price')), 'prixMoyen'],
      [sequelize.fn('MIN', sequelize.col('ProductSnapshot.price')), 'prixMin'],
      [sequelize.fn('MAX', sequelize.col('ProductSnapshot.price')), 'prixMax']
    ],
    include: [
      {
        model: require('./Offer'),
        as: 'Offer',
        attributes: [],
        include: [
          {
            model: require('./Category'),
            as: 'Category',
            attributes: ['name', 'icon']
          },
          {
            model: require('./Brand'),
            as: 'Brand',
            attributes: ['name', 'logo']
          }
        ]
      }
    ],
    group: [
      'ProductSnapshot.title',
      'ProductSnapshot.productCondition',
      'Offer->Category.name',
      'Offer->Category.icon',
      'Offer->Brand.name',
      'Offer->Brand.logo'
    ],
    order: [[sequelize.literal('nombreDemandes'), 'DESC']],
    limit: limit
  });
};

// Méthode pour obtenir les produits les plus OFFERTS (isFromProduct: true)
ProductSnapshot.getMostOfferedProducts = function(limit = 20) {
  return this.findAll({
    where: { 
      isFromProduct: true // Produits DONNÉS (donc offerts)
    },
    attributes: [
      'title',
      'productCondition',
      [sequelize.fn('COUNT', sequelize.col('ProductSnapshot.id')), 'nombreOffres'],
      [sequelize.fn('AVG', sequelize.col('ProductSnapshot.price')), 'prixMoyen'],
      [sequelize.fn('MIN', sequelize.col('ProductSnapshot.price')), 'prixMin'],
      [sequelize.fn('MAX', sequelize.col('ProductSnapshot.price')), 'prixMax']
    ],
    include: [
      {
        model: require('./Offer'),
        as: 'Offer',
        attributes: [],
        include: [
          {
            model: require('./Category'),
            as: 'Category',
            attributes: ['name', 'icon']
          },
          {
            model: require('./Brand'),
            as: 'Brand',
            attributes: ['name', 'logo']
          }
        ]
      }
    ],
    group: [
      'ProductSnapshot.title',
      'ProductSnapshot.productCondition',
      'Offer->Category.name',
      'Offer->Category.icon',
      'Offer->Brand.name',
      'Offer->Brand.logo'
    ],
    order: [[sequelize.literal('nombreOffres'), 'DESC']],
    limit: limit
  });
};

// Méthode pour analyser les gains par catégorie
ProductSnapshot.getValueGainsByCategory = function() {
  return sequelize.query(`
    SELECT 
      offered_cat.name as "offeredCategory",
      wanted_cat.name as "wantedCategory",
      COUNT(*) as "exchangeCount",
      AVG(wanted.price - offered.price) as "averageGain",
      SUM(wanted.price - offered.price) as "totalGain",
      MIN(wanted.price - offered.price) as "minGain",
      MAX(wanted.price - offered.price) as "maxGain"
    FROM product_snapshots offered
    JOIN product_snapshots wanted ON offered.order_id = wanted.order_id
    JOIN offers offered_offer ON offered.offer_id = offered_offer.id
    JOIN offers wanted_offer ON wanted.offer_id = wanted_offer.id
    JOIN categories offered_cat ON offered_offer.category_id = offered_cat.id
    JOIN categories wanted_cat ON wanted_offer.category_id = wanted_cat.id
    WHERE offered.is_from_product = true 
      AND wanted.is_from_product = false
      AND offered.price IS NOT NULL 
      AND wanted.price IS NOT NULL
    GROUP BY offered_cat.name, wanted_cat.name
    ORDER BY "averageGain" DESC
    LIMIT 30
  `, {
    type: sequelize.QueryTypes.SELECT
  });
};

// Méthode pour analyser la rotation des conditions de produits
ProductSnapshot.getConditionUpgradeAnalysis = function() {
  return sequelize.query(`
    SELECT 
      offered.product_condition as "offeredCondition",
      wanted.product_condition as "wantedCondition",
      COUNT(*) as "exchangeCount",
      AVG(wanted.price - offered.price) as "averageGain",
      CASE 
        WHEN offered.product_condition = 'fair' AND wanted.product_condition IN ('good', 'like_new', 'new') THEN 'Amélioration'
        WHEN offered.product_condition = 'good' AND wanted.product_condition IN ('like_new', 'new') THEN 'Amélioration'
        WHEN offered.product_condition = 'like_new' AND wanted.product_condition = 'new' THEN 'Amélioration'
        WHEN offered.product_condition = wanted.product_condition THEN 'Équivalent'
        ELSE 'Détérioration'
      END as "conditionTrend"
    FROM product_snapshots offered
    JOIN product_snapshots wanted ON offered.order_id = wanted.order_id
    WHERE offered.is_from_product = true 
      AND wanted.is_from_product = false
    GROUP BY offered.product_condition, wanted.product_condition
    ORDER BY "exchangeCount" DESC
  `, {
    type: sequelize.QueryTypes.SELECT
  });
};

// Méthode pour obtenir les meilleurs "deals" (plus gros gains)
ProductSnapshot.getBestDeals = function(limit = 20) {
  return sequelize.query(`
    SELECT 
      offered.title as "offeredProduct",
      offered.price as "offeredPrice",
      offered.product_condition as "offeredCondition",
      wanted.title as "wantedProduct", 
      wanted.price as "wantedPrice",
      wanted.product_condition as "wantedCondition",
      (wanted.price - offered.price) as "valueGain",
      ROUND(((wanted.price - offered.price) / offered.price * 100), 2) as "percentageGain",
      o.order_number as "orderNumber",
      o.completed_at as "exchangeDate"
    FROM product_snapshots offered
    JOIN product_snapshots wanted ON offered.order_id = wanted.order_id
    JOIN orders o ON offered.order_id = o.id
    WHERE offered.is_from_product = true 
      AND wanted.is_from_product = false
      AND offered.price > 0
      AND wanted.price > offered.price
      AND o.status = 'completed'
    ORDER BY "percentageGain" DESC
    LIMIT :limit
  `, {
    replacements: { limit },
    type: sequelize.QueryTypes.SELECT
  });
};

// Méthode pour obtenir les "pires deals" (plus grosses pertes)
ProductSnapshot.getWorstDeals = function(limit = 20) {
  return sequelize.query(`
    SELECT 
      offered.title as "offeredProduct",
      offered.price as "offeredPrice", 
      offered.product_condition as "offeredCondition",
      wanted.title as "wantedProduct",
      wanted.price as "wantedPrice",
      wanted.product_condition as "wantedCondition",
      (wanted.price - offered.price) as "valueLoss",
      ROUND(((wanted.price - offered.price) / offered.price * 100), 2) as "percentageLoss", 
      o.order_number as "orderNumber",
      o.completed_at as "exchangeDate"
    FROM product_snapshots offered
    JOIN product_snapshots wanted ON offered.order_id = wanted.order_id
    JOIN orders o ON offered.order_id = o.id
    WHERE offered.is_from_product = true 
      AND wanted.is_from_product = false
      AND offered.price > 0
      AND wanted.price < offered.price
      AND o.status = 'completed'
    ORDER BY "percentageLoss" ASC
    LIMIT :limit
  `, {
    replacements: { limit },
    type: sequelize.QueryTypes.SELECT
  });
};

module.exports = ProductSnapshot;
