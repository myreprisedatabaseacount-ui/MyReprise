const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Exchange = sequelize.define('Exchange', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  fromOfferId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'from_offer_id',
    references: {
      model: 'offers',
      key: 'id'
    }
  },
  toOfferId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'to_offer_id',
    references: {
      model: 'offers',
      key: 'id'
    }
  },
  fromUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'from_user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  toUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'to_user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  fromOfferValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'from_offer_value',
    comment: 'Valeur de l\'offre donnée au moment de l\'échange'
  },
  toOfferValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'to_offer_value',
    comment: 'Valeur de l\'offre reçue au moment de l\'échange'
  },
  gainLoss: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'gain_loss',
    comment: 'Gain/Perte de cet échange (toOfferValue - fromOfferValue)'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
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
  tableName: 'exchanges',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['from_user_id']
    },
    {
      fields: ['to_user_id']
    },
    {
      fields: ['from_offer_id']
    },
    {
      fields: ['to_offer_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['completed_at']
    }
  ],
  hooks: {
    beforeSave: function(exchange) {
      // Calculer automatiquement le gain/perte
      if (exchange.fromOfferValue && exchange.toOfferValue) {
        exchange.gainLoss = exchange.toOfferValue - exchange.fromOfferValue;
      }
    }
  }
});

// Méthodes d'instance
Exchange.prototype.calculateReturn = function() {
  if (!this.fromOfferValue || this.fromOfferValue === 0) return 0;
  return ((this.toOfferValue - this.fromOfferValue) / this.fromOfferValue) * 100;
};

Exchange.prototype.isProfit = function() {
  return this.gainLoss > 0;
};

// Méthodes statiques pour l'investissement
Exchange.getUserExchangeChain = async function(userId) {
  const exchanges = await this.findAll({
    where: { fromUserId: userId, status: 'completed' },
    order: [['completedAt', 'ASC']],
    include: [
      { model: require('./Offer'), as: 'fromOffer' },
      { model: require('./Offer'), as: 'toOffer' }
    ]
  });
  
  return this.buildInvestmentChain(exchanges);
};

Exchange.buildInvestmentChain = function(exchanges) {
  const chain = [];
  let totalInvestment = 0;
  let currentValue = 0;
  
  exchanges.forEach((exchange, index) => {
    if (index === 0) {
      currentValue = exchange.fromOfferValue;
    }
    
    totalInvestment += (exchange.gainLoss || 0);
    currentValue = exchange.toOfferValue;
    
    chain.push({
      step: index + 1,
      fromProduct: exchange.fromOffer.title,
      toProduct: exchange.toOffer.title,
      fromValue: exchange.fromOfferValue,
      toValue: exchange.toOfferValue,
      gain: exchange.gainLoss,
      roi: exchange.calculateReturn(),
      totalValue: currentValue,
      totalGain: totalInvestment,
      date: exchange.completedAt
    });
  });
  
  return {
    chain,
    summary: {
      totalExchanges: exchanges.length,
      initialValue: exchanges[0]?.fromOfferValue || 0,
      currentValue: currentValue,
      totalGain: totalInvestment,
      totalROI: exchanges[0]?.fromOfferValue ? 
        (totalInvestment / exchanges[0].fromOfferValue) * 100 : 0
    }
  };
};

Exchange.getTopInvestors = async function(limit = 10) {
  const result = await sequelize.query(`
    SELECT 
      u.id,
      u.first_name,
      u.last_name,
      COUNT(e.id) as total_exchanges,
      SUM(e.gain_loss) as total_profit,
      AVG(e.gain_loss) as avg_profit_per_exchange,
      MAX(e.completed_at) as last_exchange_date
    FROM users u
    INNER JOIN exchanges e ON u.id = e.from_user_id
    WHERE e.status = 'completed'
    GROUP BY u.id, u.first_name, u.last_name
    ORDER BY total_profit DESC
    LIMIT :limit
  `, {
    replacements: { limit },
    type: sequelize.QueryTypes.SELECT
  });
  
  return result;
};

module.exports = Exchange;
