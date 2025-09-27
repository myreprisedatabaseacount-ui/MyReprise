const cloudinaryService = require("../services/cloudinaryService.js");
const { Category } = require('../models/Category.js');
const Neo4jSyncService = require('../services/neo4jSyncService');
const { Op, Sequelize } = require('sequelize');
// Fonction utilitaire pour extraire le public_id d'une URL Cloudinary
const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    // Format URL: https://res.cloudinary.com/.../image/upload/v1234567890/categories/images/uyh8qxffruxt1weq8e9y.jpg
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
const cleanupUploadedFiles = async (imagePublicId, iconPublicId) => {
  const filesToDelete = [];

  if (imagePublicId) {
    filesToDelete.push(imagePublicId);
    console.log("🗑️ Image à supprimer:", imagePublicId);
  }
  if (iconPublicId) {
    filesToDelete.push(iconPublicId);
    console.log("🗑️ Icône à supprimer:", iconPublicId);
  }

  if (filesToDelete.length > 0) {
    try {
      await cloudinaryService.deleteMultipleFiles(filesToDelete);
      console.log("✅ Fichiers supprimés après erreur:", filesToDelete);
    } catch (deleteError) {
      console.error("❌ Erreur lors de la suppression des fichiers:", deleteError);
    }
  }
};

