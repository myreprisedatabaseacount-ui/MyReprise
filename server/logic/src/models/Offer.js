const { DataTypes } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

const Offer = sequelize.define('Offer', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
        allowNull: true,
        validate: {
            len: [0, 2000]
        }
    },
    listingType: {
        type: DataTypes.ENUM('vehicle', 'item', 'property'),
        allowNull: false,
        defaultValue: 'item'
    },
    specificData: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON object with type-specific data (vehicle, property, item)'
    },
    addressId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'address_id',
        references: {
            model: 'addresses',
            key: 'id'
        },
        comment: 'Référence vers l\'adresse de l\'offre'
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
    tableName: 'offers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['product_id']
        },
        {
            fields: ['seller_id']
        },
        {
            fields: ['category_id']
        },
        {
            fields: ['brand_id']
        },
        {
            fields: ['subject_id']
        },
        {
            fields: ['status']
        },
        {
            fields: ['is_deleted']
        },
        {
            fields: ['price']
        },
        {
            fields: ['product_condition']
        },
        {
            fields: ['address_id']
        }
    ]
});

// ========================================
// MÉTHODES D'INSTANCE
// ========================================

Offer.prototype.getPublicData = function() {
    // Parser les données JSON
    let specificData = {};
    
    try {
        specificData = this.specificData ? JSON.parse(this.specificData) : {};
    } catch (error) {
        console.error('Erreur parsing specificData:', error);
        specificData = {};
    }

    return {
        id: this.id,
        productId: this.productId,
        sellerId: this.sellerId,
        categoryId: this.categoryId,
        brandId: this.brandId,
        subjectId: this.subjectId,
        addressId: this.addressId,
        productCondition: this.productCondition,
        price: parseFloat(this.price),
        title: this.title,
        description: this.description,
        status: this.status,
        listingType: this.listingType,
        specificData: specificData,
        createdAt: this.createdAt
    };
};

/**
 * Méthode pour obtenir les données complètes de l'offre avec toutes les relations
 */
Offer.prototype.getCompleteData = async function() {
    const sequelize = db.getSequelize();
    const { Brand } = require('./Brand');
    const { Category } = require('./Category');
    const { User } = require('./User');
    const { Store } = require('./Store');
    const { OfferCategory } = require('./OfferCategory');
    
    // Récupérer les données de base
    const baseData = this.getPublicData();
    
    // Récupérer les données de la marque
    let brandData = null;
    if (this.brandId) {
        const brand = await Brand.findByPk(this.brandId);
        if (brand) {
            brandData = brand.getLocalizedData('fr');
        }
    }
    
    // Récupérer les données de la catégorie
    let categoryData = null;
    if (this.categoryId) {
        const category = await Category.findByPk(this.categoryId);
        if (category) {
            categoryData = category.getLocalizedData('fr');
        }
    }
    
    // Récupérer les données du vendeur
    let sellerData = null;
    if (this.sellerId) {
        const seller = await User.findByPk(this.sellerId);
        if (seller) {
            sellerData = seller.getPublicData();
        }
    }
    
    // Récupérer les données du magasin du vendeur
    let storeData = null;
    if (this.sellerId) {
        const store = await Store.findByUserId(this.sellerId);
        if (store) {
            storeData = store.getPublicData();
        }
    }
    
    // Récupérer les catégories de reprise (OfferCategory)
    let repriseCategories = [];
    try {
        const repriseCategoryRelations = await OfferCategory.getCategoriesByOffer(this.id);
        repriseCategories = repriseCategoryRelations.map(cat => cat.getLocalizedData('fr'));
    } catch (error) {
        console.error('Erreur lors de la récupération des catégories de reprise:', error);
        repriseCategories = [];
    }
    
    // Récupérer les données de l'adresse
    let addressData = null;
    if (this.addressId) {
        const { Address } = require('./Address');
        const address = await Address.findByPk(this.addressId);
        if (address) {
            addressData = address.getPublicData();
        }
    }
    
    return {
        ...baseData,
        brand: brandData,
        category: categoryData,
        seller: sellerData,
        store: storeData,
        repriseCategories: repriseCategories,
        address: addressData
    };
};

Offer.prototype.isAvailable = function() {
    return this.status === 'available' && !this.isDeleted;
};

Offer.prototype.isExchanged = function() {
    return this.status === 'exchanged';
};

Offer.prototype.isArchived = function() {
    return this.status === 'archived';
};

Offer.prototype.archive = async function() {
    return await this.update({ status: 'archived' });
};

Offer.prototype.exchange = async function(replacedByOfferId) {
    return await this.update({ 
        status: 'exchanged',
        replacedByOffer: replacedByOfferId
    });
};

