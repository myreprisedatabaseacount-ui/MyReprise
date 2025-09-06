const express = require("express");
const multer = require("multer");
const { createSubject, getSubjects, getSubjectById, updateSubject, deleteSubject } = require("../controllers/subjectController.js");

const subjectRoutes = express.Router();

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
        else {
          cb(new Error('Champ de fichier non reconnu'), false);
        }
      } catch (filterError) {
        console.error('❌ Erreur filtre multer:', filterError);
        cb(filterError, false);
      }
    }
  });
  console.log('✅ Configuration multer pour sujets initialisée');
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

// Route pour récupérer tous les sujets
subjectRoutes.get("/", getSubjects);

// Route pour récupérer un sujet par ID
subjectRoutes.get("/:id", getSubjectById);

// Route pour créer un sujet avec upload d'image
subjectRoutes.post("/create",
  upload.single('image'),
  handleMulterError,
  createSubject
);

// Route pour mettre à jour un sujet avec upload d'image optionnel
subjectRoutes.put("/:id",
  upload.single('image'),
  handleMulterError,
  updateSubject
);

// Route pour supprimer un sujet
subjectRoutes.delete("/:id", deleteSubject);

module.exports = subjectRoutes;
