const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
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
      type: DataTypes.ENUM('pending', 'picked_up', 'in_transit', 'delivered', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
      field: 'delivery_status'
    },
    deliveryComment: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'delivery_comment'
    },
    deliveryType: {
      type: DataTypes.ENUM('standard', 'express', 'same_day'),
      allowNull: false,
      defaultValue: 'standard',
      field: 'delivery_type'
    },
    isFragile: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_fragile'
    },
    orderNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'order_number'
    },
    packageCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'package_count'
    },
    packageHeight: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      field: 'package_height'
    },
    packageLength: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      field: 'package_length'
    },
    packageWidth: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      field: 'package_width'
    },
    rangeWeight: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'range_weight'
    },
    status: {
      type: DataTypes.ENUM('created', 'confirmed', 'shipped', 'delivered', 'cancelled'),
      allowNull: false,
      defaultValue: 'created'
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_price'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount'
    },
    totalWeight: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      field: 'total_weight'
    },
    trackingNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'tracking_number'
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
    }
  }, {
    tableName: 'delivery_infos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return DeliveryInfo;
};