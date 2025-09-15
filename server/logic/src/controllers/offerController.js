const cloudinaryService = require("../services/cloudinaryService.js");
const { Offer } = require("../models/Offer.js");

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
      location
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
      specificData
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

    // ✅ Validation des données spécifiques selon le type
    if (listingType === 'vehicle') {
      if (!specificData || !specificData.vehicleType || !specificData.year || !specificData.brand || !specificData.model || !specificData.mileage) {
        await cleanupUploadedFiles(uploadedPublicIds);
        return res.status(400).json({
          error: "Pour un véhicule, type, année, marque, modèle et kilométrage sont obligatoires dans specificData"
        });
      }
    } else if (listingType === 'property') {
      if (!specificData || !specificData.propertyType || !specificData.area) {
        await cleanupUploadedFiles(uploadedPublicIds);
        return res.status(400).json({
          error: "Pour une propriété, type et surface sont obligatoires dans specificData"
        });
      }
    }

    // ✅ Sauvegarde en base de données
    try {
      const offerData = {
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
        // Stocker les URLs des images en JSON
        images: JSON.stringify(imageUrls),
        // Données spécifiques dans un objet JSON
        specificData: specificData ? JSON.stringify(specificData) : null,
        location: location ? JSON.stringify(location) : null,
        isDeleted: false,
      };

      const offer = await Offer.createOffer(offerData);

      return res.status(201).json({
        success: true,
        data: { 
          id: offer.id, 
          title: offer.title, 
          price: offer.price,
          images: imageUrls,
          listingType: offer.listingType
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

    // Construire les filtres
    const filters = {};
    
    if (listingType) filters.listingType = listingType;
    if (categoryId) filters.categoryId = parseInt(categoryId);
    if (brandId) filters.brandId = parseInt(brandId);
    if (sellerId) filters.sellerId = parseInt(sellerId);
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

    // Parser les images JSON pour chaque offre
    const offersWithParsedImages = result.offers.map(offer => {
      const offerData = offer.getPublicData();
      try {
        offerData.images = offer.images ? JSON.parse(offer.images) : [];
      } catch (error) {
        console.error('Erreur parsing images:', error);
        offerData.images = [];
      }
      return offerData;
    });

    return res.status(200).json({
      success: true,
      data: offersWithParsedImages,
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

    const offer = await Offer.findByPk(offerId);
    
    if (!offer) {
      return res.status(404).json({
        error: "Offre non trouvée"
      });
    }

    const offerData = offer.getPublicData();
    
    // Parser les images JSON
    try {
      offerData.images = offer.images ? JSON.parse(offer.images) : [];
    } catch (error) {
      console.error('Erreur parsing images:', error);
      offerData.images = [];
    }

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

module.exports = {
  createOffer,
  getOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
};
