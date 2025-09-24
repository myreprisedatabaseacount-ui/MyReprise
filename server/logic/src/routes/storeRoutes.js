const express = require('express');
const multer = require("multer");
const { getStoreByUser, getStoreInfo, updateStore, createStore } = require('../controllers/storeController');
const { authenticateToken } = require('../middleware/auth');
const storeRoutes = express.Router();

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
        // Pour les logos
        if (file.fieldname === 'logo') {
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new Error('Seules les images sont autorisées pour le champ logo'), false);
          }
        }
        // Pour les banners
        else if (file.fieldname === 'banner') {
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new Error('Seules les images sont autorisées pour le champ banner'), false);
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
  console.log('✅ Configuration multer initialisée pour les stores');
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

// GET /api/stores/:userId - Récupérer le store d'un utilisateur
storeRoutes.get('/:userId', authenticateToken, getStoreByUser);

// GET /api/stores/:userId/info - Récupérer les informations complètes du store
storeRoutes.get('/:userId/info', authenticateToken, getStoreInfo);

// PUT /api/stores/:userId - Mettre à jour le store avec uploads multiples
storeRoutes.put('/:userId',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  handleMulterError,
  updateStore
);

// POST /api/stores - Créer un nouveau store
storeRoutes.post('/', createStore);

module.exports = storeRoutes;
