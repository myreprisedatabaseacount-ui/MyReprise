/**
 * Configuration Sequelize pour MySQL
 */

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

let sequelize;

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',  // Changed from 'mysql' to 'localhost'
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'myreprise_new',
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',   // Remplacez par votre mot de passe MySQL
  dialect: 'mysql',
  
  // Configuration du pool de connexions
  pool: {
    max: 20,
    min: 5,
    acquire: 60000,
    idle: 300000,
  },
  
  // Configuration des logs
  logging: (msg) => logger.debug(msg),
  
  // Options Sequelize
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
  
  // Configuration MySQL spécifique
  dialectOptions: {
    charset: 'utf8mb4',
    timezone: '+00:00',
    supportBigNumbers: true,
    bigNumberStrings: true,
  },
  
  // Timezone
  timezone: '+00:00',
};

async function connectToDatabase() {
  try {
    console.log('🔄 Tentative de connexion à la base de données...');
    console.log('📝 Configuration DB:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      username: dbConfig.username,
      // password: dbConfig.password ? '***' : 'vide'
    });
    
    // Créer l'instance Sequelize
    sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      dbConfig
    );
    
    // Test de la connexion avec timeout
    console.log('🔄 Test de connexion...');
    await Promise.race([
      sequelize.authenticate(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout connexion DB')), 10000)
      )
    ]);
    
    console.log('✅ Connexion Sequelize/MySQL établie avec succès');
    logger.info('✅ Connexion Sequelize/MySQL établie avec succès');
    
    return sequelize;
  } catch (error) {
    console.error('❌ Erreur de connexion Sequelize:', error.message);
    logger.error('❌ Erreur de connexion Sequelize:', error);
    
    // Ne pas faire échouer le serveur, juste logger l'erreur
    console.log('⚠️ Le serveur continuera sans base de données');
    return null;
  }
}

async function closeDatabase() {
  if (sequelize) {
    await sequelize.close();
    logger.info('📴 Connexion Sequelize fermée');
  }
}

function getSequelize() {
  try {
    if (!sequelize) {
      console.error('❌ Instance Sequelize non initialisée');
      throw new Error('Instance Sequelize non initialisée');
    }
    return sequelize;
  } catch (error) {
    console.error('❌ Erreur getSequelize:', error.message);
    throw error;
  }
}

// Helper pour les transactions
async function withTransaction(callback) {
  try {
    if (!sequelize) {
      throw new Error('Instance Sequelize non initialisée pour la transaction');
    }
    
    const transaction = await sequelize.transaction();
    
    try {
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      logger.error('❌ Transaction Sequelize échouée:', error);
      throw error;
    }
  } catch (error) {
    console.error('❌ Erreur withTransaction:', error.message);
    logger.error('❌ Erreur withTransaction:', error);
    throw error;
  }
}

// Exporter Sequelize et DataTypes pour les modèles
const { DataTypes, Op, QueryTypes } = require('sequelize');

module.exports = {
  connectToDatabase,
  closeDatabase,
  getSequelize,
  withTransaction,
  // Export des utilitaires Sequelize
  Sequelize,
  DataTypes,
  Op,
  QueryTypes,
};
