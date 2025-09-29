const { DataTypes } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

const Conversation = sequelize.define('Conversation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
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
    type: {
        type: DataTypes.ENUM('chat', 'negotiation'),
        allowNull: false,
        defaultValue: 'chat',
        validate: {
            isIn: [['chat', 'negotiation']]
        }
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
    tableName: 'conversations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['order_id']
        },
        {
            fields: ['type']
        },
        {
            fields: ['created_at']
        }
    ]
});

module.exports = { Conversation };