const createCategory = async (req, res) => {
  let imagePublicId = null;
  let iconPublicId = null;

  try {
    const {
      nameAr,
      nameFr,
      descriptionAr,
      descriptionFr,
      gender,
      ageMin,
      ageMax,
      parentId,
      listingType,
    } = req.body;

    console.log('📥 Données reçues pour création:', {
      nameAr,
      nameFr,
      descriptionAr,
      descriptionFr,
      gender,
      ageMin,
      ageMax,
      parentId,
      listingType
    });

    // ✅ Vérification des fichiers
    const imageFile = req.files?.image?.[0];
    const iconFile = req.files?.icon?.[0];

    let imageUrl = null;
    let iconUrl = null;

    // ✅ Upload image
    if (imageFile) {
      try {
        const imageUploadResult = await cloudinaryService.uploadFromBuffer(
          imageFile.buffer,
          "categories/images",
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
        imageUrl = imageUploadResult.secure_url;
        imagePublicId = imageUploadResult.public_id;
      } catch (uploadError) {
        console.error("❌ Erreur upload image:", uploadError);
        return res.status(500).json({
          error: "Erreur lors de l'upload de l'image",
          details: uploadError.message || "Erreur inconnue",
        });
      }
    }

    // ✅ Upload icône
    if (iconFile) {
      try {
        const iconUploadResult = await cloudinaryService.uploadFromBuffer(
          iconFile.buffer,
          "categories/icons",
          {
            resource_type: "image",
            transformation: [{ width: 64, height: 64, crop: "scale" }],
          }
        );
        iconUrl = iconUploadResult.secure_url;
        iconPublicId = iconUploadResult.public_id;
      } catch (uploadError) {
        console.error("❌ Erreur upload icône:", uploadError);
        // Supprimer l'image si elle a été uploadée
        if (imagePublicId) {
          try {
            await cloudinaryService.deleteFile(imagePublicId);
            console.log("✅ Image supprimée après erreur icône");
          } catch (deleteError) {
            console.error("❌ Erreur suppression image:", deleteError);
          }
        }
        return res.status(500).json({
          error: "Erreur lors de l'upload de l'icône",
          details: uploadError.message || "Erreur inconnue",
        });
      }
    }

    // ✅ Validation
    if (!nameAr || !nameFr) {
      // Supprimer les fichiers uploadés en cas d'erreur de validation
      await cleanupUploadedFiles(imagePublicId, iconPublicId);
      return res
        .status(400)
        .json({ error: "Les noms en arabe et français sont obligatoires" });
    }

    if (!imageUrl) {
      // Supprimer l'icône si elle a été uploadée
      await cleanupUploadedFiles(null, iconPublicId);
      return res.status(400).json({ error: "Une image est obligatoire" });
    }

    if (!iconUrl) {
      // Supprimer l'image si elle a été uploadée
      await cleanupUploadedFiles(imagePublicId, null);
      return res.status(400).json({ error: "Une icône est obligatoire" });
    }

    // ✅ Validation des âges
    const ageMinNum = parseInt(ageMin) || 0;
    const ageMaxNum = parseInt(ageMax) || 100;
    if (ageMinNum < 0 || ageMinNum > 120) {
      await cleanupUploadedFiles(imagePublicId, iconPublicId);
      return res
        .status(400)
        .json({ error: "L'âge minimum doit être entre 0 et 120 ans" });
    }

    if (ageMaxNum < 0 || ageMaxNum > 120) {
      await cleanupUploadedFiles(imagePublicId, iconPublicId);
      return res
        .status(400)
        .json({ error: "L'âge maximum doit être entre 0 et 120 ans" });
    }

    if (ageMinNum >= ageMaxNum) {
      await cleanupUploadedFiles(imagePublicId, iconPublicId);
      return res.status(400).json({
        error: "L'âge maximum doit être supérieur à l'âge minimum",
      });
    }
    // ✅ Mapping genre
    let genderValue = "mixte";
    if (gender === "homme") genderValue = "male";
    else if (gender === "femme") genderValue = "female";

    // ✅ Sauvegarde DB
    try {
      const category = await Category.create({
        nameAr,
        nameFr,
        descriptionAr,
        descriptionFr,
        gender: genderValue,
        ageMin: ageMinNum,
        ageMax: ageMaxNum,
        parentId: parentId ? parseInt(parentId) : null,
        image: imageUrl,
        icon: iconUrl,
        listingType: listingType || null,
        isActive: true,
      });

      // Synchroniser avec Neo4j
      Neo4jSyncService.syncCategory(category, 'CREATE').catch(error => {
        console.error('❌ Erreur synchronisation catégorie:', error);
      });

      return res.status(201).json({
        success: true,
        data: { id: category.id, nameAr, nameFr, imageUrl, iconUrl },
        message: "Catégorie créée avec succès",
      });
    } catch (dbError) {
      console.error("❌ Erreur DB:", dbError);
      // Supprimer les fichiers uploadés en cas d'erreur DB
      await cleanupUploadedFiles(imagePublicId, iconPublicId);
      return res.status(500).json({
        error: "Erreur lors de la création en base de données",
        details: dbError.message || "Erreur inconnue",
      });
    }
  } catch (err) {
    console.error("❌ Erreur interne:", err);
    // Supprimer les fichiers uploadés en cas d'erreur interne
    await cleanupUploadedFiles(imagePublicId, iconPublicId);
    return res.status(500).json({
      error: "Erreur interne du serveur",
      details: err.message || "Erreur inconnue",
    });
  }
}

const getAllCategories = async (req, res) => {
  try {
    const { language = 'fr', search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    // Construire les conditions de recherche
    let whereClause = {};
    
    if (search && search.trim()) {
      const searchTerm = search.trim();
      console.log(`🔍 Recherche multilingue pour: "${searchTerm}"`);
      
      whereClause = {
        [Op.or]: [
          // Recherche dans les champs français (insensible à la casse)
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('Category.name_fr')),
            'LIKE',
            `%${searchTerm.toLowerCase()}%`
          ),
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('Category.description_fr')),
            'LIKE',
            `%${searchTerm.toLowerCase()}%`
          ),
          // Recherche dans les champs arabes (insensible à la casse)
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('Category.name_ar')),
            'LIKE',
            `%${searchTerm.toLowerCase()}%`
          ),
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('Category.description_ar')),
            'LIKE',
            `%${searchTerm.toLowerCase()}%`
          )
        ]
      };
    }

    const { count, rows: categoriesWithBrands } = await Category.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: require('../models/Brand').Brand,
          as: 'brands',
          through: { attributes: [] },
          attributes: ['id', 'nameFr', 'nameAr', 'logo', 'descriptionFr', 'descriptionAr']
        }
      ],
      order: [['nameFr', 'ASC']],
      limit: limit,
      offset: offset
    });

    // Transformer les données pour inclure les champs localisés
    const transformedCategories = categoriesWithBrands.map(category => {
      const categoryData = category.toJSON();
      
      // Ajouter les champs localisés pour la catégorie
      categoryData.name = language === 'ar' ? categoryData.nameAr : categoryData.nameFr;
      categoryData.description = language === 'ar' ? categoryData.descriptionAr : categoryData.descriptionFr;
      
      // Ajouter les champs localisés pour les marques
      if (categoryData.brands) {
        categoryData.brands = categoryData.brands.map(brand => ({
          ...brand,
          name: language === 'ar' ? brand.nameAr : brand.nameFr,
          description: language === 'ar' ? brand.descriptionAr : brand.descriptionFr
        }));
      }
      
      return categoryData;
    });

    return res.status(200).json({
      success: true,
      data: transformedCategories,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      searchTerm: search || null,
      hasSearch: !!(search && search.trim())
    });

  } catch (error) {
    console.error("❌ Erreur getAllCategories:", error);
    return res.status(500).json({
      error: "Erreur lors de la récupération des catégories",
      details: error.message || "Erreur inconnue"
    });
  }
};

