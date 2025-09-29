const { DataTypes } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

const UserDevice = sequelize.define('UserDevice', {
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
	fcm_token: {
		type: DataTypes.STRING(2000),
		allowNull: false,
		unique: true,
		field: 'fcm_token'
	},
	platform: {
		type: DataTypes.ENUM('android', 'ios', 'web'),
		allowNull: false
	},
	device_info: {
		type: DataTypes.JSON,
		allowNull: true
	},
	is_active: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: true,
		field: 'is_active'
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
	tableName: 'user_devices',
	timestamps: true,
	createdAt: 'created_at',
	updatedAt: 'updated_at',
	indexes: [
		{ fields: ['user_id'] },
		{ fields: ['platform'] },
		{ fields: ['is_active'] }
	]
});

module.exports = { UserDevice };


