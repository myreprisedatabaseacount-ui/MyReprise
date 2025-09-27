const { DataTypes } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

const OfferBrand = sequelize.define('OfferBrand', {
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    brandId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'brand_id',
        references: {
            model: 'brands',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
    tableName: 'offer_brands',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['offer_id', 'brand_id']
        },
        {
            fields: ['offer_id']
        },
        {
            fields: ['brand_id']
        }
    ]
});

// ========================================
// MÉTHODES D'INSTANCE
// ========================================

OfferBrand.prototype.getOfferBrandData = function() {
    return {
        id: this.id,
        offerId: this.offerId,
        brandId: this.brandId,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

// ========================================
// MÉTHODES STATIQUES
// ========================================

/**
 * Trouve les relations par offre
 */
OfferBrand.findByOffer = function(offerId) {
    return this.findAll({
        where: { offerId },
        include: [{
            model: sequelize.models.Brand,
            as: 'brand',
            attributes: ['id', 'nameFr', 'nameAr', 'logo', 'descriptionFr', 'descriptionAr']
        }],
        order: [['createdAt', 'ASC']]
    });
};

/**
 * Trouve les relations par marque
 */
OfferBrand.findByBrand = function(brandId) {
    return this.findAll({
        where: { brandId },
        include: [{
            model: sequelize.models.Offer,
            as: 'offer',
            attributes: ['id', 'title', 'description', 'price', 'status', 'productCondition']
        }],
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Crée une relation offer-brand
 */
OfferBrand.createOfferBrand = async function(offerId, brandId) {
    // Vérifier si la relation existe déjà
    const existingRelation = await this.findOne({
        where: { offerId, brandId }
    });
    
    if (existingRelation) {
        throw new Error('Cette relation offre-marque existe déjà');
    }
    
    // Vérifier que l'offre existe
    const Offer = sequelize.models.Offer;
    const offer = await Offer.findByPk(offerId);
    if (!offer) {
        throw new Error('Offre non trouvée');
    }
    
    // Vérifier que la marque existe
    const Brand = sequelize.models.Brand;
    const brand = await Brand.findByPk(brandId);
    if (!brand) {
        throw new Error('Marque non trouvée');
    }
    
    // Créer la relation
    return await this.create({ offerId, brandId });
};

/**
 * Crée plusieurs relations offer-brand
 */
OfferBrand.createMultipleOfferBrands = async function(offerId, brandIds) {
    if (!Array.isArray(brandIds) || brandIds.length === 0) {
        return [];
    }
    
    // Vérifier que l'offre existe
    const Offer = sequelize.models.Offer;
    const offer = await Offer.findByPk(offerId);
    if (!offer) {
        throw new Error('Offre non trouvée');
    }
    
    // Vérifier que toutes les marques existent
    const Brand = sequelize.models.Brand;
    const brands = await Brand.findAll({
        where: { id: brandIds }
    });
    
    if (brands.length !== brandIds.length) {
        throw new Error('Une ou plusieurs marques n\'existent pas');
    }
    
    // Vérifier les relations existantes
    const existingRelations = await this.findAll({
        where: { 
            offerId,
            brandId: brandIds
        }
    });
    
    const existingBrandIds = existingRelations.map(rel => rel.brandId);
    const newBrandIds = brandIds.filter(id => !existingBrandIds.includes(id));
    
    if (newBrandIds.length === 0) {
        return existingRelations;
    }
    
    // Créer les nouvelles relations
    const relations = await Promise.all(
        newBrandIds.map(brandId => this.create({ offerId, brandId }))
    );
    
    return [...existingRelations, ...relations];
};

/**
 * Supprime une relation offer-brand
 */
OfferBrand.deleteOfferBrand = async function(offerId, brandId) {
    const relation = await this.findOne({
        where: { offerId, brandId }
    });
    
    if (!relation) {
        throw new Error('Relation offre-marque non trouvée');
    }
    
    return await relation.destroy();
};

/**
 * Supprime toutes les relations d'une offre
 */
OfferBrand.deleteByOffer = async function(offerId) {
    return await this.destroy({
        where: { offerId }
    });
};

/**
 * Supprime toutes les relations d'une marque
 */
OfferBrand.deleteByBrand = async function(brandId) {
    return await this.destroy({
        where: { brandId }
    });
};

/**
 * Met à jour les relations d'une offre (remplace toutes les relations existantes)
 */
OfferBrand.updateOfferBrands = async function(offerId, brandIds) {
    // Supprimer toutes les relations existantes
    await this.deleteByOffer(offerId);
    
    // Créer les nouvelles relations si des marques sont fournies
    if (brandIds && brandIds.length > 0) {
        return await this.createMultipleOfferBrands(offerId, brandIds);
    }
    
    return [];
};

/**
 * Trouve les offres par marques (pour les recommandations)
 */
OfferBrand.findOffersByBrands = async function(brandIds, limit = 10) {
    if (!Array.isArray(brandIds) || brandIds.length === 0) {
        return [];
    }
    
    return await this.findAll({
        where: { brandId: brandIds },
        include: [{
            model: sequelize.models.Offer,
            as: 'offer',
            attributes: ['id', 'title', 'description', 'price', 'status', 'productCondition', 'createdAt']
        }],
        order: [['createdAt', 'DESC']],
        limit
    });
};

/**
 * Trouve les marques populaires basées sur les offres
 */
OfferBrand.getPopularBrands = async function(limit = 10) {
    return await this.findAll({
        attributes: [
            'brandId',
            [sequelize.fn('COUNT', sequelize.col('OfferBrand.brandId')), 'offerCount']
        ],
        include: [{
            model: sequelize.models.Brand,
            as: 'brand',
            attributes: ['id', 'nameFr', 'nameAr', 'logo']
        }],
        group: ['brandId', 'brand.id'],
        order: [[sequelize.fn('COUNT', sequelize.col('OfferBrand.brandId')), 'DESC']],
        limit
    });
};

/**
 * Obtient les statistiques des relations offer-brand
 */
OfferBrand.getStats = async function() {
    const totalRelations = await this.count();
    
    const uniqueOffers = await this.count({
        distinct: true,
        col: 'offerId'
    });
    
    const uniqueBrands = await this.count({
        distinct: true,
        col: 'brandId'
    });
    
    return {
        totalRelations,
        uniqueOffers,
        uniqueBrands,
        averageBrandsPerOffer: uniqueOffers > 0 ? (totalRelations / uniqueOffers).toFixed(2) : 0,
        averageOffersPerBrand: uniqueBrands > 0 ? (totalRelations / uniqueBrands).toFixed(2) : 0
    };
};

module.exports = { OfferBrand };
