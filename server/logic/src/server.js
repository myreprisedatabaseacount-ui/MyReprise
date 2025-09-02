/**
 * Serveur principal Node.js pour MyReprise
 * Responsable de la logique métier complète de l'application
 */

// Configuration manuelle pour éviter le .env corrompu
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '3001';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '3306';
process.env.DB_USERNAME = process.env.DB_USERNAME || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.DB_DATABASE = process.env.DB_DATABASE || 'myreprise_new';
process.env.DB_NAME = process.env.DB_NAME || 'myreprise_new';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.NEO4J_URI = process.env.NEO4J_URI || 'neo4j://localhost:7687';
process.env.NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
process.env.NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'neo4j123';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'myreprisel2alamiya&&codesecretman3tihchlberrani';
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { initializeModels } = require('./models');


// Import des modules internes
const logger = require('./utils/logger');
const { connectToDatabase } = require('./config/database');
const { connectToRedis } = require('./config/redis');

// Configuration de l'application
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par windowMs
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Middleware de logging
if (NODE_ENV === 'production') {
  app.use(morgan('combined', { stream: logger.stream }));
} else {
  app.use(morgan('dev'));
}

// Middleware de compression
app.use(compression());

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));



// Route unique de santé
app.get('/api/health', (req, res) => {
  console.log('✅ Service Node.js - Démarré et en bonne santé');
  res.status(200).json({
    status: 'healthy',
    service: 'MyReprise-NodeJS',
    message: 'Service démarré et en bonne santé',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// WebSocket pour temps réel
io.use((socket, next) => {
  // Authentification WebSocket
  const token = socket.request.headers.authorization;
  if (token) {
    // Valider le token JWT ici
    next();
  } else {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  logger.info(`Nouvelle connexion WebSocket: ${socket.id}`);
  
  socket.on('join_room', (room) => {
    socket.join(room);
    logger.info(`Socket ${socket.id} a rejoint la room ${room}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Connexion WebSocket fermée: ${socket.id}`);
  });
});

// Middleware simple pour les routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Fonction de démarrage du serveur
async function startServer() {
  try {
    console.log('🔄 startServer() appelée');
    
    // Connexion à la base de données
    console.log('🔄 Connexion à MySQL...');
    await connectToDatabase();
    console.log('✅ MySQL connecté');
    logger.info('✅ Connexion à MySQL établie');
    
    // Initialisation des modèles et création des tables
    logger.info('🔄 Début initialisation des modèles...');
    await initializeModels();
    logger.info('✅ Modèles initialisés avec succès');
    // Connexion à Redis (désactivée temporairement)
    // await connectToRedis();
    logger.info('⚠️ Redis désactivé temporairement');
    
    // Démarrage du serveur
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Serveur MyReprise démarré sur le port ${PORT}`);
      logger.info(`📝 Environnement: ${NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
    
  } catch (error) {
    logger.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Gestion des signaux de fermeture
process.on('SIGTERM', () => {
  logger.info('Signal SIGTERM reçu, fermeture gracieuse du serveur...');
  server.close(() => {
    logger.info('Serveur fermé');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('Signal SIGINT reçu, fermeture gracieuse du serveur...');
  server.close(() => {
    logger.info('Serveur fermé');
    process.exit(0);
  });
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.error('Exception non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesse rejetée non gérée à:', promise, 'raison:', reason);
  process.exit(1);
});

// Démarrer le serveur avec debug
console.log('🔄 DÉBUT DU SCRIPT SERVER.JS');
console.log('🔄 Variables d\'environnement:');
console.log('  - PORT:', process.env.PORT);
console.log('  - DB_HOST:', process.env.DB_HOST);
console.log('  - DB_NAME:', process.env.DB_NAME);
console.log('  - NODE_ENV:', process.env.NODE_ENV);

startServer().catch(error => {
  console.error('💥 ERREUR FATALE:', error);
  console.error('💥 Stack trace:', error.stack);
  process.exit(1);
});

module.exports = { app, server, io };
