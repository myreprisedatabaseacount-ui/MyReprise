const { DataTypes } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

const Address = sequelize.define('Address', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 100]
        }
    },
    sector: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            len: [2, 100]
        }
    },
    addressName: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'address_name',
        validate: {
            notEmpty: true,
            len: [5, 500]
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
    tableName: 'addresses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['city']
        },
        {
            fields: ['sector']
        },
        {
            fields: ['city', 'sector']
        }
    ]
});

// ========================================
// MÉTHODES D'INSTANCE
// ========================================

Address.prototype.getFullAddress = function() {
    let fullAddress = this.addressName;
    if (this.sector) {
        fullAddress += `, ${this.sector}`;
    }
    fullAddress += `, ${this.city}`;
    return fullAddress;
};

Address.prototype.getShortAddress = function() {
    return `${this.city}${this.sector ? ` - ${this.sector}` : ''}`;
};

Address.prototype.getPublicData = function() {
    return {
        id: this.id,
        city: this.city,
        sector: this.sector,
        addressName: this.addressName,
        fullAddress: this.getFullAddress(),
        shortAddress: this.getShortAddress()
    };
};

// ========================================
// MÉTHODES STATIQUES
// ========================================

/**
 * Trouve les adresses par ville
 */
Address.findByCity = function(city) {
    return this.findAll({
        where: { city: city },
        order: [['sector', 'ASC'], ['addressName', 'ASC']]
    });
};

/**
 * Trouve les adresses par ville et secteur
 */
Address.findByCityAndSector = function(city, sector) {
    return this.findAll({
        where: { 
            city: city,
            sector: sector 
        },
        order: [['addressName', 'ASC']]
    });
};

/**
 * Trouve les adresses par secteur
 */
Address.findBySector = function(sector) {
    return this.findAll({
        where: { sector: sector },
        order: [['city', 'ASC'], ['addressName', 'ASC']]
    });
};

/**
 * Crée une nouvelle adresse avec validation
 */
Address.createAddress = async function(addressData) {
    // Validation des données
    if (!addressData.city || !addressData.addressName) {
        throw new Error('Ville et nom d\'adresse sont requis');
    }
    
    // Normalisation des données
    addressData.city = addressData.city.trim();
    if (addressData.sector) {
        addressData.sector = addressData.sector.trim();
    }
    addressData.addressName = addressData.addressName.trim();
    
    return await Address.create(addressData);
};

/**
 * Met à jour une adresse avec validation
 */
Address.updateAddress = async function(id, updateData) {
    const address = await Address.findByPk(id);
    if (!address) {
        throw new Error('Adresse non trouvée');
    }
    
    // Normalisation des données
    if (updateData.city) updateData.city = updateData.city.trim();
    if (updateData.sector) updateData.sector = updateData.sector.trim();
    if (updateData.addressName) updateData.addressName = updateData.addressName.trim();
    
    return await address.update(updateData);
};

/**
 * Supprime une adresse
 */
Address.deleteAddress = async function(id) {
    const address = await Address.findByPk(id);
    if (!address) {
        throw new Error('Adresse non trouvée');
    }
    
    return await address.destroy();
};

/**
 * Trouve les adresses avec recherche
 */
Address.searchAddresses = async function(searchTerm, filters = {}) {
    const whereClause = {};
    
    if (searchTerm) {
        whereClause[db.Sequelize.Op.or] = [
            { city: { [db.Sequelize.Op.like]: `%${searchTerm}%` } },
            { sector: { [db.Sequelize.Op.like]: `%${searchTerm}%` } },
            { addressName: { [db.Sequelize.Op.like]: `%${searchTerm}%` } }
        ];
    }
    
    if (filters.city) whereClause.city = filters.city;
    if (filters.sector) whereClause.sector = filters.sector;
    
    return await Address.findAll({
        where: whereClause,
        order: [['city', 'ASC'], ['sector', 'ASC'], ['addressName', 'ASC']]
    });
};

/**
 * Obtient toutes les villes uniques
 */
Address.getUniqueCities = async function() {
    const cities = await Address.findAll({
        attributes: ['city'],
        group: ['city'],
        order: [['city', 'ASC']]
    });
    
    return cities.map(city => city.city);
};

/**
 * Obtient tous les secteurs d'une ville
 */
Address.getSectorsByCity = async function(city) {
    const sectors = await Address.findAll({
        attributes: ['sector'],
        where: { city: city },
        group: ['sector'],
        order: [['sector', 'ASC']]
    });
    
    return sectors.map(sector => sector.sector).filter(sector => sector);
};

/**
 * Trouve les adresses avec pagination
 */
Address.findWithPagination = async function(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (filters.city) whereClause.city = filters.city;
    if (filters.sector) whereClause.sector = filters.sector;
    if (filters.search) {
        whereClause[db.Sequelize.Op.or] = [
            { city: { [db.Sequelize.Op.like]: `%${filters.search}%` } },
            { sector: { [db.Sequelize.Op.like]: `%${filters.search}%` } },
            { addressName: { [db.Sequelize.Op.like]: `%${filters.search}%` } }
        ];
    }
    
    const { count, rows } = await Address.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: offset,
        order: [['city', 'ASC'], ['sector', 'ASC'], ['addressName', 'ASC']]
    });
    
    return {
        addresses: rows,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
    };
};

module.exports = { Address };