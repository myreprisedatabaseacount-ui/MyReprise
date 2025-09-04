const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const cookieParser = require("cookie-parser");
const { Op } = require("sequelize");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const { sequelize } = require('./config/db.js');
dotenv.config();

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
const { categoryRoutes, userRoutes } = require('./routes');

// Import Redis
const { connectToRedis } = require('./config/redis');

const app = express();
const rateLimit = require('express-rate-limit');

// Charger les variables sensibles depuis le fichier .env
const PORT = process.env.PORT || 3001;

// Middleware de nettoyage JSON personnalisé
app.use((req, res, next) => {
  if (req.is('application/json')) {
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
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

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