Offer.prototype.restore = async function() {
    return await this.update({ status: 'available' });
};

Offer.prototype.softDelete = async function() {
    return await this.update({ isDeleted: true });
};

Offer.prototype.restoreFromDelete = async function() {
    return await this.update({ isDeleted: false });
};

/**
 * Méthode d'investissement - Analyse de la chaîne d'échanges
 */
Offer.prototype.getInvestment = async function(userId) {
    const investmentSteps = [];
    let currentOffer = this;
    let totalGainLoss = 0;
    let totalInitialValue = parseFloat(currentOffer.price);

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
            roi: 0,
            createdAt: currentOffer.createdAt
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
    const totalROI = totalInitialValue > 0 ? ((netWorth - totalInitialValue) / totalInitialValue) * 100 : 0;

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

// ========================================
// MÉTHODES STATIQUES
// ========================================

/**
 * Trouve les offres par vendeur
 */
Offer.findBySeller = function(sellerId) {
    return this.findAll({
        where: { 
            sellerId: sellerId,
            isDeleted: false
        },
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Trouve les offres disponibles
 */
Offer.findAvailable = function() {
    return this.findAll({
        where: { 
            status: 'available',
            isDeleted: false
        },
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Trouve les offres par catégorie
 */
Offer.findByCategory = function(categoryId) {
    return this.findAll({
        where: { 
            categoryId: categoryId,
            status: 'available',
            isDeleted: false
        },
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Trouve les offres par marque
 */
Offer.findByBrand = function(brandId) {
    return this.findAll({
        where: { 
            brandId: brandId,
            status: 'available',
            isDeleted: false
        },
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Trouve les offres par gamme de prix
 */
Offer.findByPriceRange = function(minPrice, maxPrice) {
    return this.findAll({
        where: { 
            price: {
                [db.Sequelize.Op.between]: [minPrice, maxPrice]
            },
            status: 'available',
            isDeleted: false
        },
        order: [['price', 'ASC']]
    });
};

/**
 * Trouve les offres par condition
 */
Offer.findByCondition = function(condition) {
    return this.findAll({
        where: { 
            productCondition: condition,
            status: 'available',
            isDeleted: false
        },
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Crée une nouvelle offre avec validation
 */
Offer.createOffer = async function(offerData) {
    // Validation des données obligatoires
    if (!offerData.sellerId || !offerData.price || !offerData.title) {
        throw new Error('Vendeur, prix et titre sont requis');
    }
    
    if (offerData.price <= 0) {
        throw new Error('Le prix doit être supérieur à 0');
    }
    
    // Normalisation des données
    offerData.title = offerData.title.trim();
    if (offerData.description) {
        offerData.description = offerData.description.trim();
    }
    
    return await Offer.create(offerData);
};

/**
 * Met à jour une offre avec validation
 */
Offer.updateOffer = async function(id, updateData) {
    const offer = await Offer.findByPk(id);
    if (!offer) {
        throw new Error('Offre non trouvée');
    }
    
    // Validation du prix si fourni
    if (updateData.price !== undefined && updateData.price <= 0) {
        throw new Error('Le prix doit être supérieur à 0');
    }
    
    // Normalisation des données
    if (updateData.title) updateData.title = updateData.title.trim();
    if (updateData.description) updateData.description = updateData.description.trim();
    
    return await offer.update(updateData);
};

/**
 * Supprime une offre (soft delete)
 */
Offer.deleteOffer = async function(id) {
    const offer = await Offer.findByPk(id);
    if (!offer) {
        throw new Error('Offre non trouvée');
    }
    
    return await offer.softDelete();
};

/**
 * Archive une offre
 */
Offer.archiveOffer = async function(id) {
    const offer = await Offer.findByPk(id);
    if (!offer) {
        throw new Error('Offre non trouvée');
    }
    
    return await offer.archive();
};

/**
 * Échange une offre
 */
Offer.exchangeOffer = async function(id, replacedByOfferId) {
    const offer = await Offer.findByPk(id);
    if (!offer) {
        throw new Error('Offre non trouvée');
    }
    
    if (offer.status !== 'available') {
        throw new Error('Seules les offres disponibles peuvent être échangées');
    }
    
    return await offer.exchange(replacedByOfferId);
};

/**
 * Restaure une offre
 */
Offer.restoreOffer = async function(id) {
    const offer = await Offer.findByPk(id);
    if (!offer) {
        throw new Error('Offre non trouvée');
    }
    
    return await offer.restore();
};

/**
 * Trouve les offres avec recherche
 */
Offer.searchOffers = async function(searchTerm, filters = {}) {
    const whereClause = {
        isDeleted: false
    };
    
    if (searchTerm) {
        whereClause[db.Sequelize.Op.or] = [
            { title: { [db.Sequelize.Op.like]: `%${searchTerm}%` } },
            { description: { [db.Sequelize.Op.like]: `%${searchTerm}%` } }
        ];
    }
    
    if (filters.categoryId) whereClause.categoryId = filters.categoryId;
    if (filters.brandId) whereClause.brandId = filters.brandId;
    if (filters.sellerId) whereClause.sellerId = filters.sellerId;
    if (filters.status) whereClause.status = filters.status;
    if (filters.productCondition) whereClause.productCondition = filters.productCondition;
    if (filters.minPrice) whereClause.price = { ...whereClause.price, [db.Sequelize.Op.gte]: filters.minPrice };
    if (filters.maxPrice) whereClause.price = { ...whereClause.price, [db.Sequelize.Op.lte]: filters.maxPrice };
    
    return await Offer.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Trouve les offres avec pagination
 */
Offer.findWithPagination = async function(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    
    const whereClause = {
        isDeleted: false
    };
    
    if (filters.categoryId) whereClause.categoryId = filters.categoryId;
    if (filters.brandId) whereClause.brandId = filters.brandId;
    if (filters.sellerId) whereClause.sellerId = filters.sellerId;
    if (filters.status) whereClause.status = filters.status;
    if (filters.productCondition) whereClause.productCondition = filters.productCondition;
    if (filters.minPrice) whereClause.price = { ...whereClause.price, [db.Sequelize.Op.gte]: filters.minPrice };
    if (filters.maxPrice) whereClause.price = { ...whereClause.price, [db.Sequelize.Op.lte]: filters.maxPrice };
    if (filters.search) {
        whereClause[db.Sequelize.Op.or] = [
            { title: { [db.Sequelize.Op.like]: `%${filters.search}%` } },
            { description: { [db.Sequelize.Op.like]: `%${filters.search}%` } }
        ];
    }
    
    const { count, rows } = await Offer.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: offset,
        order: [['createdAt', 'DESC']]
    });
    
    return {
        offers: rows,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
    };
};

/**
 * Trouve les offres avec leurs adresses associées
 */
Offer.findWithAddresses = async function(filters = {}) {
    const whereClause = {
        isDeleted: false
    };
    
    if (filters.categoryId) whereClause.categoryId = filters.categoryId;
    if (filters.brandId) whereClause.brandId = filters.brandId;
    if (filters.sellerId) whereClause.sellerId = filters.sellerId;
    if (filters.status) whereClause.status = filters.status;
    if (filters.productCondition) whereClause.productCondition = filters.productCondition;
    if (filters.addressId) whereClause.addressId = filters.addressId;
    if (filters.minPrice) whereClause.price = { ...whereClause.price, [db.Sequelize.Op.gte]: filters.minPrice };
    if (filters.maxPrice) whereClause.price = { ...whereClause.price, [db.Sequelize.Op.lte]: filters.maxPrice };
    if (filters.search) {
        whereClause[db.Sequelize.Op.or] = [
            { title: { [db.Sequelize.Op.like]: `%${filters.search}%` } },
            { description: { [db.Sequelize.Op.like]: `%${filters.search}%` } }
        ];
    }
    
    return await Offer.findAll({
        where: whereClause,
        include: [{
            model: db.Address,
            as: 'address',
            required: false // LEFT JOIN pour inclure les offres sans adresse
        }],
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Trouve une offre par ID avec son adresse associée
 */
Offer.findWithAddressById = async function(id) {
    return await Offer.findByPk(id, {
        include: [{
            model: db.Address,
            as: 'address',
            required: false
        }]
    });
};

/**
 * Trouve une offre par ID avec toutes ses relations (brand, category, seller, store, repriseCategories)
 */
Offer.findCompleteById = async function(id) {
    const offer = await Offer.findByPk(id);
    if (!offer) {
        return null;
    }
    
    return await offer.getCompleteData();
};

/**
 * Obtient les statistiques des offres
 */
Offer.getOfferStats = async function() {
    const totalOffers = await Offer.count({ where: { isDeleted: false } });
    const availableOffers = await Offer.count({ where: { status: 'available', isDeleted: false } });
    const exchangedOffers = await Offer.count({ where: { status: 'exchanged', isDeleted: false } });
    const archivedOffers = await Offer.count({ where: { status: 'archived', isDeleted: false } });
    
    return {
        total: totalOffers,
        available: availableOffers,
        exchanged: exchangedOffers,
        archived: archivedOffers,
        availablePercentage: totalOffers > 0 ? Math.round((availableOffers / totalOffers) * 100) : 0
    };
};

module.exports = { Offer };