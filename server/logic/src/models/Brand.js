const { DataTypes } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

const Brand = sequelize.define('Brand', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    logo: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isUrl: true
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
    tableName: 'brands',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['name_ar']
        },
        {
            unique: true,
            fields: ['name_fr']
        }
    ]
});

// ========================================
// MÉTHODES D'INSTANCE
// ========================================

Brand.prototype.getName = function(language = 'fr') {
    return language === 'ar' ? this.nameAr : this.nameFr;
};

Brand.prototype.getDescription = function(language = 'fr') {
    return language === 'ar' ? this.descriptionAr : this.descriptionFr;
};

Brand.prototype.getLocalizedData = function(language = 'fr') {
    return {
        id: this.id,
        name: this.getName(language),
        description: this.getDescription(language),
        logo: this.logo,
        createdAt: this.createdAt
    };
};

// Note: Les méthodes activate/deactivate ne sont plus nécessaires 
// car isActive n'existe pas dans la base de données

// ========================================
// MÉTHODES STATIQUES
// ========================================

/**
 * Trouve les marques par catégorie
 */
Brand.findByCategory = function(categoryId) {
    return this.findAll({
        include: [{
            model: sequelize.models.Category,
            as: 'categories',
            where: { id: categoryId },
            through: { attributes: [] }
        }],
        order: [['nameFr', 'ASC']]
    });
};

/**
 * Trouve les marques actives (toutes les marques car pas de champ isActive)
 */
Brand.findActiveBrands = function() {
    return this.findAll({
        order: [['nameFr', 'ASC']]
    });
};

/**
 * Trouve une marque par nom
 */
Brand.findByName = function(name, language = 'fr') {
    const field = language === 'ar' ? 'nameAr' : 'nameFr';
    return this.findOne({
        where: { [field]: name }
    });
};

/**
 * Trouve les marques par nom (recherche partielle)
 */
Brand.findByNameLike = function(name, language = 'fr') {
    const field = language === 'ar' ? 'nameAr' : 'nameFr';
    return this.findAll({
        where: { 
            [field]: { [db.Sequelize.Op.like]: `%${name}%` }
        },
        order: [[field, 'ASC']]
    });
};

/**
 * Obtient les marques populaires
 */
Brand.getPopularBrands = async function(limit = 10) {
    try {
        // Vérifier si le modèle Offer existe
        const Offer = sequelize.models.Offer;
        if (!Offer) {
            // Si pas d'offres, retourner les marques actives
            return await this.findActiveBrands();
        }
        
        const totalOffers = await Offer.count();
        
        if (totalOffers < 100) {
            // Stratégie basée sur la diversité des produits
            const Product = sequelize.models.Product;
            if (Product) {
                return await this.findAll({
                    include: [{
                        model: Product,
                        as: 'Products',
                        attributes: []
                    }],
                    group: ['Brand.id'],
                    order: [[sequelize.fn('COUNT', sequelize.col('Products.id')), 'DESC']],
                    limit
                });
            }
        } else {
            // Stratégie basée sur le nombre d'offres
            return await this.findAll({
                include: [{
                    model: Offer,
                    as: 'Offers',
                    attributes: []
                }],
                group: ['Brand.id'],
                order: [[sequelize.fn('COUNT', sequelize.col('Offers.id')), 'DESC']],
                limit
            });
        }
        
        // Fallback: marques actives
        return await this.findActiveBrands();
    } catch (error) {
        console.error('Erreur lors de la récupération des marques populaires:', error);
        return await this.findActiveBrands();
    }
};

/**
 * Crée une nouvelle marque avec validation
 */
Brand.createBrand = async function(brandData) {
    // Validation des données
    if (!brandData.nameAr || !brandData.nameFr) {
        throw new Error('Nom arabe et nom français sont requis');
    }
    
    // Vérification de l'unicité
    const existingAr = await Brand.findByName(brandData.nameAr, 'ar');
    if (existingAr) {
        throw new Error('Une marque avec ce nom arabe existe déjà');
    }
    
    const existingFr = await Brand.findByName(brandData.nameFr, 'fr');
    if (existingFr) {
        throw new Error('Une marque avec ce nom français existe déjà');
    }
    
    // Extraire les catégories des données
    const categoryIds = brandData.categoryIds || [];
    delete brandData.categoryIds;
    
    // Normalisation des données
    brandData.nameAr = brandData.nameAr.trim();
    brandData.nameFr = brandData.nameFr.trim();
    if (brandData.descriptionAr) brandData.descriptionAr = brandData.descriptionAr.trim();
    if (brandData.descriptionFr) brandData.descriptionFr = brandData.descriptionFr.trim();
    
    // Créer la marque
    const brand = await Brand.create(brandData);
    
    // Associer les catégories si fournies
    if (categoryIds.length > 0) {
        await brand.setCategories(categoryIds);
    }
    
    return brand;
};