const updateCategory = async (req, res) => {
  let imagePublicId = null;
  let iconPublicId = null;
  try {
    const categoryId = req.params.id;
    const {
      nameAr,
      nameFr,
      descriptionAr,
      descriptionFr,
      gender,
      ageMin,
      ageMax,
      parentId,
      listingType,
    } = req.body;

    console.log('📥 Données reçues pour mise à jour:', {
      categoryId,
      nameAr,
      nameFr,
      descriptionAr,
      descriptionFr,
      gender,
      ageMin,
      ageMax,
      parentId,
      listingType
    });

    // Vérifier que la catégorie existe
    const existingCategory = await Category.findByPk(categoryId);
    if (!existingCategory) {
      return res.status(404).json({
        error: "Catégorie non trouvée",
      });
    }

    // Récupérer les anciens public_ids pour nettoyage
    const oldImageUrl = existingCategory.image;
    const oldIconUrl = existingCategory.icon;

    let imageUrl = oldImageUrl;
    let iconUrl = oldIconUrl;

    // ✅ Upload nouvelle image si fournie
    const imageFile = req.files?.image?.[0];
    if (imageFile) {
      try {
        const imageUploadResult = await cloudinaryService.uploadFromBuffer(
          imageFile.buffer,
          "categories/images",
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
        imageUrl = imageUploadResult.secure_url;
        imagePublicId = imageUploadResult.public_id;
      } catch (uploadError) {
        console.error("❌ Erreur upload image:", uploadError);
        return res.status(500).json({
          error: "Erreur lors de l'upload de l'image",
          details: uploadError.message || "Erreur inconnue",
        });
      }
    }

    // ✅ Upload nouvelle icône si fournie
    const iconFile = req.files?.icon?.[0];
    if (iconFile) {
      try {
        const iconUploadResult = await cloudinaryService.uploadFromBuffer(
          iconFile.buffer,
          "categories/icons",
          {
            resource_type: "image",
            transformation: [{ width: 64, height: 64, crop: "scale" }],
          }
        );
        iconUrl = iconUploadResult.secure_url;
        iconPublicId = iconUploadResult.public_id;
      } catch (uploadError) {
        console.error("❌ Erreur upload icône:", uploadError);
        // Supprimer la nouvelle image si elle a été uploadée
        if (imagePublicId) {
          try {
            await cloudinaryService.deleteFile(imagePublicId);
            console.log("✅ Image supprimée après erreur icône");
          } catch (deleteError) {
            console.error("❌ Erreur suppression image:", deleteError);
          }
        }
        return res.status(500).json({
          error: "Erreur lors de l'upload de l'icône",
          details: uploadError.message || "Erreur inconnue",
        });
      }
    }

    // ✅ Validation
    if (!nameAr || !nameFr) {
      // Supprimer les nouveaux fichiers uploadés en cas d'erreur de validation
      await cleanupUploadedFiles(imagePublicId, iconPublicId);
      return res
        .status(400)
        .json({ error: "Les noms en arabe et français sont obligatoires" });
    }

    // ✅ Validation des âges
    const ageMinNum = parseInt(ageMin) || 0;
    const ageMaxNum = parseInt(ageMax) || 100;

    if (ageMinNum < 0 || ageMinNum > 120) {
      await cleanupUploadedFiles(imagePublicId, iconPublicId);
      return res
        .status(400)
        .json({ error: "L'âge minimum doit être entre 0 et 120 ans" });
    }

    if (ageMaxNum < 0 || ageMaxNum > 120) {
      await cleanupUploadedFiles(imagePublicId, iconPublicId);
      return res
        .status(400)
        .json({ error: "L'âge maximum doit être entre 0 et 120 ans" });
    }

    if (ageMinNum >= ageMaxNum) {
      await cleanupUploadedFiles(imagePublicId, iconPublicId);
      return res.status(400).json({
        error: "L'âge maximum doit être supérieur à l'âge minimum",
      });
    }

    // ✅ Mapping genre
    let genderValue = "mixte";
    if (gender === "homme") genderValue = "male";
    else if (gender === "femme") genderValue = "female";
    // ✅ Mise à jour en base de données
    try {
      const updateData = {
        nameAr,
        nameFr,
        descriptionAr,
        descriptionFr,
        gender: genderValue,
        ageMin: ageMinNum,
        ageMax: ageMaxNum,
        parentId: parentId ? parseInt(parentId) : null,
        listingType: listingType || null,
        isActive: true,
      };
      // Ajouter les URLs seulement si elles ont été mises à jour
      if (imageUrl !== oldImageUrl) {
        updateData.image = imageUrl;
      }
      if (iconUrl !== oldIconUrl) {
        updateData.icon = iconUrl;
      }

      await existingCategory.update(updateData);
      const updatedCategory = await Category.findByPk(categoryId);

      // Synchroniser avec Neo4j
      Neo4jSyncService.syncCategory(updatedCategory, 'UPDATE').catch(error => {
        console.error('❌ Erreur synchronisation catégorie:', error);
      });
      // Supprimer les anciens fichiers Cloudinary si de nouveaux ont été uploadés
      const filesToDelete = [];

      if (imagePublicId && oldImageUrl) {
        console.log("🔄 Nouvelle image uploadée, suppression de l'ancienne:", oldImageUrl);
        const oldImagePublicId = extractPublicIdFromUrl(oldImageUrl);
        if (oldImagePublicId) {
          filesToDelete.push(oldImagePublicId);
          console.log("🗑️ Ancienne image à supprimer:", oldImagePublicId);
        }
      }

      if (iconPublicId && oldIconUrl) {
        console.log("🔄 Nouvelle icône uploadée, suppression de l'ancienne:", oldIconUrl);
        const oldIconPublicId = extractPublicIdFromUrl(oldIconUrl);
        if (oldIconPublicId) {
          filesToDelete.push(oldIconPublicId);
          console.log("🗑️ Ancienne icône à supprimer:", oldIconPublicId);
        }
      }
      if (filesToDelete.length > 0) {
        try {
          await cloudinaryService.deleteMultipleFiles(filesToDelete);
          console.log("✅ Anciens fichiers supprimés:", filesToDelete);
        } catch (deleteError) {
          console.error("❌ Erreur suppression anciens fichiers:", deleteError);
        }
      }
      return res.status(200).json({
        success: true,
        data: {
          id: updatedCategory.id,
          nameAr,
          nameFr,
          imageUrl: updatedCategory.image,
          iconUrl: updatedCategory.icon
        },
        message: "Catégorie mise à jour avec succès",
      });
    } catch (dbError) {
      console.error("❌ Erreur DB:", dbError);
      // Supprimer les nouveaux fichiers uploadés en cas d'erreur DB
      await cleanupUploadedFiles(imagePublicId, iconPublicId);
      return res.status(500).json({
        error: "Erreur lors de la mise à jour en base de données",
        details: dbError.message || "Erreur inconnue",
      });
    }
  } catch (err) {
    console.error("❌ Erreur interne:", err);
    // Supprimer les nouveaux fichiers uploadés en cas d'erreur interne
    await cleanupUploadedFiles(imagePublicId, iconPublicId);
    return res.status(500).json({
      error: "Erreur interne du serveur",
      details: err.message || "Erreur inconnue",
    });
  }
};
const getCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.id;

    if (!categoryId) {
      return res.status(400).json({
        error: "ID de catégorie requis"
      });
    }

    const category = await Category.findByPk(categoryId);

    if (!category) {
      return res.status(404).json({
        error: "Catégorie non trouvée"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: category.id,
        nameAr: category.nameAr,
        nameFr: category.nameFr,
        descriptionAr: category.descriptionAr,
        descriptionFr: category.descriptionFr,
        image: category.image,
        icon: category.icon,
        parentId: category.parentId,
        gender: category.gender,
        ageMin: category.ageMin,
        ageMax: category.ageMax,
        listingType: category.listingType,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      },
      message: "Catégorie récupérée avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur getCategoryById:", error);
    return res.status(500).json({
      error: "Erreur lors de la récupération de la catégorie",
      details: error.message || "Erreur inconnue"
    });
  }
};

