// Test ultra minimal
console.log('🔄 Début test minimal...');

// Test 1: Express seul
const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  res.json({ message: 'Express fonctionne!' });
});

console.log('🔄 Démarrage serveur Express...');
const server = app.listen(3002, () => {
  console.log('🚀 Serveur Express démarré sur port 3002');
  console.log('🔗 Test: http://localhost:3002/test');
  
  // Garder en vie
  setInterval(() => {
    console.log('💓 Serveur vivant');
  }, 3000);
});

process.on('SIGINT', () => {
  console.log('🛑 Arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur fermé');
    process.exit(0);
  });
});
