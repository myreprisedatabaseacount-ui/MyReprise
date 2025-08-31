/**
 * Index des modèles Sequelize
 * Point d'entrée central pour tous les modèles de données
 */

const { getSequelize, DataTypes } = require('../config/database');
const logger = require('../utils/logger');

// Import des modèles
const User = require('./User');
const Address = require('./Address');
const Store = require('./Store');
const Product = require('./Product');
const Category = require('./Category');
const Brand = require('./Brand');
const Subject = require('./Subject');
const SubjectCategory = require('./SubjectCategory');
const Offer = require('./Offer');
const OfferImage = require('./OfferImage');
const Order = require('./Order');
const UserSnapshot = require('./UserSnapshot');
const ProductSnapshot = require('./ProductSnapshot');
const Exchange = require('./Exchange');
const DeliveryCompany = require('./DeliveryCompany');
const DeliveryInfo = require('./DeliveryInfo');
const Setting = require('./Setting');

/**
 * Initialiser tous les modèles et leurs associations
 */
async function initializeModels() {
  try {
    const sequelize = getSequelize();
    
    // Définir les associations entre modèles
    
    // ===== User Relations =====
    User.belongsTo(Address, { foreignKey: 'addressId', as: 'Address' });
    Address.hasMany(User, { foreignKey: 'addressId', as: 'Users' });
    
    User.hasOne(Store, { foreignKey: 'userId', as: 'Store' });
    Store.belongsTo(User, { foreignKey: 'userId', as: 'User' });
    
    // ===== Product Relations =====
    Product.belongsTo(User, { foreignKey: 'createdBy', as: 'Creator' });
    User.hasMany(Product, { foreignKey: 'createdBy', as: 'Products' });
    
    // ===== Category Relations =====
    Category.belongsTo(Category, { foreignKey: 'parentId', as: 'Parent' });
    Category.hasMany(Category, { foreignKey: 'parentId', as: 'Children' });
    
    // ===== Brand Relations =====
    Brand.belongsTo(Category, { foreignKey: 'categoryId', as: 'Category' });
    Category.hasMany(Brand, { foreignKey: 'categoryId', as: 'Brands' });
    
    // ===== Subject Relations =====
    Subject.hasMany(SubjectCategory, { foreignKey: 'subjectId', as: 'SubjectCategories' });
    SubjectCategory.belongsTo(Subject, { foreignKey: 'subjectId', as: 'Subject' });
    
    Category.hasMany(SubjectCategory, { foreignKey: 'categoryId', as: 'SubjectCategories' });
    SubjectCategory.belongsTo(Category, { foreignKey: 'categoryId', as: 'Category' });
    
    // ===== Offer Relations =====
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
    
    // Offer self-reference pour replacedByOffer
    Offer.belongsTo(Offer, { foreignKey: 'replacedByOffer', as: 'ReplacedBy' });
    Offer.hasOne(Offer, { foreignKey: 'replacedByOffer', as: 'Replacement' });
    
    // ===== OfferImage Relations =====
    OfferImage.belongsTo(Offer, { foreignKey: 'offerId', as: 'Offer' });
    Offer.hasMany(OfferImage, { foreignKey: 'offerId', as: 'Images' });
    
    // ===== Order Relations =====
    Order.hasMany(UserSnapshot, { foreignKey: 'orderId', as: 'UserSnapshots' });
    UserSnapshot.belongsTo(Order, { foreignKey: 'orderId', as: 'Order' });
    
    Order.hasMany(ProductSnapshot, { foreignKey: 'orderId', as: 'ProductSnapshots' });
    ProductSnapshot.belongsTo(Order, { foreignKey: 'orderId', as: 'Order' });
    
    // ===== UserSnapshot Relations =====
    UserSnapshot.belongsTo(User, { foreignKey: 'userId', as: 'User' });
    User.hasMany(UserSnapshot, { foreignKey: 'userId', as: 'Snapshots' });
    
    UserSnapshot.belongsTo(Address, { foreignKey: 'addressId', as: 'Address' });
    Address.hasMany(UserSnapshot, { foreignKey: 'addressId', as: 'UserSnapshots' });
    
    // ===== ProductSnapshot Relations =====
    ProductSnapshot.belongsTo(Offer, { foreignKey: 'offerId', as: 'Offer' });
    Offer.hasMany(ProductSnapshot, { foreignKey: 'offerId', as: 'Snapshots' });
    
    // ProductSnapshot self-reference pour replacedByProductId
    ProductSnapshot.belongsTo(ProductSnapshot, { foreignKey: 'replacedByProductId', as: 'ReplacedBy' });
    ProductSnapshot.hasOne(ProductSnapshot, { foreignKey: 'replacedByProductId', as: 'Replacement' });
    
    // ===== Exchange Relations =====
    Exchange.belongsTo(User, { foreignKey: 'initiatorUserId', as: 'Initiator' });
    User.hasMany(Exchange, { foreignKey: 'initiatorUserId', as: 'InitiatedExchanges' });
    
    Exchange.belongsTo(Offer, { foreignKey: 'offeredOfferId', as: 'OfferedOffer' });
    Offer.hasMany(Exchange, { foreignKey: 'offeredOfferId', as: 'ExchangesFrom' });
    
    Exchange.belongsTo(Offer, { foreignKey: 'requestedOfferId', as: 'RequestedOffer' });
    Offer.hasMany(Exchange, { foreignKey: 'requestedOfferId', as: 'ExchangesTo' });
    
    // ===== Delivery Relations =====
    DeliveryInfo.belongsTo(Order, { foreignKey: 'orderId', as: 'Order' });
    Order.hasMany(DeliveryInfo, { foreignKey: 'orderId', as: 'DeliveryInfos' });
    
    DeliveryInfo.belongsTo(DeliveryCompany, { foreignKey: 'companyId', as: 'Company' });
    DeliveryCompany.hasMany(DeliveryInfo, { foreignKey: 'companyId', as: 'DeliveryInfos' });
    
    logger.info('✅ Modèles Sequelize et associations initialisés');
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
  // Export des modèles
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
  Exchange,
  DeliveryCompany,
  DeliveryInfo,
  Setting
};
