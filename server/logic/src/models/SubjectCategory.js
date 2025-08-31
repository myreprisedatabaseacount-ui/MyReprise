const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubjectCategory = sequelize.define('SubjectCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'subject_id',
    references: {
      model: 'subjects',
      key: 'id'
    }
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'category_id',
    references: {
      model: 'categories',
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
  tableName: 'subject_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['subject_id']
    },
    {
      fields: ['category_id']
    },
    {
      unique: true,
      fields: ['subject_id', 'category_id']
    }
  ]
});

// Méthodes statiques
SubjectCategory.addSubjectToCategory = async function(subjectId, categoryId) {
  try {
    const [association, created] = await this.findOrCreate({
      where: {
        subjectId: subjectId,
        categoryId: categoryId
      },
      defaults: {
        subjectId: subjectId,
        categoryId: categoryId
      }
    });
    
    return {
      success: true,
      association: association,
      created: created,
      message: created ? 'Association créée' : 'Association existante'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

SubjectCategory.removeSubjectFromCategory = async function(subjectId, categoryId) {
  try {
    const deleted = await this.destroy({
      where: {
        subjectId: subjectId,
        categoryId: categoryId
      }
    });
    
    return {
      success: true,
      deleted: deleted > 0,
      message: deleted > 0 ? 'Association supprimée' : 'Association introuvable'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

SubjectCategory.getCategoriesForSubject = function(subjectId) {
  return this.findAll({
    where: {
      subjectId: subjectId
    },
    include: [
      {
        model: require('./Category'),
        as: 'Category',
        attributes: ['id', 'name', 'description', 'icon', 'image']
      }
    ],
    order: [['Category', 'name', 'ASC']]
  });
};

SubjectCategory.getSubjectsForCategory = function(categoryId) {
  return this.findAll({
    where: {
      categoryId: categoryId
    },
    include: [
      {
        model: require('./Subject'),
        as: 'Subject',
        attributes: ['id', 'name', 'description', 'icon', 'image']
      }
    ],
    order: [['Subject', 'name', 'ASC']]
  });
};

SubjectCategory.getPopularAssociations = function(limit = 20) {
  return this.findAll({
    attributes: [
      'id',
      'subjectId',
      'categoryId',
      [
        sequelize.fn('COUNT', sequelize.col('Category->Offers.id')), 
        'offerCount'
      ]
    ],
    include: [
      {
        model: require('./Subject'),
        as: 'Subject',
        attributes: ['name', 'icon']
      },
      {
        model: require('./Category'),
        as: 'Category',
        attributes: ['name', 'icon'],
        include: [
          {
            model: require('./Offer'),
            as: 'Offers',
            attributes: [],
            where: {
              status: 'available',
              isDeleted: false
            },
            required: false
          }
        ]
      }
    ],
    group: ['SubjectCategory.id', 'Subject.id', 'Category.id'],
    order: [[sequelize.literal('offerCount'), 'DESC']],
    limit: limit
  });
};

// Méthode pour obtenir les associations avec statistiques détaillées
SubjectCategory.getAssociationsWithStats = function() {
  return this.findAll({
    attributes: [
      'id',
      'subjectId',
      'categoryId',
      [
        sequelize.fn('COUNT', sequelize.col('Category->Offers.id')), 
        'totalOffers'
      ],
      [
        sequelize.fn('COUNT', 
          sequelize.literal(`CASE WHEN "Category->Offers"."status" = 'available' THEN 1 END`)
        ), 
        'availableOffers'
      ],
      [
        sequelize.fn('AVG', sequelize.col('Category->Offers.price')), 
        'averagePrice'
      ],
      [
        sequelize.fn('MIN', sequelize.col('Category->Offers.price')), 
        'minPrice'
      ],
      [
        sequelize.fn('MAX', sequelize.col('Category->Offers.price')), 
        'maxPrice'
      ]
    ],
    include: [
      {
        model: require('./Subject'),
        as: 'Subject',
        attributes: ['name', 'icon', 'image']
      },
      {
        model: require('./Category'),
        as: 'Category',
        attributes: ['name', 'icon', 'image'],
        include: [
          {
            model: require('./Offer'),
            as: 'Offers',
            attributes: [],
            where: {
              isDeleted: false
            },
            required: false
          }
        ]
      }
    ],
    group: ['SubjectCategory.id', 'Subject.id', 'Category.id'],
    having: sequelize.literal('COUNT("Category->Offers"."id") > 0'),
    order: [['Subject', 'name', 'ASC'], ['Category', 'name', 'ASC']]
  });
};

// Méthode pour la recherche croisée matière-catégorie
SubjectCategory.searchAssociations = function(query) {
  return this.findAll({
    include: [
      {
        model: require('./Subject'),
        as: 'Subject',
        where: {
          [sequelize.Op.or]: [
            {
              name: {
                [sequelize.Op.iLike]: `%${query}%`
              }
            },
            {
              description: {
                [sequelize.Op.iLike]: `%${query}%`
              }
            }
          ]
        }
      },
      {
        model: require('./Category'),
        as: 'Category',
        attributes: ['id', 'name', 'icon', 'image']
      }
    ],
    order: [['Subject', 'name', 'ASC']]
  });
};

module.exports = SubjectCategory;
