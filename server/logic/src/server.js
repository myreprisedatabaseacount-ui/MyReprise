const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const { Op } = require("sequelize");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const db = require("./config/db.js");
const sequelize = db.getSequelize();
dotenv.config();
const fs = require('fs');

// Import de l'initialisation des modèles
const { initializeModels } = require('./models');

// Import des routes
const { categoryRoutes, userRoutes, brandRoutes, subjectRoutes } = require('./routes');

// Import Redis
const { connectToRedis } = require('./config/redis');

const app = express();
const rateLimit = require('express-rate-limit');

// Configuration de multer pour gérer les fichiers multipart
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepter les images et les fichiers SVG
    if (file.mimetype.startsWith('image/') || file.mimetype === 'image/svg+xml') {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté. Seules les images sont autorisées.'), false);
    }
  }
});

// Charger les variables sensibles depuis le fichier .env
const PORT = process.env.PORT || 3001;

// Middleware pour parser les données JSON et multipart
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de nettoyage JSON personnalisé (pour les requêtes JSON uniquement)
app.use((req, res, next) => {
  if (req.is('application/json') && !req.is('multipart/form-data')) {
    let data = '';
    req.setEncoding('utf8');
    
    req.on('data', (chunk) => {
      data += chunk;
    });
    
    req.on('end', () => {
      try {
        // Nettoyer le JSON des caractères invisibles
        const cleanData = data
          .replace(/\r\n/g, '')  // Supprimer les retours à la ligne Windows
          .replace(/\n/g, '')    // Supprimer les retours à la ligne Unix
          .replace(/\r/g, '')    // Supprimer les retours chariot
          .replace(/\s+/g, ' ')  // Remplacer les espaces multiples par un seul
          .trim();               // Supprimer les espaces en début/fin
        
        // Parser le JSON nettoyé
        req.body = JSON.parse(cleanData);
        next();
        
      } catch (e) {
        res.status(400).json({
          error: 'JSON invalide',
          message: 'Le format JSON de la requête est incorrect',
          details: e.message
        });
      }
    });
  } else {
    next();
  }
});

// Middleware de gestion d'erreur JSON
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: 'JSON invalide',
      message: 'Le format JSON de la requête est incorrect',
      details: error.message
    });
  }
  next(error);
});

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 200
}));

// Middleware pour gérer les requêtes OPTIONS (preflight)
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.use("/api/images", express.static("./uploads")); // Servir les fichiers statiques
app.use(helmet()); // Ajouter des en-têtes de sécurité

// Middleware pour parser les cookies
app.use(cookieParser());

// Limiter les requêtes à 100 par heure par IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // max 1000 requêtes par minute
  message: 'Trop de requêtes, réessayez dans une minute.',
});

app.use(limiter);

// Routes
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/users", userRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'MyReprise-NodeJS',
    message: 'Service démarré et en bonne santé',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Fonction pour démarrer le serveur
async function startServer() {
  try {
    // Initialiser les modèles avec leurs associations
    console.log('🔄 Initialisation des modèles...');
    await initializeModels();
    console.log('✅ Modèles initialisés avec succès');
    
    // Initialiser Redis
    await connectToRedis();
    console.log('✅ Redis initialisé avec succès');
    
    app.listen(PORT, () => {
      console.log(`🚀 Serveur MyReprise démarré sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

db.initializeDatabase()
  .then(() => startServer())
  .catch((error) => {
    console.error("Erreur lors de l'initialisation de l'application :", error);
    process.exit(1); // Arrêter l'application en cas d'échec critique
  });

// db.syncModels()
//   .then(() => startServer())
//   .catch((error) => {
//     console.error("Erreur lors de la synchronisation des modèles :", error);
//     process.exit(1); // Arrêter l'application en cas d'échec critique
//   });