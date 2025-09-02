const express = require("express");
const multer = require("multer");
const { createCategory } = require("../controllers/categoryController.js");

const categoryRoutes = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
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
  }
});

// Route pour créer une catégorie avec uploads multiples
categoryRoutes.post("/create", upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'icon', maxCount: 1 }
]), createCategory);

// Route alternative pour créer une catégorie sans fichiers (si les fichiers sont déjà uploadés via Cloudinary)
categoryRoutes.post("/create-with-urls", createCategory);

module.exports = categoryRoutes;
