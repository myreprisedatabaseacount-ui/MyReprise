const BrandService = require('../services/brandService');
const cloudinaryService = require('../services/cloudinaryService');
const logger = require('../utils/logger');

// ========================================
// CONTRÔLEUR DE GESTION DES MARQUES
// ========================================

// Fonction utilitaire pour extraire le public_id d'une URL Cloudinary
const extractPublicIdFromUrl = (url) => {
    if (!url) return null;

    try {
        // Format URL: https://res.cloudinary.com/.../image/upload/v1234567890/brands/logos/uyh8qxffruxt1weq8e9y.jpg
        const urlParts = url.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');

        if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
            // Prendre TOUS les segments après 'upload/v1234567890/' pour reconstituer le chemin complet
            const pathSegments = urlParts.slice(uploadIndex + 2);
            const fullPath = pathSegments.join('/');
            // Enlever l'extension si présente
            const publicId = fullPath.split('.')[0];
            console.log("🔍 Public ID extrait:", publicId, "depuis:", url);
            return publicId;
        }

        console.warn("⚠️ Impossible d'extraire le public_id de l'URL:", url);
        return null;
    } catch (error) {
        console.error("❌ Erreur lors de l'extraction du public_id:", error);
        return null;
    }
};

// Fonction utilitaire pour nettoyer les fichiers uploadés en cas d'erreur
const cleanupUploadedFiles = async (imagePublicId) => {
    if (imagePublicId) {
        try {
            await cloudinaryService.deleteFile(imagePublicId);
            console.log("✅ Fichier supprimé après erreur:", imagePublicId);
        } catch (deleteError) {
            console.error("❌ Erreur lors de la suppression du fichier:", deleteError);
        }
    }
};

/**
 * Crée une nouvelle marque
 */
