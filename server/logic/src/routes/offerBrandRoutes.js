const express = require('express');
const router = express.Router();
const offerBrandController = require('../controllers/offerBrandController');

// ========================================
// ROUTES DE CRÉATION
// ========================================

/**
 * @route   POST /api/offer-brands
 * @desc    Crée une relation offer-brand
 * @access  Public
 */
router.post('/', offerBrandController.createOfferBrand);

/**
 * @route   POST /api/offer-brands/multiple
 * @desc    Crée plusieurs relations offer-brand
 * @access  Public
 */
router.post('/multiple', offerBrandController.createMultipleOfferBrands);

// ========================================
// ROUTES DE RÉCUPÉRATION
// ========================================

/**
 * @route   GET /api/offer-brands/offer/:offerId
 * @desc    Récupère les marques d'une offre
 * @access  Public
 */
router.get('/offer/:offerId', offerBrandController.getBrandsByOffer);

/**
 * @route   GET /api/offer-brands/brand/:brandId
 * @desc    Récupère les offres d'une marque
 * @access  Public
 */
router.get('/brand/:brandId', offerBrandController.getOffersByBrand);

// ========================================
// ROUTES DE MISE À JOUR
// ========================================

/**
 * @route   PUT /api/offer-brands/offer/:offerId
 * @desc    Met à jour les marques d'une offre (remplace toutes les relations existantes)
 * @access  Public
 */
router.put('/offer/:offerId', offerBrandController.updateOfferBrands);

// ========================================
// ROUTES DE SUPPRESSION
// ========================================

/**
 * @route   DELETE /api/offer-brands/:offerId/:brandId
 * @desc    Supprime une relation offer-brand spécifique
 * @access  Public
 */
router.delete('/:offerId/:brandId', offerBrandController.deleteOfferBrand);

/**
 * @route   DELETE /api/offer-brands/offer/:offerId
 * @desc    Supprime toutes les relations d'une offre
 * @access  Public
 */
router.delete('/offer/:offerId', offerBrandController.deleteOfferBrandsByOffer);

// ========================================
// ROUTES DE STATISTIQUES
// ========================================

/**
 * @route   GET /api/offer-brands/stats
 * @desc    Récupère les statistiques des relations offer-brand
 * @access  Public
 */
router.get('/stats', offerBrandController.getOfferBrandStats);

/**
 * @route   GET /api/offer-brands/popular
 * @desc    Récupère les marques populaires basées sur les offres
 * @access  Public
 */
router.get('/popular', offerBrandController.getPopularBrands);

module.exports = router;
