const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
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
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    isSender: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'is_sender'
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
    }
  }, {
    tableName: 'user_snapshots',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Méthodes d'analyse
  UserSnapshot.getUserExchangePattern = async function(userId) {
    return await this.findAll({
      where: { userId },
      include: [
        { model: sequelize.models.Order, as: 'Order' }
      ],
      order: [['created_at', 'DESC']]
    });
  };

  return UserSnapshot;
};