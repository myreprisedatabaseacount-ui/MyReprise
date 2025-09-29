const { OfferBrand } = require('../models/OfferBrand');
const { Offer } = require('../models/Offer');
const { Brand } = require('../models/Brand');
const db = require('../config/db');

// ========================================
// CRÉATION DE RELATIONS OFFER-BRAND
// ========================================

/**
 * Crée une relation offer-brand
 */
const createOfferBrand = async (req, res) => {
    try {
        const { offerId, brandId } = req.body;

        // Validation des paramètres
        if (!offerId || !brandId) {
            return res.status(400).json({
                success: false,
                error: 'offerId et brandId sont requis',
                details: 'Les identifiants de l\'offre et de la marque sont obligatoires'
            });
        }

        // Vérifier que les IDs sont des nombres valides
        if (isNaN(offerId) || isNaN(brandId)) {
            return res.status(400).json({
                success: false,
                error: 'IDs invalides',
                details: 'Les identifiants doivent être des nombres valides'
            });
        }

        // Créer la relation
        const relation = await OfferBrand.createOfferBrand(parseInt(offerId), parseInt(brandId));

        res.status(201).json({
            success: true,
            message: 'Relation offre-marque créée avec succès',
            data: relation.getOfferBrandData()
        });

    } catch (error) {
        console.error('Erreur lors de la création de la relation offer-brand:', error);
        
        if (error.message.includes('existe déjà')) {
            return res.status(409).json({
                success: false,
                error: 'Relation existante',
                details: error.message
            });
        }
        
        if (error.message.includes('non trouvée')) {
            return res.status(404).json({
                success: false,
                error: 'Ressource non trouvée',
                details: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: 'Impossible de créer la relation offre-marque'
        });
    }
};

/**
 * Crée plusieurs relations offer-brand
 */
const createMultipleOfferBrands = async (req, res) => {
    try {
        const { offerId, brandIds } = req.body;

        // Validation des paramètres
        if (!offerId || !brandIds || !Array.isArray(brandIds)) {
            return res.status(400).json({
                success: false,
                error: 'Paramètres invalides',
                details: 'offerId et brandIds (tableau) sont requis'
            });
        }

        if (isNaN(offerId)) {
            return res.status(400).json({
                success: false,
                error: 'ID d\'offre invalide',
                details: 'L\'identifiant de l\'offre doit être un nombre valide'
            });
        }

        // Filtrer les IDs valides
        const validBrandIds = brandIds.filter(id => !isNaN(id)).map(id => parseInt(id));
        
        if (validBrandIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Aucun ID de marque valide',
                details: 'Aucun identifiant de marque valide fourni'
            });
        }

        // Créer les relations
        const relations = await OfferBrand.createMultipleOfferBrands(parseInt(offerId), validBrandIds);

        res.status(201).json({
            success: true,
            message: `${relations.length} relation(s) offre-marque créée(s) avec succès`,
            data: relations.map(rel => rel.getOfferBrandData())
        });

    } catch (error) {
        console.error('Erreur lors de la création des relations offer-brand:', error);
        
        if (error.message.includes('non trouvée')) {
            return res.status(404).json({
                success: false,
                error: 'Ressource non trouvée',
                details: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: 'Impossible de créer les relations offre-marque'
        });
    }
};

// ========================================
// RÉCUPÉRATION DE RELATIONS
// ========================================

/**
 * Récupère les marques d'une offre
 */
const getBrandsByOffer = async (req, res) => {
    try {
        const { offerId } = req.params;

        if (!offerId || isNaN(offerId)) {
            return res.status(400).json({
                success: false,
                error: 'ID d\'offre invalide',
                details: 'L\'identifiant de l\'offre doit être un nombre valide'
            });
        }

        const relations = await OfferBrand.findByOffer(parseInt(offerId));

        res.json({
            success: true,
            message: 'Marques récupérées avec succès',
            data: relations.map(rel => ({
                id: rel.id,
                brandId: rel.brandId,
                brand: rel.brand ? {
                    id: rel.brand.id,
                    name: rel.brand.nameFr,
                    nameAr: rel.brand.nameAr,
                    nameFr: rel.brand.nameFr,
                    logo: rel.brand.logo,
                    description: rel.brand.descriptionFr,
                    descriptionAr: rel.brand.descriptionAr,
                    descriptionFr: rel.brand.descriptionFr
                } : null,
                createdAt: rel.createdAt
            }))
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des marques de l\'offre:', error);
        
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: 'Impossible de récupérer les marques de l\'offre'
        });
    }
};

/**
 * Récupère les offres d'une marque
 */
