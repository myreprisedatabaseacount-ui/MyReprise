const { DataTypes } = require('sequelize');
const db = require('../config/db');
const Neo4jSyncService = require('../services/neo4jSyncService');

const sequelize = db.getSequelize();

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
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
      isUrl: true
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
});

// ========================================
// MÉTHODES D'INSTANCE
// ========================================

Category.prototype.getName = function (language = 'fr') {
  return language === 'ar' ? this.nameAr : this.nameFr;
};

Category.prototype.getDescription = function (language = 'fr') {
  return language === 'ar' ? this.descriptionAr : this.descriptionFr;
};

Category.prototype.getLocalizedData = function (language = 'fr') {
  return {
    id: this.id,
    name: this.getName(language),
    description: this.getDescription(language),
    image: this.image,
    icon: this.icon,
    parentId: this.parentId,
    gender: this.gender,
    ageMin: this.ageMin,
    ageMax: this.ageMax
  };
};

Category.prototype.getFullPath = async function (language = 'fr') {
  const path = [this.getName(language)];
  let current = this;

  while (current.parentId) {
    const parent = await Category.findByPk(current.parentId);
    if (parent) {
      path.unshift(parent.getName(language));
      current = parent;
    } else {
      break;
    }
  }

  return path.join(' > ');
};

// ========================================
// MÉTHODES STATIQUES
// ========================================

/**
 * Trouve toutes les catégories avec leurs sous-catégories
 */
Category.findAllWithChildren = async function (language = 'fr') {
  const categories = await Category.findAll({
    where: { parentId: null },
    include: [{
      model: Category,
      as: 'children',
      required: false
    }]
  });

  return categories.map(cat => cat.getLocalizedData(language));
};

/**
 * Trouve une catégorie par nom
 */
Category.findByName = async function (name, language = 'fr') {
  const field = language === 'ar' ? 'nameAr' : 'nameFr';
  return await Category.findOne({
    where: { [field]: name }
  });
};

/**
 * Trouve les catégories par genre
 */
Category.findByGender = async function (gender, language = 'fr') {
  const categories = await Category.findAll({
    where: { gender: gender }
  });

  return categories.map(cat => cat.getLocalizedData(language));
};

/**
 * Trouve les catégories par tranche d'âge
 */
Category.findByAgeRange = async function (age, language = 'fr') {
  const categories = await Category.findAll({
    where: {
      ageMin: { [db.Sequelize.Op.lte]: age },
      ageMax: { [db.Sequelize.Op.gte]: age }
    }
  });

  return categories.map(cat => cat.getLocalizedData(language));
};

/**
 * Crée une nouvelle catégorie avec validation
 */
Category.createCategory = async function (categoryData) {
  // Validation des données
  if (!categoryData.nameAr || !categoryData.nameFr) {
    throw new Error('Les noms en arabe et français sont requis');
  }

  // Vérification de l'unicité
  const existingAr = await Category.findOne({
    where: {
      nameAr: categoryData.nameAr,
      parentId: categoryData.parentId || null
    }
  });

  if (existingAr) {
    throw new Error('Une catégorie avec ce nom arabe existe déjà');
  }

  const existingFr = await Category.findOne({
    where: {
      nameFr: categoryData.nameFr,
      parentId: categoryData.parentId || null
    }
  });

  if (existingFr) {
    throw new Error('Une catégorie avec ce nom français existe déjà');
  }

  const newCategory = await Category.create(categoryData);

  // Synchroniser vers Neo4j (asynchrone, non bloquant)
  Neo4jSyncService.syncCategory(newCategory, 'CREATE').catch(error => {
    console.error('Erreur synchronisation Neo4j catégorie (non bloquant):', error);
  });

  return newCategory;
};

/**
 * Met à jour une catégorie avec validation
 */
Category.updateCategory = async function (id, updateData) {
  const category = await Category.findByPk(id);
  if (!category) {
    throw new Error('Catégorie non trouvée');
  }

  // Validation des données
  if (updateData.nameAr || updateData.nameFr) {
    const parentId = updateData.parentId !== undefined ? updateData.parentId : category.parentId;

    if (updateData.nameAr) {
      const existingAr = await Category.findOne({
        where: {
          nameAr: updateData.nameAr,
          parentId: parentId,
          id: { [db.Sequelize.Op.ne]: id }
        }
      });

      if (existingAr) {
        throw new Error('Une catégorie avec ce nom arabe existe déjà');
      }
    }

    if (updateData.nameFr) {
      const existingFr = await Category.findOne({
        where: {
          nameFr: updateData.nameFr,
          parentId: parentId,
          id: { [db.Sequelize.Op.ne]: id }
        }
      });

      if (existingFr) {
        throw new Error('Une catégorie avec ce nom français existe déjà');
      }
    }
  }

  const updatedCategory = await category.update(updateData);

  // Synchroniser vers Neo4j (asynchrone, non bloquant)
  Neo4jSyncService.syncCategory(updatedCategory, 'UPDATE').catch(error => {
    console.error('Erreur synchronisation Neo4j catégorie (non bloquant):', error);
  });

  return updatedCategory;
};

/**
 * Supprime une catégorie et ses sous-catégories
 */
Category.deleteCategory = async function (id) {
  const category = await Category.findByPk(id);
  if (!category) {
    throw new Error('Catégorie non trouvée');
  }

  // Trouver et supprimer les sous-catégories
  const children = await Category.findAll({
    where: { parentId: id }
  });

  for (const child of children) {
    await Category.deleteCategory(child.id);
  }

  const result = await category.destroy();

  // Synchroniser vers Neo4j (asynchrone, non bloquant)
  Neo4jSyncService.syncCategory(category, 'DELETE').catch(error => {
    console.error('Erreur synchronisation Neo4j catégorie (non bloquant):', error);
  });

  return result;
};

/**
 * Obtient la hiérarchie complète des catégories
 */
Category.getHierarchy = async function (language = 'fr') {
  const buildHierarchy = async (parentId = null) => {
    const categories = await Category.findAll({
      where: { parentId: parentId },
      order: [['nameFr', 'ASC']]
    });

    const result = [];
    for (const category of categories) {
      const categoryData = category.getLocalizedData(language);
      categoryData.children = await buildHierarchy(category.id);
      result.push(categoryData);
    }

    return result;
  };

  return await buildHierarchy();
};

module.exports = { Category };