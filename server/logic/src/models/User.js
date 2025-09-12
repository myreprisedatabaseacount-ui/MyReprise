const { DataTypes } = require('sequelize');
const db = require('../config/db');

const sequelize = db.getSequelize();

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'first_name',
        validate: {
            notEmpty: true,
            len: [2, 100]
        }
    },
    lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'last_name',
        validate: {
            notEmpty: true,
            len: [2, 100]
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
        validate: {
            len: [10, 20]
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: true, // Optionnel car Google/Facebook n'en ont pas besoin
        validate: {
            len: [8, 255]
        }
    },
    // Nouveaux champs pour l'authentification multi-provider
    authProvider: {
        type: DataTypes.ENUM('phone', 'google', 'facebook'),
        allowNull: false,
        field: 'auth_provider'
    },
    primaryIdentifier: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        field: 'primary_identifier',
        comment: 'Phone pour phone, Email pour google, Facebook ID pour facebook'
    },
    // Champs pour les providers externes
    googleId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        field: 'google_id'
    },
    facebookId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        field: 'facebook_id'
    },
    // Champs optionnels pour Facebook (peuvent être phone ou email)
    facebookPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'facebook_phone'
    },
    facebookEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'facebook_email'
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_verified'
    },
    role: {
        type: DataTypes.ENUM('user', 'admin', 'moderator'),
        defaultValue: 'user'
    },
    profileImage: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'profile_image',
        validate: {
            isUrl: true
        }
    },
    addressId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'address_id'
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
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['primary_identifier']
        },
        {
            unique: true,
            fields: ['phone']
        },
        {
            unique: true,
            fields: ['email']
        },
        {
            unique: true,
            fields: ['google_id']
        },
        {
            unique: true,
            fields: ['facebook_id']
        },
        {
            fields: ['auth_provider']
        },
        {
            fields: ['role']
        },
        {
            fields: ['is_verified']
        }
    ]
});

// ========================================
// MÉTHODES D'INSTANCE
// ========================================

User.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
};

User.prototype.getPublicData = function() {
    return {
        id: this.id,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        phone: this.phone,
        profileImage: this.profileImage,
        isVerified: this.isVerified,
        role: this.role,
        createdAt: this.createdAt
    };
};

User.prototype.isAdmin = function() {
    return this.role === 'admin';
};

User.prototype.isModerator = function() {
    return this.role === 'moderator' || this.role === 'admin';
};

// ========================================
// MÉTHODES STATIQUES
// ========================================

/**
 * Trouve un utilisateur par email
 */
User.findByEmail = function(email) {
    return this.findOne({
        where: { email: email.toLowerCase() }
    });
};

/**
 * Trouve un utilisateur par numéro de téléphone
 */
User.findByPhone = function(phone) {
    return this.findOne({
        where: { phone: phone }
    });
};

/**
 * Trouve un utilisateur par identifiant principal
 */
User.findByPrimaryIdentifier = function(identifier) {
    return this.findOne({
        where: { primaryIdentifier: identifier }
    });
};

/**
 * Trouve un utilisateur par Google ID
 */
User.findByGoogleId = function(googleId) {
    return this.findOne({
        where: { googleId: googleId }
    });
};

/**
 * Trouve un utilisateur par Facebook ID
 */
User.findByFacebookId = function(facebookId) {
    return this.findOne({
        where: { facebookId: facebookId }
    });
};

/**
 * Trouve un utilisateur par provider et identifiant
 */
User.findByProvider = function(provider, identifier) {
    const whereClause = { authProvider: provider };
    
    switch (provider) {
        case 'phone':
            whereClause.phone = identifier;
            break;
        case 'google':
            whereClause.email = identifier;
            break;
        case 'facebook':
            whereClause.facebookId = identifier;
            break;
        default:
            throw new Error('Provider non supporté');
    }
    
    return this.findOne({ where: whereClause });
};

/**
 * Trouve tous les utilisateurs vérifiés
 */
User.findVerifiedUsers = function() {
    return this.findAll({
        where: { isVerified: true }
    });
};

/**
 * Trouve les utilisateurs par rôle
 */
User.findByRole = function(role) {
    return this.findAll({
        where: { role: role }
    });
};

/**
 * Crée un nouvel utilisateur avec validation multi-provider
 */