const getOffersByBrand = async (req, res) => {
    try {
        const { brandId } = req.params;

        if (!brandId || isNaN(brandId)) {
            return res.status(400).json({
                success: false,
                error: 'ID de marque invalide',
                details: 'L\'identifiant de la marque doit être un nombre valide'
            });
        }

        const relations = await OfferBrand.findByBrand(parseInt(brandId));

        res.json({
            success: true,
            message: 'Offres récupérées avec succès',
            data: relations.map(rel => ({
                id: rel.id,
                offerId: rel.offerId,
                offer: rel.offer ? {
                    id: rel.offer.id,
                    title: rel.offer.title,
                    description: rel.offer.description,
                    price: rel.offer.price,
                    status: rel.offer.status,
                    productCondition: rel.offer.productCondition,
                    createdAt: rel.offer.createdAt
                } : null,
                createdAt: rel.createdAt
            }))
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des offres de la marque:', error);
        
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: 'Impossible de récupérer les offres de la marque'
        });
    }
};

// ========================================
// MISE À JOUR DE RELATIONS
// ========================================

/**
 * Met à jour les marques d'une offre (remplace toutes les relations existantes)
 */
const updateOfferBrands = async (req, res) => {
    try {
        const { offerId } = req.params;
        const { brandIds } = req.body;

        if (!offerId || isNaN(offerId)) {
            return res.status(400).json({
                success: false,
                error: 'ID d\'offre invalide',
                details: 'L\'identifiant de l\'offre doit être un nombre valide'
            });
        }

        if (!Array.isArray(brandIds)) {
            return res.status(400).json({
                success: false,
                error: 'Paramètre invalide',
                details: 'brandIds doit être un tableau'
            });
        }

        // Filtrer les IDs valides
        const validBrandIds = brandIds.filter(id => !isNaN(id)).map(id => parseInt(id));

        // Mettre à jour les relations
        const relations = await OfferBrand.updateOfferBrands(parseInt(offerId), validBrandIds);

        res.json({
            success: true,
            message: 'Marques de l\'offre mises à jour avec succès',
            data: relations.map(rel => rel.getOfferBrandData())
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour des marques de l\'offre:', error);
        
        if (error.message.includes('non trouvée')) {
            return res.status(404).json({
                success: false,
                error: 'Ressource non trouvée',
                details: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: 'Impossible de mettre à jour les marques de l\'offre'
        });
    }
};

// ========================================
// SUPPRESSION DE RELATIONS
// ========================================

/**
 * Supprime une relation offer-brand
 */
const deleteOfferBrand = async (req, res) => {
    try {
        const { offerId, brandId } = req.params;

        if (!offerId || !brandId || isNaN(offerId) || isNaN(brandId)) {
            return res.status(400).json({
                success: false,
                error: 'IDs invalides',
                details: 'Les identifiants de l\'offre et de la marque doivent être des nombres valides'
            });
        }

        await OfferBrand.deleteOfferBrand(parseInt(offerId), parseInt(brandId));

        res.json({
            success: true,
            message: 'Relation offre-marque supprimée avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la suppression de la relation offer-brand:', error);
        
        if (error.message.includes('non trouvée')) {
            return res.status(404).json({
                success: false,
                error: 'Relation non trouvée',
                details: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: 'Impossible de supprimer la relation offre-marque'
        });
    }
};

/**
 * Supprime toutes les relations d'une offre
 */
const deleteOfferBrandsByOffer = async (req, res) => {
    try {
        const { offerId } = req.params;

        if (!offerId || isNaN(offerId)) {
            return res.status(400).json({
                success: false,
                error: 'ID d\'offre invalide',
                details: 'L\'identifiant de l\'offre doit être un nombre valide'
            });
        }

        const deletedCount = await OfferBrand.deleteByOffer(parseInt(offerId));

        res.json({
            success: true,
            message: `${deletedCount} relation(s) offre-marque supprimée(s) avec succès`
        });

    } catch (error) {
        console.error('Erreur lors de la suppression des relations de l\'offre:', error);
        
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: 'Impossible de supprimer les relations de l\'offre'
        });
    }
};

// ========================================
// STATISTIQUES ET ANALYSES
// ========================================

/**
 * Récupère les statistiques des relations offer-brand
 */
const getOfferBrandStats = async (req, res) => {
    try {
        const stats = await OfferBrand.getStats();

        res.json({
            success: true,
            message: 'Statistiques récupérées avec succès',
            data: stats
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: 'Impossible de récupérer les statistiques'
        });
    }
};

/**
 * Récupère les marques populaires
 */
const getPopularBrands = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const popularBrands = await OfferBrand.getPopularBrands(parseInt(limit));

        res.json({
            success: true,
            message: 'Marques populaires récupérées avec succès',
            data: popularBrands.map(item => ({
                brandId: item.brandId,
                offerCount: item.dataValues.offerCount,
                brand: item.brand ? {
                    id: item.brand.id,
                    name: item.brand.nameFr,
                    nameAr: item.brand.nameAr,
                    nameFr: item.brand.nameFr,
                    logo: item.brand.logo
                } : null
            }))
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des marques populaires:', error);
        
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            details: 'Impossible de récupérer les marques populaires'
        });
    }
};

module.exports = {
    createOfferBrand,
    createMultipleOfferBrands,
    getBrandsByOffer,
    getOffersByBrand,
    updateOfferBrands,
    deleteOfferBrand,
    deleteOfferBrandsByOffer,
    getOfferBrandStats,
    getPopularBrands
};
