const { DataTypes, Op } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

  const Subject = sequelize.define('Subject', {
    id: {
      type: DataTypes.INTEGER,
    autoIncrement: true,
      primaryKey: true,
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
});

// ========================================
// MÉTHODES D'INSTANCE
// ========================================

Subject.prototype.getName = function (language = 'fr') {
  return language === 'ar' ? this.nameAr : this.nameFr;
};

Subject.prototype.getDescription = function (language = 'fr') {
  return language === 'ar' ? this.descriptionAr : this.descriptionFr;
};

Subject.prototype.getLocalizedData = function (language = 'fr') {
  return {
    id: this.id,
    name: this.getName(language),
    description: this.getDescription(language),
    image: this.image,
    nameAr: this.nameAr,
    nameFr: this.nameFr,
    descriptionAr: this.descriptionAr,
    descriptionFr: this.descriptionFr,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// ========================================
// MÉTHODES STATIQUES
// ========================================

/**
 * Trouve un sujet par nom
 */
Subject.findByName = async function (name, language = 'fr') {
  const field = language === 'ar' ? 'nameAr' : 'nameFr';
  return await Subject.findOne({
    where: { [field]: name }
  });
};

/**
 * Crée un nouveau sujet avec validation
 */
Subject.createSubject = async function (subjectData) {
  // Validation des données
  if (!subjectData.nameAr || !subjectData.nameFr) {
    throw new Error('Les noms en arabe et français sont requis');
  }

  // Vérification de l'unicité
  const existingAr = await Subject.findOne({
    where: { nameAr: subjectData.nameAr }
  });

  if (existingAr) {
    throw new Error('Un sujet avec ce nom arabe existe déjà');
  }

  const existingFr = await Subject.findOne({
    where: { nameFr: subjectData.nameFr }
  });

  if (existingFr) {
    throw new Error('Un sujet avec ce nom français existe déjà');
  }

  const newSubject = await Subject.create(subjectData);
  return newSubject;
};

/**
 * Met à jour un sujet avec validation
 */
Subject.updateSubject = async function (id, updateData) {
  const subject = await Subject.findByPk(id);
  if (!subject) {
    throw new Error('Sujet non trouvé');
  }

  // Validation des données
  if (updateData.nameAr || updateData.nameFr) {
    if (updateData.nameAr) {
      const existingAr = await Subject.findOne({
        where: {
          nameAr: updateData.nameAr,
          id: { [Op.ne]: id }
        }
      });

      if (existingAr) {
        throw new Error('Un sujet avec ce nom arabe existe déjà');
      }
    }

    if (updateData.nameFr) {
      const existingFr = await Subject.findOne({
        where: {
          nameFr: updateData.nameFr,
          id: { [Op.ne]: id }
        }
      });

      if (existingFr) {
        throw new Error('Un sujet avec ce nom français existe déjà');
      }
    }
  }

  const updatedSubject = await subject.update(updateData);
  return updatedSubject;
};

/**
 * Supprime un sujet
 */
Subject.deleteSubject = async function (id) {
  const subject = await Subject.findByPk(id);
  if (!subject) {
    throw new Error('Sujet non trouvé');
  }

  const result = await subject.destroy();
  return result;
};

// ========================================
// ASSOCIATIONS
// ========================================

// Les associations sont définies dans models/index.js

module.exports = { Subject };