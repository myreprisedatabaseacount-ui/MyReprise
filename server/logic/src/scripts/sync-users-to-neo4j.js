const Neo4jSyncService = require('../services/neo4jSyncService');
const { connectToRedis, closeRedis } = require('../config/redis');

// ========================================
// SCRIPT DE SYNCHRONISATION DES UTILISATEURS VERS NEO4J
// ========================================

async function syncUsersToNeo4j() {
    try {
        console.log('🔄 Démarrage de la synchronisation des utilisateurs vers Neo4j...');
        
        // Initialiser Redis
        console.log('📦 Connexion à Redis...');
        await connectToRedis();
        
        // Synchroniser tous les utilisateurs existants
        const result = await Neo4jSyncService.syncAllUsers();
        
        console.log('\n📊 Résultats de la synchronisation :');
        console.log(`   ✅ Utilisateurs synchronisés avec succès: ${result.successCount}`);
        console.log(`   ❌ Erreurs de synchronisation: ${result.errorCount}`);
        console.log(`   📈 Taux de réussite: ${Math.round((result.successCount / (result.successCount + result.errorCount)) * 100)}%`);
        
        if (result.errorCount > 0) {
            console.log('\n⚠️  Des erreurs ont été détectées. Les utilisateurs en erreur ont été ajoutés à la queue de retry.');
            console.log('   Utilisez "npm run process:sync-retry" pour traiter les retries.');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error.message);
        throw error;
    } finally {
        // Fermer la connexion Redis
        await closeRedis();
    }
}

// Exécuter la synchronisation si le script est appelé directement
if (require.main === module) {
    syncUsersToNeo4j()
        .then(() => {
            console.log('🎉 Synchronisation terminée !');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Échec de la synchronisation:', error);
            process.exit(1);
        });
}

module.exports = { syncUsersToNeo4j };
