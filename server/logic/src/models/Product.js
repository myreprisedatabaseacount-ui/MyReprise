const { DataTypes } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'created_by',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    nameAr: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'name_ar',
        validate: {
            notEmpty: true,
            len: [2, 255]
        }
    },
    nameFr: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'name_fr',
        validate: {
            notEmpty: true,
            len: [2, 255]
        }
    },
    descriptionAr: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'description_ar',
        validate: {
            len: [0, 2000]
        }
    },
    descriptionFr: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'description_fr',
        validate: {
            len: [0, 2000]
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
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['created_by']
        },
        {
            fields: ['brand_id']
        },
        {
            fields: ['category_id']
        },
        {
            fields: ['is_active']
        },
        {
            fields: ['name_ar']
        },
        {
            fields: ['name_fr']
        }
    ]
});

// ========================================
// MÉTHODES D'INSTANCE
// ========================================

Product.prototype.getName = function(language = 'fr') {
    return language === 'ar' ? this.nameAr : this.nameFr;
};

Product.prototype.getDescription = function(language = 'fr') {
    return language === 'ar' ? this.descriptionAr : this.descriptionFr;
};

Product.prototype.getLocalizedData = function(language = 'fr') {
    return {
        id: this.id,
        name: this.getName(language),
        description: this.getDescription(language),
        brandId: this.brandId,
        categoryId: this.categoryId,
        isActive: this.isActive,
        createdBy: this.createdBy,
        createdAt: this.createdAt
    };
};

Product.prototype.activate = async function() {
    return await this.update({ isActive: true });
};

Product.prototype.deactivate = async function() {
    return await this.update({ isActive: false });
};

Product.prototype.isProductActive = function() {
    return this.isActive;
};

// ========================================
// MÉTHODES STATIQUES
// ========================================

/**
 * Trouve les produits par créateur
 */
Product.findByCreator = function(createdBy) {
    return this.findAll({
        where: { createdBy: createdBy },
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Trouve les produits actifs
 */
Product.findActiveProducts = function() {
    return this.findAll({
        where: { isActive: true },
        order: [['nameFr', 'ASC']]
    });
};

/**
 * Trouve les produits par marque
 */
Product.findByBrand = function(brandId) {
    return this.findAll({
        where: { brandId: brandId },
        order: [['nameFr', 'ASC']]
    });
};

/**
 * Trouve les produits par catégorie
 */
Product.findByCategory = function(categoryId) {
    return this.findAll({
        where: { categoryId: categoryId },
        order: [['nameFr', 'ASC']]
    });
};

/**
 * Trouve les produits par nom
 */
Product.findByName = function(name, language = 'fr') {
    const field = language === 'ar' ? 'nameAr' : 'nameFr';
    return this.findAll({
        where: { 
            [field]: { [db.Sequelize.Op.like]: `%${name}%` }
        },
        order: [[field, 'ASC']]
    });
};

/**
 * Crée un nouveau produit avec validation
 */
Product.createProduct = async function(productData) {
    // Validation des données
    if (!productData.createdBy || !productData.nameAr || !productData.nameFr) {
        throw new Error('Créateur, nom arabe et nom français sont requis');
    }
    
    // Normalisation des données
    productData.nameAr = productData.nameAr.trim();
    productData.nameFr = productData.nameFr.trim();
    if (productData.descriptionAr) productData.descriptionAr = productData.descriptionAr.trim();
    if (productData.descriptionFr) productData.descriptionFr = productData.descriptionFr.trim();
    
    return await Product.create(productData);
};

/**
 * Met à jour un produit avec validation
 */
Product.updateProduct = async function(id, updateData) {
    const product = await Product.findByPk(id);
    if (!product) {
        throw new Error('Produit non trouvé');
    }
    
    // Normalisation des données
    if (updateData.nameAr) updateData.nameAr = updateData.nameAr.trim();
    if (updateData.nameFr) updateData.nameFr = updateData.nameFr.trim();
    if (updateData.descriptionAr) updateData.descriptionAr = updateData.descriptionAr.trim();
    if (updateData.descriptionFr) updateData.descriptionFr = updateData.descriptionFr.trim();
    
    return await product.update(updateData);
};

/**
 * Supprime un produit
 */
Product.deleteProduct = async function(id) {
    const product = await Product.findByPk(id);
    if (!product) {
        throw new Error('Produit non trouvé');
    }
    
    return await product.destroy();
};

/**
 * Active un produit
 */
Product.activateProduct = async function(id) {
    const product = await Product.findByPk(id);
    if (!product) {
        throw new Error('Produit non trouvé');
    }
    
    return await product.activate();
};

/**
 * Désactive un produit
 */
Product.deactivateProduct = async function(id) {
    const product = await Product.findByPk(id);
    if (!product) {
        throw new Error('Produit non trouvé');
    }
    
    return await product.deactivate();
};

/**
 * Trouve les produits avec recherche
 */
Product.searchProducts = async function(searchTerm, filters = {}, language = 'fr') {
    const whereClause = {};
    
    if (searchTerm) {
        const nameField = language === 'ar' ? 'nameAr' : 'nameFr';
        const descField = language === 'ar' ? 'descriptionAr' : 'descriptionFr';
        
        whereClause[db.Sequelize.Op.or] = [
            { [nameField]: { [db.Sequelize.Op.like]: `%${searchTerm}%` } },
            { [descField]: { [db.Sequelize.Op.like]: `%${searchTerm}%` } }
        ];
    }
    
    if (filters.brandId) whereClause.brandId = filters.brandId;
    if (filters.categoryId) whereClause.categoryId = filters.categoryId;
    if (filters.createdBy) whereClause.createdBy = filters.createdBy;
    if (filters.isActive !== undefined) whereClause.isActive = filters.isActive;
    
    const orderField = language === 'ar' ? 'nameAr' : 'nameFr';
    
    return await Product.findAll({
        where: whereClause,
        order: [[orderField, 'ASC']]
    });
};

/**
 * Trouve les produits avec pagination
 */
Product.findWithPagination = async function(page = 1, limit = 10, filters = {}, language = 'fr') {
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (filters.brandId) whereClause.brandId = filters.brandId;
    if (filters.categoryId) whereClause.categoryId = filters.categoryId;
    if (filters.createdBy) whereClause.createdBy = filters.createdBy;
    if (filters.isActive !== undefined) whereClause.isActive = filters.isActive;
    if (filters.search) {
        const nameField = language === 'ar' ? 'nameAr' : 'nameFr';
        const descField = language === 'ar' ? 'descriptionAr' : 'descriptionFr';
        
        whereClause[db.Sequelize.Op.or] = [
            { [nameField]: { [db.Sequelize.Op.like]: `%${filters.search}%` } },
            { [descField]: { [db.Sequelize.Op.like]: `%${filters.search}%` } }
        ];
    }
    
    const orderField = language === 'ar' ? 'nameAr' : 'nameFr';
    
    const { count, rows } = await Product.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: offset,
        order: [[orderField, 'ASC']]
    });
    
    return {
        products: rows,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
    };
};

/**
 * Obtient les statistiques des produits
 */
Product.getProductStats = async function() {
    const totalProducts = await Product.count();
    const activeProducts = await Product.count({ where: { isActive: true } });
    const inactiveProducts = await Product.count({ where: { isActive: false } });
    
    return {
        total: totalProducts,
        active: activeProducts,
        inactive: inactiveProducts,
        activePercentage: totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 0
    };
};

module.exports = { Product };