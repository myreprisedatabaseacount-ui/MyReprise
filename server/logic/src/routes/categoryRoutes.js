const express = require('express');
const multer = require("multer");
const { createCategory, getAllCategories, getCategoryById, updateCategory } = require("../controllers/categoryController.js");
// GET /api/categories/listing-type/:listingType - Récupérer les catégories par type de listing
const categoryRoutes = express.Router();

// Configuration multer avec gestion d'erreur
let upload;
try {
  const storage = multer.memoryStorage();
  upload = multer({
    storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req, file, cb) => {
      try {
        // Pour les images
        if (file.fieldname === 'image') {
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new Error('Seules les images sont autorisées pour le champ image'), false);
          }
        }
        // Pour les icônes SVG
        else if (file.fieldname === 'icon') {
          if (file.mimetype === 'image/svg+xml') {
            cb(null, true);
          } else {
            cb(new Error('Seuls les fichiers SVG sont autorisés pour le champ icon'), false);
          }
        }
        else {
          cb(new Error('Champ de fichier non reconnu'), false);
        }
      } catch (filterError) {
        console.error('❌ Erreur filtre multer:', filterError);
        cb(filterError, false);
      }
    }
  });
  console.log('✅ Configuration multer initialisée');
} catch (multerError) {
  console.error('❌ Erreur configuration multer:', multerError);
  // Créer une configuration multer basique en cas d'erreur
  upload = multer({ storage: multer.memoryStorage() });
}

// Middleware de gestion d'erreur pour multer
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      console.error('❌ Erreur Multer:', error);
      return res.status(400).json({
        error: 'Erreur upload fichier',
        details: error.message
      });
    } else if (error) {
      console.error('❌ Erreur upload:', error);
      return res.status(400).json({
        error: 'Erreur upload fichier',
        details: error.message
      });
    }
    next();
  };
  
  // Route pour récupérer les catégories
  categoryRoutes.get("/", getAllCategories);
  
  // Route pour récupérer une catégorie par ID
  categoryRoutes.get("/:id", getCategoryById);
  
  // Route pour créer une catégorie avec uploads multiples
  categoryRoutes.post("/create",
    upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'icon', maxCount: 1 }
    ]),
    handleMulterError,
    createCategory
  );
  
  // Route pour mettre à jour une catégorie avec uploads multiples
  categoryRoutes.put("/:id",
    upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'icon', maxCount: 1 }
    ]),
    handleMulterError,
    updateCategory
  );

module.exports = categoryRoutes;