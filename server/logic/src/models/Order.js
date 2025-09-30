const { DataTypes } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    balanceAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'balance_amount',
        comment: 'Différence de prix entre les deux produits échangés',
        validate: {
            min: 0
        }
    },
    balanceSenderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'balance_sender_id',
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'Utilisateur qui a initié l\'envoi de la commande'
    },
    balancePayerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'balance_payer_id',
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'Utilisateur qui doit payer la différence (si balance_amount > 0)'
    },
    status: {
        type: DataTypes.ENUM('pending', 'cancelled', 'negotiation', 'accepted'),
        allowNull: false,
        defaultValue: 'pending'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 1000]
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
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['balance_payer_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['created_at']
        }
    ]
});

// ========================================
// MÉTHODES D'INSTANCE
// ========================================

Order.prototype.getPublicData = function() {
    return {
        id: this.id,
        balanceAmount: parseFloat(this.balanceAmount),
        balancePayerId: this.balancePayerId,
        balanceSenderId: this.balanceSenderId,
        status: this.status,
        notes: this.notes,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

Order.prototype.isPending = function() {
    return this.status === 'pending';
};

Order.prototype.isCompleted = function() {
    return this.status === 'completed';
};

Order.prototype.isCancelled = function() {
    return this.status === 'cancelled';
};

Order.prototype.isRefunded = function() {
    return this.status === 'refunded';
};

Order.prototype.complete = async function() {
    return await this.update({ status: 'completed' });
};

Order.prototype.cancel = async function() {
    return await this.update({ status: 'cancelled' });
};

Order.prototype.refund = async function() {
    return await this.update({ status: 'refunded' });
};

Order.prototype.hasBalance = function() {
    return parseFloat(this.balanceAmount) > 0;
};

Order.prototype.getBalanceInfo = function() {
    return {
        hasBalance: this.hasBalance(),
        amount: parseFloat(this.balanceAmount),
        payerId: this.balancePayerId,
        needsPayment: this.hasBalance() && this.balancePayerId
    };
};

// ========================================
// MÉTHODES STATIQUES
// ========================================

/**
 * Trouve les commandes par statut
 */
Order.findByStatus = function(status) {
    return this.findAll({
        where: { status: status },
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Trouve les commandes par payeur de balance
 */
Order.findByBalancePayer = function(payerId) {
    return this.findAll({
        where: { balancePayerId: payerId },
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Trouve les commandes avec balance
 */
Order.findWithBalance = function() {
    return this.findAll({
        where: { 
            balanceAmount: { [db.Sequelize.Op.gt]: 0 }
        },
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Trouve les commandes sans balance
 */
Order.findWithoutBalance = function() {
    return this.findAll({
        where: { 
            balanceAmount: 0
        },
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Crée une nouvelle commande avec validation
 */
Order.createOrder = async function(orderData) {
    // Validation des données
    if (orderData.balanceAmount === undefined || orderData.balanceAmount < 0) {
        throw new Error('Le montant de balance doit être défini et positif');
    }
    
    // Normalisation des données
    if (orderData.notes) {
        orderData.notes = orderData.notes.trim();
    }
    
    return await Order.create(orderData);
};

/**
 * Met à jour une commande avec validation
 */
Order.updateOrder = async function(id, updateData) {
    const order = await Order.findByPk(id);
    if (!order) {
        throw new Error('Commande non trouvée');
    }
    
    // Validation du montant de balance si fourni
    if (updateData.balanceAmount !== undefined && updateData.balanceAmount < 0) {
        throw new Error('Le montant de balance doit être positif');
    }
    
    // Normalisation des données
    if (updateData.notes) {
        updateData.notes = updateData.notes.trim();
    }
    
    return await order.update(updateData);
};

/**
 * Supprime une commande
 */
Order.deleteOrder = async function(id) {
    const order = await Order.findByPk(id);
    if (!order) {
        throw new Error('Commande non trouvée');
    }
    
    return await order.destroy();
};

/**
 * Complète une commande
 */
Order.completeOrder = async function(id) {
    const order = await Order.findByPk(id);
    if (!order) {
        throw new Error('Commande non trouvée');
    }
    
    if (order.status !== 'pending') {
        throw new Error('Seules les commandes en attente peuvent être complétées');
    }
    
    return await order.complete();
};

/**
 * Annule une commande
 */
Order.cancelOrder = async function(id) {
    const order = await Order.findByPk(id);
    if (!order) {
        throw new Error('Commande non trouvée');
    }
    
    if (order.status === 'completed') {
        throw new Error('Les commandes complétées ne peuvent pas être annulées');
    }
    
    return await order.cancel();
};

/**
 * Rembourse une commande
 */
Order.refundOrder = async function(id) {
    const order = await Order.findByPk(id);
    if (!order) {
        throw new Error('Commande non trouvée');
    }
    
    if (order.status !== 'completed') {
        throw new Error('Seules les commandes complétées peuvent être remboursées');
    }
    
    return await order.refund();
};

/**
 * Trouve les commandes avec recherche
 */
Order.searchOrders = async function(searchTerm, filters = {}) {
    const whereClause = {};
    
    if (searchTerm) {
        whereClause[db.Sequelize.Op.or] = [
            { notes: { [db.Sequelize.Op.like]: `%${searchTerm}%` } }
        ];
    }
    
    if (filters.status) whereClause.status = filters.status;
    if (filters.balancePayerId) whereClause.balancePayerId = filters.balancePayerId;
    if (filters.hasBalance !== undefined) {
        if (filters.hasBalance) {
            whereClause.balanceAmount = { [db.Sequelize.Op.gt]: 0 };
        } else {
            whereClause.balanceAmount = 0;
        }
    }
    
    return await Order.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Trouve les commandes avec pagination
 */
Order.findWithPagination = async function(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (filters.status) whereClause.status = filters.status;
    if (filters.balancePayerId) whereClause.balancePayerId = filters.balancePayerId;
    if (filters.hasBalance !== undefined) {
        if (filters.hasBalance) {
            whereClause.balanceAmount = { [db.Sequelize.Op.gt]: 0 };
        } else {
            whereClause.balanceAmount = 0;
        }
    }
    if (filters.search) {
        whereClause[db.Sequelize.Op.or] = [
            { notes: { [db.Sequelize.Op.like]: `%${filters.search}%` } }
        ];
    }
    
    const { count, rows } = await Order.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: offset,
        order: [['createdAt', 'DESC']]
    });
    
    return {
        orders: rows,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
    };
};

/**
 * Obtient les statistiques des échanges
 */
Order.getExchangeStats = async function(period = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const stats = await Order.findAll({
        where: {
            createdAt: { [db.Sequelize.Op.gte]: startDate }
        },
        attributes: [
            [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalOrders'],
            [db.Sequelize.fn('AVG', db.Sequelize.col('balance_amount')), 'avgBalanceAmount'],
            [db.Sequelize.fn('SUM', db.Sequelize.col('balance_amount')), 'totalBalanceAmount'],
            [db.Sequelize.fn('MAX', db.Sequelize.col('balance_amount')), 'maxBalanceAmount'],
            [db.Sequelize.fn('MIN', db.Sequelize.col('balance_amount')), 'minBalanceAmount']
        ],
        group: [db.Sequelize.fn('DATE', db.Sequelize.col('created_at'))],
        order: [[db.Sequelize.fn('DATE', db.Sequelize.col('created_at')), 'ASC']]
    });

    return stats;
};

/**
 * Analyse les patterns d'échange
 */
Order.getExchangePatterns = async function() {
    try {
        return await Order.findAll({
            include: [
                { 
                    model: sequelize.models.UserSnapshot, 
                    as: 'UserSnapshots',
                    separate: true 
                },
                { 
                    model: sequelize.models.ProductSnapshot, 
                    as: 'ProductSnapshots',
                    separate: true 
                }
            ],
            order: [['created_at', 'DESC']]
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des patterns d\'échange:', error);
        return await Order.findAll({
            order: [['created_at', 'DESC']]
        });
    }
};

/**
 * Obtient les statistiques générales des commandes
 */
Order.getOrderStats = async function() {
    const totalOrders = await Order.count();
    const pendingOrders = await Order.count({ where: { status: 'pending' } });
    const completedOrders = await Order.count({ where: { status: 'completed' } });
    const cancelledOrders = await Order.count({ where: { status: 'cancelled' } });
    const refundedOrders = await Order.count({ where: { status: 'refunded' } });
    const ordersWithBalance = await Order.count({ where: { balanceAmount: { [db.Sequelize.Op.gt]: 0 } } });
    
    const totalBalanceAmount = await Order.sum('balanceAmount', {
        where: { balanceAmount: { [db.Sequelize.Op.gt]: 0 } }
    });
    
    return {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
        refunded: refundedOrders,
        withBalance: ordersWithBalance,
        withoutBalance: totalOrders - ordersWithBalance,
        totalBalanceAmount: totalBalanceAmount || 0,
        completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
    };
};

module.exports = { Order };