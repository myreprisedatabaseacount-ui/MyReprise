const { DataTypes } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

// Définir les associations
const defineAssociations = () => {
  const { Offer } = require('./Offer');
  const { Category } = require('./Category');
  
  // Association avec Offer
  OfferCategory.belongsTo(Offer, {
    foreignKey: 'offerId',
    as: 'offer'
  });
  
  // Association avec Category
  OfferCategory.belongsTo(Category, {
    foreignKey: 'categoryId',
    as: 'category'
  });
};

const OfferCategory = sequelize.define('OfferCategory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
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
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'category_id',
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
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
  tableName: 'offer_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['offer_id']
    },
    {
      fields: ['category_id']
    },
    {
      fields: ['is_active']
    },
    {
      unique: true,
      fields: ['offer_id', 'category_id']
    }
  ]
});

// ========================================
// MÉTHODES D'INSTANCE
// ========================================

OfferCategory.prototype.activate = async function() {
  return await this.update({ isActive: true });
};

OfferCategory.prototype.deactivate = async function() {
  return await this.update({ isActive: false });
};

// ========================================
// MÉTHODES STATIQUES
// ========================================

/**
 * Ajouter une catégorie à une offre
 */
OfferCategory.addCategoryToOffer = async function(offerId, categoryId) {
  // Vérifier si la relation existe déjà
  const existingRelation = await OfferCategory.findOne({
    where: { 
      offerId: offerId, 
      categoryId: categoryId 
    }
  });

  if (existingRelation) {
    // Si elle existe mais est inactive, la réactiver
    if (!existingRelation.isActive) {
      return await existingRelation.activate();
    }
    // Si elle existe et est active, retourner la relation existante
    return existingRelation;
  }

  // Créer une nouvelle relation
  return await OfferCategory.create({
    offerId: offerId,
    categoryId: categoryId,
    isActive: true
  });
};

/**
 * Supprimer une catégorie d'une offre
 */
OfferCategory.removeCategoryFromOffer = async function(offerId, categoryId) {
  const relation = await OfferCategory.findOne({
    where: { 
      offerId: offerId, 
      categoryId: categoryId 
    }
  });

  if (!relation) {
    throw new Error('Relation offre-catégorie non trouvée');
  }

  // Désactiver au lieu de supprimer (soft delete)
  return await relation.deactivate();
};

/**
 * Récupérer toutes les catégories d'une offre
 */
OfferCategory.getCategoriesByOffer = async function(offerId) {
  const relations = await OfferCategory.findAll({
    where: { 
      offerId: offerId,
      isActive: true 
    },
    include: [{
      model: db.getSequelize().models.Category,
      as: 'category',
      required: true
    }]
  });

  return relations.map(relation => relation.category);
};

/**
 * Récupérer toutes les offres d'une catégorie
 */
OfferCategory.getOffersByCategory = async function(categoryId) {
  const relations = await OfferCategory.findAll({
    where: { 
      categoryId: categoryId,
      isActive: true 
    },
    include: [{
      model: db.getSequelize().models.Offer,
      as: 'offer',
      required: true
    }]
  });

  return relations.map(relation => relation.offer);
};

/**
 * Vérifier si une relation existe
 */
OfferCategory.relationExists = async function(offerId, categoryId) {
  const relation = await OfferCategory.findOne({
    where: { 
      offerId: offerId, 
      categoryId: categoryId,
      isActive: true 
    }
  });

  return !!relation;
};

/**
 * Supprimer toutes les catégories d'une offre
 */
OfferCategory.deleteByOfferId = async function(offerId) {
  return await OfferCategory.destroy({
    where: { offerId: offerId }
  });
};

/**
 * Récupérer les statistiques des relations
 */
OfferCategory.getRelationStats = async function() {
  const totalRelations = await OfferCategory.count({
    where: { isActive: true }
  });

  const uniqueOffers = await OfferCategory.count({
    distinct: true,
    col: 'offer_id',
    where: { isActive: true }
  });

  const uniqueCategories = await OfferCategory.count({
    distinct: true,
    col: 'category_id',
    where: { isActive: true }
  });

  return {
    totalRelations,
    uniqueOffers,
    uniqueCategories
  };
};

// Initialiser les associations
defineAssociations();

module.exports = { OfferCategory };
