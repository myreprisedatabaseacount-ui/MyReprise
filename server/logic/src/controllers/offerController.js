const cloudinaryService = require("../services/cloudinaryService.js");
const { Offer } = require("../models/Offer.js");
const { Product } = require("../models/Product.js");
const { Category } = require("../models/Category.js");
const { OfferCategory } = require("../models/OfferCategory.js");
const { OfferBrand } = require("../models/OfferBrand.js");
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
      addressId,
      // Catégories d'échange
      exchangeCategories = [],
      // Marques d'échange
      exchangeBrands = []
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
      addressId,
      exchangeCategories,
      exchangeBrands
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
    if (!title || !price || !listingType) {
      await cleanupUploadedFiles(uploadedPublicIds);
      return res.status(400).json({
        error: "Titre, prix et type de listing sont obligatoires"
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
        descriptionAr: description ? description.trim() : '', // Description optionnelle
        descriptionFr: description ? description.trim() : '', // Description optionnelle
        brandId: brandId ? parseInt(brandId) : null,
        categoryId: categoryId ? parseInt(categoryId) : null,
      };

      console.log('📦 Création du produit:', productData);
      const product = await Product.createProduct(productData);
      console.log('✅ Produit créé avec ID:', product.id);

      // 2. Créer ensuite l'Offer avec productId (sans les images)
      const offerData = {
        productId: product.id, // Référence vers le produit créé
        title: title.trim(),
        description: description ? description.trim() : '', // Description optionnelle
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

      // Ajouter les catégories d'échange si elles sont fournies
      if (exchangeCategories && exchangeCategories.length > 0) {
        console.log(`🔄 Ajout des catégories d'échange pour l'offre ${offer.id}:`, exchangeCategories);
        
        try {
          for (const categoryId of exchangeCategories) {
            // Vérifier que la catégorie existe
            const category = await Category.findByPk(categoryId);
            if (category) {
              await OfferCategory.addCategoryToOffer(offer.id, categoryId);
              console.log(`✅ Catégorie d'échange ${categoryId} ajoutée à l'offre ${offer.id}`);
            } else {
              console.warn(`⚠️ Catégorie ${categoryId} non trouvée, ignorée`);
            }
          }
          
          // Synchroniser les relations avec Neo4j (asynchrone, non bloquant)
          for (const categoryId of exchangeCategories) {
            Neo4jSyncService.syncOfferCategoryRelation(offer.id, categoryId, 'CREATE').catch(error => {
              console.error('Erreur synchronisation Neo4j relation offre-catégorie (non bloquant):', error);
            });
          }
        } catch (categoryError) {
          console.error('❌ Erreur lors de l\'ajout des catégories d\'échange:', categoryError);
          // Ne pas faire échouer la création de l'offre pour une erreur de catégories
        }
      }

      // Ajouter les marques d'échange si elles sont fournies
      if (exchangeBrands && exchangeBrands.length > 0) {
        console.log(`🏷️ Ajout des marques d'échange pour l'offre ${offer.id}:`, exchangeBrands);
        
        try {
          const brandRelations = await OfferBrand.createMultipleOfferBrands(offer.id, exchangeBrands);
          console.log(`✅ ${brandRelations.length} marque(s) d'échange ajoutée(s) à l'offre ${offer.id}`);
        } catch (brandError) {
          console.error('❌ Erreur lors de l\'ajout des marques d\'échange:', brandError);
          // Ne pas faire échouer la création de l'offre pour une erreur de marques
        }
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
      category, // Ajouter le paramètre 'category' de l'URL
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
    // Prioriser categoryId, sinon utiliser category
    let effectiveCategoryId = categoryId || category;
    if (effectiveCategoryId !== undefined && isNaN(parseInt(effectiveCategoryId))) {
      effectiveCategoryId = undefined;
    }
    if (effectiveCategoryId) {
      filters.categoryId = parseInt(effectiveCategoryId);
      console.log(`🔍 Filtre par catégorie appliqué: categoryId=${filters.categoryId}`);
    }
    if (brandId) filters.brandId = parseInt(brandId);
    // Prioriser l'ID vendeur provenant de l'URL /seller/:sellerId
    const effectiveSellerId = req.params && req.params.sellerId ? parseInt(req.params.sellerId) : (sellerId ? parseInt(sellerId) : undefined);
    if (effectiveSellerId !== undefined) filters.sellerId = effectiveSellerId;
    if (productCondition) filters.productCondition = productCondition;
    if (status) filters.status = status;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (search) filters.search = search;

    // Gestion spéciale pour la route corbeille
    if (req.route.path === '/trash/:sellerId') {
      filters.isDeleted = true; // Récupérer seulement les offres supprimées
    } else {
      filters.isDeleted = false; // Récupérer seulement les offres non supprimées
    }

    // Récupérer les offres avec pagination et détails
    const result = await Offer.getOffersWithDetails(
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
      // Récupérer les images depuis OfferImage
      const offerImages = await OfferImage.findAll({
        where: { offerId: offer.id },
        order: [['isMain', 'DESC'], ['id', 'ASC']] // Image principale en premier
      });
      
      return {
        ...offer,
        images: offerImages.map(img => ({
        id: img.id,
        imageUrl: img.imageUrl,
        isMain: img.isMain,
        color: img.color,
        colorHex: img.colorHex
        }))
      };
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

const getMyOffers = async (req, res) => {
  try {
    const {
      search,
      listingType,
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      productCondition,
      status = 'available',
      page = 1,
      limit = 10
    } = req.query;
    
    const sellerId = req.user.userId;

    // L'utilisateur doit être authentifié
    if (!sellerId) {
      return res.status(401).json({ error: "Authentification requise" });
    }

    // Construire les filtres
    const filters = {};

    // Forcer le filtrage par l'utilisateur authentifié uniquement
    filters.sellerId = parseInt(sellerId);
    if (listingType) filters.listingType = listingType;
    if (categoryId) filters.categoryId = parseInt(categoryId);
    if (brandId) filters.brandId = parseInt(brandId);
    if (productCondition) filters.productCondition = productCondition;
    if (status) filters.status = status;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (search) filters.search = search;

    // Récupérer les offres avec pagination et détails
    const result = await Offer.getOffersWithDetails(
      parseInt(page),
      parseInt(limit),
      filters
    );

    // Vérifications liées à req.params.sellerId non nécessaires ici: on filtre toujours par l'utilisateur connecté

    // Récupérer les images depuis OfferImage pour chaque offre
    const offersWithImages = await Promise.all(result.offers.map(async (offer) => {
      // Récupérer les images depuis OfferImage
      const offerImages = await OfferImage.findAll({
        where: { offerId: offer.id },
        order: [['isMain', 'DESC'], ['id', 'ASC']] // Image principale en premier
      });

      return {
        ...offer,
        images: offerImages.map(img => ({
          id: img.id,
          imageUrl: img.imageUrl,
          isMain: img.isMain,
          color: img.color,
          colorHex: img.colorHex
        }))
      };
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
    const route = req.route.path;

    const offer = await Offer.findByPk(offerId);
    if (!offer) {
      return res.status(404).json({
        error: "Offre non trouvée"
      });
    }

    // Gérer les différentes routes
    if (route === '/:id/status') {
      // Changer seulement le statut
      if (!updateData.status) {
        return res.status(400).json({
          error: "Statut requis"
        });
      }

      const validStatuses = ['available', 'exchanged', 'archived'];
      if (!validStatuses.includes(updateData.status)) {
        return res.status(400).json({
          error: "Statut invalide. Valeurs autorisées: available, exchanged, archived"
        });
      }

      // Vérifier si l'offre a été échangée
      if (offer.replacedByOfferId !== null && offer.replacedByOfferId !== undefined) {
        return res.status(400).json({
          error: "Cet article n'est pas disponible chez vous actuellement",
          details: "Cette offre a été échangée et ne peut plus être modifiée"
        });
      }

      await offer.update({ status: updateData.status });

      return res.status(200).json({
        success: true,
        data: offer.getPublicData(),
        message: `Statut de l'offre changé vers ${updateData.status}`
      });
    } else if (route === '/:id/archive') {
      // Archiver l'offre
      await offer.update({ status: 'archived' });

      return res.status(200).json({
        success: true,
        data: offer.getPublicData(),
        message: "Offre archivée avec succès"
      });
    } else if (route === '/:id/exchange') {
      // Échanger l'offre
      if (!updateData.replacedByOfferId) {
        return res.status(400).json({
          error: "ID de l'offre de remplacement requis"
        });
      }

      await offer.update({
        status: 'exchanged',
        replacedByOfferId: updateData.replacedByOfferId
      });

      return res.status(200).json({
        success: true,
        data: offer.getPublicData(),
        message: "Offre échangée avec succès"
      });
    } else if (route === '/:id/restore') {
      // Restaurer l'offre depuis la corbeille
      console.log('🔍 Restauration de l\'offre:', offer);
      if (!offer.isDeleted) {
        return res.status(400).json({
          error: "Cette offre n'est pas dans la corbeille"
        });
      }

      await offer.update({ isDeleted: false });

      return res.status(200).json({
        success: true,
        data: offer.getPublicData(),
        message: "Offre restaurée avec succès"
      });
    } else {
      // Mise à jour complète de l'offre
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
          addressId,
          specificData,
          exchangeCategories = [],
          exchangeBrands = [],
          imagesToDelete = [],
          existingImages = []
        } = updateData;

        // Extraire les nouvelles images depuis req.files
        const newImages = req.files && req.files.newImages ? req.files.newImages : [];
        
        console.log('🔍 Fichiers reçus pour mise à jour:', {
          filesKeys: req.files ? Object.keys(req.files) : 'Aucun fichier',
          newImagesCount: newImages.length,
          newImages: newImages.map(img => ({ fieldname: img.fieldname, originalname: img.originalname, mimetype: img.mimetype }))
        });

        let uploadedPublicIds = [];

        // 1. Supprimer les images marquées pour suppression
        if (imagesToDelete && imagesToDelete.length > 0) {
          console.log(`🗑️ Suppression de ${imagesToDelete.length} image(s) de l'offre ${offerId}`);
          
          for (const imageId of imagesToDelete) {
            try {
              // Récupérer l'image depuis la base de données
              const imageToDelete = await OfferImage.findByPk(imageId);
              if (imageToDelete) {
                // Extraire le public_id de l'URL Cloudinary
                const publicId = extractPublicIdFromUrl(imageToDelete.imageUrl);
                if (publicId) {
                  // Supprimer de Cloudinary
                  await cloudinaryService.deleteFile(publicId);
                  console.log(`✅ Image ${imageId} supprimée de Cloudinary`);
                }
                
                // Supprimer de la base de données
                await imageToDelete.destroy();
                console.log(`✅ Image ${imageId} supprimée de la base de données`);
              }
            } catch (deleteError) {
              console.error(`❌ Erreur lors de la suppression de l'image ${imageId}:`, deleteError);
              // Continuer même en cas d'erreur pour ne pas bloquer la mise à jour
            }
          }
        }

        // 2. Uploader les nouvelles images
        if (newImages && newImages.length > 0) {
          console.log(`📤 Upload de ${newImages.length} nouvelle(s) image(s) pour l'offre ${offerId}`);
          
          try {
            for (const imageFile of newImages) {
              const imageUploadResult = await cloudinaryService.uploadFromBuffer(
                imageFile.buffer,
                "offers/images",
                {
                  resource_type: "image",
                  transformation: [
                    {
                      quality: "auto:best",
                      fetch_format: "auto",
                      flags: "lossy",
                      bytes_limit: 400000
                    }
                  ],
                }
              );
              
              // Créer l'enregistrement dans la base de données
              const imageData = {
                offerId: parseInt(offerId),
                imageUrl: imageUploadResult.secure_url,
                isMain: false, // Sera géré plus tard
                color: null,
                colorHex: null
              };
              
              const newImage = await OfferImage.create(imageData);
              uploadedPublicIds.push(imageUploadResult.public_id);
              console.log(`✅ Nouvelle image créée avec ID: ${newImage.id}`);
            }
          } catch (uploadError) {
            console.error("❌ Erreur upload nouvelles images:", uploadError);
            // Nettoyer les fichiers uploadés en cas d'erreur
            await cleanupUploadedFiles(uploadedPublicIds);
            return res.status(500).json({
              error: "Erreur lors de l'upload des nouvelles images",
              details: uploadError.message || "Erreur inconnue",
            });
          }
        }

        // 3. Mettre à jour les données de l'offre
        const offerUpdateData = {
          title: title ? title.trim() : offer.title,
          description: description ? description.trim() : offer.description,
          price: price ? parseFloat(price) : offer.price,
          status: status || offer.status,
          productCondition: productCondition || offer.productCondition,
          listingType: listingType || offer.listingType,
          categoryId: categoryId ? parseInt(categoryId) : offer.categoryId,
          brandId: brandId ? parseInt(brandId) : offer.brandId,
          subjectId: subjectId ? parseInt(subjectId) : offer.subjectId,
          addressId: addressId ? parseInt(addressId) : offer.addressId,
          specificData: specificData ? JSON.stringify(specificData) : offer.specificData,
        };

        await offer.update(offerUpdateData);

        // 4. Mettre à jour les catégories d'échange
        if (exchangeCategories && exchangeCategories.length > 0) {
          console.log(`🔄 Mise à jour des catégories d'échange pour l'offre ${offerId}`);
          
          try {
            // Supprimer les anciennes catégories d'échange
            await OfferCategory.deleteByOfferId(offerId);
            
            // Ajouter les nouvelles catégories d'échange
            for (const categoryId of exchangeCategories) {
              const category = await Category.findByPk(categoryId);
              if (category) {
                await OfferCategory.addCategoryToOffer(offerId, categoryId);
                console.log(`✅ Catégorie d'échange ${categoryId} ajoutée`);
              }
            }
          } catch (categoryError) {
            console.error('❌ Erreur lors de la mise à jour des catégories d\'échange:', categoryError);
          }
        }

        // 5. Mettre à jour les marques d'échange
        if (exchangeBrands && exchangeBrands.length > 0) {
          console.log(`🏷️ Mise à jour des marques d'échange pour l'offre ${offerId}`);
          
          try {
            // Supprimer les anciennes marques d'échange
            await OfferBrand.deleteByOffer(offerId);
            
            // Ajouter les nouvelles marques d'échange
            const brandRelations = await OfferBrand.createMultipleOfferBrands(offerId, exchangeBrands);
            console.log(`✅ ${brandRelations.length} marque(s) d'échange ajoutée(s)`);
          } catch (brandError) {
            console.error('❌ Erreur lors de la mise à jour des marques d\'échange:', brandError);
          }
        }

        // 6. Récupérer l'offre mise à jour avec toutes ses relations
        const updatedOffer = await Offer.findCompleteById(offerId);
        
        // Récupérer les images depuis OfferImage
        const offerImages = await OfferImage.findAll({
          where: { offerId: parseInt(offerId) },
          order: [['isMain', 'DESC'], ['id', 'ASC']]
        });

        updatedOffer.images = offerImages.map(img => ({
          id: img.id,
          imageUrl: img.imageUrl,
          isMain: img.isMain,
          color: img.color,
          colorHex: img.colorHex
        }));

    return res.status(200).json({
      success: true,
          data: updatedOffer,
      message: "Offre mise à jour avec succès"
    });

      } catch (updateError) {
        console.error("❌ Erreur lors de la mise à jour de l'offre:", updateError);
        return res.status(500).json({
          error: "Erreur lors de la mise à jour de l'offre",
          details: updateError.message || "Erreur inconnue"
        });
      }
    }

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
    const route = req.route.path;

    const offer = await Offer.findByPk(offerId);
    if (!offer) {
      return res.status(404).json({
        error: "Offre non trouvée"
      });
    }

    if (route === '/:id/permanent') {
      // Suppression définitive (hard delete)
      await offer.destroy();
      
      return res.status(200).json({
        success: true,
        message: "Offre supprimée définitivement"
      });
    } else {
      // Suppression logique (soft delete)
    await Offer.deleteOffer(offerId);

    return res.status(200).json({
      success: true,
      message: "Offre supprimée avec succès"
    });
    }

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

const getOffersGroupedByTopCategories = async (req, res) => {
  try {
    const { limit = 3, offersLimit = 8 } = req.query;
    const { Op, Sequelize } = require('sequelize');
    const db = require('../config/db');
    const sequelize = db.getSequelize();
    const Category = sequelize.models.Category;

    console.log(`📊 Récupération des offres groupées par les ${limit} catégories les plus populaires`);

    // 1. Récupérer les catégories avec le plus grand nombre d'offres
    const topCategories = await Category.findAll({
      attributes: [
        'id',
        'nameFr',
        'nameAr',
        'descriptionFr',
        'descriptionAr',
        'image',
        'icon',
        'createdAt',
        'updatedAt',
        [
          Sequelize.literal('(SELECT COUNT(*) FROM offers WHERE offers.category_id = Category.id AND offers.is_deleted = false AND offers.status = "available")'),
          'offersCount'
        ]
      ],
      having: Sequelize.literal('offersCount > 0'),
      order: [
        [Sequelize.literal('offersCount'), 'DESC']
      ],
      limit: parseInt(limit)
    });

    // 2. Pour chaque catégorie, récupérer les offres
    const categoriesWithOffers = await Promise.all(
      topCategories.map(async (category) => {
        const categoryData = category.toJSON();
        
        // Récupérer les offres pour cette catégorie avec une requête directe
        const offers = await sequelize.query(`
          SELECT 
            o.id,
            o.product_id as productId,
            o.seller_id as sellerId,
            o.category_id as categoryId,
            o.brand_id as brandId,
            o.subject_id as subjectId,
            o.address_id as addressId,
            o.title,
            o.description,
            o.price,
            o.status,
            o.product_condition as productCondition,
            o.listing_type as listingType,
            o.specific_data as specificData,
            o.is_deleted as isDeleted,
            o.created_at as createdAt,
            o.updated_at as updatedAt
          FROM offers o
          WHERE o.category_id = :categoryId 
            AND o.is_deleted = false 
            AND o.status = 'available'
          ORDER BY o.created_at DESC
          LIMIT :limit
        `, {
          replacements: { 
            categoryId: category.id, 
            limit: parseInt(offersLimit) 
          },
          type: sequelize.QueryTypes.SELECT
        });

        // Récupérer les images pour chaque offre
        const offersWithImages = await Promise.all(offers.map(async (offer) => {
          const offerImages = await OfferImage.findAll({
            where: { offerId: offer.id },
            order: [['isMain', 'DESC'], ['id', 'ASC']]
          });

          return {
            ...offer,
            images: offerImages.map(img => ({
              id: img.id,
              imageUrl: img.imageUrl,
              isMain: img.isMain,
              color: img.color,
              colorHex: img.colorHex
            }))
          };
        }));

        return {
          id: categoryData.id,
          name: categoryData.nameFr,
          nameFr: categoryData.nameFr,
          nameAr: categoryData.nameAr,
          description: categoryData.descriptionFr,
          descriptionFr: categoryData.descriptionFr,
          descriptionAr: categoryData.descriptionAr,
          image: categoryData.image,
          icon: categoryData.icon,
          offersCount: categoryData.offersCount,
          offers: offersWithImages,
          createdAt: categoryData.createdAt,
          updatedAt: categoryData.updatedAt
        };
      })
    );

    console.log(`✅ ${categoriesWithOffers.length} catégories avec offres récupérées`);

    return res.status(200).json({
      success: true,
      data: categoriesWithOffers,
      message: `Offres groupées par les ${limit} catégories les plus populaires récupérées avec succès`
    });

  } catch (error) {
    console.error("❌ Erreur getOffersGroupedByTopCategories:", error);
    return res.status(500).json({
      error: "Erreur lors de la récupération des offres groupées par catégories",
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
  getMyOffers,
  getOffersGroupedByTopCategories,
};
