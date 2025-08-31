const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserSnapshot = sequelize.define('UserSnapshot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
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
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 200]
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[\+]?[0-9\s\-\(\)]{10,20}$/
    }
  },
  isSender: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'is_sender',
    defaultValue: false
  },
  addressId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'address_id',
    references: {
      model: 'addresses',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
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
  tableName: 'user_snapshots',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['order_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['is_sender']
    },
    {
      fields: ['order_id', 'is_sender']
    },
    {
      fields: ['order_id', 'user_id']
    }
  ]
});

// Méthodes d'instance
UserSnapshot.prototype.isSenderUser = function() {
  return this.isSender === true;
};

UserSnapshot.prototype.isReceiverUser = function() {
  return this.isSender === false;
};

UserSnapshot.prototype.getFullName = function() {
  return this.name;
};

UserSnapshot.prototype.hasPhone = function() {
  return !!this.phone;
};

// Méthodes statiques
UserSnapshot.getSenderForOrder = function(orderId) {
  return this.findOne({
    where: {
      orderId: orderId,
      isSender: true
    },
    include: [
      {
        model: require('./Address'),
        as: 'Address',
        attributes: ['city', 'sector', 'addressName']
      }
    ]
  });
};

UserSnapshot.getReceiverForOrder = function(orderId) {
  return this.findOne({
    where: {
      orderId: orderId,
      isSender: false
    },
    include: [
      {
        model: require('./Address'),
        as: 'Address',
        attributes: ['city', 'sector', 'addressName']
      }
    ]
  });
};

UserSnapshot.getUsersForOrder = function(orderId) {
  return this.findAll({
    where: {
      orderId: orderId
    },
    include: [
      {
        model: require('./Address'),
        as: 'Address',
        attributes: ['city', 'sector', 'addressName']
      },
      {
        model: require('./User'),
        as: 'User',
        attributes: ['id', 'role', 'isVerified']
      }
    ],
    order: [['isSender', 'DESC']] // Expéditeur en premier
  });
};

