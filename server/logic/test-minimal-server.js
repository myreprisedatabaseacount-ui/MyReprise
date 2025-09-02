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

console.log('🔄 DÉBUT DU TEST MINIMAL SERVER');
console.log('🔄 Variables d\'environnement:');
console.log('  - PORT:', process.env.PORT);
console.log('  - DB_HOST:', process.env.DB_HOST);
console.log('  - DB_NAME:', process.env.DB_NAME);
console.log('  - NODE_ENV:', process.env.NODE_ENV);

console.log('🔄 Test import express...');
const express = require('express');
console.log('✅ Express importé');

console.log('🔄 Test import autres modules...');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
console.log('✅ Tous les modules importés');

console.log('🔄 Test création app Express...');
const app = express();
console.log('✅ App Express créée');

console.log('🔄 Test création serveur HTTP...');
const server = createServer(app);
console.log('✅ Serveur HTTP créé');

console.log('🔄 Test création Socket.io...');
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
console.log('✅ Socket.io créé');

console.log('🔄 Test configuration middleware...');
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
console.log('✅ Middleware configuré');

console.log('🔄 Test route de base...');
app.get('/', (req, res) => {
  res.json({ message: 'Test server OK' });
});
console.log('✅ Route configurée');

const PORT = process.env.PORT || 3001;

console.log('🔄 Test démarrage serveur...');
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log('✅ TOUS LES TESTS PASSÉS');
  // Arrêter après 2 secondes pour le test
  setTimeout(() => {
    console.log('🔄 Arrêt du serveur de test...');
    server.close();
    process.exit(0);
  }, 2000);
});

console.log('🔄 Configuration terminée, attente du démarrage...');
