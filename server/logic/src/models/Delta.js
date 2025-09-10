const { DataTypes } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

const Delta = sequelize.define('Delta', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    offer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'offer_id',
        references: {
            model: 'offers',
            key: 'id'
        }
    },
    sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'sender_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    receiver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'receiver_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    conversation_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'conversation_id',
        references: {
            model: 'conversations',
            key: 'id'
        }
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'order_id',
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    is_accepted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_accepted'
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'deltas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['offer_id']
        },
        {
            fields: ['sender_id']
        },
        {
            fields: ['receiver_id']
        },
        {
            fields: ['conversation_id']
        },
        {
            fields: ['order_id']
        },
        {
            fields: ['is_accepted']
        },
        {
            fields: ['created_at']
        }
    ]
});

module.exports = { Delta };
