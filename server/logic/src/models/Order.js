const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'order_number'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  exchangeType: {
    type: DataTypes.ENUM('direct', 'chain', 'group'),
    allowNull: false,
    field: 'exchange_type',
    defaultValue: 'direct'
  },
  totalValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'total_value',
    validate: {
      min: 0
    }
  },
  exchangeDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'exchange_date'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['order_number']
    },
    {
      fields: ['status']
    },
    {
      fields: ['exchange_type']
    },
    {
      fields: ['exchange_date']
    },
    {
      fields: ['completed_at']
    }
  ]
});

// Méthodes d'instance
Order.prototype.isCompleted = function() {
  return this.status === 'completed';
};

Order.prototype.isPending = function() {
  return this.status === 'pending';
};

Order.prototype.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

Order.prototype.getStatusLabel = function() {
  const statusLabels = {
    'pending': 'En attente',
    'confirmed': 'Confirmé',
    'in_progress': 'En cours',
    'completed': 'Terminé',
    'cancelled': 'Annulé',
    'failed': 'Échoué'
  };
  return statusLabels[this.status] || this.status;
};

Order.prototype.getDurationInDays = function() {
  if (!this.completedAt || !this.createdAt) return null;
  
  const diffTime = Math.abs(this.completedAt - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Méthodes statiques
Order.generateOrderNumber = function() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MR-${timestamp.slice(-6)}-${random}`;
};

Order.createExchangeOrder = async function(fromUserId, toUserId, fromOfferId, toOfferId, exchangeType = 'direct') {
  const transaction = await sequelize.transaction();
  
  try {
    // Créer la commande
    const order = await this.create({
      orderNumber: this.generateOrderNumber(),
      status: 'pending',
      exchangeType: exchangeType
    }, { transaction });

    // Créer les snapshots des utilisateurs
    const [fromUser, toUser] = await Promise.all([
      require('./User').findByPk(fromUserId),
      require('./User').findByPk(toUserId)
    ]);

    const [fromOffer, toOffer] = await Promise.all([
      require('./Offer').findByPk(fromOfferId),
      require('./Offer').findByPk(toOfferId)
    ]);

    // Créer les snapshots
    await Promise.all([
      require('./UserSnapshot').createFromUser(fromUser, order.id, true),
      require('./UserSnapshot').createFromUser(toUser, order.id, false),
      require('./ProductSnapshot').createFromOffer(fromOffer, order.id, true),
      require('./ProductSnapshot').createFromOffer(toOffer, order.id, false)
    ]);

    // Calculer la valeur totale
    const totalValue = (fromOffer.price || 0) + (toOffer.price || 0);
    await order.update({ totalValue }, { transaction });

    await transaction.commit();
    
    return {
      success: true,
      order: order,
      message: 'Commande d\'échange créée'
    };
  } catch (error) {
    await transaction.rollback();
    return {
      success: false,
      error: error.message
    };
  }
};

Order.getOrderWithDetails = function(orderId) {
  return this.findByPk(orderId, {
    include: [
      {
        model: require('./UserSnapshot'),
        as: 'UserSnapshots',
        include: [
          {
            model: require('./Address'),
            as: 'Address'
          }
        ]
      },
      {
        model: require('./ProductSnapshot'),
        as: 'ProductSnapshots',
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
      }
    ]
  });
};

Order.getUserOrders = function(userId, status = null, limit = 50) {
  const whereClause = {};
  if (status) {
    whereClause.status = status;
  }

  return this.findAll({
    where: whereClause,
    include: [
      {
        model: require('./UserSnapshot'),
        as: 'UserSnapshots',
        where: {
          userId: userId
        }
      },
      {
        model: require('./ProductSnapshot'),
        as: 'ProductSnapshots',
        include: [
          {
            model: require('./Offer'),
            as: 'Offer',
            attributes: ['id', 'title']
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: limit
  });
};

Order.getOrdersByStatus = function(status, limit = 100) {
  return this.findAll({
    where: {
      status: status
    },
    include: [
      {
        model: require('./UserSnapshot'),
        as: 'UserSnapshots'
      },
      {
        model: require('./ProductSnapshot'),
        as: 'ProductSnapshots'
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: limit
  });
};

// Statistiques des commandes
Order.getOrderStats = async function(period = 30) {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - period);

  const stats = await this.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('AVG', sequelize.col('total_value')), 'avgValue'],
      [sequelize.fn('SUM', sequelize.col('total_value')), 'totalValue']
    ],
    where: {
      createdAt: {
        [sequelize.Op.gte]: dateLimit
      }
    },
    group: ['status'],
    order: [[sequelize.literal('count'), 'DESC']]
  });

  const totalOrders = await this.count({
    where: {
      createdAt: {
        [sequelize.Op.gte]: dateLimit
      }
    }
  });

  return {
    period: period,
    totalOrders: totalOrders,
    byStatus: stats,
    summary: {
      completed: stats.find(s => s.status === 'completed')?.dataValues.count || 0,
      pending: stats.find(s => s.status === 'pending')?.dataValues.count || 0,
      cancelled: stats.find(s => s.status === 'cancelled')?.dataValues.count || 0,
      successRate: totalOrders > 0 ? 
        ((stats.find(s => s.status === 'completed')?.dataValues.count || 0) / totalOrders * 100).toFixed(1) : 0
    }
  };
};

Order.updateOrderStatus = async function(orderId, newStatus, notes = null) {
  try {
    const updateData = { status: newStatus };
    
    if (newStatus === 'completed') {
      updateData.completedAt = new Date();
    }
    
    if (notes) {
      updateData.notes = notes;
    }

    const [updatedCount] = await this.update(updateData, {
      where: { id: orderId }
    });

    return {
      success: updatedCount > 0,
      message: updatedCount > 0 ? 'Statut mis à jour' : 'Commande introuvable'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Méthode pour analyser les échanges (qui demande quoi)
Order.getExchangeAnalysis = async function(orderId) {
  const order = await this.findByPk(orderId, {
    include: [
      {
        model: require('./UserSnapshot'),
        as: 'UserSnapshots'
      },
      {
        model: require('./ProductSnapshot'),
        as: 'ProductSnapshots'
      }
    ]
  });

  if (!order) {
    return { success: false, message: 'Commande introuvable' };
  }

  const sender = order.UserSnapshots.find(u => u.isSender);
  const receiver = order.UserSnapshots.find(u => !u.isSender);
  const senderProduct = order.ProductSnapshots.find(p => p.isFromProduct);
  const receiverProduct = order.ProductSnapshots.find(p => !p.isFromProduct);

  return {
    success: true,
    analysis: {
      demandeur: {
        nom: sender.name,
        email: sender.email,
        produitOffert: senderProduct.title,
        valeurOfferte: senderProduct.price,
        condition: senderProduct.getConditionLabel()
      },
      destinataire: {
        nom: receiver.name,
        email: receiver.email,
        produitDemande: receiverProduct.title,
        valeurDemandee: receiverProduct.price,
        condition: receiverProduct.getConditionLabel()
      },
      initiative: `${sender.name} veut échanger sa ${senderProduct.title} contre le ${receiverProduct.title} de ${receiver.name}`,
      gainDemandeur: (receiverProduct.price || 0) - (senderProduct.price || 0),
      gainDestinataire: (senderProduct.price || 0) - (receiverProduct.price || 0),
      pourcentageGainDemandeur: senderProduct.price > 0 ? 
        (((receiverProduct.price || 0) - (senderProduct.price || 0)) / senderProduct.price * 100).toFixed(1) : 0
    }
  };
};

// Méthode pour obtenir les patterns d'échange
Order.getExchangePatterns = async function(limit = 50) {
  const orders = await this.findAll({
    where: {
      status: 'completed'
    },
    include: [
      {
        model: require('./ProductSnapshot'),
        as: 'ProductSnapshots',
        include: [
          {
            model: require('./Offer'),
            as: 'Offer',
            include: [
              {
                model: require('./Category'),
                as: 'Category',
                attributes: ['name', 'icon']
              },
              {
                model: require('./Brand'),
                as: 'Brand',
                attributes: ['name']
              }
            ]
          }
        ]
      }
    ],
    limit: limit,
    order: [['completedAt', 'DESC']]
  });

  return orders.map(order => {
    const offered = order.ProductSnapshots.find(p => p.isFromProduct);
    const wanted = order.ProductSnapshots.find(p => !p.isFromProduct);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      pattern: `${offered.Offer?.Category?.name || 'Inconnu'} → ${wanted.Offer?.Category?.name || 'Inconnu'}`,
      offeredProduct: offered.title,
      offeredBrand: offered.Offer?.Brand?.name,
      offeredPrice: offered.price,
      wantedProduct: wanted.title,
      wantedBrand: wanted.Offer?.Brand?.name,
      wantedPrice: wanted.price,
      valueGap: (wanted.price || 0) - (offered.price || 0),
      exchangeDate: order.completedAt
    };
  });
};

// Méthode pour analyser les patterns populaires
Order.getPopularExchangePatterns = async function(limit = 20) {
  const patterns = await this.getExchangePatterns(500); // Prendre plus de données
  
  // Grouper par pattern
  const patternStats = patterns.reduce((acc, exchange) => {
    const pattern = exchange.pattern;
    if (!acc[pattern]) {
      acc[pattern] = {
        pattern: pattern,
        count: 0,
        totalValueGap: 0,
        exchanges: []
      };
    }
    acc[pattern].count++;
    acc[pattern].totalValueGap += exchange.valueGap;
    acc[pattern].exchanges.push(exchange);
    return acc;
  }, {});

  // Convertir en array et trier
  return Object.values(patternStats)
    .map(stat => ({
      pattern: stat.pattern,
      count: stat.count,
      averageValueGap: stat.count > 0 ? (stat.totalValueGap / stat.count).toFixed(2) : 0,
      totalValueGap: stat.totalValueGap,
      percentage: ((stat.count / patterns.length) * 100).toFixed(1)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

module.exports = Order;
