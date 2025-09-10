const { DataTypes } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

const ConversationParticipants = sequelize.define('ConversationParticipants', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
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
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    joined_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'joined_at'
    },
    left_at: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'left_at'
    },
    blocked_conversation: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'blocked_conversation'
    },
    role: {
        type: DataTypes.ENUM('admin', 'membre'),
        allowNull: false,
        defaultValue: 'membre',
        validate: {
            isIn: [['admin', 'membre']]
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
    tableName: 'conversation_participants',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['conversation_id']
        },
        {
            fields: ['user_id']
        },
        {
            fields: ['role']
        },
        {
            fields: ['blocked_conversation']
        },
        {
            fields: ['joined_at']
        },
        {
            unique: true,
            fields: ['conversation_id', 'user_id']
        }
    ]
});

module.exports = { ConversationParticipants };
