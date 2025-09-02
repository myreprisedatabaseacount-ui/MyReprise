#!/usr/bin/env node
/**
 * Debug du serveur étape par étape
 */

console.log('🔄 Début du debug...');

try {
  console.log('🔄 1. Chargement des modules...');
  require('dotenv').config();
  console.log('✅ dotenv chargé');
  
  const express = require('express');
  console.log('✅ express chargé');
  
  console.log('🔄 2. Test de la base de données...');
  const { connectToDatabase } = require('./src/config/database');
  console.log('✅ database config chargé');
  
  console.log('🔄 3. Test des modèles...');
  const { initializeModels } = require('./src/models');
  console.log('✅ models chargé');
  
  console.log('🔄 4. Test du logger...');
  const logger = require('./src/utils/logger');
  console.log('✅ logger chargé');
  
  console.log('🔄 5. Connexion MySQL...');
  connectToDatabase()
    .then(() => {
      console.log('✅ MySQL connecté');
      
      console.log('🔄 6. Initialisation modèles...');
      return initializeModels();
    })
    .then(() => {
      console.log('✅ Modèles initialisés');
      
      console.log('🔄 7. Création serveur Express...');
      const app = express();
      
      app.get('/test', (req, res) => {
        res.json({ status: 'ok', message: 'Serveur fonctionne !' });
      });
      
      console.log('🔄 8. Démarrage serveur...');
      app.listen(3001, () => {
        console.log('🚀 Serveur démarré avec succès sur le port 3001 !');
        console.log('🔗 Test: http://localhost:3001/test');
        
        // Garder le processus vivant
        setInterval(() => {
          console.log('💓 Serveur toujours en vie...');
        }, 5000);
      });
    })
    .catch((error) => {
      console.error('❌ Erreur détectée:', error);
      console.error('📋 Stack:', error.stack);
      process.exit(1);
    });
  
} catch (error) {
  console.error('❌ Erreur lors du chargement:', error);
  console.error('📋 Stack:', error.stack);
  process.exit(1);
}
