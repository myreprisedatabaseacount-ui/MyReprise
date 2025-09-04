const BrandService = require('../services/brandService');
const logger = require('../utils/logger');

// ========================================
// CONTRÔLEUR DE GESTION DES MARQUES
// ========================================

/**
 * Crée une nouvelle marque
 */
const createBrand = async (req, res) => {
    try {
        const {
            nameAr,
            nameFr,
            descriptionAr,
            descriptionFr,
            logo,
            categoryId,
            isActive = true
        } = req.body;

        // Validation des données requises
        if (!nameAr || !nameFr) {
            return res.status(400).json({
                success: false,
                error: 'Les noms en arabe et français sont obligatoires'
            });
        }

        const brandData = {
            nameAr: nameAr.trim(),
            nameFr: nameFr.trim(),
            descriptionAr: descriptionAr ? descriptionAr.trim() : null,
            descriptionFr: descriptionFr ? descriptionFr.trim() : null,
            logo: logo || null,
            categoryId: categoryId ? parseInt(categoryId) : null,
            isActive: isActive === true || isActive === 'true'
        };

        const result = await BrandService.createBrand(brandData);

        res.status(201).json(result);

    } catch (error) {
        logger.error('Erreur création marque:', error);
        
        if (error.message.includes('existe déjà')) {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * Récupère toutes les marques avec pagination
 */
const getAllBrands = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const language = req.query.language || 'fr';
        
        const filters = {
            categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : undefined,
            isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
            search: req.query.search
        };

        const result = await BrandService.getAllBrands(page, limit, filters, language);

        res.json(result);

    } catch (error) {
        logger.error('Erreur récupération marques:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * Récupère une marque par ID
 */
const getBrandById = async (req, res) => {
    try {
        const { id } = req.params;
        const language = req.query.language || 'fr';

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                error: 'ID de marque invalide'
            });
        }

        const result = await BrandService.getBrandById(parseInt(id), language);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);

    } catch (error) {
        logger.error('Erreur récupération marque:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * Recherche des marques
 */
const searchBrands = async (req, res) => {
    try {
        const { searchTerm } = req.query;
        const language = req.query.language || 'fr';
        
        const filters = {
            categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : undefined,
            isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
        };

        if (!searchTerm || searchTerm.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Le terme de recherche doit contenir au moins 2 caractères'
            });
        }

        const result = await BrandService.searchBrands(searchTerm.trim(), filters, language);

        res.json(result);

    } catch (error) {
        logger.error('Erreur recherche marques:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * Récupère les marques populaires
 */
const getPopularBrands = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const language = req.query.language || 'fr';

        if (limit < 1 || limit > 50) {
            return res.status(400).json({
                success: false,
                error: 'La limite doit être entre 1 et 50'
            });
        }

        const result = await BrandService.getPopularBrands(limit, language);

        res.json(result);

    } catch (error) {
        logger.error('Erreur récupération marques populaires:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * Récupère les marques par catégorie
 */
const getBrandsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const language = req.query.language || 'fr';

        if (!categoryId || isNaN(parseInt(categoryId))) {
            return res.status(400).json({
                success: false,
                error: 'ID de catégorie invalide'
            });
        }

        const result = await BrandService.getBrandsByCategory(parseInt(categoryId), language);

        res.json(result);

    } catch (error) {
        logger.error('Erreur récupération marques par catégorie:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * Met à jour une marque
 */
const updateBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nameAr,
            nameFr,
            descriptionAr,
            descriptionFr,
            logo,
            categoryId,
            isActive
        } = req.body;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                error: 'ID de marque invalide'
            });
        }

        const updateData = {};
        
        if (nameAr !== undefined) updateData.nameAr = nameAr.trim();
        if (nameFr !== undefined) updateData.nameFr = nameFr.trim();
        if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr ? descriptionAr.trim() : null;
        if (descriptionFr !== undefined) updateData.descriptionFr = descriptionFr ? descriptionFr.trim() : null;
        if (logo !== undefined) updateData.logo = logo;
        if (categoryId !== undefined) updateData.categoryId = categoryId ? parseInt(categoryId) : null;
        if (isActive !== undefined) updateData.isActive = isActive === true || isActive === 'true';

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Aucune donnée à mettre à jour'
            });
        }

        const result = await BrandService.updateBrand(parseInt(id), updateData);

        res.json(result);

    } catch (error) {
        logger.error('Erreur mise à jour marque:', error);
        
        if (error.message.includes('existe déjà')) {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }

        if (error.message.includes('non trouvée')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * Active une marque
 */
const activateBrand = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                error: 'ID de marque invalide'
            });
        }

        const result = await BrandService.activateBrand(parseInt(id));

        res.json(result);

    } catch (error) {
        logger.error('Erreur activation marque:', error);
        
        if (error.message.includes('non trouvée')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * Désactive une marque
 */
const deactivateBrand = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                error: 'ID de marque invalide'
            });
        }

        const result = await BrandService.deactivateBrand(parseInt(id));

        res.json(result);

    } catch (error) {
        logger.error('Erreur désactivation marque:', error);
        
        if (error.message.includes('non trouvée')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * Supprime une marque
 */
const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                error: 'ID de marque invalide'
            });
        }

        const result = await BrandService.deleteBrand(parseInt(id));

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json(result);

    } catch (error) {
        logger.error('Erreur suppression marque:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * Récupère les statistiques des marques
 */
const getBrandStats = async (req, res) => {
    try {
        const result = await BrandService.getBrandStats();

        res.json(result);

    } catch (error) {
        logger.error('Erreur récupération statistiques marques:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * Récupère les marques actives
 */
const getActiveBrands = async (req, res) => {
    try {
        const language = req.query.language || 'fr';
        
        const result = await BrandService.getAllBrands(1, 1000, { isActive: true }, language);

        res.json(result);

    } catch (error) {
        logger.error('Erreur récupération marques actives:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

/**
 * Récupère les marques inactives
 */
const getInactiveBrands = async (req, res) => {
    try {
        const language = req.query.language || 'fr';
        
        const result = await BrandService.getAllBrands(1, 1000, { isActive: false }, language);

        res.json(result);

    } catch (error) {
        logger.error('Erreur récupération marques inactives:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: error.message
        });
    }
};

module.exports = {
    createBrand,
    getAllBrands,
    getBrandById,
    searchBrands,
    getPopularBrands,
    getBrandsByCategory,
    updateBrand,
    activateBrand,
    deactivateBrand,
    deleteBrand,
    getBrandStats,
    getActiveBrands,
    getInactiveBrands
};
