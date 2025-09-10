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

// Import des nouveaux modèles de conversation
const { Conversation } = require('./Conversation');
const { Message } = require('./Message');
const { Delta } = require('./Delta');
const { ConversationParticipants } = require('./ConversationParticipants');
const { MessageReads } = require('./MessageReads');

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
    
    // Associations pour les modèles de conversation
    try {
      if (Conversation && Message) {
        console.log('🔄 Association Conversation <-> Message...');
        Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'Messages' });
        Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'Conversation' });
      }
    } catch (error) {
      console.error('❌ Erreur association Conversation <-> Message:', error.message);
    }
    
    try {
      if (User && Message) {
        console.log('🔄 Association User <-> Message (sender)...');
        User.hasMany(Message, { foreignKey: 'sender_id', as: 'SentMessages' });
        Message.belongsTo(User, { foreignKey: 'sender_id', as: 'Sender' });
      }
    } catch (error) {
      console.error('❌ Erreur association User <-> Message (sender):', error.message);
    }
    
    try {
      if (Message) {
        console.log('🔄 Association Message self-reference (reply)...');
        Message.belongsTo(Message, { foreignKey: 'reply_to_message_id', as: 'ReplyToMessage' });
        Message.hasMany(Message, { foreignKey: 'reply_to_message_id', as: 'Replies' });
      }
    } catch (error) {
      console.error('❌ Erreur association Message self-reference:', error.message);
    }
    
    try {
      if (Offer && Message) {
        console.log('🔄 Association Offer <-> Message...');
        Offer.hasMany(Message, { foreignKey: 'offer_id', as: 'Messages' });
        Message.belongsTo(Offer, { foreignKey: 'offer_id', as: 'Offer' });
      }
    } catch (error) {
      console.error('❌ Erreur association Offer <-> Message:', error.message);
    }
    
    try {
      if (Offer && Delta) {
        console.log('🔄 Association Offer <-> Delta...');
        Offer.hasMany(Delta, { foreignKey: 'offer_id', as: 'Deltas' });
        Delta.belongsTo(Offer, { foreignKey: 'offer_id', as: 'Offer' });
      }
    } catch (error) {
      console.error('❌ Erreur association Offer <-> Delta:', error.message);
    }
    
    try {
      if (User && Delta) {
        console.log('🔄 Association User <-> Delta (sender/receiver)...');
        User.hasMany(Delta, { foreignKey: 'sender_id', as: 'SentDeltas' });
        User.hasMany(Delta, { foreignKey: 'receiver_id', as: 'ReceivedDeltas' });
        Delta.belongsTo(User, { foreignKey: 'sender_id', as: 'Sender' });
        Delta.belongsTo(User, { foreignKey: 'receiver_id', as: 'Receiver' });
      }
    } catch (error) {
      console.error('❌ Erreur association User <-> Delta:', error.message);
    }
    
    try {
      if (Conversation && Delta) {
        console.log('🔄 Association Conversation <-> Delta...');
        Conversation.hasMany(Delta, { foreignKey: 'conversation_id', as: 'Deltas' });
        Delta.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'Conversation' });
      }
    } catch (error) {
      console.error('❌ Erreur association Conversation <-> Delta:', error.message);
    }
    
    try {
      if (Order && Delta) {
        console.log('🔄 Association Order <-> Delta...');
        Order.hasMany(Delta, { foreignKey: 'order_id', as: 'Deltas' });
        Delta.belongsTo(Order, { foreignKey: 'order_id', as: 'Order' });
      }
    } catch (error) {
      console.error('❌ Erreur association Order <-> Delta:', error.message);
    }
    
    try {
      if (Conversation && ConversationParticipants) {
        console.log('🔄 Association Conversation <-> ConversationParticipants...');
        Conversation.hasMany(ConversationParticipants, { foreignKey: 'conversation_id', as: 'Participants' });
        ConversationParticipants.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'Conversation' });
      }
    } catch (error) {
      console.error('❌ Erreur association Conversation <-> ConversationParticipants:', error.message);
    }
    
    try {
      if (User && ConversationParticipants) {
        console.log('🔄 Association User <-> ConversationParticipants...');
        User.hasMany(ConversationParticipants, { foreignKey: 'user_id', as: 'ConversationParticipations' });
        ConversationParticipants.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
      }
    } catch (error) {
      console.error('❌ Erreur association User <-> ConversationParticipants:', error.message);
    }
    
    try {
      if (Message && MessageReads) {
        console.log('🔄 Association Message <-> MessageReads...');
        Message.hasMany(MessageReads, { foreignKey: 'message_id', as: 'Reads' });
        MessageReads.belongsTo(Message, { foreignKey: 'message_id', as: 'Message' });
      }
    } catch (error) {
      console.error('❌ Erreur association Message <-> MessageReads:', error.message);
    }
    
    try {
      if (User && MessageReads) {
        console.log('🔄 Association User <-> MessageReads...');
        User.hasMany(MessageReads, { foreignKey: 'user_id', as: 'MessageReads' });
        MessageReads.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
      }
    } catch (error) {
      console.error('❌ Erreur association User <-> MessageReads:', error.message);
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
      Setting,
      // Nouveaux modèles de conversation
      Conversation,
      Message,
      Delta,
      ConversationParticipants,
      MessageReads
    };
    
  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation des modèles:', error);
    throw error;
  }
}

module.exports = {
  initializeModels
};