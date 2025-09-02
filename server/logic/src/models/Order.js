const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    balanceAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'balance_amount',
      comment: 'Différence de prix entre les deux produits échangés'
    },
    balancePayerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'balance_payer_id',
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Utilisateur qui doit payer la différence (si balance_amount > 0)'
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Méthodes d'analyse pour les échanges
  Order.getExchangeStats = async function(period = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    return await this.findAll({
      where: {
        createdAt: { [sequelize.Sequelize.Op.gte]: startDate }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('AVG', sequelize.col('balance_amount')), 'avgBalanceAmount'],
        [sequelize.fn('SUM', sequelize.col('balance_amount')), 'totalBalanceAmount']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
    });
  };

  // Méthode pour analyser les patterns d'échange
  Order.getExchangePatterns = async function() {
    return await this.findAll({
      include: [
        { 
          model: sequelize.models.UserSnapshot, 
          as: 'UserSnapshots',
          separate: true 
        },
        { 
          model: sequelize.models.ProductSnapshot, 
          as: 'ProductSnapshots',
          separate: true 
        }
      ],
      order: [['created_at', 'DESC']]
    });
  };

  return Order;
};