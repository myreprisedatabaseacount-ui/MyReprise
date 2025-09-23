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
const { MessageReactions } = require('./MessageReactions');

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
    
    // Associer Order <-> UserSnapshot (pour jointures sur 'Order')
    try {
      if (Order && UserSnapshot) {
        Order.hasMany(UserSnapshot, { foreignKey: 'order_id', as: 'UserSnapshots' });
        UserSnapshot.belongsTo(Order, { foreignKey: 'order_id', as: 'Order' });
      }
    } catch (error) {
      console.error('❌ Erreur association Order <-> UserSnapshot:', error.message);
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
        Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'Messages' });
        Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'Conversation' });
      }
    } catch (error) {
      console.error('❌ Erreur association Conversation <-> Message:', error.message);
    }
    
    try {
      if (User && Message) {
        User.hasMany(Message, { foreignKey: 'sender_id', as: 'SentMessages' });
        Message.belongsTo(User, { foreignKey: 'sender_id', as: 'Sender' });
      }
    } catch (error) {
      console.error('❌ Erreur association User <-> Message (sender):', error.message);
    }
    
    try {
      if (Message) {
        Message.belongsTo(Message, { foreignKey: 'reply_to_message_id', as: 'ReplyToMessage' });
        Message.hasMany(Message, { foreignKey: 'reply_to_message_id', as: 'Replies' });
      }
    } catch (error) {
      console.error('❌ Erreur association Message self-reference:', error.message);
    }
    
    try {
      if (Offer && Message) {
        Offer.hasMany(Message, { foreignKey: 'offer_id', as: 'Messages' });
        Message.belongsTo(Offer, { foreignKey: 'offer_id', as: 'Offer' });
      }
    } catch (error) {
      console.error('❌ Erreur association Offer <-> Message:', error.message);
    }
    
    try {
      if (Offer && Delta) {
        Offer.hasMany(Delta, { foreignKey: 'offer_id', as: 'Deltas' });
        Delta.belongsTo(Offer, { foreignKey: 'offer_id', as: 'Offer' });
      }
    } catch (error) {
      console.error('❌ Erreur association Offer <-> Delta:', error.message);
    }
    
    try {
      if (Offer && Address) {
        Offer.belongsTo(Address, { foreignKey: 'addressId', as: 'address' });
        Address.hasMany(Offer, { foreignKey: 'addressId', as: 'offers' });
      }
    } catch (error) {
      console.error('❌ Erreur association Offer <-> Address:', error.message);
    }
    
    try {
      if (Offer && OfferImage) {
        Offer.hasMany(OfferImage, { foreignKey: 'offerId', as: 'images' });
        OfferImage.belongsTo(Offer, { foreignKey: 'offerId', as: 'offer' });
      }
    } catch (error) {
      console.error('❌ Erreur association Offer <-> OfferImage:', error.message);
    }
    
    try {
      if (User && Delta) {
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
        Conversation.hasMany(Delta, { foreignKey: 'conversation_id', as: 'Deltas' });
        Delta.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'Conversation' });
      }
    } catch (error) {
      console.error('❌ Erreur association Conversation <-> Delta:', error.message);
    }
    
    try {
      if (Order && Delta) {
        Order.hasMany(Delta, { foreignKey: 'order_id', as: 'Deltas' });
        Delta.belongsTo(Order, { foreignKey: 'order_id', as: 'Order' });
      }
    } catch (error) {
      console.error('❌ Erreur association Order <-> Delta:', error.message);
    }
    
    try {
      if (Conversation && ConversationParticipants) {
        Conversation.hasMany(ConversationParticipants, { foreignKey: 'conversation_id', as: 'Participants' });
        ConversationParticipants.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'Conversation' });
      }
    } catch (error) {
      console.error('❌ Erreur association Conversation <-> ConversationParticipants:', error.message);
    }
    
    try {
      if (User && ConversationParticipants) {
        User.hasMany(ConversationParticipants, { foreignKey: 'user_id', as: 'ConversationParticipations' });
        ConversationParticipants.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
      }
    } catch (error) {
      console.error('❌ Erreur association User <-> ConversationParticipants:', error.message);
    }
    
    try {
      if (Message && MessageReads) {
        Message.hasMany(MessageReads, { foreignKey: 'message_id', as: 'Reads' });
        MessageReads.belongsTo(Message, { foreignKey: 'message_id', as: 'Message' });
      }
    } catch (error) {
      console.error('❌ Erreur association Message <-> MessageReads:', error.message);
    }
    
    try {
      if (User && MessageReads) {
        User.hasMany(MessageReads, { foreignKey: 'user_id', as: 'MessageReads' });
        MessageReads.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
      }
    } catch (error) {
      console.error('❌ Erreur association User <-> MessageReads:', error.message);
    }
    
    try {
      if (Message && MessageReactions) {
        Message.hasMany(MessageReactions, { foreignKey: 'message_id', as: 'Reactions' });
        MessageReactions.belongsTo(Message, { foreignKey: 'message_id', as: 'Message' });
      }
    } catch (error) {
      console.error('❌ Erreur association Message <-> MessageReactions:', error.message);
    }
    
    try {
      if (User && MessageReactions) {
        User.hasMany(MessageReactions, { foreignKey: 'user_id', as: 'MessageReactions' });
        MessageReactions.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
      }
    } catch (error) {
      console.error('❌ Erreur association User <-> MessageReactions:', error.message);
    }
    
    // Synchroniser la base de données (créer les tables)

    // try {
    //   // Désactiver temporairement les contraintes de clés étrangères
    //   await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
    //   // Utiliser alter: true pour synchroniser les changements de structure
    //   const syncOptions = {
    //     force: false,
    //     alter: true,
    //     logging: false
    //   };
      
    //   await sequelize.sync(syncOptions);
      
    //   // Réactiver les contraintes de clés étrangères
    //   await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    // } catch (syncError) {
    //   console.error('❌ Erreur synchronisation base de données:', syncError.message);
    //   logger.error('❌ Erreur synchronisation base de données:', syncError);
      
    //   // Si c'est une erreur de validation, essayer de la corriger avec le script
    //   if (syncError.name === 'SequelizeValidationError' || syncError.message.includes('Validation error')) {
    //     try {
    //       // Importer et exécuter les scripts de correction
    //       const { fixUserTable } = require('../scripts/fix-user-table');
    //       const { fixAddressesTable } = require('../scripts/fix-addresses-table');
          
    //       await fixUserTable();
    //       await fixAddressesTable();
          
    //       // Réessayer la synchronisation après correction
    //       await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    //       await sequelize.sync({
    //         force: false,
    //         alter: true,
    //         logging: false
    //       });
    //       await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    //     } catch (correctionError) {
    //       console.error('❌ Erreur lors de la correction:', correctionError.message);
          
    //       // En dernier recours, utiliser force: true en mode développement
    //       if (process.env.NODE_ENV === 'development' && process.env.FORCE_SYNC === 'true') {
    //         try {
    //           await sequelize.sync({ force: true, logging: false });
    //         } catch (forceError) {
    //           console.error('❌ Erreur même avec force: true:', forceError.message);
    //           logger.error('❌ Erreur même avec force: true:', forceError);
    //         }
    //       }
    //     }
    //   }
      
    //   // Si c'est une erreur de trop d'index, optimiser les index
    //   if (syncError.message.includes('Too many keys specified')) {
    //     try {
    //       // Importer et exécuter le script d'optimisation des index
    //       const { optimizeIndexes } = require('../scripts/optimize-indexes');
    //       await optimizeIndexes();
          
    //       // Réessayer la synchronisation après optimisation
    //       await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    //       await sequelize.sync({
    //         force: false,
    //         alter: true,
    //         logging: false
    //       });
    //       await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    //     } catch (optimizationError) {
    //       console.error('❌ Erreur lors de l\'optimisation des index:', optimizationError.message);
    //     }
    //   }
    // }
    
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
      MessageReads,
      MessageReactions
    };
    
  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation des modèles:', error);
    throw error;
  }
}

module.exports = {
  initializeModels
};