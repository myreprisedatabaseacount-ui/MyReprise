const cloudinaryService = require("../services/cloudinaryService.js");
const { Category } = require("../models/Category.js");

// Fonction utilitaire pour nettoyer les fichiers uploadés en cas d'erreur
const cleanupUploadedFiles = async (imagePublicId, iconPublicId) => {
  const filesToDelete = [];
  
  if (imagePublicId) filesToDelete.push(imagePublicId);
  if (iconPublicId) filesToDelete.push(iconPublicId);
  
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
    } = req.body;

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
      const category = await Category.createCategory({
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
        isActive: true,
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
};

module.exports = {
  createCategory,
};
