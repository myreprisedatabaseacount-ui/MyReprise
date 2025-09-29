const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🧪 Test de l\'API /api/offers/grouped-by-top-categories...');
    
    const response = await fetch('http://localhost:3001/api/offers/grouped-by-top-categories?limit=3&offersLimit=8');
    const data = await response.json();
    
    console.log('📊 Résultat:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testAPI();
