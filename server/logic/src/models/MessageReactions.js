const { DataTypes } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

const MessageReactions = sequelize.define('MessageReactions', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    message_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'message_id',
        references: {
            model: 'messages',
            key: 'id'
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    reaction_type: {
        type: DataTypes.ENUM('like', 'love', 'laugh', 'wow', 'sad', 'angry', 'thumbs_up', 'thumbs_down'),
        allowNull: false,
        field: 'reaction_type'
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
    }
}, {
    tableName: 'message_reactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['message_id']
        },
        {
            fields: ['user_id']
        },
        {
            fields: ['reaction_type']
        },
        {
            unique: true,
            fields: ['message_id', 'user_id', 'reaction_type']
        }
    ]
});

module.exports = { MessageReactions };
