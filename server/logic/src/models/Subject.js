const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
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
      len: [0, 1000]
    }
  },
  descriptionFr: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'description_fr',
    validate: {
      len: [0, 1000]
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
  tableName: 'subjects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['name']
    }
  ]
});

// Méthodes d'instance
Subject.prototype.hasImage = function() {
  return !!this.image;
};

Subject.prototype.hasIcon = function() {
  return !!this.icon;
};

Subject.prototype.getName = function(language = 'fr') {
  return language === 'ar' ? this.nameAr : this.nameFr;
};

Subject.prototype.getDescription = function(language = 'fr') {
  return language === 'ar' ? this.descriptionAr : this.descriptionFr;
};

Subject.prototype.getDisplayName = function(language = 'fr') {
  return this.getName(language);
};

Subject.prototype.getLocalizedData = function(language = 'fr') {
  return {
    id: this.id,
    name: this.getName(language),
    description: this.getDescription(language),
    image: this.image,
    icon: this.icon,
    hasImage: this.hasImage(),
    hasIcon: this.hasIcon()
  };
};

// Méthodes statiques
Subject.getAllSubjects = function() {
  return this.findAll({
    order: [['name', 'ASC']]
  });
};

Subject.getSubjectsByCategory = function(categoryId) {
  return this.findAll({
    include: [
      {
        model: require('./SubjectCategory'),
        as: 'SubjectCategories',
        where: {
          categoryId: categoryId
        },
        include: [
          {
            model: require('./Category'),
            as: 'Category'
          }
        ]
      }
    ],
    order: [['name', 'ASC']]
  });
};

Subject.getPopularSubjects = function(limit = 15) {
  return this.findAll({
    attributes: [
      'id',
      'name',
      'description',
      'image',
      'icon',
      [
        sequelize.fn('COUNT', 
          sequelize.col('SubjectCategories->Category->Offers.id')
        ), 
        'offerCount'
      ]
    ],
    include: [
      {
        model: require('./SubjectCategory'),
        as: 'SubjectCategories',
        attributes: [],
        include: [
          {
            model: require('./Category'),
            as: 'Category',
            attributes: [],
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
        ]
      }
    ],
    group: ['Subject.id'],
    order: [[sequelize.literal('offerCount'), 'DESC']],
    limit: limit
  });
};

Subject.searchSubjects = function(query, language = 'fr') {
  const nameField = language === 'ar' ? 'nameAr' : 'nameFr';
  const descField = language === 'ar' ? 'descriptionAr' : 'descriptionFr';
  
  return this.findAll({
    where: {
      [sequelize.Op.or]: [
        {
          [nameField]: {
            [sequelize.Op.iLike]: `%${query}%`
          }
        },
        {
          [descField]: {
            [sequelize.Op.iLike]: `%${query}%`
          }
        }
      ]
    },
    order: [[nameField, 'ASC']],
    limit: 50
  });
};

// Méthode pour obtenir les matières avec leurs catégories associées
Subject.getSubjectsWithCategories = function() {
  return this.findAll({
    include: [
      {
        model: require('./SubjectCategory'),
        as: 'SubjectCategories',
        include: [
          {
            model: require('./Category'),
            as: 'Category',
            attributes: ['id', 'name', 'icon']
          }
        ]
      }
    ],
    order: [['name', 'ASC']]
  });
};

// Méthode pour obtenir les statistiques des matières
Subject.getSubjectsWithStats = function() {
  return this.findAll({
    attributes: [
      'id',
      'name',
      'description',
      'image',
      'icon',
      [
        sequelize.fn('COUNT', 
          sequelize.literal('DISTINCT "SubjectCategories"."category_id"')
        ), 
        'categoryCount'
      ],
      [
        sequelize.fn('COUNT', 
          sequelize.col('SubjectCategories->Category->Offers.id')
        ), 
        'totalOffers'
      ],
      [
        sequelize.fn('COUNT', 
          sequelize.literal(`CASE WHEN "SubjectCategories->Category->Offers"."status" = 'available' THEN 1 END`)
        ), 
        'availableOffers'
      ]
    ],
    include: [
      {
        model: require('./SubjectCategory'),
        as: 'SubjectCategories',
        attributes: [],
        include: [
          {
            model: require('./Category'),
            as: 'Category',
            attributes: [],
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
        ]
      }
    ],
    group: ['Subject.id'],
    order: [['name', 'ASC']]
  });
};

// Méthode pour obtenir les matières par niveau scolaire (basé sur les catégories)
Subject.getSubjectsByLevel = function(levelKeywords = ['primaire', 'collège', 'lycée', 'université']) {
  const results = {};
  
  return Promise.all(
    levelKeywords.map(async (level) => {
      const subjects = await this.findAll({
        include: [
          {
            model: require('./SubjectCategory'),
            as: 'SubjectCategories',
            include: [
              {
                model: require('./Category'),
                as: 'Category',
                where: {
                  name: {
                    [sequelize.Op.iLike]: `%${level}%`
                  }
                }
              }
            ]
          }
        ],
        order: [['name', 'ASC']]
      });
      
      results[level] = subjects;
      return { level, subjects };
    })
  ).then(() => results);
};

module.exports = Subject;
