// Script Node.js pour vider toutes les tables
const { sequelize } = require('../logic/src/config/database');

async function clearAllTables() {
    try {
        console.log('🗑️ Début du nettoyage des tables...');
        
        // Désactiver les vérifications de clés étrangères
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Liste des tables à vider (dans l'ordre inverse des dépendances)
        const tables = [
            'delivery_infos',
            'delivery_companies', 
            'product_snapshots',
            'user_snapshots',
            'orders',
            'offer_images',
            'offers',
            'products',
            'subject_categories',
            'subjects',
            'brands',
            'categories',
            'stores',
            'users',
            'addresses',
            'settings'
        ];
        
        // Vider chaque table
        for (const table of tables) {
            try {
                await sequelize.query(`TRUNCATE TABLE ${table}`);
                console.log(`✅ Table ${table} vidée`);
            } catch (error) {
                console.log(`⚠️ Table ${table}: ${error.message}`);
            }
        }
        
        // Réactiver les vérifications de clés étrangères
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log('🎉 Toutes les tables ont été vidées avec succès!');
        
        // Vérifier que les tables sont vides
        const result = await sequelize.query('SELECT COUNT(*) as count FROM users');
        console.log(`📊 Nombre d'utilisateurs restants: ${result[0][0].count}`);
        
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error.message);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

clearAllTables();
