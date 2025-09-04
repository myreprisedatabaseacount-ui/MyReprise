const Neo4jSyncService = require('../services/neo4jSyncService');
const { connectToRedis, closeRedis } = require('../config/redis');

// ========================================
// SCRIPT POUR TRAITER LA QUEUE DE RETRY
// ========================================

async function processSyncRetry() {
    try {
        console.log('🔄 Traitement de la queue de retry Neo4j...');
        
        // Initialiser Redis
        console.log('📦 Connexion à Redis...');
        await connectToRedis();
        
        // Traiter la queue de retry
        await Neo4jSyncService.processRetryQueue();
        
        console.log('✅ Queue de retry traitée');
        
    } catch (error) {
        console.error('❌ Erreur lors du traitement de la queue:', error.message);
        throw error;
    } finally {
        // Fermer la connexion Redis
        await closeRedis();
    }
}

// Exécuter le traitement si le script est appelé directement
if (require.main === module) {
    processSyncRetry()
        .then(() => {
            console.log('🎉 Traitement terminé !');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Échec du traitement:', error);
            process.exit(1);
        });
}

module.exports = { processSyncRetry };
