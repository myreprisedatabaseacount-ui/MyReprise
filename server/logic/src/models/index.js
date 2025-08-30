/**
 * Index des modèles Sequelize
 * Point d'entrée central pour tous les modèles de données
 */

const { getSequelize, DataTypes } = require('../config/database');
const logger = require('../utils/logger');

// Import des modèles (à créer selon vos besoins)
// const User = require('./User');
// const Product = require('./Product');
// const Order = require('./Order');
// const Category = require('./Category');

/**
 * Initialiser tous les modèles et leurs associations
 */
async function initializeModels() {
  try {
    const sequelize = getSequelize();
    
    // Ici vous pouvez définir vos modèles directement ou les importer
    // Exemple de structure :
    
    /*
    const models = {
      User: User(sequelize, DataTypes),
      Product: Product(sequelize, DataTypes),
      Order: Order(sequelize, DataTypes),
      Category: Category(sequelize, DataTypes),
    };
    
    // Définir les associations
    Object.keys(models).forEach(modelName => {
      if (models[modelName].associate) {
        models[modelName].associate(models);
      }
    });
    
    // Attacher les modèles à l'instance Sequelize
    sequelize.models = models;
    */
    
    logger.info('✅ Modèles Sequelize initialisés');
    return sequelize;
    
  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation des modèles:', error);
    throw error;
  }
}

/**
 * Synchroniser la base de données
 */
async function syncDatabase(options = {}) {
  try {
    const sequelize = getSequelize();
    
    const defaultOptions = {
      force: false,      // Ne pas supprimer les tables existantes
      alter: process.env.NODE_ENV === 'development', // Modifier en dev seulement
      logging: (sql) => logger.debug(`Sequelize: ${sql}`)
    };
    
    const syncOptions = { ...defaultOptions, ...options };
    
    await sequelize.sync(syncOptions);
    logger.info('✅ Base de données synchronisée');
    
  } catch (error) {
    logger.error('❌ Erreur lors de la synchronisation:', error);
    throw error;
  }
}

module.exports = {
  initializeModels,
  syncDatabase,
  // Exporter ici vos modèles quand vous les créez
  // User,
  // Product,
  // Order,
  // Category,
};
