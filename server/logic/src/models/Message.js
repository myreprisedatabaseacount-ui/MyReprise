const { DataTypes } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

const Message = sequelize.define('Message', {
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
    sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'sender_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 5000] // Limite de 5000 caractères
        }
    },
    audio_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'audio_url',
        validate: {
            isUrl: true
        }
    },
    reply_to_message_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'reply_to_message_id',
        references: {
            model: 'messages',
            key: 'id'
        }
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_deleted'
    },
    is_edited: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_edited'
    },
    offer_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'offer_id',
        references: {
            model: 'offers',
            key: 'id'
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
    tableName: 'messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['conversation_id']
        },
        {
            fields: ['sender_id']
        },
        {
            fields: ['reply_to_message_id']
        },
        {
            fields: ['offer_id']
        },
        {
            fields: ['created_at']
        },
        {
            fields: ['is_deleted']
        }
    ]
});

module.exports = { Message };
