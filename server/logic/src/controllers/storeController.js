const { Store } = require('../models/Store');
const { User } = require('../models/User');
const { Offer } = require('../models/Offer');
const { Delta } = require('../models/Delta');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Récupérer le store d'un utilisateur
 */
const getStoreByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    logger.info(`📥 Récupération du store pour l'utilisateur ${userId}`);

    const store = await Store.findByUserId(userId);

    if (!store) {
      return res.status(404).json({
        error: 'Store not found for this user'
      });
    }

    // Récupérer les informations de l'utilisateur
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const storeData = {
      ...store.getPublicData(),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone
      }
    };

    logger.info(`✅ Store récupéré pour l'utilisateur ${userId}`);

    return res.status(200).json({
      success: true,
      data: storeData,
      message: 'Store retrieved successfully'
    });

  } catch (error) {
    logger.error('❌ Erreur getStoreByUser:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

/**
 * Récupérer les informations complètes du store avec statistiques
 */
const getStoreInfo = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    logger.info(`📥 Récupération des informations complètes du store pour l'utilisateur ${userId}`);

    const store = await Store.findByUserId(userId);

    if (!store) {
      return res.status(404).json({
        error: 'Store not found for this user'
      });
    }

    // Récupérer les informations de l'utilisateur
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Calculer les statistiques
    const stats = await calculateStoreStats(userId);

    const storeInfo = {
      ...store.getPublicData(),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone
      },
      stats: stats
    };

    logger.info(`✅ Informations complètes du store récupérées pour l'utilisateur ${userId}`);

    return res.status(200).json({
      success: true,
      data: storeInfo,
      message: 'Store information retrieved successfully'
    });

  } catch (error) {
    logger.error('❌ Erreur getStoreInfo:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

/**
 * Calculer les statistiques du store
 */
const calculateStoreStats = async (userId) => {
  try {
    // Nombre total d'offres
    const totalOffers = await Offer.count({
      where: { sellerId: userId }
    });

    // Nombre d'offres actives
    const activeOffers = await Offer.count({
      where: { 
        sellerId: userId,
        status: 'available'
      }
    });

    // Nombre total de commandes (via les deltas acceptés)
    const totalOrders = await Delta.count({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ],
        isAccepted: true
      }
    });

    // Nombre de commandes en attente
    const pendingOrders = await Delta.count({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ],
        isAccepted: false
      }
    });

    // Calculer le rating moyen (pour l'instant, on utilise une valeur par défaut)
    // TODO: Implémenter le système de rating
    const averageRating = 4.8; // Valeur par défaut
    const totalReviews = 0; // À implémenter

    // Nombre de vues (simulation - à implémenter avec un système de tracking)
    const totalViews = Math.floor(Math.random() * 1000) + 100;

    return {
      totalOffers,
      activeOffers,
      totalOrders,
      pendingOrders,
      averageRating,
      totalReviews,
      totalViews,
      completionRate: totalOffers > 0 ? Math.round((activeOffers / totalOffers) * 100) : 0
    };

  } catch (error) {
    logger.error('❌ Erreur calculateStoreStats:', error);
    return {
      totalOffers: 0,
      activeOffers: 0,
      totalOrders: 0,
      pendingOrders: 0,
      averageRating: 0,
      totalReviews: 0,
      totalViews: 0,
      completionRate: 0
    };
  }
};

/**
 * Mettre à jour le store
 */
const updateStore = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    logger.info(`📥 Mise à jour du store pour l'utilisateur ${userId}`);

    const store = await Store.findByUserId(userId);

    if (!store) {
      return res.status(404).json({
        error: 'Store not found for this user'
      });
    }

    // Mettre à jour le store
    const updatedStore = await Store.updateStore(store.id, updateData);

    logger.info(`✅ Store mis à jour pour l'utilisateur ${userId}`);

    return res.status(200).json({
      success: true,
      data: updatedStore.getPublicData(),
      message: 'Store updated successfully'
    });

  } catch (error) {
    logger.error('❌ Erreur updateStore:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

/**
 * Créer un store
 */
const createStore = async (req, res) => {
  try {
    const storeData = req.body;

    if (!storeData.userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    logger.info(`📥 Création d'un nouveau store pour l'utilisateur ${storeData.userId}`);

    // Vérifier si l'utilisateur existe
    const user = await User.findByPk(storeData.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Créer le store
    const newStore = await Store.createStore(storeData);

    logger.info(`✅ Store créé avec succès pour l'utilisateur ${storeData.userId}`);

    return res.status(201).json({
      success: true,
      data: newStore.getPublicData(),
      message: 'Store created successfully'
    });

  } catch (error) {
    logger.error('❌ Erreur createStore:', error);
    
    if (error.message.includes('déjà un magasin')) {
      return res.status(409).json({
        error: 'User already has a store',
        details: error.message
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

module.exports = {
  getStoreByUser,
  getStoreInfo,
  updateStore,
  createStore
};
