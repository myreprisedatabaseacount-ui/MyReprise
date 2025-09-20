const cloudinaryService = require("../services/cloudinaryService.js");
const { Offer } = require("../models/Offer.js");
const { Product } = require("../models/Product.js");
const { OfferCategory } = require("../models/OfferCategory.js");
const db = require("../config/db");
const createOfferImageModel = require("../models/OfferImage.js");

// Initialiser le modèle OfferImage
const sequelize = db.getSequelize();
const OfferImage = createOfferImageModel(sequelize);

// Fonction utilitaire pour extraire le public_id d'une URL Cloudinary
const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  
  try {
    // Format URL: https://res.cloudinary.com/.../image/upload/v1234567890/offers/images/uyh8qxffruxt1weq8e9y.jpg
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
const cleanupUploadedFiles = async (publicIds) => {
  if (!publicIds || publicIds.length === 0) return;
  
  try {
    await cloudinaryService.deleteMultipleFiles(publicIds);
    console.log("✅ Fichiers supprimés après erreur:", publicIds);
  } catch (deleteError) {
    console.error("❌ Erreur lors de la suppression des fichiers:", deleteError);
  }
};

const createOffer = async (req, res) => {
  let uploadedPublicIds = [];
  
  try {
    const {
      title,
      description,
      price,
      status = 'available',
      productCondition = 'good',
      listingType,
      sellerId,
      categoryId,
      brandId,
      subjectId,
      // Données spécifiques (seront dans specificData)
      specificData,
      // Localisation
      addressId
    } = req.body;

    console.log('📥 Données reçues pour création d\'offre:', {
      title,
      description,
      price,
      status,
      productCondition,
      listingType,
      sellerId,
      categoryId,
      brandId,
      subjectId,
      specificData,
      addressId
    });

    // ✅ Vérification des fichiers
    const imageFiles = req.files || [];

    let imageUrls = [];

    // ✅ Upload des images vers Cloudinary
    if (imageFiles.length > 0) {
      try {
        for (const imageFile of imageFiles) {
          const imageUploadResult = await cloudinaryService.uploadFromBuffer(
            imageFile.buffer,
            "offers/images",
            {
              resource_type: "image",
              transformation: [
                {
                  quality: "auto:best",   // compression intelligente haute qualité
                  fetch_format: "auto",   // WebP/AVIF si dispo
                  flags: "lossy",
                  bytes_limit: 400000     // limite stricte à 0.4 MB
                }
              ],
            }
          );
          imageUrls.push(imageUploadResult.secure_url);
          uploadedPublicIds.push(imageUploadResult.public_id);
        }
      } catch (uploadError) {
        console.error("❌ Erreur upload images:", uploadError);
        // Supprimer les fichiers déjà uploadés
        await cleanupUploadedFiles(uploadedPublicIds);
        return res.status(500).json({
          error: "Erreur lors de l'upload des images",
          details: uploadError.message || "Erreur inconnue",
        });
      }
    }

    // ✅ Validation des données obligatoires
    if (!title || !description || !price || !listingType) {
      await cleanupUploadedFiles(uploadedPublicIds);
      return res.status(400).json({
        error: "Titre, description, prix et type de listing sont obligatoires"
      });
    }

    if (imageUrls.length === 0) {
      await cleanupUploadedFiles(uploadedPublicIds);
      return res.status(400).json({
        error: "Au moins une image est obligatoire"
      });
    }

    // ✅ Validation du prix
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      await cleanupUploadedFiles(uploadedPublicIds);
      return res.status(400).json({
        error: "Le prix doit être un nombre positif"
      });
    }

    // ✅ Pas de validation des specificData - flexibilité totale
    // Les specificData sont acceptés tels quels, sans validation de format ou de contenu

    // ✅ Sauvegarde en base de données
    try {
      // 1. Créer d'abord le Product
      const productData = {
        createdBy: sellerId ? parseInt(sellerId) : 1, // TODO: Récupérer depuis l'auth
        nameAr: title.trim(), // Utiliser le titre comme nom arabe
        nameFr: title.trim(), // Utiliser le titre comme nom français
        descriptionAr: description.trim(),
        descriptionFr: description.trim(),
        brandId: brandId ? parseInt(brandId) : null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        isActive: true
      };

      console.log('📦 Création du produit:', productData);
      const product = await Product.createProduct(productData);
      console.log('✅ Produit créé avec ID:', product.id);

      // 2. Créer ensuite l'Offer avec productId (sans les images)
      const offerData = {
        productId: product.id, // Référence vers le produit créé
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        status,
        productCondition,
        listingType,
        sellerId: sellerId ? parseInt(sellerId) : 1, // TODO: Récupérer depuis l'auth
        categoryId: categoryId ? parseInt(categoryId) : null,
        brandId: brandId ? parseInt(brandId) : null,
        subjectId: subjectId ? parseInt(subjectId) : null,
        addressId: addressId ? parseInt(addressId) : null,
        // Données spécifiques dans un objet JSON
        specificData: specificData ? JSON.stringify(specificData) : null,
        isDeleted: false,
      };

      console.log('📋 Création de l\'offre:', offerData);
      const offer = await Offer.createOffer(offerData);

      // 3. Créer les enregistrements OfferImage pour chaque image
      console.log('🖼️ Création des enregistrements d\'images pour l\'offre:', offer.id);
      const offerImages = [];
      for (let i = 0; i < imageUrls.length; i++) {
        const imageData = {
          offerId: offer.id,
          imageUrl: imageUrls[i],
          isMain: i === 0, // La première image est l'image principale
          color: null, // Peut être rempli plus tard si nécessaire
          colorHex: null
        };
        
        const offerImage = await OfferImage.create(imageData);
        offerImages.push(offerImage);
        console.log(`✅ Image ${i + 1} créée avec ID:`, offerImage.id);
      }

      // Synchroniser l'offre vers Neo4j
      try {
        const Neo4jSyncService = require('../services/neo4jSyncService');
        await Neo4jSyncService.syncOffer(offer.id, offerData, 'CREATE');
        console.log(`✅ Offre ${offer.id} synchronisée vers Neo4j`);
      } catch (syncError) {
        console.error('⚠️ Erreur synchronisation offre vers Neo4j (non bloquant):', syncError);
      }

      // Récupérer les images depuis OfferImage pour la réponse
      const offerImagesData = offerImages.map(img => ({
        id: img.id,
        imageUrl: img.imageUrl,
        isMain: img.isMain,
        color: img.color,
        colorHex: img.colorHex
      }));

      return res.status(201).json({
        success: true,
        data: { 
          id: offer.id, 
          productId: product.id,
          title: offer.title, 
          price: offer.price,
          images: offerImagesData, // Images depuis OfferImage
          listingType: offer.listingType,
          product: {
            id: product.id,
            nameAr: product.nameAr,
            nameFr: product.nameFr,
            categoryId: product.categoryId,
            brandId: product.brandId
          }
        },
        message: "Offre créée avec succès",
      });
    } catch (dbError) {
      console.error("❌ Erreur DB:", dbError);
      // Supprimer les fichiers uploadés en cas d'erreur DB
      await cleanupUploadedFiles(uploadedPublicIds);
      return res.status(500).json({
        error: "Erreur lors de la création en base de données",
        details: dbError.message || "Erreur inconnue",
      });
    }
  } catch (err) {
    console.error("❌ Erreur interne:", err);
    // Supprimer les fichiers uploadés en cas d'erreur interne
    await cleanupUploadedFiles(uploadedPublicIds);
    return res.status(500).json({
      error: "Erreur interne du serveur",
      details: err.message || "Erreur inconnue",
    });
  }
};

