/**
 * Index des modèles Sequelize - Version complète
 */

const { getSequelize } = require('../config/database');
const logger = require('../utils/logger');

// Import des modèles
const createUserModel = require('./User');
const createAddressModel = require('./Address');
const createStoreModel = require('./Store');
const createProductModel = require('./Product');
const createCategoryModel = require('./Category');
const createBrandModel = require('./Brand');
const createSubjectModel = require('./Subject');
const createSubjectCategoryModel = require('./SubjectCategory');
const createOfferModel = require('./Offer');
const createOfferImageModel = require('./OfferImage');
const createOrderModel = require('./Order');
const createUserSnapshotModel = require('./UserSnapshot');
const createProductSnapshotModel = require('./ProductSnapshot');
// Exchange model supprimé - pas dans les spécifications
const createDeliveryCompanyModel = require('./DeliveryCompany');
const createDeliveryInfoModel = require('./DeliveryInfo');
const createSettingModel = require('./Setting');

async function initializeModels() {
  try {
    logger.info('🔄 Début initialisation des modèles...');
    const sequelize = getSequelize();
    
    // Créer les modèles avec gestion d'erreur
    let User, Address, Store, Product, Category, Brand, Subject, SubjectCategory;
    let Offer, OfferImage, Order, UserSnapshot, ProductSnapshot;
    let DeliveryCompany, DeliveryInfo, Setting;
    
    try {
      console.log('🔄 Création User...');
      User = createUserModel(sequelize);
      console.log('✅ User créé');
    } catch (error) {
      console.error('❌ Erreur création User:', error.message);
      User = null;
    }
    
    try {
      console.log('🔄 Création Address...');
      Address = createAddressModel(sequelize);
      console.log('✅ Address créé');
    } catch (error) {
      console.error('❌ Erreur création Address:', error.message);
      Address = null;
    }
    
    try {
      console.log('🔄 Création Store...');
      Store = createStoreModel(sequelize);
      console.log('✅ Store créé');
    } catch (error) {
      console.error('❌ Erreur création Store:', error.message);
      Store = null;
    }
    
    try {
      console.log('🔄 Création Product...');
      Product = createProductModel(sequelize);
      console.log('✅ Product créé');
    } catch (error) {
      console.error('❌ Erreur création Product:', error.message);
      Product = null;
    }
    
    try {
      console.log('🔄 Création Category...');
      Category = createCategoryModel(sequelize);
      console.log('✅ Category créé');
    } catch (error) {
      console.error('❌ Erreur création Category:', error.message);
      Category = null;
    }
    
    try {
      console.log('🔄 Création Brand...');
      Brand = createBrandModel(sequelize);
      console.log('✅ Brand créé');
    } catch (error) {
      console.error('❌ Erreur création Brand:', error.message);
      Brand = null;
    }
    
    try {
      console.log('🔄 Création Subject...');
      Subject = createSubjectModel(sequelize);
      console.log('✅ Subject créé');
    } catch (error) {
      console.error('❌ Erreur création Subject:', error.message);
      Subject = null;
    }
    
    try {
      console.log('🔄 Création SubjectCategory...');
      SubjectCategory = createSubjectCategoryModel(sequelize);
      console.log('✅ SubjectCategory créé');
    } catch (error) {
      console.error('❌ Erreur création SubjectCategory:', error.message);
      SubjectCategory = null;
    }
    
    try {
      console.log('🔄 Création Offer...');
      Offer = createOfferModel(sequelize);
      console.log('✅ Offer créé');
    } catch (error) {
      console.error('❌ Erreur création Offer:', error.message);
      Offer = null;
    }
    
    try {
      console.log('🔄 Création OfferImage...');
      OfferImage = createOfferImageModel(sequelize);
      console.log('✅ OfferImage créé');
    } catch (error) {
      console.error('❌ Erreur création OfferImage:', error.message);
      OfferImage = null;
    }
    
    try {
      console.log('🔄 Création Order...');
      Order = createOrderModel(sequelize);
      console.log('✅ Order créé');
    } catch (error) {
      console.error('❌ Erreur création Order:', error.message);
      Order = null;
    }
    
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
      if (Brand && Category) {
        console.log('🔄 Association Brand <-> Category...');
        Brand.belongsTo(Category, { foreignKey: 'categoryId', as: 'Category' });
        Category.hasMany(Brand, { foreignKey: 'categoryId', as: 'Brands' });
      }
    } catch (error) {
      console.error('❌ Erreur association Brand <-> Category:', error.message);
    }
    
    logger.info('✅ Associations définies avec gestion d\'erreur');
    
    // Synchroniser la base de données (créer les tables)
    try {
      console.log('🔄 Création des tables...');
      await sequelize.sync({ force: false, alter: false, logging: false });
      console.log('✅ Tables créées !');
      logger.info('✅ Tables MySQL synchronisées avec Sequelize');
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