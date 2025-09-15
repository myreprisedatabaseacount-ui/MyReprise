/**
 * Script pour combiner toutes les parties des données Cathedis
 * Génère un fichier SQL unique avec toutes les requêtes INSERT
 */

const fs = require('fs');
const path = require('path');

async function combineAllParts() {
    try {
        console.log('🚀 Combinaison de toutes les 46 parties des données Cathedis...');
        
        const outputFile = path.join(__dirname, 'data-addresses-script.sql');
        let combinedContent = '';
        let totalParts = 0;
        let totalLines = 0;
        
        // Header du fichier
        combinedContent += '-- ===================================================\n';
        combinedContent += '-- Script SQL pour insérer toutes les données Cathedis\n';
        combinedContent += '-- Généré automatiquement le ' + new Date().toISOString() + '\n';
        combinedContent += '-- ===================================================\n\n';
        
        combinedContent += '-- Désactiver les vérifications de clés étrangères temporairement\n';
        combinedContent += 'SET FOREIGN_KEY_CHECKS = 0;\n\n';
        
        combinedContent += '-- Vider la table addresses avant l\'insertion\n';
        combinedContent += 'DELETE FROM addresses;\n\n';
        
        combinedContent += '-- Réinitialiser l\'auto-increment\n';
        combinedContent += 'ALTER TABLE addresses AUTO_INCREMENT = 1;\n\n';
        
        // Lire et combiner tous les fichiers de parties (1 à 46)
        for (let part = 1; part <= 46; part++) {
            const partFile = path.join(__dirname, `data-addresses-part${part}.sql`);
            
            if (fs.existsSync(partFile)) {
                console.log(`📄 Lecture de la partie ${part}...`);
                
                const partContent = fs.readFileSync(partFile, 'utf8');
                
                // Ajouter un commentaire de section
                combinedContent += `-- ===================================================\n`;
                combinedContent += `-- PARTIE ${part} DES DONNÉES CATHEDIS\n`;
                combinedContent += `-- ===================================================\n\n`;
                
                combinedContent += partContent;
                combinedContent += '\n\n';
                
                totalParts++;
                totalLines += partContent.split('\n').length;
            } else {
                console.log(`⚠️  Fichier de la partie ${part} non trouvé: ${partFile}`);
            }
        }
        
        // Footer du fichier
        combinedContent += '-- ===================================================\n';
        combinedContent += '-- FIN DU SCRIPT\n';
        combinedContent += '-- ===================================================\n\n';
        
        combinedContent += '-- Réactiver les vérifications de clés étrangères\n';
        combinedContent += 'SET FOREIGN_KEY_CHECKS = 1;\n\n';
        
        combinedContent += '-- Afficher le nombre total d\'adresses insérées\n';
        combinedContent += 'SELECT COUNT(*) as total_addresses FROM addresses;\n\n';
        
        combinedContent += '-- Afficher quelques statistiques\n';
        combinedContent += 'SELECT \n';
        combinedContent += '    COUNT(*) as total_addresses,\n';
        combinedContent += '    COUNT(DISTINCT city) as total_cities,\n';
        combinedContent += '    COUNT(DISTINCT sector) as total_sectors\n';
        combinedContent += 'FROM addresses;\n\n';
        
        // Sauvegarder le fichier combiné
        fs.writeFileSync(outputFile, combinedContent, 'utf8');
        
        console.log('\n✅ Combinaison terminée avec succès!');
        console.log(`📄 Fichier combiné: ${outputFile}`);
        console.log(`📊 Parties traitées: ${totalParts}/46`);
        console.log(`📊 Lignes totales: ${totalLines}`);
        console.log(`📊 Taille du fichier: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`);
        
        console.log('\n📋 Instructions:');
        console.log('1. Exécutez le fichier SQL combiné dans MySQL:');
        console.log(`   mysql -u root -p < ${outputFile}`);
        console.log('2. Vérifiez les données insérées');
        console.log('3. Les statistiques s\'afficheront automatiquement à la fin');
        
    } catch (error) {
        console.error('❌ Erreur lors de la combinaison:', error);
        throw error;
    }
}

// Exécuter la combinaison
if (require.main === module) {
    combineAllParts()
        .then(() => {
            console.log('✅ Script terminé');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Erreur:', error);
            process.exit(1);
        });
}

module.exports = { combineAllParts };