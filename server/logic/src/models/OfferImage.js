const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OfferImage = sequelize.define('OfferImage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true
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
      defaultValue: false,
      field: 'is_main'
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'image_url'
    },
    offerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'offer_id',
      references: {
        model: 'offers',
        key: 'id'
      }
    }
  }, {
    tableName: 'offer_images',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return OfferImage;
};