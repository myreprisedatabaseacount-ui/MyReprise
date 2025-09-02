const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Offer = sequelize.define('Offer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'product_id',
      references: {
        model: 'products',
        key: 'id'
      }
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'seller_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'category_id',
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    brandId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'brand_id',
      references: {
        model: 'brands',
        key: 'id'
      }
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'subject_id',
      references: {
        model: 'subjects',
        key: 'id'
      }
    },
    replacedByOffer: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'replaced_by_offer',
      references: {
        model: 'offers',
        key: 'id'
      }
    },
    productCondition: {
      type: DataTypes.ENUM('new', 'like_new', 'good', 'fair'),
      allowNull: false,
      defaultValue: 'good',
      field: 'product_condition'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('available', 'exchanged', 'archived'),
      allowNull: false,
      defaultValue: 'available'
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_deleted'
    }
  }, {
    tableName: 'offers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Méthode d'investissement
  Offer.prototype.getInvestment = async function(userId) {
    const investmentSteps = [];
    let currentOffer = this;
    let totalGainLoss = 0;
    let totalInitialValue = currentOffer.price;

    // Construire la chaîne d'échanges
    while (currentOffer) {
      const step = {
        offerId: currentOffer.id,
        productTitle: currentOffer.title,
        condition: currentOffer.productCondition,
        initialValue: parseFloat(currentOffer.price),
        currentValue: parseFloat(currentOffer.price),
        status: currentOffer.status,
        gainLoss: 0,
        roi: 0
      };

      if (currentOffer.replacedByOffer) {
        const nextOffer = await Offer.findByPk(currentOffer.replacedByOffer);
        if (nextOffer) {
          step.gainLoss = parseFloat(nextOffer.price) - parseFloat(currentOffer.price);
          step.roi = (step.gainLoss / parseFloat(currentOffer.price)) * 100;
          step.exchangedFor = nextOffer.title;
          totalGainLoss += step.gainLoss;
        }
      }

      investmentSteps.push(step);
      currentOffer = currentOffer.replacedByOffer ? await Offer.findByPk(currentOffer.replacedByOffer) : null;
    }

    // Calculer le résumé
    const activeOffers = investmentSteps.filter(step => step.status === 'available').length;
    const exchangedOffers = investmentSteps.filter(step => step.status === 'exchanged').length;
    const totalCurrentValue = investmentSteps.reduce((sum, step) => sum + step.currentValue, 0);
    const netWorth = totalCurrentValue + totalGainLoss;
    const totalROI = ((netWorth - totalInitialValue) / totalInitialValue) * 100;

    return {
      userId,
      investmentSteps,
      summary: {
        totalOffers: investmentSteps.length,
        activeOffers,
        exchangedOffers,
        totalInitialValue,
        totalCurrentValue,
        totalGainLoss,
        netWorth,
        totalROI,
        avgGainPerExchange: exchangedOffers > 0 ? totalGainLoss / exchangedOffers : 0,
        lastActivity: investmentSteps[investmentSteps.length - 1]?.createdAt || new Date()
      },
      insights: [
        {
          type: totalROI > 0 ? 'success' : 'warning',
          message: `ROI de ${totalROI.toFixed(1)}%`,
          icon: totalROI > 0 ? '🏆' : '📊'
        }
      ]
    };
  };

  return Offer;
};