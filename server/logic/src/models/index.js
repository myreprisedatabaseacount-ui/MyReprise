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
    
    // Créer les modèles
    const User = createUserModel(sequelize);
    const Address = createAddressModel(sequelize);
    const Store = createStoreModel(sequelize);
    const Product = createProductModel(sequelize);
    const Category = createCategoryModel(sequelize);
    const Brand = createBrandModel(sequelize);
    const Subject = createSubjectModel(sequelize);
    const SubjectCategory = createSubjectCategoryModel(sequelize);
    const Offer = createOfferModel(sequelize);
    const OfferImage = createOfferImageModel(sequelize);
    const Order = createOrderModel(sequelize);
    const UserSnapshot = createUserSnapshotModel(sequelize);
    const ProductSnapshot = createProductSnapshotModel(sequelize);
    // Exchange supprimé
    const DeliveryCompany = createDeliveryCompanyModel(sequelize);
    const DeliveryInfo = createDeliveryInfoModel(sequelize);
    const Setting = createSettingModel(sequelize);
    
    // Définir les associations
    logger.info('🔄 Définition des associations...');
    
    // User <-> Address
    User.belongsTo(Address, { foreignKey: 'addressId', as: 'Address' });
    Address.hasMany(User, { foreignKey: 'addressId', as: 'Users' });
    
    // User <-> Store
    User.hasOne(Store, { foreignKey: 'userId', as: 'Store' });
    Store.belongsTo(User, { foreignKey: 'userId', as: 'User' });
    
    // User <-> Product
    Product.belongsTo(User, { foreignKey: 'createdBy', as: 'Creator' });
    User.hasMany(Product, { foreignKey: 'createdBy', as: 'Products' });
    
    // Category relations
    Category.belongsTo(Category, { foreignKey: 'parentId', as: 'Parent' });
    Category.hasMany(Category, { foreignKey: 'parentId', as: 'Children' });
    
    // Brand <-> Category
    Brand.belongsTo(Category, { foreignKey: 'categoryId', as: 'Category' });
    Category.hasMany(Brand, { foreignKey: 'categoryId', as: 'Brands' });
    
    // Subject <-> Category (via SubjectCategory)
    Subject.hasMany(SubjectCategory, { foreignKey: 'subjectId', as: 'SubjectCategories' });
    SubjectCategory.belongsTo(Subject, { foreignKey: 'subjectId', as: 'Subject' });
    Category.hasMany(SubjectCategory, { foreignKey: 'categoryId', as: 'SubjectCategories' });
    SubjectCategory.belongsTo(Category, { foreignKey: 'categoryId', as: 'Category' });
    
    // Offer relations
    Offer.belongsTo(Product, { foreignKey: 'productId', as: 'Product' });
    Product.hasMany(Offer, { foreignKey: 'productId', as: 'Offers' });
    
    Offer.belongsTo(User, { foreignKey: 'sellerId', as: 'Seller' });
    User.hasMany(Offer, { foreignKey: 'sellerId', as: 'Offers' });
    
    Offer.belongsTo(Category, { foreignKey: 'categoryId', as: 'Category' });
    Category.hasMany(Offer, { foreignKey: 'categoryId', as: 'Offers' });
    
    Offer.belongsTo(Brand, { foreignKey: 'brandId', as: 'Brand' });
    Brand.hasMany(Offer, { foreignKey: 'brandId', as: 'Offers' });
    
    Offer.belongsTo(Subject, { foreignKey: 'subjectId', as: 'Subject' });
    Subject.hasMany(Offer, { foreignKey: 'subjectId', as: 'Offers' });
    
    // Offer self-reference
    Offer.belongsTo(Offer, { foreignKey: 'replacedByOffer', as: 'ReplacedBy' });
    Offer.hasOne(Offer, { foreignKey: 'replacedByOffer', as: 'Replacement' });
    
    // OfferImage <-> Offer
    OfferImage.belongsTo(Offer, { foreignKey: 'offerId', as: 'Offer' });
    Offer.hasMany(OfferImage, { foreignKey: 'offerId', as: 'Images' });
    
    // Order relations
    Order.hasMany(UserSnapshot, { foreignKey: 'orderId', as: 'UserSnapshots' });
    UserSnapshot.belongsTo(Order, { foreignKey: 'orderId', as: 'Order' });
    
    Order.hasMany(ProductSnapshot, { foreignKey: 'orderId', as: 'ProductSnapshots' });
    ProductSnapshot.belongsTo(Order, { foreignKey: 'orderId', as: 'Order' });
    
    // UserSnapshot relations
    UserSnapshot.belongsTo(User, { foreignKey: 'userId', as: 'User' });
    User.hasMany(UserSnapshot, { foreignKey: 'userId', as: 'Snapshots' });
    
    UserSnapshot.belongsTo(Address, { foreignKey: 'addressId', as: 'Address' });
    Address.hasMany(UserSnapshot, { foreignKey: 'addressId', as: 'UserSnapshots' });
    
    // ProductSnapshot relations
    ProductSnapshot.belongsTo(Offer, { foreignKey: 'offerId', as: 'Offer' });
    Offer.hasMany(ProductSnapshot, { foreignKey: 'offerId', as: 'Snapshots' });
    
    // ProductSnapshot self-reference
    ProductSnapshot.belongsTo(ProductSnapshot, { foreignKey: 'replacedByProductId', as: 'ReplacedBy' });
    ProductSnapshot.hasOne(ProductSnapshot, { foreignKey: 'replacedByProductId', as: 'Replacement' });
    
    // Order <-> User (balance payer)
    Order.belongsTo(User, { foreignKey: 'balancePayerId', as: 'BalancePayer' });
    User.hasMany(Order, { foreignKey: 'balancePayerId', as: 'OrdersToPayBalance' });
    
    // Delivery relations
    DeliveryInfo.belongsTo(Order, { foreignKey: 'orderId', as: 'Order' });
    Order.hasMany(DeliveryInfo, { foreignKey: 'orderId', as: 'DeliveryInfos' });
    
    DeliveryInfo.belongsTo(DeliveryCompany, { foreignKey: 'companyId', as: 'Company' });
    DeliveryCompany.hasMany(DeliveryInfo, { foreignKey: 'companyId', as: 'DeliveryInfos' });
    
    logger.info('✅ Modèles créés avec associations');
    
    // Synchroniser la base de données (créer les tables)
    console.log('🔄 Création des tables...');
    await sequelize.sync({ force: false, alter: false, logging: console.log });
    console.log('✅ Tables créées !');
    logger.info('✅ Tables MySQL synchronisées avec Sequelize');
    
    // Initialiser les données par défaut
    await Setting.initializeDefaultSettings();
    logger.info('✅ Paramètres par défaut initialisés');
    
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