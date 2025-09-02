#!/usr/bin/env node
/**
 * Test du serveur sans Redis
 */

require('dotenv').config();
const express = require('express');
const { connectToDatabase } = require('./src/config/database');
const { initializeModels } = require('./src/models');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware basic
app.use(express.json());

// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'MyReprise-NodeJS',
    message: 'Service démarré et en bonne santé',
    timestamp: new Date().toISOString()
  });
});

async function startTestServer() {
  try {
    console.log('🔄 Démarrage du serveur de test...');
    
    console.log('🔄 Connexion à MySQL...');
    await connectToDatabase();
    console.log('✅ MySQL connecté');
    
    console.log('🔄 Initialisation des modèles...');
    await initializeModels();
    console.log('✅ Modèles initialisés');
    
    console.log('🔄 Démarrage du serveur HTTP...');
    app.listen(PORT, () => {
      console.log(`🚀 Serveur de test démarré sur le port ${PORT}`);
      console.log(`🔗 Test: http://localhost:${PORT}/api/health`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

startTestServer();
