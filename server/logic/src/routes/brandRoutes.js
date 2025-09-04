const express = require('express');
const { body, param, query } = require('express-validator');
const brandController = require('../controllers/brandController');
const { 
    authenticateToken, 
    requireAdmin, 
    requireModerator,
    logAccess,
    rateLimitByUser
} = require('../middleware/auth');

const router = express.Router();

// ========================================
// VALIDATEURS
// ========================================

// Validateur pour la création de marque
const createBrandValidator = [
    body('nameAr')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom arabe doit contenir entre 2 et 100 caractères'),
    body('nameFr')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom français doit contenir entre 2 et 100 caractères'),
    body('descriptionAr')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('La description arabe ne peut pas dépasser 1000 caractères'),
    body('descriptionFr')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('La description française ne peut pas dépasser 1000 caractères'),
    body('logo')
        .optional()
        .isURL()
        .withMessage('Le logo doit être une URL valide'),
    body('categoryId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('L\'ID de catégorie doit être un entier positif'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive doit être un booléen')
];

// Validateur pour la mise à jour de marque
const updateBrandValidator = [
    body('nameAr')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom arabe doit contenir entre 2 et 100 caractères'),
    body('nameFr')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom français doit contenir entre 2 et 100 caractères'),
    body('descriptionAr')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('La description arabe ne peut pas dépasser 1000 caractères'),
    body('descriptionFr')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('La description française ne peut pas dépasser 1000 caractères'),
    body('logo')
        .optional()
        .isURL()
        .withMessage('Le logo doit être une URL valide'),
    body('categoryId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('L\'ID de catégorie doit être un entier positif'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive doit être un booléen')
];

// Validateur pour les paramètres d'ID
const idValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID de marque invalide')
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
    query('categoryId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('ID de catégorie invalide'),
    query('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive doit être un booléen'),
    query('search')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Recherche doit contenir entre 2 et 100 caractères'),
    query('language')
        .optional()
        .isIn(['fr', 'ar'])
        .withMessage('Langue doit être "fr" ou "ar"'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit doit être entre 1 et 50')
];

// ========================================
// ROUTES PUBLIQUES
// ========================================

/**
 * @route   GET /api/brands
 * @desc    Récupérer toutes les marques (avec pagination)
 * @access  Public
 */
router.get('/',
    queryValidator,
    logAccess,
    brandController.getAllBrands
);

/**
 * @route   GET /api/brands/popular
 * @desc    Récupérer les marques populaires
 * @access  Public
 */
router.get('/popular',
    queryValidator,
    logAccess,
    brandController.getPopularBrands
);

/**
 * @route   GET /api/brands/search
 * @desc    Rechercher des marques
 * @access  Public
 */
router.get('/search',
    queryValidator,
    logAccess,
    brandController.searchBrands
);

/**
 * @route   GET /api/brands/active
 * @desc    Récupérer les marques actives
 * @access  Public
 */
router.get('/active',
    queryValidator,
    logAccess,
    brandController.getActiveBrands
);

/**
 * @route   GET /api/brands/category/:categoryId
 * @desc    Récupérer les marques par catégorie
 * @access  Public
 */
router.get('/category/:categoryId',
    [
        param('categoryId')
            .isInt({ min: 1 })
            .withMessage('ID de catégorie invalide'),
        ...queryValidator
    ],
    logAccess,
    brandController.getBrandsByCategory
);

/**
 * @route   GET /api/brands/stats
 * @desc    Récupérer les statistiques des marques
 * @access  Public
 */
router.get('/stats',
    logAccess,
    brandController.getBrandStats
);

/**
 * @route   GET /api/brands/:id
 * @desc    Récupérer une marque par ID
 * @access  Public
 */
router.get('/:id',
    idValidator,
    queryValidator,
    logAccess,
    brandController.getBrandById
);

// ========================================
// ROUTES PROTÉGÉES (Moderator+)
// ========================================

/**
 * @route   GET /api/brands/inactive
 * @desc    Récupérer les marques inactives
 * @access  Private (Moderator+)
 */
router.get('/inactive',
    authenticateToken,
    requireModerator,
    queryValidator,
    logAccess,
    brandController.getInactiveBrands
);

// ========================================
// ROUTES ADMINISTRATEUR
// ========================================

/**
 * @route   POST /api/brands
 * @desc    Créer une nouvelle marque
 * @access  Private (Admin) - TEMPORAIREMENT SANS AUTH
 */
router.post('/',
    // authenticateToken,
    // requireAdmin,
    rateLimitByUser(10, 15 * 60 * 1000), // 10 tentatives par 15 minutes
    createBrandValidator,
    logAccess,
    brandController.createBrand
);

/**
 * @route   PUT /api/brands/:id
 * @desc    Mettre à jour une marque
 * @access  Private (Admin)
 */
router.put('/:id',
    authenticateToken,
    requireAdmin,
    idValidator,
    updateBrandValidator,
    logAccess,
    brandController.updateBrand
);

/**
 * @route   PUT /api/brands/:id/activate
 * @desc    Activer une marque
 * @access  Private (Admin)
 */
router.put('/:id/activate',
    authenticateToken,
    requireAdmin,
    idValidator,
    logAccess,
    brandController.activateBrand
);

/**
 * @route   PUT /api/brands/:id/deactivate
 * @desc    Désactiver une marque
 * @access  Private (Admin)
 */
router.put('/:id/deactivate',
    authenticateToken,
    requireAdmin,
    idValidator,
    logAccess,
    brandController.deactivateBrand
);

/**
 * @route   DELETE /api/brands/:id
 * @desc    Supprimer une marque
 * @access  Private (Admin)
 */
router.delete('/:id',
    authenticateToken,
    requireAdmin,
    idValidator,
    logAccess,
    brandController.deleteBrand
);

module.exports = router;
