const { DataTypes } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

const Store = sequelize.define('Store', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 255]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 1000]
        }
    },
    logo: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            isUrl: true
        }
    },
    banner: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            isUrl: true
        }
    },
    secondaryColor: {
        type: DataTypes.STRING(7),
        allowNull: true,
        validate: {
            is: /^#[0-9A-F]{6}$/i
        },
        defaultValue: '#ffa500' // orange-jaune
    },
    primaryColor: {
        type: DataTypes.STRING(7),
        allowNull: true,
        validate: {
            is: /^#[0-9A-F]{6}$/i
        },
        defaultValue: '#4169e1' // bleu royale
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
    tableName: 'stores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['user_id']
        },
        {
            fields: ['is_active']
        },
        {
            fields: ['name']
        }
    ]
});

// ========================================
// MÉTHODES D'INSTANCE
// ========================================

Store.prototype.getPublicData = function() {
    return {
        id: this.id,
        name: this.name,
        description: this.description,
        // logo et banner peuvent ne pas exister en base selon le schéma actuel
        logo: this.logo || null,
        banner: this.banner || null,
        secondaryColor: this.secondaryColor || null,
        primaryColor: this.primaryColor || null,
        isActive: this.isActive,
        createdAt: this.createdAt
    };
};

Store.prototype.findByUserId = function(userId) {
    return this.findOne({
        where: { userId: userId }
    });
};

Store.prototype.activate = async function() {
    return await this.update({ isActive: true });
};

Store.prototype.deactivate = async function() {
    return await this.update({ isActive: false });
};

Store.prototype.isStoreActive = function() {
    return this.isActive;
};

// ========================================
// MÉTHODES STATIQUES
// ========================================

/**
 * Trouve un magasin par utilisateur
 */
Store.findByUserId = function(userId) {
    return this.findOne({
        where: { userId: userId },
        // Limiter aux colonnes garanties pour éviter les erreurs de colonnes inconnues
        attributes: ['id', 'userId', 'name', 'description', 'isActive', 'createdAt', 'updatedAt']
    });
};

/**
 * Trouve tous les magasins actifs
 */
Store.findActiveStores = function() {
    return this.findAll({
        where: { isActive: true },
        order: [['name', 'ASC']]
    });
};

/**
 * Trouve tous les magasins inactifs
 */
Store.findInactiveStores = function() {
    return this.findAll({
        where: { isActive: false },
        order: [['name', 'ASC']]
    });
};

/**
 * Trouve les magasins par nom
 */
Store.findByName = function(name) {
    return this.findAll({
        where: { 
            name: { [db.Sequelize.Op.like]: `%${name}%` }
        },
        order: [['name', 'ASC']]
    });
};

/**
 * Crée un nouveau magasin avec validation
 */
Store.createStore = async function(storeData) {
    // Validation des données
    if (!storeData.userId || !storeData.name) {
        throw new Error('ID utilisateur et nom du magasin sont requis');
    }
    
    // Vérification de l'unicité de l'utilisateur
    const existingStore = await Store.findByUserId(storeData.userId);
    if (existingStore) {
        throw new Error('Cet utilisateur a déjà un magasin');
    }
    
    // Normalisation des données
    storeData.name = storeData.name.trim();
    if (storeData.description) {
        storeData.description = storeData.description.trim();
    }
    
    return await Store.create(storeData);
};

/**
 * Met à jour un magasin avec validation
 */
Store.updateStore = async function(id, updateData) {
    const store = await Store.findByPk(id);
    if (!store) {
        throw new Error('Magasin non trouvé');
    }
    
    // Normalisation des données
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.description) updateData.description = updateData.description.trim();
    
    return await store.update(updateData);
};

/**
 * Supprime un magasin
 */
Store.deleteStore = async function(id) {
    const store = await Store.findByPk(id);
    if (!store) {
        throw new Error('Magasin non trouvé');
    }
    
    return await store.destroy();
};

/**
 * Active un magasin
 */
Store.activateStore = async function(id) {
    const store = await Store.findByPk(id);
    if (!store) {
        throw new Error('Magasin non trouvé');
    }
    
    return await store.activate();
};

/**
 * Désactive un magasin
 */
Store.deactivateStore = async function(id) {
    const store = await Store.findByPk(id);
    if (!store) {
        throw new Error('Magasin non trouvé');
    }
    
    return await store.deactivate();
};

/**
 * Trouve les magasins avec recherche
 */
Store.searchStores = async function(searchTerm, filters = {}) {
    const whereClause = {};
    
    if (searchTerm) {
        whereClause[db.Sequelize.Op.or] = [
            { name: { [db.Sequelize.Op.like]: `%${searchTerm}%` } },
            { description: { [db.Sequelize.Op.like]: `%${searchTerm}%` } }
        ];
    }
    
    if (filters.isActive !== undefined) whereClause.isActive = filters.isActive;
    
    return await Store.findAll({
        where: whereClause,
        order: [['name', 'ASC']]
    });
};

/**
 * Trouve les magasins avec pagination
 */
Store.findWithPagination = async function(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (filters.isActive !== undefined) whereClause.isActive = filters.isActive;
    if (filters.search) {
        whereClause[db.Sequelize.Op.or] = [
            { name: { [db.Sequelize.Op.like]: `%${filters.search}%` } },
            { description: { [db.Sequelize.Op.like]: `%${filters.search}%` } }
        ];
    }
    
    const { count, rows } = await Store.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: offset,
        order: [['name', 'ASC']]
    });
    
    return {
        stores: rows,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
    };
};

/**
 * Obtient les statistiques des magasins
 */
Store.getStoreStats = async function() {
    const totalStores = await Store.count();
    const activeStores = await Store.count({ where: { isActive: true } });
    const inactiveStores = await Store.count({ where: { isActive: false } });
    
    return {
        total: totalStores,
        active: activeStores,
        inactive: inactiveStores,
        activePercentage: totalStores > 0 ? Math.round((activeStores / totalStores) * 100) : 0
    };
};

module.exports = { Store };