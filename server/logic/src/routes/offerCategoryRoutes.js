const express = require('express');
const router = express.Router();
const { 
  addCategoryToOffer, 
  removeCategoryFromOffer, 
  getCategoriesByOffer, 
  getOffersByCategory, 
  checkRelationExists, 
  getRelationStats 
} = require('../controllers/offerCategoryController.js');

// POST /api/offer-categories/add - Ajouter une catégorie à une offre
router.post('/add', addCategoryToOffer);

// POST /api/offer-categories/remove - Supprimer une catégorie d'une offre
router.post('/remove', removeCategoryFromOffer);

// GET /api/offer-categories/offer/:offerId - Récupérer les catégories d'une offre
router.get('/offer/:offerId', getCategoriesByOffer);

// GET /api/offer-categories/category/:categoryId - Récupérer les offres d'une catégorie
router.get('/category/:categoryId', getOffersByCategory);

// GET /api/offer-categories/exists - Vérifier si une relation existe
router.get('/exists', checkRelationExists);

// GET /api/offer-categories/stats - Récupérer les statistiques des relations
router.get('/stats', getRelationStats);

module.exports = router;
