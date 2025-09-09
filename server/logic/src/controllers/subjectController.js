const cloudinaryService = require("../services/cloudinaryService.js");
const { Subject } = require("../models/Subject.js");
const { SubjectCategory } = require("../models/SubjectCategory.js");
const { Category } = require("../models/Category.js");

// Fonction utilitaire pour extraire le public_id d'une URL Cloudinary
const extractPublicIdFromUrl = (url) => {
  if (!url) return null;

  try {
    // Format URL: https://res.cloudinary.com/.../image/upload/v1234567890/subjects/images/uyh8qxffruxt1weq8e9y.jpg
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
const cleanupUploadedFiles = async (imagePublicId) => {
  if (imagePublicId) {
    try {
      await cloudinaryService.deleteFile(imagePublicId);
      console.log("✅ Fichier supprimé après erreur:", imagePublicId);
    } catch (deleteError) {
      console.error("❌ Erreur lors de la suppression du fichier:", deleteError);
    }
  }
};

const createSubject = async (req, res) => {
  let imagePublicId = null;

  try {
    const {
      nameAr,
      nameFr,
      descriptionAr,
      descriptionFr,
      categoryIds,
    } = req.body;

    // ✅ Vérification du fichier image
    const imageFile = req.file;

    let imageUrl = null;

    // ✅ Upload image
    if (imageFile) {
      try {
        const imageUploadResult = await cloudinaryService.uploadFromBuffer(
          imageFile.buffer,
          "subjects/images",
          {
            resource_type: "image",
            transformation: [
              {
                quality: "auto:best",   // compression intelligente haute qualité
                fetch_format: "auto",   // WebP/AVIF si dispo
                flags: "lossy",
                bytes_limit: 500000     // limite à 0.5 MB
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

    // ✅ Validation
    if (!nameAr || !nameFr) {
      // Supprimer le fichier uploadé en cas d'erreur de validation
      await cleanupUploadedFiles(imagePublicId);
      return res
        .status(400)
        .json({ error: "Les noms en arabe et français sont obligatoires" });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: "Une image est obligatoire" });
    }

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ error: "Au moins une catégorie doit être sélectionnée" });
    }

    // ✅ Sauvegarde DB
    try {
      const subject = await Subject.createSubject({
        nameAr,
        nameFr,
        descriptionAr,
        descriptionFr,
        image: imageUrl,
      });

      // Créer les associations avec les catégories
      if (categoryIds && categoryIds.length > 0) {
        const associations = categoryIds.map(categoryId => ({
          subjectId: subject.id,
          categoryId: parseInt(categoryId)
        }));

        await SubjectCategory.bulkCreate(associations);
      }

      return res.status(201).json({
        success: true,
        data: {
          id: subject.id,
          nameAr,
          nameFr,
          descriptionAr,
          descriptionFr,
          imageUrl,
          categoryIds
        },
        message: "matière crée avec succès",
      });
    } catch (dbError) {
      console.error("❌ Erreur DB:", dbError);
      // Supprimer le fichier uploadé en cas d'erreur DB
      await cleanupUploadedFiles(imagePublicId);
      return res.status(500).json({
        error: "Erreur lors de la création en base de données",
        details: dbError.message || "Erreur inconnue",
      });
    }
  } catch (err) {
    console.error("❌ Erreur interne:", err);
    // Supprimer le fichier uploadé en cas d'erreur interne
    await cleanupUploadedFiles(imagePublicId);
    return res.status(500).json({
      error: "Erreur interne du serveur",
      details: err.message || "Erreur inconnue",
    });
  }
};

const getSubjects = async (req, res) => {
  try {
    const { language = 'fr' } = req.query;

    const subjects = await Subject.findAll({
      include: [
        {
          model: require("../models/Category.js").Category,
          as: 'categories',
          through: {
            attributes: []
          },
          attributes: ['id', 'nameFr', 'nameAr', 'image']
        }
      ],
      order: [['nameFr', 'ASC']]
    });

    const localizedSubjects = subjects.map(subject => ({
      ...subject.getLocalizedData(language),
      categories: subject.categories || []
    }));

    return res.status(200).json({
      success: true,
      data: localizedSubjects,
      count: localizedSubjects.length,
      message: "matières récupérées avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur getSubjects:", error);
    return res.status(500).json({
      error: "Erreur lors de la récupération des matières",
      details: error.message || "Erreur inconnue"
    });
  }
};

const getSubjectById = async (req, res) => {
  try {
    const subjectId = req.params.id;

    if (!subjectId) {
      return res.status(400).json({
        error: "ID de sujet requis"
      });
    }

    // Récupérer le sujet avec ses catégories associées
    const subject = await Subject.findByPk(subjectId, {
      include: [
        {
          model: Category,
          as: 'categories',
          through: {
            attributes: [] // Exclure les attributs de la table de liaison
          },
          attributes: ['id', 'nameFr', 'nameAr', 'image', 'descriptionFr', 'descriptionAr']
        }
      ]
    });

    if (!subject) {
      return res.status(404).json({
        error: "Sujet non trouvé"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: subject.id,
        nameAr: subject.nameAr,
        nameFr: subject.nameFr,
        descriptionAr: subject.descriptionAr,
        descriptionFr: subject.descriptionFr,
        image: subject.image,
        createdAt: subject.createdAt,
        updatedAt: subject.updatedAt,
        categories: subject.categories || [],
      },
      message: "Sujet récupéré avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur getSubjectById:", error);
    return res.status(500).json({
      error: "Erreur lors de la récupération du sujet",
      details: error.message || "Erreur inconnue"
    });
  }
};

const updateSubject = async (req, res) => {
  let imagePublicId = null;

  try {
    const subjectId = req.params.id;
    const {
      nameAr,
      nameFr,
      descriptionAr,
      descriptionFr,
      categoryIds,
    } = req.body;

    console.log("🔍 Debug updateSubject:");
    console.log("- req.body:", req.body);
    console.log("- req.file:", req.file);
    console.log("- categoryIds:", categoryIds);

    // Vérifier que le sujet existe
    const existingSubject = await Subject.findByPk(subjectId);
    if (!existingSubject) {
      return res.status(404).json({
        error: "Sujet non trouvé",
      });
    }

    // Récupérer l'ancien public_id pour nettoyage
    const oldImageUrl = existingSubject.image;

    let imageUrl = oldImageUrl;

    // ✅ Upload nouvelle image si fournie
    const imageFile = req.file;
    if (imageFile) {
      try {
        const imageUploadResult = await cloudinaryService.uploadFromBuffer(
          imageFile.buffer,
          "subjects/images",
          {
            resource_type: "image",
            transformation: [
              {
                quality: "auto:best",
                fetch_format: "auto",
                flags: "lossy",
                bytes_limit: 500000
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

    // ✅ Validation
    if (!nameAr || !nameFr) {
      // Supprimer le nouveau fichier uploadé en cas d'erreur de validation
      await cleanupUploadedFiles(imagePublicId);
      return res
        .status(400)
        .json({ error: "Les noms en arabe et français sont obligatoires" });
    }

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      await cleanupUploadedFiles(imagePublicId);
      return res.status(400).json({ error: "Au moins une catégorie doit être sélectionnée" });
    }

    // ✅ Mise à jour en base de données
    try {
      const updateData = {
        nameAr,
        nameFr,
        descriptionAr,
        descriptionFr,
      };

      // Ajouter l'URL seulement si elle a été mise à jour
      if (imageUrl !== oldImageUrl) {
        updateData.image = imageUrl;
      }

      const updatedSubject = await Subject.updateSubject(subjectId, updateData);

      // Mettre à jour les associations avec les catégories
      if (categoryIds && categoryIds.length > 0) {
        // Supprimer les anciennes associations
        await SubjectCategory.destroy({
          where: { subjectId: subjectId }
        });

        // Créer les nouvelles associations
        const associations = categoryIds.map(categoryId => ({
          subjectId: subjectId,
          categoryId: parseInt(categoryId)
        }));

        await SubjectCategory.bulkCreate(associations);
        console.log("✅ Associations mises à jour:", associations);
      }

      // Supprimer l'ancien fichier Cloudinary si un nouveau a été uploadé
      if (imagePublicId && oldImageUrl) {
        console.log("🔄 Nouvelle image uploadée, suppression de l'ancienne:", oldImageUrl);
        const oldImagePublicId = extractPublicIdFromUrl(oldImageUrl);
        if (oldImagePublicId) {
          try {
            await cloudinaryService.deleteFile(oldImagePublicId);
            console.log("✅ Ancienne image supprimée:", oldImagePublicId);
          } catch (deleteError) {
            console.error("❌ Erreur suppression ancienne image:", deleteError);
          }
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          id: updatedSubject.id,
          nameAr,
          nameFr,
          descriptionAr,
          descriptionFr,
          imageUrl: updatedSubject.image,
          categoryIds
        },
        message: "Sujet mis à jour avec succès",
      });
    } catch (dbError) {
      console.error("❌ Erreur DB:", dbError);
      // Supprimer le nouveau fichier uploadé en cas d'erreur DB
      await cleanupUploadedFiles(imagePublicId);
      return res.status(500).json({
        error: "Erreur lors de la mise à jour en base de données",
        details: dbError.message || "Erreur inconnue",
      });
    }
  } catch (err) {
    console.error("❌ Erreur interne:", err);
    // Supprimer le nouveau fichier uploadé en cas d'erreur interne
    await cleanupUploadedFiles(imagePublicId);
    return res.status(500).json({
      error: "Erreur interne du serveur",
      details: err.message || "Erreur inconnue",
    });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const subjectId = req.params.id;

    if (!subjectId) {
      return res.status(400).json({
        error: "ID de sujet requis"
      });
    }

    const subject = await Subject.findByPk(subjectId);

    if (!subject) {
      return res.status(404).json({
        error: "Sujet non trouvé"
      });
    }

    // Supprimer l'image de Cloudinary
    if (subject.image) {
      const imagePublicId = extractPublicIdFromUrl(subject.image);
      if (imagePublicId) {
        try {
          await cloudinaryService.deleteFile(imagePublicId);
          console.log("✅ Image supprimée de Cloudinary:", imagePublicId);
        } catch (deleteError) {
          console.error("❌ Erreur suppression image Cloudinary:", deleteError);
        }
      }
    }

    // Supprimer le sujet de la base de données
    await Subject.deleteSubject(subjectId);

    return res.status(200).json({
      success: true,
      message: "Sujet supprimé avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur deleteSubject:", error);
    return res.status(500).json({
      error: "Erreur lors de la suppression du sujet",
      details: error.message || "Erreur inconnue"
    });
  }
};

module.exports = {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
};
