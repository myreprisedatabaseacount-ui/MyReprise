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
      parentId 
    } = req.body;

    // Gestion des fichiers uploadés
    const imageFile = req.files?.image?.[0];
    const iconFile = req.files?.icon?.[0];

    let imageUrl = null;
    let iconUrl = null;

    // Upload de l'image si présente
    if (imageFile) {
      const imageUploadResult = await cloudinaryService.uploadFromBuffer(
        imageFile.buffer, 
        "categories/images",
        {
          resource_type: "image",
          transformation: [
            { width: 800, height: 600, crop: "fill", quality: "auto" }
          ]
        }
      );
      imageUrl = imageUploadResult.secure_url;
    }

    // Upload de l'icône SVG si présente
    if (iconFile) {
      const iconUploadResult = await cloudinaryService.uploadFromBuffer(
        iconFile.buffer, 
        "categories/icons",
        {
          resource_type: "image",
          format: "svg",
          transformation: [
            { width: 64, height: 64, crop: "scale" }
          ]
        }
      );
      iconUrl = iconUploadResult.secure_url;
    }

    // Validation des données
    if (!nameAr || !nameFr) {
      return res.status(400).json({ error: "Les noms en arabe et français sont obligatoires" });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: "Une image est obligatoire" });
    }

    if (!iconUrl) {
      return res.status(400).json({ error: "Une icône SVG est obligatoire" });
    }

    // Validation des âges
    const ageMinNum = parseInt(ageMin) || 0;
    const ageMaxNum = parseInt(ageMax) || 100;
    
    if (ageMinNum < 0 || ageMinNum > 120) {
      return res.status(400).json({ error: "L'âge minimum doit être entre 0 et 120 ans" });
    }
    
    if (ageMaxNum < 0 || ageMaxNum > 120) {
      return res.status(400).json({ error: "L'âge maximum doit être entre 0 et 120 ans" });
    }
    
    if (ageMinNum >= ageMaxNum) {
      return res.status(400).json({ error: "L'âge maximum doit être supérieur à l'âge minimum" });
    }

    // Conversion du genre du frontend vers le backend
    let genderValue = 'mixte';
    if (gender === 'homme') genderValue = 'male';
    else if (gender === 'femme') genderValue = 'female';
    else if (gender === 'mixte') genderValue = 'mixte';

    // Création de la catégorie
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
    });

    res.status(201).json({
      success: true,
      data: category,
      message: "Catégorie créée avec succès"
    });
  } catch (err) {
    console.error('Erreur lors de la création de la catégorie:', err);
    res.status(500).json({ 
      error: "Erreur interne du serveur",
      details: err.message 
    });
  }
};

module.exports = {
  createCategory
};
