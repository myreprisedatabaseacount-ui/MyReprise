console.log('🔄 DÉBUT DU TEST SERVER');
console.log('🔄 Variables d\'environnement:');
console.log('  - PORT:', process.env.PORT);
console.log('  - DB_HOST:', process.env.DB_HOST);
console.log('  - DB_NAME:', process.env.DB_NAME);
console.log('  - NODE_ENV:', process.env.NODE_ENV);

console.log('🔄 Test import express...');
const express = require('express');
console.log('✅ Express importé');

console.log('🔄 Test import database...');
const { connectToDatabase } = require('./src/config/database');
console.log('✅ Database importé');

console.log('🔄 Test import models...');
const { initializeModels } = require('./src/models');
console.log('✅ Models importé');

console.log('🔄 Test connexion MySQL...');
connectToDatabase().then(() => {
  console.log('✅ MySQL connecté');
  console.log('🔄 Test initialisation modèles...');
  return initializeModels();
}).then(() => {
  console.log('✅ Modèles initialisés');
  console.log('✅ TOUS LES TESTS PASSÉS');
  process.exit(0);
}).catch(error => {
  console.error('❌ ERREUR:', error);
  console.error('❌ Stack trace:', error.stack);
  process.exit(1);
});