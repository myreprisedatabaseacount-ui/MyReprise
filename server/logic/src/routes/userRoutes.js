const express = require('express');
const { body, param, query } = require('express-validator');
const userController = require('../controllers/userController.js');
const { 
    authenticateToken, 
    requireAdmin, 
    requireModerator,
    requireVerified,
    logAccess,
    rateLimitByUser
} = require('../middleware/auth.js');

const router = express.Router();

// ========================================
// VALIDATEURS
// ========================================

// Validateur pour l'inscription
const registerValidator = [
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    body('phone')
        .isMobilePhone('any')
        .withMessage('Numéro de téléphone invalide'),
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Email invalide'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Le mot de passe doit contenir au moins 8 caractères')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
];

// Validateur pour la connexion par téléphone
const loginValidator = [
    body('phone')
        .isMobilePhone('any')
        .withMessage('Numéro de téléphone invalide'),
    body('password')
        .notEmpty()
        .withMessage('Mot de passe requis')
];

// Validateur pour la connexion Google
const loginGoogleValidator = [
    body('googleId')
        .notEmpty()
        .withMessage('Google ID requis'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email invalide'),
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom doit contenir entre 2 et 100 caractères')
];

// Validateur pour la connexion Facebook
const loginFacebookValidator = [
    body('facebookId')
        .notEmpty()
        .withMessage('Facebook ID requis'),
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Email invalide'),
    body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Numéro de téléphone invalide')
];

// Validateur pour la mise à jour du profil
const updateProfileValidator = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Numéro de téléphone invalide')
];

// Validateur pour le changement de mot de passe
const changePasswordValidator = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Mot de passe actuel requis'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
];

// Validateur pour la mise à jour d'utilisateur (Admin)
const updateUserValidator = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Email invalide'),
    body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Numéro de téléphone invalide'),
    body('role')
        .optional()
        .isIn(['user', 'admin', 'moderator'])
        .withMessage('Rôle invalide'),
    body('isVerified')
        .optional()
        .isBoolean()
        .withMessage('isVerified doit être un booléen')
];

// Validateur pour le changement de rôle
const changeRoleValidator = [
    body('role')
        .isIn(['user', 'admin', 'moderator'])
        .withMessage('Rôle invalide')
];

// Validateur pour les paramètres d'ID
const idValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID utilisateur invalide')
];

// Validateur pour les paramètres de requête
const queryValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page doit être un entier positif'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit doit être entre 1 et 100'),
    query('role')
        .optional()
        .isIn(['user', 'admin', 'moderator'])
        .withMessage('Rôle invalide'),
    query('isVerified')
        .optional()
        .isBoolean()
        .withMessage('isVerified doit être un booléen'),
    query('search')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Recherche doit contenir entre 2 et 100 caractères')
];

