const { Store } = require('../models/Store');
const { User } = require('../models/User');
const { Offer } = require('../models/Offer');
const { Delta } = require('../models/Delta');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const cloudinaryService = require('../services/cloudinaryService');

/**
 * Récupérer le store d'un utilisateur
 */
const getStoreByUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const isAuthenticated = req.isAuthenticated;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    if (!isAuthenticated) {
      return res.status(401).json({
        error: 'Unauthorized'
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
    const userId = req.user.userId;
    const isAuthenticated = req.isAuthenticated;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    if (!isAuthenticated) {
      return res.status(401).json({
        error: 'Unauthorized'
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
 * Mettre à jour le store avec upload de fichiers
 */
const updateStore = async (req, res) => {
  let logoPublicId = null;
  let bannerPublicId = null;

  try {
    const { userId } = req.params;
    const {
      name,
      description,
      primaryColor,
      secondaryColor,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    logger.info(`📥 Mise à jour du store pour l'utilisateur ${userId}`, {
      name,
      description,
      primaryColor,
      secondaryColor
    });

    const store = await Store.findByUserId(userId);

    if (!store) {
      return res.status(404).json({
        error: 'Store not found for this user'
      });
    }

    // Récupérer les anciens public_ids pour nettoyage
    const oldLogoUrl = store.logo;
    const oldBannerUrl = store.banner;

    let logoUrl = oldLogoUrl;
    let bannerUrl = oldBannerUrl;

    // ✅ Upload nouveau logo si fourni
    const logoFile = req.files?.logo?.[0];
    if (logoFile) {
      try {
        const logoUploadResult = await cloudinaryService.uploadFromBuffer(
          logoFile.buffer,
          "stores/logos",
          {
            resource_type: "image",
            transformation: [
              {
                quality: "auto:best",
                fetch_format: "auto",
                flags: "lossy",
                bytes_limit: 200000, // 0.2MB max pour le logo
                width: 512,
                height: 512,
                crop: "scale"
              }
            ],
          }
        );
        logoUrl = logoUploadResult.secure_url;
        logoPublicId = logoUploadResult.public_id;
      } catch (uploadError) {
        logger.error("❌ Erreur upload logo:", uploadError);
        return res.status(500).json({
          error: "Erreur lors de l'upload du logo",
          details: uploadError.message || "Erreur inconnue",
        });
      }
    }

    // ✅ Upload nouveau banner si fourni
    const bannerFile = req.files?.banner?.[0];
    if (bannerFile) {
      try {
        const bannerUploadResult = await cloudinaryService.uploadFromBuffer(
          bannerFile.buffer,
          "stores/banners",
          {
            resource_type: "image",
            transformation: [
              {
                quality: "auto:best",
                fetch_format: "auto",
                flags: "lossy",
                bytes_limit: 800000, // 0.8MB max pour le banner
                width: 1920,
                height: 1080,
                crop: "scale"
              }
            ],
          }
        );
        bannerUrl = bannerUploadResult.secure_url;
        bannerPublicId = bannerUploadResult.public_id;
      } catch (uploadError) {
        logger.error("❌ Erreur upload banner:", uploadError);
        // Supprimer le logo si il a été uploadé
        if (logoPublicId) {
          try {
            await cloudinaryService.deleteFile(logoPublicId);
            logger.info("✅ Logo supprimé après erreur banner");
          } catch (deleteError) {
            logger.error("❌ Erreur suppression logo:", deleteError);
          }
        }
        return res.status(500).json({
          error: "Erreur lors de l'upload du banner",
          details: uploadError.message || "Erreur inconnue",
        });
      }
    }

    // ✅ Validation
    if (!name || !description) {
      // Supprimer les nouveaux fichiers uploadés en cas d'erreur de validation
      await cleanupUploadedFiles(logoPublicId, bannerPublicId);
      return res.status(400).json({
        error: "Le nom et la description sont obligatoires"
      });
    }

    // ✅ Validation des couleurs
    const colorRegex = /^#[0-9A-F]{6}$/i;
    if (primaryColor && !colorRegex.test(primaryColor)) {
      await cleanupUploadedFiles(logoPublicId, bannerPublicId);
      return res.status(400).json({
        error: "Format de couleur principale invalide"
      });
    }
    if (secondaryColor && !colorRegex.test(secondaryColor)) {
      await cleanupUploadedFiles(logoPublicId, bannerPublicId);
      return res.status(400).json({
        error: "Format de couleur secondaire invalide"
      });
    }

    // ✅ Mise à jour en base de données
    try {
      const updateData = {
        name,
        description,
        primaryColor: primaryColor || store.primaryColor,
        secondaryColor: secondaryColor || store.secondaryColor,
      };

      // Ajouter les URLs seulement si elles ont été mises à jour
      if (logoUrl !== oldLogoUrl) {
        updateData.logo = logoUrl;
      }
      if (bannerUrl !== oldBannerUrl) {
        updateData.banner = bannerUrl;
      }

      await store.update(updateData);
      const updatedStore = await Store.findByPk(store.id);

      // Supprimer les anciens fichiers Cloudinary si de nouveaux ont été uploadés
      const filesToDelete = [];

      if (logoPublicId && oldLogoUrl) {
        logger.info("🔄 Nouveau logo uploadé, suppression de l'ancien:", oldLogoUrl);
        const oldLogoPublicId = extractPublicIdFromUrl(oldLogoUrl);
        if (oldLogoPublicId) {
          filesToDelete.push(oldLogoPublicId);
          logger.info("🗑️ Ancien logo à supprimer:", oldLogoPublicId);
        }
      }

      if (bannerPublicId && oldBannerUrl) {
        logger.info("🔄 Nouveau banner uploadé, suppression de l'ancien:", oldBannerUrl);
        const oldBannerPublicId = extractPublicIdFromUrl(oldBannerUrl);
        if (oldBannerPublicId) {
          filesToDelete.push(oldBannerPublicId);
          logger.info("🗑️ Ancien banner à supprimer:", oldBannerPublicId);
        }
      }

      if (filesToDelete.length > 0) {
        try {
          await cloudinaryService.deleteMultipleFiles(filesToDelete);
          logger.info("✅ Anciens fichiers supprimés:", filesToDelete);
        } catch (deleteError) {
          logger.error("❌ Erreur suppression anciens fichiers:", deleteError);
        }
      }

      logger.info(`✅ Store mis à jour pour l'utilisateur ${userId}`);

      return res.status(200).json({
        success: true,
        data: updatedStore.getPublicData(),
        message: 'Store mis à jour avec succès'
      });

    } catch (dbError) {
      logger.error("❌ Erreur DB:", dbError);
      // Supprimer les nouveaux fichiers uploadés en cas d'erreur DB
      await cleanupUploadedFiles(logoPublicId, bannerPublicId);
      return res.status(500).json({
        error: "Erreur lors de la mise à jour en base de données",
        details: dbError.message || "Erreur inconnue",
      });
    }

  } catch (err) {
    logger.error("❌ Erreur interne updateStore:", err);
    // Supprimer les nouveaux fichiers uploadés en cas d'erreur interne
    await cleanupUploadedFiles(logoPublicId, bannerPublicId);
    return res.status(500).json({
      error: "Erreur interne du serveur",
      details: err.message || "Erreur inconnue",
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

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

// Fonction utilitaire pour extraire le public_id d'une URL Cloudinary
const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    // Format URL: https://res.cloudinary.com/.../image/upload/v1234567890/stores/logos/uyh8qxffruxt1weq8e9y.jpg
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');

    if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
      // Prendre TOUS les segments après 'upload/v1234567890/' pour reconstituer le chemin complet
      const pathSegments = urlParts.slice(uploadIndex + 2);
      const fullPath = pathSegments.join('/');
      // Enlever l'extension si présente
      const publicId = fullPath.split('.')[0];
      logger.info("🔍 Public ID extrait:", publicId, "depuis:", url);
      return publicId;
    }

    logger.warn("⚠️ Impossible d'extraire le public_id de l'URL:", url);
    return null;
  } catch (error) {
    logger.error("❌ Erreur lors de l'extraction du public_id:", error);
    return null;
  }
};

// Fonction utilitaire pour nettoyer les fichiers uploadés en cas d'erreur
const cleanupUploadedFiles = async (logoPublicId, bannerPublicId) => {
  const filesToDelete = [];

  if (logoPublicId) {
    filesToDelete.push(logoPublicId);
    logger.info("🗑️ Logo à supprimer:", logoPublicId);
  }
  if (bannerPublicId) {
    filesToDelete.push(bannerPublicId);
    logger.info("🗑️ Banner à supprimer:", bannerPublicId);
  }

  if (filesToDelete.length > 0) {
    try {
      await cloudinaryService.deleteMultipleFiles(filesToDelete);
      logger.info("✅ Fichiers supprimés après erreur:", filesToDelete);
    } catch (deleteError) {
      logger.error("❌ Erreur lors de la suppression des fichiers:", deleteError);
    }
  }
};

module.exports = {
  getStoreByUser,
  getStoreInfo,
  updateStore,
  createStore
};