const getCategoriesByListingType = async (req, res) => {
  try {
    const { listingType } = req.params;
    const { language = 'fr' } = req.query;

    console.log(`📥 Récupération des catégories pour le type: ${listingType} (langue: ${language})`);

    if (!listingType) {
      return res.status(400).json({
        error: "Type de listing requis"
      });
    }

    // Valider le type de listing
    const validListingTypes = ['vehicle', 'item', 'property'];
    if (!validListingTypes.includes(listingType)) {
      return res.status(400).json({
        error: "Type de listing invalide",
        details: `Types valides: ${validListingTypes.join(', ')}`
      });
    }

    const categories = await Category.findAll({
      where: {
        listingType: listingType,
      },
      include: [
        {
          model: require('../models/Brand').Brand,
          as: 'brands',
          through: { attributes: [] },
          attributes: ['id', 'nameFr', 'nameAr', 'logo', 'descriptionFr', 'descriptionAr']
        }
      ],
      order: [['nameFr', 'ASC']]
    });

    // Transformer les données pour inclure les champs localisés
    const transformedCategories = categories.map(category => {
      const categoryData = category.toJSON();
      
      // Ajouter les champs localisés pour la catégorie
      categoryData.name = language === 'ar' ? categoryData.nameAr : categoryData.nameFr;
      categoryData.description = language === 'ar' ? categoryData.descriptionAr : categoryData.descriptionFr;
      
      // Ajouter les champs localisés pour les marques
      if (categoryData.brands) {
        categoryData.brands = categoryData.brands.map(brand => ({
          ...brand,
          name: language === 'ar' ? brand.nameAr : brand.nameFr,
          description: language === 'ar' ? brand.descriptionAr : brand.descriptionFr
        }));
      }
      
      return categoryData;
    });

    console.log(`✅ ${transformedCategories.length} catégories trouvées pour le type ${listingType}`);

    return res.status(200).json({
      success: true,
      data: transformedCategories,
      message: `Catégories ${listingType} récupérées avec succès`
    });

  } catch (error) {
    console.error("❌ Erreur getCategoriesByListingType:", error);
    return res.status(500).json({
      error: "Erreur lors de la récupération des catégories par type",
      details: error.message || "Erreur inconnue"
    });
  }
};

module.exports = {
  createCategory,
  updateCategory,
  getAllCategories,
  getCategoryById,
  getCategoriesByListingType
};