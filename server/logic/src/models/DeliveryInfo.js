const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DeliveryInfo = sequelize.define('DeliveryInfo', {
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
    companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'company_id',
        references: {
            model: 'delivery_companies',
            key: 'id'
        }
    },
    deliveryStatus: {
        type: DataTypes.ENUM('pending', 'picked_up', 'in_transit', 'out_for_delivery',
            'delivered', 'failed', 'returned', 'cancelled'
        ),
        allowNull: false,
        field: 'delivery_status',
        defaultValue: 'pending'
    },
    deliveryComment: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'delivery_comment'
    },
    deliveryType: {
        type: DataTypes.ENUM('standard', 'express', 'same_day', 'cod', 'fragile'),
        allowNull: false,
        field: 'delivery_type',
        defaultValue: 'standard'
    },
    isFragile: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        field: 'is_fragile',
        defaultValue: false
    },
    orderNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'order_number',
        comment: 'Numéro de suivi de la société de livraison'
    },
    packageCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'package_count',
        defaultValue: 1,
        validate: {
            min: 1
        }
    },
    packageHeight: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        field: 'package_height',
        comment: 'Hauteur en cm'
    },
    packageLength: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        field: 'package_length',
        comment: 'Longueur en cm'
    },
    packageWidth: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        field: 'package_width',
        comment: 'Largeur en cm'
    },
    rangeWeight: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'range_weight'
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Statut spécifique à la société (ex: statuts Cathedis)'
    },
    subject: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Objet/description du colis'
    },
    totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'total_price',
        comment: 'Prix total des produits'
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'total_amount',
        comment: 'Montant total à collecter (COD)'
    },
    totalWeight: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        field: 'total_weight',
        comment: 'Poids total en kg'
    },
    estimatedDelivery: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'estimated_delivery'
    },
    actualDelivery: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'actual_delivery'
    },
    deliveryAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'delivery_address',
        comment: 'Adresse complète de livraison'
    },
    recipientName: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'recipient_name'
    },
    recipientPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'recipient_phone'
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
    tableName: 'delivery_infos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['order_id']
        },
        {
            fields: ['company_id']
        },
        {
            fields: ['delivery_status']
        },
        {
            fields: ['order_number']
        },
        {
            fields: ['delivery_type']
        },
        {
            fields: ['estimated_delivery']
        },
        {
            fields: ['order_id', 'company_id']
        }
    ]
});

// Méthodes d'instance
DeliveryInfo.prototype.isDelivered = function () {
    return this.deliveryStatus === 'delivered';
};

DeliveryInfo.prototype.isPending = function () {
    return this.deliveryStatus === 'pending';
};

DeliveryInfo.prototype.isInTransit = function () {
    return ['picked_up', 'in_transit', 'out_for_delivery'].includes(this.deliveryStatus);
};

DeliveryInfo.prototype.isFailed = function () {
    return ['failed', 'returned', 'cancelled'].includes(this.deliveryStatus);
};

DeliveryInfo.prototype.getStatusLabel = function () {
    const statusLabels = {
        'pending': 'En attente',
        'picked_up': 'Collecté',
        'in_transit': 'En transit',
        'out_for_delivery': 'En cours de livraison',
        'delivered': 'Livré',
        'failed': 'Échec de livraison',
        'returned': 'Retourné',
        'cancelled': 'Annulé'
    };
    return statusLabels[this.deliveryStatus] || this.deliveryStatus;
};

DeliveryInfo.prototype.getTypeLabel = function () {
    const typeLabels = {
        'standard': 'Standard',
        'express': 'Express',
        'same_day': 'Même jour',
        'cod': 'Contre remboursement',
        'fragile': 'Fragile'
    };
    return typeLabels[this.deliveryType] || this.deliveryType;
};

DeliveryInfo.prototype.calculateVolume = function () {
    if (!this.packageHeight || !this.packageLength || !this.packageWidth) {
        return null;
    }
    return (this.packageHeight * this.packageLength * this.packageWidth / 1000000).toFixed(3); // en m³
};

DeliveryInfo.prototype.isOverdue = function () {
    if (!this.estimatedDelivery || this.isDelivered()) {
        return false;
    }
    return new Date() > new Date(this.estimatedDelivery);
};

// Méthodes statiques
DeliveryInfo.getDeliveriesByStatus = function (status, limit = 100) {
    return this.findAll({
        where: {
            deliveryStatus: status
        },
        include: [
            {
                model: require('./Order'),
                as: 'Order',
                attributes: ['orderNumber', 'status']
            },
            {
                model: require('./DeliveryCompany'),
                as: 'Company',
                attributes: ['name', 'logo']
            }
        ],
        order: [['createdAt', 'DESC']],
        limit: limit
    });
};

