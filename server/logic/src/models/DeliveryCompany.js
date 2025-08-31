const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DeliveryCompany = sequelize.define('DeliveryCompany', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  logo: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  website: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[\+]?[0-9\s\-\(\)]{10,20}$/
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'is_active',
    defaultValue: true
  },
  apiEndpoint: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'api_endpoint',
    validate: {
      isUrl: true
    }
  },
  apiKey: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'api_key'
  },
  supportsCod: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'supports_cod',
    defaultValue: true,
    comment: 'Support Cash on Delivery'
  },
  supportsFragile: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'supports_fragile',
    defaultValue: true,
    comment: 'Support fragile packages'
  },
  maxWeight: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    field: 'max_weight',
    comment: 'Maximum weight in kg'
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
  tableName: 'delivery_companies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['name']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Méthodes d'instance
DeliveryCompany.prototype.isActiveCompany = function() {
  return this.isActive === true;
};

DeliveryCompany.prototype.hasLogo = function() {
  return !!this.logo;
};

DeliveryCompany.prototype.hasApiIntegration = function() {
  return !!(this.apiEndpoint && this.apiKey);
};

DeliveryCompany.prototype.canHandleWeight = function(weight) {
  return !this.maxWeight || weight <= this.maxWeight;
};

// Méthodes statiques
DeliveryCompany.getActiveCompanies = function() {
  return this.findAll({
    where: {
      isActive: true
    },
    order: [['name', 'ASC']]
  });
};

DeliveryCompany.getCompaniesForWeight = function(weight) {
  return this.findAll({
    where: {
      isActive: true,
      [sequelize.Op.or]: [
        { maxWeight: null },
        { maxWeight: { [sequelize.Op.gte]: weight } }
      ]
    },
    order: [['name', 'ASC']]
  });
};

DeliveryCompany.getCompaniesWithCod = function() {
  return this.findAll({
    where: {
      isActive: true,
      supportsCod: true
    },
    order: [['name', 'ASC']]
  });
};

DeliveryCompany.getCompaniesWithApiIntegration = function() {
  return this.findAll({
    where: {
      isActive: true,
      apiEndpoint: { [sequelize.Op.ne]: null },
      apiKey: { [sequelize.Op.ne]: null }
    },
    order: [['name', 'ASC']]
  });
};

// Méthode pour obtenir les statistiques des sociétés de livraison
DeliveryCompany.getCompaniesWithStats = function() {
  return this.findAll({
    attributes: [
      'id',
      'name',
      'logo',
      'isActive',
      'supportsCod',
      'supportsFragile',
      'maxWeight',
      [
        sequelize.fn('COUNT', sequelize.col('DeliveryInfos.id')), 
        'totalDeliveries'
      ],
      [
        sequelize.fn('COUNT', 
          sequelize.literal(`CASE WHEN "DeliveryInfos"."delivery_status" = 'delivered' THEN 1 END`)
        ), 
        'successfulDeliveries'
      ],
      [
        sequelize.fn('AVG', sequelize.col('DeliveryInfos.total_amount')), 
        'averageAmount'
      ]
    ],
    include: [
      {
        model: require('./DeliveryInfo'),
        as: 'DeliveryInfos',
        attributes: [],
        required: false
      }
    ],
    group: ['DeliveryCompany.id'],
    order: [['name', 'ASC']]
  });
};

// Méthode pour obtenir les sociétés les plus populaires
DeliveryCompany.getMostPopularCompanies = function(limit = 10) {
  return this.findAll({
    attributes: [
      'id',
      'name',
      'logo',
      [
        sequelize.fn('COUNT', sequelize.col('DeliveryInfos.id')), 
        'deliveryCount'
      ],
      [
        sequelize.fn('COUNT', 
          sequelize.literal(`CASE WHEN "DeliveryInfos"."delivery_status" = 'delivered' THEN 1 END`)
        ), 
        'successCount'
      ]
    ],
    include: [
      {
        model: require('./DeliveryInfo'),
        as: 'DeliveryInfos',
        attributes: [],
        where: {
          createdAt: {
            [sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
          }
        },
        required: false
      }
    ],
    group: ['DeliveryCompany.id'],
    order: [[sequelize.literal('deliveryCount'), 'DESC']],
    limit: limit
  });
};

// Méthodes pour la gestion des sociétés marocaines populaires
DeliveryCompany.seedMoroccanCompanies = async function() {
  const moroccanCompanies = [
    {
      name: 'Amana',
      logo: 'https://example.com/logos/amana.png',
      website: 'https://amana.ma',
      phone: '+212 5 22 00 00 00',
      supportsCod: true,
      supportsFragile: true,
      maxWeight: 30.00
    },
    {
      name: 'Chronopost Maroc',
      logo: 'https://example.com/logos/chronopost.png',
      website: 'https://chronopost.ma',
      phone: '+212 5 22 11 11 11',
      supportsCod: true,
      supportsFragile: true,
      maxWeight: 25.00
    },
    {
      name: 'DHL Maroc',
      logo: 'https://example.com/logos/dhl.png',
      website: 'https://dhl.ma',
      phone: '+212 5 22 22 22 22',
      supportsCod: false,
      supportsFragile: true,
      maxWeight: 50.00
    },
    {
      name: 'CTM',
      logo: 'https://example.com/logos/ctm.png',
      website: 'https://ctm.ma',
      phone: '+212 5 22 33 33 33',
      supportsCod: true,
      supportsFragile: false,
      maxWeight: 20.00
    },
    {
      name: 'Colis Privé Maroc',
      logo: 'https://example.com/logos/colis-prive.png',
      website: 'https://colisprive.ma',
      phone: '+212 5 22 44 44 44',
      supportsCod: true,
      supportsFragile: true,
      maxWeight: 35.00
    }
  ];

  try {
    const createdCompanies = [];
    for (const company of moroccanCompanies) {
      const [createdCompany, created] = await this.findOrCreate({
        where: { name: company.name },
        defaults: company
      });
      createdCompanies.push({ company: createdCompany, created });
    }
    
    return {
      success: true,
      companies: createdCompanies,
      message: 'Sociétés marocaines initialisées'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = DeliveryCompany;
