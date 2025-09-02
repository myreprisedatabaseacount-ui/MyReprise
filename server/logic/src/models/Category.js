const { DataTypes } = require('sequelize');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'parent_id',
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  nameAr: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'name_ar',
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  nameFr: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'name_fr',
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  descriptionAr: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'description_ar',
    validate: {
      len: [0, 500]
    }
  },
  descriptionFr: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'description_fr',
    validate: {
      len: [0, 500]
    }
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  icon: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [1, 100]
    }
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'mixte'),
    allowNull: true,
    defaultValue: 'mixte'
  },
  ageMin: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'age_min',
    validate: {
      min: 0,
      max: 120
    }
  },
  ageMax: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'age_max',
    validate: {
      min: 0,
      max: 120
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
  tableName: 'categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['parent_id']
    },
    {
      fields: ['name']
    },
    {
      unique: true,
      fields: ['name', 'parent_id']
    }
  ]
});

// Méthodes d'instance
Category.prototype.getName = function(language = 'fr') {
  return language === 'ar' ? this.nameAr : this.nameFr;
};

Category.prototype.getDescription = function(language = 'fr') {
  return language === 'ar' ? this.descriptionAr : this.descriptionFr;
};

Category.prototype.getLocalizedData = function(language = 'fr') {
  return {
    id: this.id,
    name: this.getName(language),
    description: this.getDescription(language),
    image: this.image,
    icon: this.icon,
    parentId: this.parentId
  };
};

Category.prototype.getFullPath = async function(language = 'fr') {
  const path = [this.getName(language)];
  let current = this;
  
  while (current.parentId) {
    const parent = await Category.findByPk(current.parentId);
    if (parent) {
      path.unshift(parent.getName(language));
      current = parent;
    } else {
      // Stratégie basée sur le nombre d'offres
      return await this.findAll({
        include: [{
          model: sequelize.models.Offer,
          as: 'Offers',
          attributes: []
        }],
        group: ['Category.id'],
        order: [[sequelize.fn('COUNT', sequelize.col('Offers.id')), 'DESC']],
        limit
      });
    }
  };

  return Category;
};