const getOffers = async (req, res) => {
  try {
    const {
      search,
      listingType,
      categoryId,
      brandId,
      sellerId,
      minPrice,
      maxPrice,
      productCondition,
      status = 'available',
      page = 1,
      limit = 10
    } = req.query;

    // Validation spécifique pour la route /offers/seller/:sellerId mappée vers ce contrôleur
    if (req.params && req.params.sellerId !== undefined) {
      const paramSellerId = req.params.sellerId;
      if (!paramSellerId) {
        return res.status(400).json({ error: "ID utilisateur requis" });
      }
      if (isNaN(parseInt(paramSellerId))) {
        return res.status(400).json({ error: "ID utilisateur invalide" });
      }
    }

    // Construire les filtres
    const filters = {};
    
    if (listingType) filters.listingType = listingType;
    if (categoryId) filters.categoryId = parseInt(categoryId);
    if (brandId) filters.brandId = parseInt(brandId);
    // Prioriser l'ID vendeur provenant de l'URL /seller/:sellerId
    const effectiveSellerId = req.params && req.params.sellerId ? parseInt(req.params.sellerId) : (sellerId ? parseInt(sellerId) : undefined);
    if (effectiveSellerId !== undefined) filters.sellerId = effectiveSellerId;
    if (productCondition) filters.productCondition = productCondition;
    if (status) filters.status = status;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (search) filters.search = search;

    // Récupérer les offres avec pagination
    const result = await Offer.findWithPagination(
      parseInt(page), 
      parseInt(limit), 
      filters
    );

    // Si la route était /seller/:sellerId et qu'aucune offre n'est trouvée, vérifier si l'utilisateur existe
    if (req.params && req.params.sellerId !== undefined && result.totalCount === 0) {
      try {
        const { User } = require("../models/User.js");
        const user = await User.findByPk(parseInt(req.params.sellerId));
        if (!user) {
          return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
      } catch (userErr) {
        // En cas d'erreur inattendue lors de la vérification utilisateur, ne pas casser la réponse des offres
        console.warn('⚠️ Vérification utilisateur échouée:', userErr.message);
      }
    }

    // Si la route était /seller/:sellerId et qu'aucune offre n'est trouvée, vérifier si l'utilisateur existe
    if (req.params && req.params.sellerId !== undefined && result.totalCount === 0) {
      try {
        const { User } = require("../models/User.js");
        const user = await User.findByPk(parseInt(req.params.sellerId));
        if (!user) {
          return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
      } catch (userErr) {
        // En cas d'erreur inattendue lors de la vérification utilisateur, ne pas casser la réponse des offres
        console.warn('⚠️ Vérification utilisateur échouée:', userErr.message);
      }
    }

    // Récupérer les images depuis OfferImage pour chaque offre
    const offersWithImages = await Promise.all(result.offers.map(async (offer) => {
      const offerData = offer.getPublicData();
      
      // Récupérer les images depuis OfferImage
      const offerImages = await OfferImage.findAll({
        where: { offerId: offer.id },
        order: [['isMain', 'DESC'], ['id', 'ASC']] // Image principale en premier
        
      });
      
      offerData.images = offerImages.map(img => ({
        id: img.id,
        imageUrl: img.imageUrl,
        isMain: img.isMain,
        color: img.color,
        colorHex: img.colorHex
      }));
      
      return offerData;
    }));

    return res.status(200).json({
      success: true,
      data: offersWithImages,
      pagination: {
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        limit: parseInt(limit)
      },
      message: "Offres récupérées avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur getOffers:", error);
    return res.status(500).json({
      error: "Erreur lors de la récupération des offres",
      details: error.message || "Erreur inconnue"
    });
  }
};

const getOfferById = async (req, res) => {
  try {
    const offerId = req.params.id;
    
    if (!offerId) {
      return res.status(400).json({
        error: "ID d'offre requis"
      });
    }

    // Utiliser la nouvelle méthode pour récupérer l'offre avec toutes ses relations
    const offerData = await Offer.findCompleteById(offerId);
    
    if (!offerData) {
      return res.status(404).json({
        error: "Offre non trouvée"
      });
    }

    
    // Récupérer les images depuis OfferImage
    const offerImages = await OfferImage.findAll({
      where: { offerId: parseInt(offerId) },
      order: [['isMain', 'DESC'], ['id', 'ASC']] // Image principale en premier
    });
    
    offerData.images = offerImages.map(img => ({
      id: img.id,
      imageUrl: img.imageUrl,
      isMain: img.isMain,
      color: img.color,
      colorHex: img.colorHex
    }));

    return res.status(200).json({
      success: true,
      data: offerData,
      message: "Offre récupérée avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur getOfferById:", error);
    return res.status(500).json({
      error: "Erreur lors de la récupération de l'offre",
      details: error.message || "Erreur inconnue"
    });
  }
};

const updateOffer = async (req, res) => {
  try {
    const offerId = req.params.id;
    const updateData = req.body;

    const offer = await Offer.findByPk(offerId);
    if (!offer) {
      return res.status(404).json({
        error: "Offre non trouvée"
      });
    }

    const updatedOffer = await Offer.updateOffer(offerId, updateData);

    return res.status(200).json({
      success: true,
      data: updatedOffer.getPublicData(),
      message: "Offre mise à jour avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur updateOffer:", error);
    return res.status(500).json({
      error: "Erreur lors de la mise à jour de l'offre",
      details: error.message || "Erreur inconnue"
    });
  }
};

const deleteOffer = async (req, res) => {
  try {
    const offerId = req.params.id;

    const offer = await Offer.findByPk(offerId);
    if (!offer) {
      return res.status(404).json({
        error: "Offre non trouvée"
      });
    }

    await Offer.deleteOffer(offerId);

    return res.status(200).json({
      success: true,
      message: "Offre supprimée avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur deleteOffer:", error);
    return res.status(500).json({
      error: "Erreur lors de la suppression de l'offre",
      details: error.message || "Erreur inconnue"
    });
  }
};

const getCategoriesToExchange = async (req, res) => {
  try {
    const { offerId } = req.params;

    if (!offerId) {
      return res.status(400).json({
        error: "ID d'offre requis"
      });
    }

    // Vérifier que l'offre existe
    const offer = await Offer.findByPk(offerId);
    if (!offer) {
      return res.status(404).json({
        error: "Offre non trouvée"
      });
    }

    console.log(`📋 Récupération des catégories d'échange pour l'offre ${offerId}`);

    // Récupérer les catégories d'échange de cette offre
    const exchangeCategories = await OfferCategory.getCategoriesByOffer(offerId);

    // Convertir en format public
    const publicCategories = exchangeCategories.map(category => category.getLocalizedData('fr'));

    return res.status(200).json({
      success: true,
      data: publicCategories,
      message: "Catégories d'échange récupérées avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur getCategoriesToExchange:", error);
    return res.status(500).json({
      error: "Erreur lors de la récupération des catégories d'échange",
      details: error.message || "Erreur inconnue"
    });
  }
};

module.exports = {
  createOffer,
  getOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
  getCategoriesToExchange,
};