UserSnapshot.createFromUser = async function(user, orderId, isSender = false) {
  try {
    // Récupérer les informations complètes de l'utilisateur
    const fullUser = await require('./User').findByPk(user.id, {
      include: [
        {
          model: require('./Address'),
          as: 'Address'
        }
      ]
    });

    if (!fullUser) {
      throw new Error('Utilisateur introuvable');
    }

    const snapshot = await this.create({
      orderId: orderId,
      name: fullUser.getFullName(),
      email: fullUser.email,
      phone: fullUser.phone,
      isSender: isSender,
      addressId: fullUser.addressId,
      userId: fullUser.id
    });

    return {
      success: true,
      snapshot: snapshot,
      message: 'Snapshot utilisateur créé'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

UserSnapshot.getOrderParticipants = function(orderId) {
  return this.findAll({
    where: {
      orderId: orderId
    },
    attributes: [
      'id',
      'name',
      'email',
      'phone',
      'isSender',
      'userId'
    ],
    include: [
      {
        model: require('./Address'),
        as: 'Address',
        attributes: ['city', 'sector', 'addressName']
      }
    ],
    order: [['isSender', 'DESC']]
  });
};

// Méthode pour obtenir l'historique des échanges d'un utilisateur
UserSnapshot.getUserExchangeHistory = function(userId, limit = 50) {
  return this.findAll({
    where: {
      userId: userId
    },
    attributes: [
      'id',
      'orderId',
      'name',
      'email',
      'isSender',
      'createdAt'
    ],
    include: [
      {
        model: require('./Order'),
        as: 'Order',
        attributes: ['id', 'status', 'createdAt'],
        include: [
          {
            model: require('./ProductSnapshot'),
            as: 'ProductSnapshots',
            attributes: ['title', 'price', 'isFromProduct']
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: limit
  });
};

// Méthode pour obtenir les statistiques d'un utilisateur
UserSnapshot.getUserStats = function(userId) {
  return this.findAll({
    where: {
      userId: userId
    },
    attributes: [
      'userId',
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalExchanges'],
      [
        sequelize.fn('COUNT', 
          sequelize.literal(`CASE WHEN "is_sender" = true THEN 1 END`)
        ), 
        'sentExchanges'
      ],
      [
        sequelize.fn('COUNT', 
          sequelize.literal(`CASE WHEN "is_sender" = false THEN 1 END`)
        ), 
        'receivedExchanges'
      ]
    ],
    group: ['userId']
  });
};

// Méthode pour rechercher des snapshots par critères
UserSnapshot.searchSnapshots = function(searchQuery, orderId = null) {
  const whereClause = {
    [sequelize.Op.or]: [
      {
        name: {
          [sequelize.Op.iLike]: `%${searchQuery}%`
        }
      },
      {
        email: {
          [sequelize.Op.iLike]: `%${searchQuery}%`
        }
      },
      {
        phone: {
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
        model: require('./Address'),
        as: 'Address'
      },
      {
        model: require('./User'),
        as: 'User',
        attributes: ['id', 'role']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: 100
  });
};

// Méthode pour obtenir les utilisateurs qui demandent le plus d'échanges
UserSnapshot.getMostActiveRequesters = function(limit = 20) {
  return this.findAll({
    where: { 
      isSender: true 
    },
    attributes: [
      'userId',
      'name',
      'email',
      [sequelize.fn('COUNT', sequelize.col('id')), 'demandesInitiees'],
      [sequelize.fn('MAX', sequelize.col('createdAt')), 'derniereActivite']
    ],
    include: [
      {
        model: require('./Order'),
        as: 'Order',
        attributes: [],
        where: {
          status: 'completed'
        },
        required: false
      }
    ],
    group: ['userId', 'name', 'email'],
    order: [[sequelize.literal('demandesInitiees'), 'DESC']],
    limit: limit
  });
};

// Méthode pour obtenir les utilisateurs les plus sollicités
UserSnapshot.getMostSoughtAfterUsers = function(limit = 20) {
  return this.findAll({
    where: { 
      isSender: false 
    },
    attributes: [
      'userId',
      'name', 
      'email',
      [sequelize.fn('COUNT', sequelize.col('id')), 'demandesRecues'],
      [sequelize.fn('MAX', sequelize.col('createdAt')), 'derniereActivite']
    ],
    include: [
      {
        model: require('./Order'),
        as: 'Order',
        attributes: [],
        where: {
          status: 'completed'
        },
        required: false
      }
    ],
    group: ['userId', 'name', 'email'],
    order: [[sequelize.literal('demandesRecues'), 'DESC']],
    limit: limit
  });
};

// Méthode pour analyser les comportements d'échange d'un utilisateur
UserSnapshot.getUserBehaviorAnalysis = function(userId) {
  return this.findAll({
    where: {
      userId: userId
    },
    attributes: [
      'userId',
      [
        sequelize.fn('COUNT', 
          sequelize.literal(`CASE WHEN "is_sender" = true THEN 1 END`)
        ), 
        'demandesInitiees'
      ],
      [
        sequelize.fn('COUNT', 
          sequelize.literal(`CASE WHEN "is_sender" = false THEN 1 END`)
        ), 
        'demandesRecues'
      ],
      [
        sequelize.fn('COUNT', sequelize.col('id')), 
        'totalEchanges'
      ]
    ],
    include: [
      {
        model: require('./Order'),
        as: 'Order',
        attributes: [],
        include: [
          {
            model: require('./ProductSnapshot'),
            as: 'ProductSnapshots',
            attributes: []
          }
        ]
      }
    ],
    group: ['userId']
  }).then(results => {
    if (results.length === 0) return null;
    
    const stats = results[0].dataValues;
    const ratio = stats.demandesRecues > 0 ? 
      (stats.demandesInitiees / stats.demandesRecues).toFixed(2) : 
      'Infini';
    
    return {
      userId: userId,
      demandesInitiees: stats.demandesInitiees,
      demandesRecues: stats.demandesRecues,
      totalEchanges: stats.totalEchanges,
      ratioInitie_Recu: ratio,
      profil: stats.demandesInitiees > stats.demandesRecues ? 
        'Demandeur actif' : 
        stats.demandesRecues > stats.demandesInitiees ? 
          'Très sollicité' : 
          'Équilibré'
    };
  });
};

// Méthode pour obtenir les villes les plus actives
UserSnapshot.getMostActiveCity = function(limit = 15) {
  return this.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('UserSnapshot.id')), 'nombreEchanges']
    ],
    include: [
      {
        model: require('./Address'),
        as: 'Address',
        attributes: ['city', 'sector']
      },
      {
        model: require('./Order'),
        as: 'Order',
        attributes: [],
        where: {
          status: 'completed'
        }
      }
    ],
    group: ['Address.city', 'Address.sector'],
    order: [[sequelize.literal('nombreEchanges'), 'DESC']],
    limit: limit
  });
};

module.exports = UserSnapshot;
