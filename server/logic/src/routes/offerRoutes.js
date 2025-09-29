const express = require("express");
const multer = require("multer");
const { createOffer, getOffers, getOfferById, updateOffer, deleteOffer, getCategoriesToExchange, getMyOffers, getOffersGroupedByTopCategories } = require("../controllers/offerController.js");
const { authenticateToken } = require('../middleware/authEnhanced');

const offerRoutes = express.Router();

// Configuration multer avec gestion d'erreur
let upload;
try {
  const storage = multer.memoryStorage();
  upload = multer({
    storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max par fichier
      files: 10 // Maximum 10 fichiers
    },
    fileFilter: (req, file, cb) => {
      try {
        // Pour les images (création)
        if (file.fieldname === 'images') {
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new Error('Seules les images sont autorisées pour le champ images'), false);
          }
        }
        // Pour les nouvelles images (mise à jour)
        else if (file.fieldname === 'newImages') {
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new Error('Seules les images sont autorisées pour le champ newImages'), false);
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
  console.log('✅ Configuration multer pour offres initialisée');
} catch (multerError) {
  console.error('❌ Erreur configuration multer offres:', multerError);
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

// Route pour récupérer les offres
offerRoutes.get("/", getOffers);

// Route pour rechercher des offres
offerRoutes.get("/search", getOffers);

// Route pour récupérer les offres de l'utilisateur connecté
offerRoutes.get("/my-offers", authenticateToken, getMyOffers);

// Route pour récupérer les offres par vendeur
offerRoutes.get("/seller/:sellerId", getOffers);

// Route pour récupérer les offres par catégorie
offerRoutes.get("/category/:categoryId", getOffers);

// Route pour récupérer les offres groupées par les catégories les plus populaires
offerRoutes.get("/grouped-by-top-categories", getOffersGroupedByTopCategories);

// Route pour récupérer une offre par ID
offerRoutes.get("/:id", getOfferById);

// Route pour récupérer les catégories d'échange d'une offre
offerRoutes.get("/:offerId/categories-to-exchange", getCategoriesToExchange);

// Route pour créer une offre avec uploads multiples
offerRoutes.post("/create",
  upload.array('images', 10), // Maximum 10 images
  handleMulterError,
  createOffer
);

// Route pour créer une offre avec URLs Cloudinary
offerRoutes.post("/create-with-urls", createOffer);

// Route pour mettre à jour une offre avec uploads multiples
offerRoutes.put("/:id",
  upload.fields([
    { name: 'images', maxCount: 10 },      // Pour la création
    { name: 'newImages', maxCount: 10 }    // Pour la mise à jour
  ]),
  handleMulterError,
  updateOffer
);

// Route pour mettre à jour une offre avec URLs Cloudinary
offerRoutes.put("/:id/urls", updateOffer);

// Route pour archiver une offre
offerRoutes.put("/:id/archive", updateOffer);

// Route pour échanger une offre
offerRoutes.put("/:id/exchange", updateOffer);

// Route pour changer le statut d'une offre
offerRoutes.put("/:id/status", updateOffer);

// Route pour supprimer une offre
offerRoutes.delete("/:id", deleteOffer);

// Route pour récupérer les offres supprimées (corbeille) d'un vendeur
offerRoutes.get("/trash/:sellerId", getOffers);

// Route pour restaurer une offre depuis la corbeille
offerRoutes.put("/:id/restore", updateOffer);

// Route pour supprimer définitivement une offre
offerRoutes.delete("/:id/permanent", deleteOffer);


module.exports = offerRoutes;
