const { DataTypes } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

const Notification = sequelize.define('Notification', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		allowNull: false
	},
	user_id: {
		type: DataTypes.INTEGER,
		allowNull: false,
		field: 'user_id',
		references: { model: 'users', key: 'id' }
	},
	title: {
		type: DataTypes.STRING(200),
		allowNull: false
	},
	body: {
		type: DataTypes.STRING(1000),
		allowNull: false
	},
    link: {
		type: DataTypes.STRING(450),
		allowNull: true
	},
    image_url: {
		type: DataTypes.STRING(450),
		allowNull: true
	},
    type: {
		type: DataTypes.ENUM('reprise', 'information', 'paiement'),
		allowNull: false,
		defaultValue: 'information'
	},
	data: {
		type: DataTypes.JSON,
		allowNull: true
	},
	status: {
		type: DataTypes.ENUM('pending', 'sent', 'failed'),
		allowNull: false,
		defaultValue: 'pending'
	},
    is_read: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false
	},
    is_deleted: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false
	},
	provider_message_id: {
		type: DataTypes.STRING(255),
		allowNull: true
	},
	error_message: {
		type: DataTypes.STRING(1000),
		allowNull: true
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
	tableName: 'notifications',
	timestamps: true,
	createdAt: 'created_at',
	updatedAt: 'updated_at',
	indexes: [
		{ fields: ['user_id'] },
		{ fields: ['status'] },
		{ fields: ['created_at'] }
	]
});

module.exports = { Notification };