DeliveryInfo.getDeliveriesByCompany = function (companyId, limit = 100) {
    return this.findAll({
        where: {
            companyId: companyId
        },
        include: [
            {
                model: require('./Order'),
                as: 'Order',
                attributes: ['orderNumber', 'status']
            }
        ],
        order: [['createdAt', 'DESC']],
        limit: limit
    });
};

DeliveryInfo.getOverdueDeliveries = function () {
    return this.findAll({
        where: {
            deliveryStatus: {
                [sequelize.Op.notIn]: ['delivered', 'failed', 'returned', 'cancelled']
            },
            estimatedDelivery: {
                [sequelize.Op.lt]: new Date()
            }
        },
        include: [
            {
                model: require('./Order'),
                as: 'Order'
            },
            {
                model: require('./DeliveryCompany'),
                as: 'Company'
            }
        ],
        order: [['estimatedDelivery', 'ASC']]
    });
};

// Méthode pour créer une livraison à partir d'une commande
DeliveryInfo.createFromOrder = async function (order, companyId, deliveryOptions = {}) {
    try {
        // Récupérer les snapshots pour calculer les dimensions/poids
        const orderWithDetails = await require('./Order').findByPk(order.id, {
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

        const receiver = orderWithDetails.UserSnapshots.find(u => !u.isSender);
        const products = orderWithDetails.ProductSnapshots;

        // Calculer le poids total (estimation basée sur les catégories)
        let estimatedWeight = products.length * 0.5; // 500g par produit par défaut

        // Déterminer la tranche de poids
        let rangeWeight = '0-1kg';
        if (estimatedWeight > 20) rangeWeight = '20kg+';
        else if (estimatedWeight > 10) rangeWeight = '10-20kg';
        else if (estimatedWeight > 5) rangeWeight = '5-10kg';
        else if (estimatedWeight > 3) rangeWeight = '3-5kg';
        else if (estimatedWeight > 1) rangeWeight = '1-3kg';

        // Créer l'information de livraison
        const deliveryInfo = await this.create({
            orderId: order.id,
            companyId: companyId,
            deliveryType: deliveryOptions.deliveryType || 'standard',
            isFragile: deliveryOptions.isFragile || false,
            packageCount: deliveryOptions.packageCount || products.length,
            packageHeight: deliveryOptions.packageHeight || 20,
            packageLength: deliveryOptions.packageLength || 30,
            packageWidth: deliveryOptions.packageWidth || 25,
            rangeWeight: rangeWeight,
            subject: deliveryOptions.subject || `Échange MyReprise - ${products.length} article(s)`,
            totalPrice: order.totalValue,
            totalAmount: deliveryOptions.totalAmount || order.totalValue,
            totalWeight: estimatedWeight,
            deliveryAddress: deliveryOptions.deliveryAddress || `${receiver.name}, ${receiver.Address?.city}`,
            recipientName: receiver.name,
            recipientPhone: receiver.phone,
            estimatedDelivery: deliveryOptions.estimatedDelivery ||
                new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // +3 jours
        });

        return {
            success: true,
            deliveryInfo: deliveryInfo,
            message: 'Information de livraison créée'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

// Méthode pour obtenir les statistiques de livraison
DeliveryInfo.getDeliveryStats = function (period = 30) {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - period);

    return this.findAll({
        attributes: [
            'deliveryStatus',
            'deliveryType',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            [sequelize.fn('AVG', sequelize.col('total_amount')), 'avgAmount'],
            [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalAmount']
        ],
        where: {
            createdAt: {
                [sequelize.Op.gte]: dateLimit
            }
        },
        group: ['deliveryStatus', 'deliveryType'],
        order: [[sequelize.literal('count'), 'DESC']]
    });
};

// Méthode pour mettre à jour le statut de livraison
DeliveryInfo.updateDeliveryStatus = async function (deliveryId, newStatus, comment = null) {
    try {
        const updateData = {
            deliveryStatus: newStatus,
            updatedAt: new Date()
        };

        if (comment) {
            updateData.deliveryComment = comment;
        }

        if (newStatus === 'delivered') {
            updateData.actualDelivery = new Date();
        }

        const [updatedCount] = await this.update(updateData, {
            where: { id: deliveryId }
        });

        return {
            success: updatedCount > 0,
            message: updatedCount > 0 ? 'Statut mis à jour' : 'Livraison introuvable'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = DeliveryInfo;
