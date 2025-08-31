const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Offer = sequelize.define('Offer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'product_id',
    references: {
      model: 'products',
      key: 'id'
    }
  },
  sellerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'seller_id',
    references: {
      model: 'users',
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
  brandId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'brand_id',
    references: {
      model: 'brands',
      key: 'id'
    }
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'subject_id',
    references: {
      model: 'subjects',
      key: 'id'
    }
  },
  replacedByOffer: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'replaced_by_offer_id',
    references: {
      model: 'offers',
      key: 'id'
    }
  },
  productCondition: {
    type: DataTypes.ENUM('new', 'like_new', 'good', 'fair'),
    allowNull: false,
    field: 'product_condition',
    defaultValue: 'good'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 2000]
    }
  },
  status: {
    type: DataTypes.ENUM('available', 'exchanged', 'archived'),
    allowNull: false,
    defaultValue: 'available'
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'is_deleted',
    defaultValue: false
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
  tableName: 'offers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['product_id']
    },
    {
      fields: ['seller_id']
    },
    {
      fields: ['category_id']
    },
    {
      fields: ['brand_id']
    },
    {
      fields: ['subject_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['product_condition']
    },
    {
      fields: ['is_deleted']
    },
    {
      fields: ['seller_id', 'status']
    },
    {
      fields: ['category_id', 'status']
    },
    {
      fields: ['brand_id', 'status']
    },
    {
      fields: ['subject_id', 'status']
    }
  ],
  scopes: {
    available: {
      where: {
        status: 'available',
        isDeleted: false
      }
    },
    notDeleted: {
      where: {
        isDeleted: false
      }
    }
  }
});

// Méthodes d'instance
Offer.prototype.isAvailable = function() {
  return this.status === 'available' && !this.isDeleted;
};

Offer.prototype.getConditionLabel = function() {
  const conditionLabels = {
    'new': 'Neuf',
    'like_new': 'Comme neuf',
    'good': 'Bon état',
    'fair': 'État correct'
  };
  return conditionLabels[this.productCondition] || this.productCondition;
};

Offer.prototype.softDelete = function() {
  return this.update({ isDeleted: true });
};

Offer.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  return values;
};

// Méthodes statiques
Offer.findBySeller = function(sellerId) {
  return this.scope('notDeleted').findAll({
    where: { sellerId: sellerId },
    order: [['createdAt', 'DESC']]
  });
};

Offer.findAvailable = function(limit = 20) {
  return this.scope('available').findAll({
    order: [['createdAt', 'DESC']],
    where: {
        isDeleted: false
    },
    limit: limit
  });
};

Offer.findByCondition = function(condition) {
  return this.scope('available').findAll({
    where: { productCondition: condition, isDeleted: false },
    order: [['createdAt', 'DESC']]
  });
};

Offer.findByPriceRange = function(minPrice, maxPrice) {
  return this.scope('available').findAll({
    where: {
      price: {
        [sequelize.Op.between]: [minPrice, maxPrice]
      },
      isDeleted: false
    },
    order: [['price', 'ASC']]
  });
};

Offer.getInvestment = async function(userId) {
  // Récupérer toutes les offres de l'utilisateur avec leurs échanges
  const userOffers = await this.findAll({
    where: { 
      sellerId: userId,
      isDeleted: false
    },
    include: [
      {
        model: require('./Exchange'),
        as: 'exchangesFrom',
        where: { status: 'completed' },
        required: false
      },
      {
        model: require('./Exchange'), 
        as: 'exchangesTo',
        where: { status: 'completed' },
        required: false
      }
    ],
    order: [['createdAt', 'ASC']]
  });

  // Construire la chaîne d'investissement
  return this.buildInvestmentChain(userOffers, userId);
};

Offer.buildInvestmentChain = function(offers, userId) {
  const investmentSteps = [];
  let totalInitialValue = 0;
  let totalCurrentValue = 0;
  let totalGainLoss = 0;
  let activeOffers = 0;

  offers.forEach(offer => {
    const step = {
      offerId: offer.id,
      productTitle: offer.title,
      condition: offer.productCondition,
      initialValue: offer.price,
      currentValue: offer.price,
      status: offer.status,
      gainLoss: 0,
      roi: 0,
      exchangeHistory: []
    };

    // Si l'offre a été échangée (donnée)
    if (offer.exchangesFrom && offer.exchangesFrom.length > 0) {
      const exchange = offer.exchangesFrom[0];
      step.exchangedFor = exchange.toOffer?.title || 'Produit échangé';
      step.exchangeDate = exchange.completedAt;
      step.gainLoss = exchange.gainLoss || 0;
      step.roi = exchange.calculateReturn ? exchange.calculateReturn() : 0;
      step.status = 'exchanged';
    }

    // Si l'offre a été reçue via échange
    if (offer.exchangesTo && offer.exchangesTo.length > 0) {
      const exchange = offer.exchangesTo[0];
      step.acquiredFrom = exchange.fromOffer?.title || 'Produit reçu';
      step.acquisitionDate = exchange.completedAt;
    }

    investmentSteps.push(step);

    // Calculs pour le résumé
    totalInitialValue += step.initialValue || 0;
    
    if (step.status === 'available') {
      totalCurrentValue += step.currentValue || 0;
      activeOffers++;
    } else if (step.status === 'exchanged') {
      totalGainLoss += step.gainLoss || 0;
    }
  });

  // Calculer le ROI global
  const totalROI = totalInitialValue > 0 ? 
    ((totalCurrentValue + totalGainLoss - totalInitialValue) / totalInitialValue) * 100 : 0;

  return {
    userId: userId,
    investmentSteps: investmentSteps,
    summary: {
      totalOffers: offers.length,
      activeOffers: activeOffers,
      exchangedOffers: offers.filter(o => o.status === 'exchanged').length,
      totalInitialValue: totalInitialValue,
      totalCurrentValue: totalCurrentValue,
      totalGainLoss: totalGainLoss,
      netWorth: totalCurrentValue + totalGainLoss,
      totalROI: totalROI,
      avgGainPerExchange: offers.length > 0 ? totalGainLoss / offers.length : 0,
      lastActivity: offers.length > 0 ? 
        Math.max(...offers.map(o => new Date(o.updatedAt))) : null
    },
    insights: this.generateInvestmentInsights(investmentSteps, totalROI)
  };
};

