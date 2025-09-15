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
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        validate: {
            min: -90,
            max: 90
        },
        comment: 'Latitude en degrés décimaux (WGS84)'
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        validate: {
            min: -180,
            max: 180
        },
        comment: 'Longitude en degrés décimaux (WGS84)'
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
        },
        {
            fields: ['latitude', 'longitude'],
            name: 'idx_addresses_coordinates'
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

/**
 * Calcule la distance entre cette adresse et une autre (formule de Haversine)
 * @param {Address} otherAddress - L'autre adresse
 * @returns {number} Distance en kilomètres
 */
Address.prototype.getDistanceTo = function(otherAddress) {
    if (!this.latitude || !this.longitude || !otherAddress.latitude || !otherAddress.longitude) {
        return null; // Impossible de calculer sans coordonnées
    }
    
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(otherAddress.latitude - this.latitude);
    const dLon = this.toRadians(otherAddress.longitude - this.longitude);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(this.latitude)) * Math.cos(this.toRadians(otherAddress.latitude)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

/**
 * Convertit les degrés en radians
 * @param {number} degrees - Degrés
 * @returns {number} Radians
 */
Address.prototype.toRadians = function(degrees) {
    return degrees * (Math.PI / 180);
};

Address.prototype.getPublicData = function() {
    return {
        id: this.id,
        city: this.city,
        sector: this.sector,
        addressName: this.addressName,
        latitude: this.latitude,
        longitude: this.longitude,
        fullAddress: this.getFullAddress(),
        shortAddress: this.getShortAddress(),
        coordinates: this.latitude && this.longitude ? {
            lat: parseFloat(this.latitude),
            lng: parseFloat(this.longitude)
        } : null
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

/**
 * Trouve les adresses dans un rayon donné (en km) autour d'un point
 * @param {number} latitude - Latitude du point central
 * @param {number} longitude - Longitude du point central
 * @param {number} radiusKm - Rayon de recherche en kilomètres
 * @returns {Array} Liste des adresses dans le rayon
 */
Address.findNearby = async function(latitude, longitude, radiusKm = 10) {
    // Formule approximative pour convertir km en degrés
    const latDelta = radiusKm / 111; // 1 degré de latitude ≈ 111 km
    const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
    
    return await Address.findAll({
        where: {
            latitude: {
                [db.Sequelize.Op.between]: [latitude - latDelta, latitude + latDelta]
            },
            longitude: {
                [db.Sequelize.Op.between]: [longitude - lngDelta, longitude + lngDelta]
            }
        },
        order: [['city', 'ASC'], ['sector', 'ASC']]
    });
};

/**
 * Trouve l'adresse la plus proche d'un point donné
 * @param {number} latitude - Latitude du point
 * @param {number} longitude - Longitude du point
 * @returns {Address|null} L'adresse la plus proche
 */
Address.findNearest = async function(latitude, longitude) {
    const addresses = await Address.findAll({
        where: {
            latitude: { [db.Sequelize.Op.ne]: null },
            longitude: { [db.Sequelize.Op.ne]: null }
        }
    });
    
    if (addresses.length === 0) return null;
    
    let nearest = addresses[0];
    let minDistance = nearest.getDistanceTo({ latitude, longitude });
    
    for (let i = 1; i < addresses.length; i++) {
        const distance = addresses[i].getDistanceTo({ latitude, longitude });
        if (distance < minDistance) {
            minDistance = distance;
            nearest = addresses[i];
        }
    }
    
    return nearest;
};

module.exports = { Address };