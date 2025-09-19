const { OfferCategory } = require('../models/OfferCategory.js');
const { Offer } = require('../models/Offer.js');
const { Category } = require('../models/Category.js');
const Neo4jSyncService = require('../services/neo4jSyncService');

/**
 * Ajouter une catégorie à une offre
 */
const addCategoryToOffer = async (req, res) => {
  try {
    const { offerId, categoryId } = req.body;

    // Validation des paramètres
    if (!offerId || !categoryId) {
      return res.status(400).json({
        error: "ID d'offre et ID de catégorie sont requis"
      });
    }

    // Vérifier que l'offre existe
    const offer = await Offer.findByPk(offerId);
    if (!offer) {
      return res.status(404).json({
        error: "Offre non trouvée"
      });
    }

    // Vérifier que la catégorie existe
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({
        error: "Catégorie non trouvée"
      });
    }

    console.log(`📝 Ajout de la catégorie ${categoryId} à l'offre ${offerId}`);

    // Ajouter la relation
    const relation = await OfferCategory.addCategoryToOffer(offerId, categoryId);

    // Synchroniser avec Neo4j (asynchrone, non bloquant)
    Neo4jSyncService.syncOfferCategoryRelation(offerId, categoryId, 'CREATE').catch(error => {
      console.error('Erreur synchronisation Neo4j relation offre-catégorie (non bloquant):', error);
    });

    return res.status(200).json({
      success: true,
      data: {
        id: relation.id,
        offerId: relation.offerId,
        categoryId: relation.categoryId,
        isActive: relation.isActive
      },
      message: "Catégorie ajoutée à l'offre avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur addCategoryToOffer:", error);
    return res.status(500).json({
      error: "Erreur lors de l'ajout de la catégorie à l'offre",
      details: error.message || "Erreur inconnue"
    });
  }
};

/**
 * Supprimer une catégorie d'une offre
 */
const removeCategoryFromOffer = async (req, res) => {
  try {
    const { offerId, categoryId } = req.body;

    // Validation des paramètres
    if (!offerId || !categoryId) {
      return res.status(400).json({
        error: "ID d'offre et ID de catégorie sont requis"
      });
    }

    console.log(`🗑️ Suppression de la catégorie ${categoryId} de l'offre ${offerId}`);

    // Supprimer la relation
    await OfferCategory.removeCategoryFromOffer(offerId, categoryId);

    // Synchroniser avec Neo4j (asynchrone, non bloquant)
    Neo4jSyncService.syncOfferCategoryRelation(offerId, categoryId, 'DELETE').catch(error => {
      console.error('Erreur synchronisation Neo4j relation offre-catégorie (non bloquant):', error);
    });

    return res.status(200).json({
      success: true,
      message: "Catégorie supprimée de l'offre avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur removeCategoryFromOffer:", error);
    return res.status(500).json({
      error: "Erreur lors de la suppression de la catégorie de l'offre",
      details: error.message || "Erreur inconnue"
    });
  }
};

/**
 * Récupérer les catégories d'une offre
 */
const getCategoriesByOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    if (!offerId) {
      return res.status(400).json({
        error: "ID d'offre requis"
      });
    }

    console.log(`📋 Récupération des catégories pour l'offre ${offerId}`);

    const categories = await OfferCategory.getCategoriesByOffer(offerId);

    // Convertir en format public
    const publicCategories = categories.map(category => category.getLocalizedData('fr'));

    return res.status(200).json({
      success: true,
      data: publicCategories,
      message: "Catégories récupérées avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur getCategoriesByOffer:", error);
    return res.status(500).json({
      error: "Erreur lors de la récupération des catégories",
      details: error.message || "Erreur inconnue"
    });
  }
};

/**
 * Récupérer les offres d'une catégorie
 */
const getOffersByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({
        error: "ID de catégorie requis"
      });
    }

    console.log(`📋 Récupération des offres pour la catégorie ${categoryId}`);

    const offers = await OfferCategory.getOffersByCategory(categoryId);

    // Convertir en format public
    const publicOffers = offers.map(offer => offer.getPublicData());

    return res.status(200).json({
      success: true,
      data: publicOffers,
      message: "Offres récupérées avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur getOffersByCategory:", error);
    return res.status(500).json({
      error: "Erreur lors de la récupération des offres",
      details: error.message || "Erreur inconnue"
    });
  }
};

/**
 * Vérifier si une relation existe
 */
const checkRelationExists = async (req, res) => {
  try {
    const { offerId, categoryId } = req.query;

    if (!offerId || !categoryId) {
      return res.status(400).json({
        error: "ID d'offre et ID de catégorie sont requis"
      });
    }

    const exists = await OfferCategory.relationExists(offerId, categoryId);

    return res.status(200).json({
      success: true,
      data: { exists },
      message: "Vérification effectuée avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur checkRelationExists:", error);
    return res.status(500).json({
      error: "Erreur lors de la vérification de la relation",
      details: error.message || "Erreur inconnue"
    });
  }
};

/**
 * Récupérer les statistiques des relations
 */
const getRelationStats = async (req, res) => {
  try {
    const stats = await OfferCategory.getRelationStats();

    return res.status(200).json({
      success: true,
      data: stats,
      message: "Statistiques récupérées avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur getRelationStats:", error);
    return res.status(500).json({
      error: "Erreur lors de la récupération des statistiques",
      details: error.message || "Erreur inconnue"
    });
  }
};

module.exports = {
  addCategoryToOffer,
  removeCategoryFromOffer,
  getCategoriesByOffer,
  getOffersByCategory,
  checkRelationExists,
  getRelationStats
};
