const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OfferImage = sequelize.define('OfferImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  color: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [2, 50]
    }
  },
  colorHex: {
    type: DataTypes.STRING(7),
    allowNull: true,
    field: 'color_hex',
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  isMain: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'is_main',
    defaultValue: false
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'image_url',
    validate: {
      notEmpty: true,
      isUrl: true
    }
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
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'offer_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['offer_id']
    },
    {
      fields: ['is_main']
    },
    {
      fields: ['offer_id', 'is_main']
    },
    {
      fields: ['color']
    }
  ]
});

// Méthodes d'instance
OfferImage.prototype.isMainImage = function() {
  return this.isMain === true;
};

OfferImage.prototype.hasColor = function() {
  return !!(this.color || this.colorHex);
};

OfferImage.prototype.getColorInfo = function() {
  return {
    name: this.color,
    hex: this.colorHex,
    hasColor: this.hasColor()
  };
};

// Méthodes statiques
OfferImage.getImagesForOffer = function(offerId) {
  return this.findAll({
    where: {
      offerId: offerId
    },
    order: [
      ['isMain', 'DESC'],
      ['createdAt', 'ASC']
    ]
  });
};

OfferImage.getMainImageForOffer = function(offerId) {
  return this.findOne({
    where: {
      offerId: offerId,
      isMain: true
    }
  });
};

OfferImage.getImagesByColor = function(offerId, color) {
  const whereClause = {
    offerId: offerId
  };

  if (color) {
    whereClause[sequelize.Op.or] = [
      { color: { [sequelize.Op.iLike]: `%${color}%` } },
      { colorHex: color }
    ];
  }

  return this.findAll({
    where: whereClause,
    order: [['isMain', 'DESC'], ['createdAt', 'ASC']]
  });
};

OfferImage.setMainImage = async function(imageId, offerId) {
  const transaction = await sequelize.transaction();
  
  try {
    // Retirer le statut principal de toutes les images de cette offre
    await this.update(
      { isMain: false },
      { 
        where: { offerId: offerId },
        transaction 
      }
    );

    // Définir la nouvelle image principale
    await this.update(
      { isMain: true },
      { 
        where: { 
          id: imageId,
          offerId: offerId 
        },
        transaction 
      }
    );

    await transaction.commit();
    
    return {
      success: true,
      message: 'Image principale mise à jour'
    };
  } catch (error) {
    await transaction.rollback();
    return {
      success: false,
      error: error.message
    };
  }
};

OfferImage.addImageToOffer = async function(offerId, imageData) {
  try {
    // Si c'est la première image, la définir comme principale
    const existingImages = await this.count({
      where: { offerId: offerId }
    });

    const imageRecord = await this.create({
      offerId: offerId,
      imageUrl: imageData.imageUrl,
      color: imageData.color || null,
      colorHex: imageData.colorHex || null,
      isMain: existingImages === 0 ? true : (imageData.isMain || false)
    });

    // Si cette image est définie comme principale, 
    // retirer le statut des autres
    if (imageRecord.isMain && existingImages > 0) {
      await this.update(
        { isMain: false },
        { 
          where: { 
            offerId: offerId,
            id: { [sequelize.Op.ne]: imageRecord.id }
          }
        }
      );
    }

    return {
      success: true,
      image: imageRecord,
      message: 'Image ajoutée avec succès'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

OfferImage.removeImageFromOffer = async function(imageId, offerId) {
  try {
    const image = await this.findOne({
      where: {
        id: imageId,
        offerId: offerId
      }
    });

    if (!image) {
      return {
        success: false,
        message: 'Image introuvable'
      };
    }

    const wasMain = image.isMain;
    await image.destroy();

    // Si l'image supprimée était principale, 
    // définir une autre image comme principale
    if (wasMain) {
      const nextImage = await this.findOne({
        where: { offerId: offerId },
        order: [['createdAt', 'ASC']]
      });

      if (nextImage) {
        await nextImage.update({ isMain: true });
      }
    }

    return {
      success: true,
      message: 'Image supprimée avec succès'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Méthode pour obtenir les couleurs populaires
OfferImage.getPopularColors = function(limit = 20) {
  return this.findAll({
    attributes: [
      'color',
      'colorHex',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where: {
      color: {
        [sequelize.Op.ne]: null
      }
    },
    group: ['color', 'colorHex'],
    order: [[sequelize.literal('count'), 'DESC']],
    limit: limit
  });
};

// Méthode pour obtenir les images avec leurs statistiques
OfferImage.getImagesWithStats = function() {
  return this.findAll({
    attributes: [
      'id',
      'color',
      'colorHex',
      'isMain',
      'imageUrl',
      'offerId'
    ],
    include: [
      {
        model: require('./Offer'),
        as: 'Offer',
        attributes: ['title', 'status', 'price'],
        include: [
          {
            model: require('./Category'),
            as: 'Category',
            attributes: ['name']
          }
        ]
      }
    ],
    order: [['isMain', 'DESC'], ['createdAt', 'DESC']]
  });
};

module.exports = OfferImage;
