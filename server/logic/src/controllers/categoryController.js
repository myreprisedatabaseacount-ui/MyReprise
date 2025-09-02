const cloudinaryService = require("../services/cloudinaryService.js");
const Category = require("../models/Category.js");

const createCategory = async (req, res) => {
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
              { width: 800, height: 600, crop: "fill", quality: "auto" },
            ],
          }
        );
        imageUrl = imageUploadResult.secure_url;
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
      } catch (uploadError) {
        console.error("❌ Erreur upload icône:", uploadError);
        return res.status(500).json({
          error: "Erreur lors de l'upload de l'icône",
          details: uploadError.message || "Erreur inconnue",
        });
      }
    }

    // ✅ Validation
    if (!nameAr || !nameFr) {
      return res
        .status(400)
        .json({ error: "Les noms en arabe et français sont obligatoires" });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: "Une image est obligatoire" });
    }

    if (!iconUrl) {
      return res.status(400).json({ error: "Une icône est obligatoire" });
    }

    // ✅ Validation des âges
    const ageMinNum = parseInt(ageMin) || 0;
    const ageMaxNum = parseInt(ageMax) || 100;

    if (ageMinNum < 0 || ageMinNum > 120) {
      return res
        .status(400)
        .json({ error: "L'âge minimum doit être entre 0 et 120 ans" });
    }

    if (ageMaxNum < 0 || ageMaxNum > 120) {
      return res
        .status(400)
        .json({ error: "L'âge maximum doit être entre 0 et 120 ans" });
    }

    if (ageMinNum >= ageMaxNum) {
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
        imageUrl,
        iconUrl,
        isActive: true,
      });

      return res.status(201).json({
        success: true,
        data: { id: category.id, nameAr, nameFr, imageUrl, iconUrl },
        message: "Catégorie créée avec succès",
      });
    } catch (dbError) {
      console.error("❌ Erreur DB:", dbError);
      return res.status(500).json({
        error: "Erreur lors de la création en base de données",
        details: dbError.message || "Erreur inconnue",
      });
    }
  } catch (err) {
    console.error("❌ Erreur interne:", err);
    return res.status(500).json({
      error: "Erreur interne du serveur",
      details: err.message || "Erreur inconnue",
    });
  }
};

module.exports = {
  createCategory,
};
