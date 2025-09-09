const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const { Op } = require("sequelize");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const { sequelize } = require('./config/db.js');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const db = require("./config/db.js");
const fs = require('fs');

// Import des modèles refactorisés
const { User } = require('./models/User');
const { Address } = require('./models/Address');
const { Store } = require('./models/Store');
const { Product } = require('./models/Product');
const { Category } = require('./models/Category');
const { Brand } = require('./models/Brand');
const { Offer } = require('./models/Offer');
const { Order } = require('./models/Order');

// Import des routes
const { categoryRoutes, userRoutes, brandRoutes, whatsappRoutes } = require('./routes');

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
app.use("/api/auth", userRoutes);
app.use("/api/users", userRoutes);
app.use("/api/whatsapp", whatsappRoutes);

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
    // Initialiser Redis
    await connectToRedis();
    console.log('✅ Redis initialisé avec succès');
    
    app.listen(PORT, () => {
      console.log(`🚀 Serveur MyReprise démarré sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de Redis:', error);
    // Continuer sans Redis si ce n'est pas critique
    app.listen(PORT, () => {
      console.log(`🚀 Serveur MyReprise démarré sur le port ${PORT} (sans Redis)`);
    });
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