Offer.generateInvestmentInsights = function(steps, totalROI) {
  const insights = [];
  
  // Analyse de performance
  if (totalROI > 50) {
    insights.push({
      type: 'success',
      message: `Excellent investisseur ! ROI de ${totalROI.toFixed(1)}%`,
      icon: '🏆'
    });
  } else if (totalROI > 20) {
    insights.push({
      type: 'good',
      message: `Bon investisseur ! ROI de ${totalROI.toFixed(1)}%`,
      icon: '📈'
    });
  } else if (totalROI < 0) {
    insights.push({
      type: 'warning',
      message: `Attention ! Perte de ${Math.abs(totalROI).toFixed(1)}%`,
      icon: '⚠️'
    });
  }

  // Recommandations
  const availableOffers = steps.filter(s => s.status === 'available');
  if (availableOffers.length > 3) {
    insights.push({
      type: 'tip',
      message: `Vous avez ${availableOffers.length} offres actives. Considérez quelques échanges !`,
      icon: '💡'
    });
  }

  // Analyse des tendances
  const exchangedSteps = steps.filter(s => s.status === 'exchanged');
  if (exchangedSteps.length > 0) {
    const avgGain = exchangedSteps.reduce((sum, s) => sum + s.gainLoss, 0) / exchangedSteps.length;
    if (avgGain > 0) {
      insights.push({
        type: 'trend',
        message: `Gain moyen par échange: ${avgGain.toFixed(0)}€`,
        icon: '📊'
      });
    }
  }

  return insights;
};

// Méthode pour obtenir les statistiques globales de l'application
Offer.getAppStats = async function() {
  const [
    totalOffers,
    availableOffers,
    exchangedOffers,
    totalProducts,
    totalBrands,
    totalCategories,
    totalUsers
  ] = await Promise.all([
    this.count({ where: { isDeleted: false } }),
    this.count({ where: { status: 'available', isDeleted: false } }),
    this.count({ where: { status: 'exchanged', isDeleted: false } }),
    require('./Product').count(),
    require('./Brand').count(),
    require('./Category').count(),
    require('./User').count()
  ]);

  // Déterminer la phase de l'application
  const appPhase = availableOffers < 100 ? 'startup' : 'mature';
  
  return {
    phase: appPhase,
    offers: {
      total: totalOffers,
      available: availableOffers,
      exchanged: exchangedOffers,
      exchangeRate: totalOffers > 0 ? (exchangedOffers / totalOffers * 100).toFixed(1) : 0
    },
    catalog: {
      products: totalProducts,
      brands: totalBrands,
      categories: totalCategories
    },
    community: {
      users: totalUsers,
      avgOffersPerUser: totalUsers > 0 ? (totalOffers / totalUsers).toFixed(1) : 0
    },
    recommendations: {
      useProductCount: appPhase === 'startup',
      useBrandDiversity: appPhase === 'startup',
      message: appPhase === 'startup' 
        ? 'Application en phase de démarrage - Algorithmes adaptés'
        : 'Application mature - Algorithmes complets'
    }
  };
};

// Méthodes pour gérer les images
Offer.prototype.getImages = function() {
  return require('./OfferImage').getImagesForOffer(this.id);
};

Offer.prototype.getMainImage = function() {
  return require('./OfferImage').getMainImageForOffer(this.id);
};

Offer.prototype.hasImages = async function() {
  const imageCount = await require('./OfferImage').count({
    where: { offerId: this.id }
  });
  return imageCount > 0;
};

Offer.prototype.getImagesByColor = function(color) {
  return require('./OfferImage').getImagesByColor(this.id, color);
};

// Méthode pour obtenir les offres avec leurs images principales
Offer.getOffersWithMainImages = function(options = {}) {
  const defaultOptions = {
    where: {
      status: 'available',
      isDeleted: false
    },
    include: [
      {
        model: require('./OfferImage'),
        as: 'Images',
        where: { isMain: true },
        required: false,
        limit: 1
      },
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
    ],
    order: [['createdAt', 'DESC']]
  };

  return this.findAll({
    ...defaultOptions,
    ...options
  });
};

module.exports = Offer;