/**
 * Index des modèles Sequelize - Version complète
 */

const db = require('../config/db');
const logger = require('../utils/logger');

// Import des modèles refactorisés
const { User } = require('./User');
const { Address } = require('./Address');
const { Store } = require('./Store');
const { Product } = require('./Product');
const { Category } = require('./Category');
const { Brand } = require('./Brand');
const { Offer } = require('./Offer');
const { Order } = require('./Order');

// Import des modèles non encore refactorisés
const { Subject } = require('./Subject');
const { SubjectCategory } = require('./SubjectCategory');
const { BrandCategory } = require('./BrandCategory');
const createOfferImageModel = require('./OfferImage');
const createUserSnapshotModel = require('./UserSnapshot');
const createProductSnapshotModel = require('./ProductSnapshot');
const createDeliveryCompanyModel = require('./DeliveryCompany');
const createDeliveryInfoModel = require('./DeliveryInfo');
const createSettingModel = require('./Setting');

async function initializeModels() {
  try {
    logger.info('🔄 Début initialisation des modèles...');
    const sequelize = db.getSequelize();
    
    // Créer les modèles avec gestion d'erreur
    let OfferImage, UserSnapshot, ProductSnapshot;
    let DeliveryCompany, DeliveryInfo, Setting;
    
    // Modèles refactorisés déjà importés
    
    // Offer déjà importé
    
    try {
      OfferImage = createOfferImageModel(sequelize);
    } catch (error) {
      console.error('❌ Erreur création OfferImage:', error.message);
      OfferImage = null;
    }
    
    // Order déjà importé
    
    try {
      UserSnapshot = createUserSnapshotModel(sequelize);
    } catch (error) {
      console.error('❌ Erreur création UserSnapshot:', error.message);
      UserSnapshot = null;
    }
    
    try {
      ProductSnapshot = createProductSnapshotModel(sequelize);
    } catch (error) {
      console.error('❌ Erreur création ProductSnapshot:', error.message);
      ProductSnapshot = null;
    }
    
    try {
      DeliveryCompany = createDeliveryCompanyModel(sequelize);
    } catch (error) {
      console.error('❌ Erreur création DeliveryCompany:', error.message);
      DeliveryCompany = null;
    }
    
    try {
      DeliveryInfo = createDeliveryInfoModel(sequelize);
    } catch (error) {
      console.error('❌ Erreur création DeliveryInfo:', error.message);
      DeliveryInfo = null;
    }
    
    try {
      Setting = createSettingModel(sequelize);
    } catch (error) {
      console.error('❌ Erreur création Setting:', error.message);
      Setting = null;
    }
    
    // Définir les associations avec gestion d'erreur
    logger.info('🔄 Définition des associations...');
    
    // Vérifier que tous les modèles sont définis
    
    // Associations avec try-catch
    try {
      if (User && Address) {
        User.belongsTo(Address, { foreignKey: 'addressId', as: 'Address' });
        Address.hasMany(User, { foreignKey: 'addressId', as: 'Users' });
      }
    } catch (error) {
      console.error('❌ Erreur association User <-> Address:', error.message);
    }
    
    try {
      if (User && Store) {
        User.hasOne(Store, { foreignKey: 'userId', as: 'Store' });
        Store.belongsTo(User, { foreignKey: 'userId', as: 'User' });
      }
    } catch (error) {
      console.error('❌ Erreur association User <-> Store:', error.message);
    }
    
    try {
      if (Product && User) {
        Product.belongsTo(User, { foreignKey: 'createdBy', as: 'Creator' });
        User.hasMany(Product, { foreignKey: 'createdBy', as: 'Products' });
      }
    } catch (error) {
      console.error('❌ Erreur association User <-> Product:', error.message);
    }
    
    try {
      if (Category) {
        Category.belongsTo(Category, { foreignKey: 'parentId', as: 'Parent' });
        Category.hasMany(Category, { foreignKey: 'parentId', as: 'Children' });
      }
    } catch (error) {
      console.error('❌ Erreur association Category self-reference:', error.message);
    }
    
    try {
      if (Brand && Category && BrandCategory) {
        Brand.belongsToMany(Category, {
          through: BrandCategory,
          foreignKey: 'brandId',
          otherKey: 'categoryId',
          as: 'categories'
        });
        Category.belongsToMany(Brand, {
          through: BrandCategory,
          foreignKey: 'categoryId',
          otherKey: 'brandId',
          as: 'brands'
        });
      }
    } catch (error) {
      console.error('❌ Erreur association Brand <-> Category:', error.message);
    }
    
    try {
      if (Subject && Category && SubjectCategory) {
        Subject.belongsToMany(Category, {
          through: SubjectCategory,
          foreignKey: 'subjectId',
          otherKey: 'categoryId',
          as: 'categories'
        });
        Category.belongsToMany(Subject, {
          through: SubjectCategory,
          foreignKey: 'categoryId',
          otherKey: 'subjectId',
          as: 'subjects'
        });
      }
    } catch (error) {
      console.error('❌ Erreur association Subject <-> Category:', error.message);
    }
    
    logger.info('✅ Associations définies avec gestion d\'erreur');
    
    // Synchroniser la base de données (créer les tables)
    try {
      // Désactiver la synchronisation automatique pour éviter les erreurs de colonnes manquantes
      // await sequelize.sync({ force: false, alter: false, logging: false });
      logger.info('✅ Synchronisation MySQL désactivée');
    } catch (syncError) {
      console.error('❌ Erreur synchronisation base de données:', syncError.message);
      logger.error('❌ Erreur synchronisation base de données:', syncError);
      // Ne pas faire échouer le serveur pour une erreur de sync
    }
    
    // Initialiser les données par défaut
    try {
      if (Setting && typeof Setting.initializeDefaultSettings === 'function') {
        await Setting.initializeDefaultSettings();
        logger.info('✅ Paramètres par défaut initialisés');
      }
    } catch (settingsError) {
      console.error('❌ Erreur initialisation paramètres:', settingsError.message);
      logger.error('❌ Erreur initialisation paramètres:', settingsError);
      // Ne pas faire échouer le serveur pour une erreur de paramètres
    }
    
    return { 
      User, 
      Address, 
      Store,
      Product, 
      Category, 
      Brand, 
      Subject, 
      SubjectCategory, 
      BrandCategory,
      Offer, 
      OfferImage, 
      Order,
      UserSnapshot,
      ProductSnapshot,
      // Exchange supprimé
      DeliveryCompany,
      DeliveryInfo,
      Setting 
    };
    
  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation des modèles:', error);
    throw error;
  }
}

module.exports = {
  initializeModels
};