const createBrand = async (req, res) => {
    let imagePublicId = null;

    try {
        const {
            nameAr,
            nameFr,
            descriptionAr,
            descriptionFr,
            categoryIds: categoryIdsRaw
        } = req.body;

        // Debug: Vérifier les données reçues
        console.log('🔍 Debug createBrand - req.body:', req.body);
        console.log('🔍 Debug createBrand - categoryIdsRaw:', categoryIdsRaw, typeof categoryIdsRaw);

        // Parser categoryIds si c'est une chaîne JSON
        let categoryIds = categoryIdsRaw;
        if (typeof categoryIdsRaw === 'string') {
            try {
                categoryIds = JSON.parse(categoryIdsRaw);
                console.log('🔍 Debug createBrand - categoryIds parsed:', categoryIds);
            } catch (error) {
                console.error('Erreur parsing categoryIds:', error);
                categoryIds = [];
            }
        }

        // ✅ Vérification du fichier image
        const imageFile = req.file;

        let logoUrl = null;

        // ✅ Upload image
        if (imageFile) {
            try {
                const imageUploadResult = await cloudinaryService.uploadFromBuffer(
                    imageFile.buffer,
                    "brands/logos",
                    {
                        resource_type: "image",
                        transformation: [
                            {
                                quality: "auto:best",   // compression intelligente haute qualité
                                fetch_format: "auto",   // WebP/AVIF si dispo
                                flags: "lossy",
                                bytes_limit: 250000     // limite à 0.25 MB pour les logos
                            }
                        ],
                    }
                );
                logoUrl = imageUploadResult.secure_url;
                imagePublicId = imageUploadResult.public_id;
            } catch (uploadError) {
                console.error("❌ Erreur upload logo:", uploadError);
                return res.status(500).json({
                    success: false,
                    error: "Erreur lors de l'upload du logo",
                    details: uploadError.message || "Erreur inconnue",
                });
            }
        }

        // ✅ Validation
        if (!nameAr || !nameFr) {
            // Supprimer le fichier uploadé en cas d'erreur de validation
            await cleanupUploadedFiles(imagePublicId);
            return res.status(400).json({
                success: false,
                error: 'Les noms en arabe et français sont obligatoires'
            });
        }

        if (!logoUrl) {
            await cleanupUploadedFiles(imagePublicId);
            return res.status(400).json({
                success: false,
                error: "Un logo est obligatoire"
            });
        }

        if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
            await cleanupUploadedFiles(imagePublicId);
            return res.status(400).json({
                success: false,
                error: "Au moins une catégorie doit être sélectionnée"
            });
        }

        const brandData = {
            nameAr: nameAr.trim(),
            nameFr: nameFr.trim(),
            descriptionAr: descriptionAr ? descriptionAr.trim() : null,
            descriptionFr: descriptionFr ? descriptionFr.trim() : null,
            logo: logoUrl,
            categoryIds: categoryIds || []
        };

        const result = await BrandService.createBrand(brandData);

        res.status(201).json(result);

    } catch (error) {
        logger.error('Erreur création marque:', error);
        
        // Supprimer le fichier uploadé en cas d'erreur
        await cleanupUploadedFiles(imagePublicId);
        
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
            categoryIds: req.query.categoryIds ? req.query.categoryIds.split(',').map(id => parseInt(id)) : undefined,
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
            categoryIds: req.query.categoryIds ? req.query.categoryIds.split(',').map(id => parseInt(id)) : undefined
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
    let imagePublicId = null;

    try {
        const { id } = req.params;
        const {
            nameAr,
            nameFr,
            descriptionAr,
            descriptionFr,
            categoryIds: categoryIdsRaw
        } = req.body;

        // Parser categoryIds si c'est une chaîne JSON
        let categoryIds = categoryIdsRaw;
        if (typeof categoryIdsRaw === 'string') {
            try {
                categoryIds = JSON.parse(categoryIdsRaw);
            } catch (error) {
                console.error('Erreur parsing categoryIds:', error);
                categoryIds = [];
            }
        }

        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                error: 'ID de marque invalide'
            });
        }

        // Vérifier que la marque existe
        const { Brand } = require('../models/Brand');
        const existingBrand = await Brand.findByPk(id);
        if (!existingBrand) {
            return res.status(404).json({
                success: false,
                error: 'Marque non trouvée'
            });
        }

        // Récupérer l'ancien public_id pour nettoyage
        const oldLogoUrl = existingBrand.logo;

        let logoUrl = oldLogoUrl;

        // ✅ Upload nouvelle image si fournie
        const imageFile = req.file;
        if (imageFile) {
            try {
                const imageUploadResult = await cloudinaryService.uploadFromBuffer(
                    imageFile.buffer,
                    "brands/logos",
                    {
                        resource_type: "image",
                        transformation: [
                            {
                                quality: "auto:best",
                                fetch_format: "auto",
                                flags: "lossy",
                                bytes_limit: 250000
                            }
                        ],
                    }
                );
                logoUrl = imageUploadResult.secure_url;
                imagePublicId = imageUploadResult.public_id;
            } catch (uploadError) {
                console.error("❌ Erreur upload logo:", uploadError);
                return res.status(500).json({
                    success: false,
                    error: "Erreur lors de l'upload du logo",
                    details: uploadError.message || "Erreur inconnue",
                });
            }
        }

        const updateData = {};
        
        if (nameAr !== undefined) updateData.nameAr = nameAr.trim();
        if (nameFr !== undefined) updateData.nameFr = nameFr.trim();
        if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr ? descriptionAr.trim() : null;
        if (descriptionFr !== undefined) updateData.descriptionFr = descriptionFr ? descriptionFr.trim() : null;
        if (logoUrl !== oldLogoUrl) updateData.logo = logoUrl;
        if (categoryIds !== undefined) updateData.categoryIds = categoryIds || [];

        if (Object.keys(updateData).length === 0) {
            await cleanupUploadedFiles(imagePublicId);
            return res.status(400).json({
                success: false,
                error: 'Aucune donnée à mettre à jour'
            });
        }

        const result = await BrandService.updateBrand(parseInt(id), updateData);

        // Supprimer l'ancien fichier Cloudinary si un nouveau a été uploadé
        if (imagePublicId && oldLogoUrl) {
            console.log("🔄 Nouveau logo uploadé, suppression de l'ancien:", oldLogoUrl);
            const oldImagePublicId = extractPublicIdFromUrl(oldLogoUrl);
            if (oldImagePublicId) {
                try {
                    await cloudinaryService.deleteFile(oldImagePublicId);
                    console.log("✅ Ancien logo supprimé:", oldImagePublicId);
                } catch (deleteError) {
                    console.error("❌ Erreur suppression ancien logo:", deleteError);
                }
            }
        }

        res.json(result);

    } catch (error) {
        logger.error('Erreur mise à jour marque:', error);
        
        // Supprimer le nouveau fichier uploadé en cas d'erreur
        await cleanupUploadedFiles(imagePublicId);
        
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

// Note: Les méthodes activateBrand et deactivateBrand ont été supprimées
// car le champ isActive n'existe pas dans la base de données

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

        // Récupérer la marque avant suppression pour obtenir l'URL du logo
        const { Brand } = require('../models/Brand');
        const brand = await Brand.findByPk(id);

        if (!brand) {
            return res.status(404).json({
                success: false,
                error: 'Marque non trouvée'
            });
        }

        // Supprimer le logo de Cloudinary
        if (brand.logo) {
            const imagePublicId = extractPublicIdFromUrl(brand.logo);
            if (imagePublicId) {
                try {
                    await cloudinaryService.deleteFile(imagePublicId);
                    console.log("✅ Logo supprimé de Cloudinary:", imagePublicId);
                } catch (deleteError) {
                    console.error("❌ Erreur suppression logo Cloudinary:", deleteError);
                }
            }
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
        
        const result = await BrandService.getAllBrands(1, 1000, {}, language);

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
        
        const result = await BrandService.getAllBrands(1, 1000, {}, language);

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

/**
 * Vide le cache des marques
 */
const clearBrandsCache = async (req, res) => {
    try {
        const result = await BrandService.clearAllBrandsCache();
        
        if (result.success) {
            res.json({
                success: true,
                message: `Cache des marques vidé avec succès. ${result.clearedKeys} clés supprimées.`
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Erreur lors du vidage du cache',
                details: result.error
            });
        }
    } catch (error) {
        logger.error('Erreur vidage cache marques:', error);
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
    deleteBrand,
    getBrandStats,
    getActiveBrands,
    getInactiveBrands,
    clearBrandsCache
};
