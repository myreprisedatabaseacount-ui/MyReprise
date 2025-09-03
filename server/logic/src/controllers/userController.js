const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User.js');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger.js');
const AuthService = require('../services/authService.js');

// ========================================
// CONFIGURATION JWT
// ========================================
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// ========================================
// MÉTHODES D'AUTHENTIFICATION
// ========================================

/**
 * 🔐 Inscription d'un nouvel utilisateur par téléphone
 */
const register = async (req, res) => {
    try {
        // Validation des données
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Données invalides',
                details: errors.array()
            });
        }

        const { firstName, lastName, phone, password } = req.body;

        const result = await AuthService.registerWithPhone({
            firstName,
            lastName,
            phone,
            password
        });

        res.status(201).json(result);

    } catch (error) {
        logger.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * 🔑 Connexion d'un utilisateur par téléphone
 */
const login = async (req, res) => {
    try {
        // Validation des données
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Données invalides',
                details: errors.array()
            });
        }

        const { phone, password } = req.body;

        const result = await AuthService.authenticateWithPhone(phone, password);
        res.json(result);

    } catch (error) {
        logger.error('Erreur lors de la connexion:', error);
        res.status(401).json({
            success: false,
            error: error.message || 'Erreur interne du serveur'
        });
    }
};

/**
 * 🔄 Rafraîchissement du token
 */
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        const result = await AuthService.refreshToken(refreshToken);
        res.json(result);

    } catch (error) {
        logger.error('Erreur lors du rafraîchissement du token:', error);
        res.status(401).json({
            success: false,
            error: error.message || 'Refresh token invalide'
        });
    }
};

/**
 * 🔐 Connexion avec Google
 */
const loginWithGoogle = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Données invalides',
                details: errors.array()
            });
        }

        const { googleId, email, firstName, lastName, profilePicture } = req.body;

        const result = await AuthService.authenticateWithGoogle({
            googleId,
            email,
            firstName,
            lastName,
            profilePicture
        });

        res.json(result);

    } catch (error) {
        logger.error('Erreur lors de la connexion Google:', error);
        res.status(401).json({
            success: false,
            error: error.message || 'Erreur de connexion Google'
        });
    }
};

/**
 * 🔐 Connexion avec Facebook
 */
const loginWithFacebook = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Données invalides',
                details: errors.array()
            });
        }

        const { facebookId, email, phone, firstName, lastName, profilePicture } = req.body;

        const result = await AuthService.authenticateWithFacebook({
            facebookId,
            email,
            phone,
            firstName,
            lastName,
            profilePicture
        });

        res.json(result);

    } catch (error) {
        logger.error('Erreur lors de la connexion Facebook:', error);
        res.status(401).json({
            success: false,
            error: error.message || 'Erreur de connexion Facebook'
        });
    }
};

/**
 * 🚪 Déconnexion d'un utilisateur
 */
const logout = async (req, res) => {
    try {
        const result = await AuthService.logout(req.user);
        res.json(result);

    } catch (error) {
        logger.error('Erreur lors de la déconnexion:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erreur interne du serveur'
        });
    }
};

// ========================================
// MÉTHODES CRUD
// ========================================

