const axios = require('axios');

const GRAPH_SERVICE_URL = process.env.GRAPH_SERVICE_URL || 'http://localhost:8002';

/**
 * Récupère les recommandations d'échange pour une offre
 */
const getExchangeRecommendations = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { limit = 10 } = req.query;

    if (!offerId) {
      return res.status(400).json({
        error: "ID d'offre requis"
      });
    }

    console.log(`📋 Récupération des recommandations pour l'offre ${offerId}`);

    // Appeler le Graph Service
    const response = await axios.get(`${GRAPH_SERVICE_URL}/recommendations/exchange/${offerId}`, {
      params: { limit: parseInt(limit) },
      timeout: 10000
    });

    return res.status(200).json({
      success: true,
      data: response.data.data,
      total: response.data.total,
      message: response.data.message
    });

  } catch (error) {
    console.error("❌ Erreur getExchangeRecommendations:", error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: "Erreur lors de la récupération des recommandations",
        details: error.response.data?.detail || error.message
      });
    }

    return res.status(500).json({
      error: "Erreur lors de la récupération des recommandations",
      details: error.message || "Erreur inconnue"
    });
  }
};

/**
 * Récupère toutes les recommandations d'un utilisateur
 */
const getUserRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: "ID utilisateur requis"
      });
    }

    console.log(`📋 Récupération des recommandations pour l'utilisateur ${userId}`);

    // Appeler le Graph Service
    const response = await axios.get(`${GRAPH_SERVICE_URL}/recommendations/user/${userId}`, {
      params: { limit: parseInt(limit) },
      timeout: 10000
    });

    return res.status(200).json({
      success: true,
      data: response.data.data,
      totalOffers: response.data.totalOffers,
      message: response.data.message
    });

  } catch (error) {
    console.error("❌ Erreur getUserRecommendations:", error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: "Erreur lors de la récupération des recommandations",
        details: error.response.data?.detail || error.message
      });
    }

    return res.status(500).json({
      error: "Erreur lors de la récupération des recommandations",
      details: error.message || "Erreur inconnue"
    });
  }
};

module.exports = {
  getExchangeRecommendations,
  getUserRecommendations
};