/**
 * Met à jour une marque avec validation
 */
Brand.updateBrand = async function(id, updateData) {
    const brand = await Brand.findByPk(id);
    if (!brand) {
        throw new Error('Marque non trouvée');
    }
    
    // Extraire les catégories des données
    const categoryIds = updateData.categoryIds;
    if (categoryIds !== undefined) {
        delete updateData.categoryIds;
    }
    
    // Validation des noms si fournis
    if (updateData.nameAr) {
        const existingAr = await Brand.findOne({
            where: { 
                nameAr: updateData.nameAr,
                id: { [db.Sequelize.Op.ne]: id }
            }
        });
        
        if (existingAr) {
            throw new Error('Une marque avec ce nom arabe existe déjà');
        }
        updateData.nameAr = updateData.nameAr.trim();
    }
    
    if (updateData.nameFr) {
        const existingFr = await Brand.findOne({
            where: { 
                nameFr: updateData.nameFr,
                id: { [db.Sequelize.Op.ne]: id }
            }
        });
        
        if (existingFr) {
            throw new Error('Une marque avec ce nom français existe déjà');
        }
        updateData.nameFr = updateData.nameFr.trim();
    }
    
    // Normalisation des autres données
    if (updateData.descriptionAr) updateData.descriptionAr = updateData.descriptionAr.trim();
    if (updateData.descriptionFr) updateData.descriptionFr = updateData.descriptionFr.trim();
    
    // Mettre à jour la marque
    const updatedBrand = await brand.update(updateData);
    
    // Mettre à jour les catégories si fournies
    if (categoryIds !== undefined) {
        await brand.setCategories(categoryIds);
    }
    
    return updatedBrand;
};

/**
 * Supprime une marque
 */
Brand.deleteBrand = async function(id) {
    const brand = await Brand.findByPk(id);
    if (!brand) {
        throw new Error('Marque non trouvée');
    }
    
    return await brand.destroy();
};

/**
 * Active une marque
 */
Brand.activateBrand = async function(id) {
    const brand = await Brand.findByPk(id);
    if (!brand) {
        throw new Error('Marque non trouvée');
    }
    
    return await brand.activate();
};

/**
 * Désactive une marque
 */
Brand.deactivateBrand = async function(id) {
    const brand = await Brand.findByPk(id);
    if (!brand) {
        throw new Error('Marque non trouvée');
    }
    
    return await brand.deactivate();
};

/**
 * Trouve les marques avec recherche
 */
Brand.searchBrands = async function(searchTerm, filters = {}, language = 'fr') {
    const whereClause = {};
    
    if (searchTerm) {
        const nameField = language === 'ar' ? 'nameAr' : 'nameFr';
        const descField = language === 'ar' ? 'descriptionAr' : 'descriptionFr';
        
        whereClause[db.Sequelize.Op.or] = [
            { [nameField]: { [db.Sequelize.Op.like]: `%${searchTerm}%` } },
            { [descField]: { [db.Sequelize.Op.like]: `%${searchTerm}%` } }
        ];
    }
    
    // Note: categoryId filter will be handled in the include clause
    // Note: isActive filter supprimé car le champ n'existe pas dans la base de données
    
    const orderField = language === 'ar' ? 'nameAr' : 'nameFr';
    
    return await Brand.findAll({
        where: whereClause,
        order: [[orderField, 'ASC']]
    });
};

/**
 * Trouve les marques avec pagination
 */
Brand.findWithPagination = async function(page = 1, limit = 10, filters = {}, language = 'fr') {
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    // Note: categoryId filter will be handled in the include clause
    // Note: isActive filter supprimé car le champ n'existe pas dans la base de données
    if (filters.search) {
        const nameField = language === 'ar' ? 'nameAr' : 'nameFr';
        const descField = language === 'ar' ? 'descriptionAr' : 'descriptionFr';
        
        whereClause[db.Sequelize.Op.or] = [
            { [nameField]: { [db.Sequelize.Op.like]: `%${filters.search}%` } },
            { [descField]: { [db.Sequelize.Op.like]: `%${filters.search}%` } }
        ];
    }
    
    const orderField = language === 'ar' ? 'nameAr' : 'nameFr';
    
    const { count, rows } = await Brand.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: offset,
        order: [[orderField, 'ASC']]
    });
    
    return {
        brands: rows,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
    };
};

/**
 * Obtient les statistiques des marques
 */
Brand.getBrandStats = async function() {
    const totalBrands = await Brand.count();
    
    return {
        total: totalBrands,
        active: totalBrands, // Toutes les marques sont considérées comme actives
        inactive: 0, // Pas de champ isActive dans la base de données
        activePercentage: 100 // Toutes les marques sont actives
    };
};

module.exports = { Brand };