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
    console.log('✅ User importé');
    console.log('✅ Address importé');
    console.log('✅ Store importé');
    console.log('✅ Product importé');
    console.log('✅ Category importé');
    console.log('✅ Brand importé');
    console.log('✅ Offer importé');
    console.log('✅ Order importé');
    console.log('✅ Subject importé');
    console.log('✅ SubjectCategory importé');
    console.log('✅ BrandCategory importé');
    
    // Offer déjà importé
    
    try {
      console.log('🔄 Création OfferImage...');
      OfferImage = createOfferImageModel(sequelize);
      console.log('✅ OfferImage créé');
    } catch (error) {
      console.error('❌ Erreur création OfferImage:', error.message);
      OfferImage = null;
    }
    
    // Order déjà importé
    
    try {
      console.log('🔄 Création UserSnapshot...');
      UserSnapshot = createUserSnapshotModel(sequelize);
      console.log('✅ UserSnapshot créé');
    } catch (error) {
      console.error('❌ Erreur création UserSnapshot:', error.message);
      UserSnapshot = null;
    }
    
    try {
      console.log('🔄 Création ProductSnapshot...');
      ProductSnapshot = createProductSnapshotModel(sequelize);
      console.log('✅ ProductSnapshot créé');
    } catch (error) {
      console.error('❌ Erreur création ProductSnapshot:', error.message);
      ProductSnapshot = null;
    }
    
    try {
      console.log('🔄 Création DeliveryCompany...');
      DeliveryCompany = createDeliveryCompanyModel(sequelize);
      console.log('✅ DeliveryCompany créé');
    } catch (error) {
      console.error('❌ Erreur création DeliveryCompany:', error.message);
      DeliveryCompany = null;
    }
    
    try {
      console.log('🔄 Création DeliveryInfo...');
      DeliveryInfo = createDeliveryInfoModel(sequelize);
      console.log('✅ DeliveryInfo créé');
    } catch (error) {
      console.error('❌ Erreur création DeliveryInfo:', error.message);
      DeliveryInfo = null;
    }
    
    try {
      console.log('🔄 Création Setting...');
      Setting = createSettingModel(sequelize);
      console.log('✅ Setting créé');
    } catch (error) {
      console.error('❌ Erreur création Setting:', error.message);
      Setting = null;
    }
    
    // Définir les associations avec gestion d'erreur
    logger.info('🔄 Définition des associations...');
    
    // Vérifier que tous les modèles sont définis
    console.log('🔄 Vérification des modèles...');
    console.log('  - User:', typeof User);
    console.log('  - Address:', typeof Address);
    console.log('  - Store:', typeof Store);
    console.log('  - Product:', typeof Product);
    console.log('  - Category:', typeof Category);
    console.log('  - Brand:', typeof Brand);
    console.log('  - Subject:', typeof Subject);
    console.log('  - SubjectCategory:', typeof SubjectCategory);
    console.log('  - BrandCategory:', typeof BrandCategory);
    console.log('  - Offer:', typeof Offer);
    console.log('  - OfferImage:', typeof OfferImage);
    console.log('  - Order:', typeof Order);
    console.log('  - UserSnapshot:', typeof UserSnapshot);
    console.log('  - ProductSnapshot:', typeof ProductSnapshot);
    console.log('  - DeliveryCompany:', typeof DeliveryCompany);
    console.log('  - DeliveryInfo:', typeof DeliveryInfo);
    console.log('  - Setting:', typeof Setting);
    
    // Associations avec try-catch
    try {
      if (User && Address) {
        console.log('🔄 Association User <-> Address...');
        User.belongsTo(Address, { foreignKey: 'addressId', as: 'Address' });
        Address.hasMany(User, { foreignKey: 'addressId', as: 'Users' });
      }
    } catch (error) {
      console.error('❌ Erreur association User <-> Address:', error.message);
    }
    
    try {
      if (User && Store) {
        console.log('🔄 Association User <-> Store...');
        User.hasOne(Store, { foreignKey: 'userId', as: 'Store' });
        Store.belongsTo(User, { foreignKey: 'userId', as: 'User' });
      }
    } catch (error) {
      console.error('❌ Erreur association User <-> Store:', error.message);
    }
    
    try {
      if (Product && User) {
        console.log('🔄 Association User <-> Product...');
        Product.belongsTo(User, { foreignKey: 'createdBy', as: 'Creator' });
        User.hasMany(Product, { foreignKey: 'createdBy', as: 'Products' });
      }
    } catch (error) {
      console.error('❌ Erreur association User <-> Product:', error.message);
    }
    
    try {
      if (Category) {
        console.log('🔄 Association Category self-reference...');
        Category.belongsTo(Category, { foreignKey: 'parentId', as: 'Parent' });
        Category.hasMany(Category, { foreignKey: 'parentId', as: 'Children' });
      }
    } catch (error) {
      console.error('❌ Erreur association Category self-reference:', error.message);
    }
    
    try {
      if (Brand && Category && BrandCategory) {
        console.log('🔄 Association Brand <-> Category via BrandCategory...');
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
        console.log('🔄 Association Subject <-> Category via SubjectCategory...');
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
      console.log('🔄 Synchronisation des tables...');
      // Désactiver la synchronisation automatique pour éviter les erreurs de colonnes manquantes
      // await sequelize.sync({ force: false, alter: false, logging: false });
      console.log('✅ Synchronisation désactivée (tables existantes)');
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