User.createUser = async function(userData) {
    const { authProvider } = userData;
    
    // Validation des données de base
    if (!userData.firstName || !userData.lastName || !authProvider) {
        throw new Error('Prénom, nom et provider d\'authentification sont requis');
    }
    
    // Validation selon le provider
    switch (authProvider) {
        case 'phone':
            if (!userData.phone) {
                throw new Error('Numéro de téléphone requis pour l\'authentification par téléphone');
            }
            userData.primaryIdentifier = userData.phone;
            
            // Vérification de l'unicité du téléphone
            const existingUserByPhone = await User.findByPhone(userData.phone);
            if (existingUserByPhone) {
                throw new Error('Un utilisateur avec ce numéro de téléphone existe déjà');
            }
            break;
            
        case 'google':
            if (!userData.email || !userData.googleId) {
                throw new Error('Email et Google ID requis pour l\'authentification Google');
            }
            userData.primaryIdentifier = userData.email.toLowerCase();
            userData.email = userData.email.toLowerCase();
            
            // Vérification de l'unicité de l'email et Google ID
            const existingUserByEmail = await User.findByEmail(userData.email);
            if (existingUserByEmail) {
                throw new Error('Un utilisateur avec cet email existe déjà');
            }
            const existingUserByGoogleId = await User.findByGoogleId(userData.googleId);
            if (existingUserByGoogleId) {
                throw new Error('Un utilisateur avec ce Google ID existe déjà');
            }
            break;
            
        case 'facebook':
            if (!userData.facebookId) {
                throw new Error('Facebook ID requis pour l\'authentification Facebook');
            }
            userData.primaryIdentifier = userData.facebookId;
            
            // Vérification de l'unicité du Facebook ID
            const existingUserByFacebookId = await User.findByFacebookId(userData.facebookId);
            if (existingUserByFacebookId) {
                throw new Error('Un utilisateur avec ce Facebook ID existe déjà');
            }
            
            // Vérification de l'unicité de l'email Facebook si fourni
            if (userData.facebookEmail) {
                const existingUserByFacebookEmail = await User.findByEmail(userData.facebookEmail);
                if (existingUserByFacebookEmail) {
                    throw new Error('Un utilisateur avec cet email Facebook existe déjà');
                }
                userData.facebookEmail = userData.facebookEmail.toLowerCase();
            }
            
            // Vérification de l'unicité du téléphone Facebook si fourni
            if (userData.facebookPhone) {
                const existingUserByFacebookPhone = await User.findByPhone(userData.facebookPhone);
                if (existingUserByFacebookPhone) {
                    throw new Error('Un utilisateur avec ce téléphone Facebook existe déjà');
                }
            }
            break;
            
        default:
            throw new Error('Provider d\'authentification non supporté');
    }
    
    // Vérification de l'unicité de l'identifiant principal
    const existingUserByPrimaryId = await User.findByPrimaryIdentifier(userData.primaryIdentifier);
    if (existingUserByPrimaryId) {
        throw new Error('Un utilisateur avec cet identifiant principal existe déjà');
    }
    
    return await User.create(userData);
};

/**
 * Met à jour un utilisateur avec validation
 */
User.updateUser = async function(id, updateData) {
    const user = await User.findByPk(id);
    if (!user) {
        throw new Error('Utilisateur non trouvé');
    }
    
    // Validation du téléphone si fourni
    if (updateData.phone) {
        const existingUserByPhone = await User.findOne({
            where: { 
                phone: updateData.phone,
                id: { [db.Sequelize.Op.ne]: id }
            }
        });
        
        if (existingUserByPhone) {
            throw new Error('Un utilisateur avec ce numéro de téléphone existe déjà');
        }
    }
    
    // Validation de l'email si fourni
    if (updateData.email) {
        const existingUserByEmail = await User.findOne({
            where: { 
                email: updateData.email.toLowerCase(),
                id: { [db.Sequelize.Op.ne]: id }
            }
        });
        
        if (existingUserByEmail) {
            throw new Error('Un utilisateur avec cet email existe déjà');
        }
        
        updateData.email = updateData.email.toLowerCase();
    }
    
    return await user.update(updateData);
};

/**
 * Supprime un utilisateur
 */
User.deleteUser = async function(id) {
    const user = await User.findByPk(id);
    if (!user) {
        throw new Error('Utilisateur non trouvé');
    }
    
    return await user.destroy();
};

/**
 * Vérifie un utilisateur
 */
User.verifyUser = async function(id) {
    const user = await User.findByPk(id);
    if (!user) {
        throw new Error('Utilisateur non trouvé');
    }
    
    return await user.update({ isVerified: true });
};

/**
 * Change le rôle d'un utilisateur
 */
User.changeRole = async function(id, newRole) {
    const validRoles = ['user', 'admin', 'moderator'];
    if (!validRoles.includes(newRole)) {
        throw new Error('Rôle invalide');
    }
    
    const user = await User.findByPk(id);
    if (!user) {
        throw new Error('Utilisateur non trouvé');
    }
    
    return await user.update({ role: newRole });
};

/**
 * Trouve les utilisateurs avec pagination
 */
User.findWithPagination = async function(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (filters.role) whereClause.role = filters.role;
    if (filters.isVerified !== undefined) whereClause.isVerified = filters.isVerified;
    if (filters.search) {
        whereClause[db.Sequelize.Op.or] = [
            { firstName: { [db.Sequelize.Op.like]: `%${filters.search}%` } },
            { lastName: { [db.Sequelize.Op.like]: `%${filters.search}%` } },
            { phone: { [db.Sequelize.Op.like]: `%${filters.search}%` } },
            { email: { [db.Sequelize.Op.like]: `%${filters.search}%` } }
        ];
    }
    
    const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        limit: limit,
        offset: offset,
        order: [['createdAt', 'DESC']]
    });
    
    return {
        users: rows,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
    };
};

/**
 * Mettre à jour le statut de vérification d'un utilisateur
 */
User.updateVerificationStatus = async (userId, isVerified) => {
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return null;
        }

        user.isVerified = isVerified;
        await user.save();

        return user;
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut de vérification:', error);
        throw error;
    }
};

module.exports = { User };