/**
 * 📋 Récupérer tous les utilisateurs (avec pagination)
 */
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filters = {
            role: req.query.role,
            isVerified: req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined,
            search: req.query.search
        };

        const result = await User.findWithPagination(page, limit, filters);

        res.json({
            success: true,
            data: {
                users: result.users.map(user => user.getPublicData()),
                pagination: {
                    totalCount: result.totalCount,
                    totalPages: result.totalPages,
                    currentPage: result.currentPage,
                    limit
                }
            }
        });

    } catch (error) {
        logger.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * 👤 Récupérer un utilisateur par ID
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        res.json({
            success: true,
            data: {
                user: user.getPublicData()
            }
        });

    } catch (error) {
        logger.error('Erreur lors de la récupération de l\'utilisateur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * 👤 Récupérer le profil de l'utilisateur connecté
 */
const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        res.json({
            success: true,
            data: {
                user: user.getPublicData()
            }
        });

    } catch (error) {
        logger.error('Erreur lors de la récupération du profil:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * ✏️ Mettre à jour le profil de l'utilisateur connecté
 */
const updateProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Données invalides',
                details: errors.array()
            });
        }

        const { firstName, lastName, phone } = req.body;
        const userId = req.user.userId;

        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (phone) updateData.phone = phone;

        const user = await User.updateUser(userId, updateData);

        logger.info(`Profil mis à jour: ${user.phone}`);

        res.json({
            success: true,
            message: 'Profil mis à jour avec succès',
            data: {
                user: user.getPublicData()
            }
        });

    } catch (error) {
        logger.error('Erreur lors de la mise à jour du profil:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * 🔒 Changer le mot de passe
 */
const changePassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Données invalides',
                details: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        // Vérification du mot de passe actuel
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Mot de passe actuel incorrect'
            });
        }

        // Hashage du nouveau mot de passe
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Mise à jour du mot de passe
        await user.update({ password: hashedNewPassword });

        logger.info(`Mot de passe changé: ${user.phone}`);

        res.json({
            success: true,
            message: 'Mot de passe changé avec succès'
        });

    } catch (error) {
        logger.error('Erreur lors du changement de mot de passe:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * ✏️ Mettre à jour un utilisateur (Admin)
 */
const updateUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Données invalides',
                details: errors.array()
            });
        }

        const { id } = req.params;
        const { firstName, lastName, email, phone, role, isVerified } = req.body;

        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (email) updateData.email = email.toLowerCase();
        if (phone) updateData.phone = phone;
        if (role) updateData.role = role;
        if (isVerified !== undefined) updateData.isVerified = isVerified;

        const user = await User.updateUser(id, updateData);

        logger.info(`Utilisateur mis à jour par admin: ${user.phone}`);

        res.json({
            success: true,
            message: 'Utilisateur mis à jour avec succès',
            data: {
                user: user.getPublicData()
            }
        });

    } catch (error) {
        logger.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * 🗑️ Supprimer un utilisateur (Admin)
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Empêcher la suppression de son propre compte
        if (parseInt(id) === req.user.userId) {
            return res.status(400).json({
                success: false,
                error: 'Vous ne pouvez pas supprimer votre propre compte'
            });
        }

        await User.deleteUser(id);

        logger.info(`Utilisateur supprimé par admin: ID ${id}`);

        res.json({
            success: true,
            message: 'Utilisateur supprimé avec succès'
        });

    } catch (error) {
        logger.error('Erreur lors de la suppression de l\'utilisateur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * ✅ Vérifier un utilisateur (Admin)
 */
const verifyUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.verifyUser(id);

        logger.info(`Utilisateur vérifié par admin: ${user.phone}`);

        res.json({
            success: true,
            message: 'Utilisateur vérifié avec succès',
            data: {
                user: user.getPublicData()
            }
        });

    } catch (error) {
        logger.error('Erreur lors de la vérification de l\'utilisateur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * 🔄 Changer le rôle d'un utilisateur (Admin)
 */
const changeUserRole = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Données invalides',
                details: errors.array()
            });
        }

        const { id } = req.params;
        const { role } = req.body;

        const user = await User.changeRole(id, role);

        logger.info(`Rôle changé par admin: ${user.phone} -> ${role}`);

        res.json({
            success: true,
            message: 'Rôle changé avec succès',
            data: {
                user: user.getPublicData()
            }
        });

    } catch (error) {
        logger.error('Erreur lors du changement de rôle:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

// ========================================
// MÉTHODES OTP (TODO - À IMPLÉMENTER)
// ========================================

/**
 * 📱 Envoyer le code OTP pour vérification du téléphone
 * TODO: Implémenter l'envoi SMS/WhatsApp
 */
const sendOTP = async (req, res) => {
    try {
        // TODO: Implémenter l'envoi d'OTP
        // 1. Générer un code OTP (6 chiffres)
        // 2. Sauvegarder le code avec expiration (5 minutes)
        // 3. Envoyer via SMS ou WhatsApp
        // 4. Retourner un message de succès

        res.status(501).json({
            success: false,
            error: 'Fonctionnalité OTP non implémentée',
            message: 'Cette fonctionnalité sera disponible prochainement'
        });

    } catch (error) {
        logger.error('Erreur lors de l\'envoi OTP:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * ✅ Vérifier le code OTP
 * TODO: Implémenter la vérification OTP
 */
const verifyOTP = async (req, res) => {
    try {
        // TODO: Implémenter la vérification OTP
        // 1. Récupérer le code OTP saisi
        // 2. Vérifier le code et l'expiration
        // 3. Marquer l'utilisateur comme vérifié
        // 4. Retourner un message de succès

        res.status(501).json({
            success: false,
            error: 'Fonctionnalité OTP non implémentée',
            message: 'Cette fonctionnalité sera disponible prochainement'
        });

    } catch (error) {
        logger.error('Erreur lors de la vérification OTP:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

module.exports = {
    // Authentification
    register,
    login,
    loginWithGoogle,
    loginWithFacebook,
    refreshToken,
    logout,
    
    // CRUD Utilisateur
    getAllUsers,
    getUserById,
    getProfile,
    updateProfile,
    changePassword,
    updateUser,
    deleteUser,
    verifyUser,
    changeUserRole,
    
    // OTP (TODO)
    sendOTP,
    verifyOTP
};
