const express = require('express');
const router = express.Router();
const { getCategoriesByListingType, getAllCategories } = require('../controllers/categoryController.js');

// GET /api/categories/listing-type/:listingType - Récupérer les catégories par type de listing
router.get('/listing-type/:listingType', getCategoriesByListingType);

// GET /api/categories - Récupérer toutes les catégories
router.get('/', getAllCategories);

module.exports = router;