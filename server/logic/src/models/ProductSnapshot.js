const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductSnapshot = sequelize.define('ProductSnapshot', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    productCondition: {
      type: DataTypes.ENUM('new', 'like_new', 'good', 'fair'),
      allowNull: false,
      field: 'product_condition'
    },
    replacedByProductId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'replaced_by_product_id',
      references: {
        model: 'product_snapshots',
        key: 'id'
      }
    },
    isFromProduct: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'is_from_product'
    },
    offerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'offer_id',
      references: {
        model: 'offers',
        key: 'id'
      }
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'order_id',
      references: {
        model: 'orders',
        key: 'id'
      }
    }
  }, {
    tableName: 'product_snapshots',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Méthodes d'analyse
  ProductSnapshot.getPopularProducts = async function(limit = 10) {
    return await this.findAll({
      attributes: [
        'title',
        [sequelize.fn('COUNT', sequelize.col('id')), 'exchangeCount'],
        [sequelize.fn('AVG', sequelize.col('price')), 'avgPrice']
      ],
      group: ['title'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit
    });
  };

  ProductSnapshot.getValueTrends = async function(period = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    return await this.findAll({
      where: {
        createdAt: { [sequelize.Sequelize.Op.gte]: startDate }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('AVG', sequelize.col('price')), 'avgPrice'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'volume']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
    });
  };

  return ProductSnapshot;
};