// ========================================
// ROUTES D'AUTHENTIFICATION
// ========================================

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post('/register', 
    rateLimitByUser(5, 15 * 60 * 1000), // 5 tentatives par 15 minutes
    registerValidator,
    logAccess,
    userController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur par téléphone
 * @access  Public
 */
router.post('/login',
    rateLimitByUser(10, 15 * 60 * 1000), // 10 tentatives par 15 minutes
    loginValidator,
    logAccess,
    userController.login
);

/**
 * @route   POST /api/auth/google
 * @desc    Connexion avec Google
 * @access  Public
 */
router.post('/google',
    rateLimitByUser(10, 15 * 60 * 1000), // 10 tentatives par 15 minutes
    loginGoogleValidator,
    logAccess,
    userController.loginWithGoogle
);

/**
 * @route   POST /api/auth/facebook
 * @desc    Connexion avec Facebook
 * @access  Public
 */
router.post('/facebook',
    rateLimitByUser(10, 15 * 60 * 1000), // 10 tentatives par 15 minutes
    loginFacebookValidator,
    logAccess,
    userController.loginWithFacebook
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Rafraîchissement du token JWT
 * @access  Public
 */
router.post('/refresh',
    rateLimitByUser(20, 15 * 60 * 1000), // 20 tentatives par 15 minutes
    logAccess,
    userController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion d'un utilisateur
 * @access  Private
 */
router.post('/logout',
    authenticateToken,
    logAccess,
    userController.logout
);

// ========================================
// ROUTES DE PROFIL UTILISATEUR
// ========================================

/**
 * @route   GET /api/users/profile
 * @desc    Récupérer le profil de l'utilisateur connecté
 * @access  Private
 */
router.get('/profile',
    authenticateToken,
    logAccess,
    userController.getProfile
);

/**
 * @route   PUT /api/users/profile
 * @desc    Mettre à jour le profil de l'utilisateur connecté
 * @access  Private
 */
router.put('/profile',
    authenticateToken,
    updateProfileValidator,
    logAccess,
    userController.updateProfile
);

/**
 * @route   PUT /api/users/change-password
 * @desc    Changer le mot de passe de l'utilisateur connecté
 * @access  Private
 */
router.put('/change-password',
    authenticateToken,
    changePasswordValidator,
    logAccess,
    userController.changePassword
);

// ========================================
// ROUTES OTP (TODO - À IMPLÉMENTER)
// ========================================

/**
 * @route   POST /api/users/send-otp
 * @desc    Envoyer le code OTP pour vérification du téléphone
 * @access  Private
 */
router.post('/send-otp',
    authenticateToken,
    rateLimitByUser(3, 5 * 60 * 1000), // 3 tentatives par 5 minutes
    logAccess,
    userController.sendOTP
);

/**
 * @route   POST /api/users/verify-otp
 * @desc    Vérifier le code OTP
 * @access  Private
 */
router.post('/verify-otp',
    authenticateToken,
    rateLimitByUser(5, 5 * 60 * 1000), // 5 tentatives par 5 minutes
    logAccess,
    userController.verifyOTP
);

// ========================================
// ROUTES ADMINISTRATEUR
// ========================================

/**
 * @route   GET /api/users
 * @desc    Récupérer tous les utilisateurs (avec pagination)
 * @access  Private (Admin/Moderator)
 */
router.get('/',
    authenticateToken,
    requireModerator,
    queryValidator,
    logAccess,
    userController.getAllUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Récupérer un utilisateur par ID
 * @access  Private (Admin/Moderator)
 */
router.get('/:id',
    authenticateToken,
    requireModerator,
    idValidator,
    logAccess,
    userController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Mettre à jour un utilisateur
 * @access  Private (Admin)
 */
router.put('/:id',
    authenticateToken,
    requireAdmin,
    idValidator,
    updateUserValidator,
    logAccess,
    userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Supprimer un utilisateur
 * @access  Private (Admin)
 */
router.delete('/:id',
    authenticateToken,
    requireAdmin,
    idValidator,
    logAccess,
    userController.deleteUser
);

/**
 * @route   PUT /api/users/:id/verify
 * @desc    Vérifier un utilisateur
 * @access  Private (Admin/Moderator)
 */
router.put('/:id/verify',
    authenticateToken,
    requireModerator,
    idValidator,
    logAccess,
    userController.verifyUser
);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Changer le rôle d'un utilisateur
 * @access  Private (Admin)
 */
router.put('/:id/role',
    authenticateToken,
    requireAdmin,
    idValidator,
    changeRoleValidator,
    logAccess,
    userController.changeUserRole
);

// ========================================
// ROUTES SPÉCIALISÉES
// ========================================

/**
 * @route   GET /api/users/verified
 * @desc    Récupérer tous les utilisateurs vérifiés
 * @access  Private (Moderator+)
 */
router.get('/verified',
    authenticateToken,
    requireModerator,
    queryValidator,
    logAccess,
    async (req, res) => {
        // Ajouter le filtre isVerified=true
        req.query.isVerified = 'true';
        return userController.getAllUsers(req, res);
    }
);

/**
 * @route   GET /api/users/unverified
 * @desc    Récupérer tous les utilisateurs non vérifiés
 * @access  Private (Moderator+)
 */
router.get('/unverified',
    authenticateToken,
    requireModerator,
    queryValidator,
    logAccess,
    async (req, res) => {
        // Ajouter le filtre isVerified=false
        req.query.isVerified = 'false';
        return userController.getAllUsers(req, res);
    }
);

/**
 * @route   GET /api/users/role/:role
 * @desc    Récupérer les utilisateurs par rôle
 * @access  Private (Moderator+)
 */
router.get('/role/:role',
    authenticateToken,
    requireModerator,
    [
        param('role')
            .isIn(['user', 'admin', 'moderator'])
            .withMessage('Rôle invalide'),
        ...queryValidator
    ],
    logAccess,
    async (req, res) => {
        // Ajouter le filtre role
        req.query.role = req.params.role;
        return userController.getAllUsers(req, res);
    }
);

/**
 * @route   GET /api/users/stats
 * @desc    Récupérer les statistiques des utilisateurs
 * @access  Private (Admin)
 */
router.get('/stats',
    authenticateToken,
    requireAdmin,
    logAccess,
    async (req, res) => {
        try {
            const { User } = require('../models/User.js');
            
            // Statistiques générales
            const totalUsers = await User.count();
            const verifiedUsers = await User.count({ where: { isVerified: true } });
            const unverifiedUsers = totalUsers - verifiedUsers;
            
            // Statistiques par rôle
            const usersByRole = await User.findAll({
                attributes: [
                    'role',
                    [require('../config/db.js').getSequelize().fn('COUNT', '*'), 'count']
                ],
                group: ['role']
            });
            
            // Statistiques par mois (derniers 12 mois)
            const monthlyStats = await User.findAll({
                attributes: [
                    [require('../config/db.js').getSequelize().fn('DATE_FORMAT', require('../config/db.js').getSequelize().col('created_at'), '%Y-%m'), 'month'],
                    [require('../config/db.js').getSequelize().fn('COUNT', '*'), 'count']
                ],
                where: require('../config/db.js').getSequelize().where(
                    require('../config/db.js').getSequelize().fn('DATE', require('../config/db.js').getSequelize().col('created_at')),
                    '>=',
                    require('../config/db.js').getSequelize().fn('DATE_SUB', require('../config/db.js').getSequelize().fn('NOW'), require('../config/db.js').getSequelize().literal('INTERVAL 12 MONTH'))
                ),
                group: [require('../config/db.js').getSequelize().fn('DATE_FORMAT', require('../config/db.js').getSequelize().col('created_at'), '%Y-%m')],
                order: [[require('../config/db.js').getSequelize().fn('DATE_FORMAT', require('../config/db.js').getSequelize().col('created_at'), '%Y-%m'), 'ASC']]
            });
            
            res.json({
                success: true,
                data: {
                    total: totalUsers,
                    verified: verifiedUsers,
                    unverified: unverifiedUsers,
                    verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(2) : 0,
                    byRole: usersByRole,
                    monthlyGrowth: monthlyStats
                }
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des statistiques',
                details: error.message
            });
        }
    }
);

module.exports = router;
