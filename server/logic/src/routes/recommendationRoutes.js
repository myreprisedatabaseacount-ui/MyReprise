const express = require('express');
const router = express.Router();
const { getExchangeRecommendations, getUserRecommendations } = require('../controllers/recommendationController.js');

// GET /api/recommendations/exchange/:offerId - Récupérer les recommandations d'échange pour une offre
router.get('/exchange/:offerId', getExchangeRecommendations);

// GET /api/recommendations/user/:userId - Récupérer toutes les recommandations d'un utilisateur
router.get('/user/:userId', getUserRecommendations);

module.exports = router;
