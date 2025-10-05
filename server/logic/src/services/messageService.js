// Import direct des modèles
const { Message } = require('../models/Message');
const { MessageReads } = require('../models/MessageReads');
const { User } = require('../models/User');
const { Conversation } = require('../models/Conversation');
const logger = require('../utils/logger');

/**
 * Service pour gérer les messages
 */
class MessageService {
    
    static async sendMessage(conversationId, senderId, text = null, audioUrl = null, replyToMessageId = null, offerId = null) {
        try {
            // Vérifier que la conversation existe
            const conversation = await Conversation.findByPk(conversationId);
            if (!conversation) {
                throw new Error('Conversation non trouvée');
            }

            // Vérifier que l'expéditeur existe
            const sender = await User.findByPk(senderId);
            if (!sender) {
                throw new Error('Expéditeur non trouvé');
            }

            // Créer le message
            const message = await Message.create({
                conversation_id: conversationId,
                sender_id: senderId,
                text: text,
                audio_url: audioUrl,
                reply_to_message_id: replyToMessageId,
                offer_id: offerId
            });

            // Marquer le message comme lu par l'expéditeur
            await MessageReads.create({
                message_id: message.id,
                user_id: senderId,
                read_at: new Date()
            });

            logger.info(`Message envoyé: ${message.id} dans conversation ${conversationId}`);
            return message;
        } catch (error) {
            logger.error('Erreur envoi message:', error);
            throw error;
        }
    }

    /**
     * Marquer un message comme lu
     * @param {number} messageId - ID du message
     * @param {number} userId - ID de l'utilisateur
     * @returns {Object} Lecture créée
     */
    static async markMessageAsRead(messageId, userId) {
        try {
            // Vérifier si le message existe
            const message = await Message.findByPk(messageId);
            if (!message) {
                throw new Error('Message non trouvé');
            }

            // Vérifier si l'utilisateur a déjà lu le message
            const existingRead = await MessageReads.findOne({
                where: {
                    message_id: messageId,
                    user_id: userId
                }
            });

            if (existingRead) {
                return existingRead;
            }

            // Créer la lecture
            const read = await MessageReads.create({
                message_id: messageId,
                user_id: userId,
                read_at: new Date()
            });

            logger.info(`Message ${messageId} marqué comme lu par utilisateur ${userId}`);
            return read;
        } catch (error) {
            logger.error('Erreur marquage message lu:', error);
            throw error;
        }
    }

    /**
     * Obtenir les messages d'une conversation
     * @param {number} conversationId - ID de la conversation
     * @param {number} limit - Nombre de messages à récupérer
     * @param {number} offset - Décalage pour la pagination
     * @returns {Array} Liste des messages
     */
    static async getConversationMessages(conversationId, limit = 50, offset = 0) {
        try {
            const messages = await Message.findAll({
                where: {
                    conversation_id: conversationId,
                    is_deleted: false
                },
                include: [
                    {
                        model: User,
                        as: 'Sender',
                        attributes: ['id', 'email', 'primaryIdentifier']
                    },
                    {
                        model: Message,
                        as: 'ReplyToMessage',
                        attributes: ['id', 'text', 'sender_id'],
                        include: [{
                            model: User,
                            as: 'Sender',
                            attributes: ['id', 'email', 'primaryIdentifier']
                        }]
                    }
                ],
                order: [['created_at', 'ASC']],
                limit: limit,
                offset: offset
            });

            return messages;
        } catch (error) {
            logger.error('Erreur récupération messages:', error);
            throw error;
        }
    }

    /**
     * Supprimer un message (soft delete)
     * @param {number} messageId - ID du message
     * @param {number} userId - ID de l'utilisateur (pour vérifier les permissions)
     * @returns {boolean} Succès
     */
    static async deleteMessage(messageId, userId) {
        try {
            const message = await Message.findByPk(messageId);
            if (!message) {
                throw new Error('Message non trouvé');
            }

            // Vérifier que l'utilisateur est l'expéditeur du message
            if (message.sender_id !== userId) {
                throw new Error('Permission refusée: vous ne pouvez supprimer que vos propres messages');
            }

            await message.update({
                is_deleted: true
            });

            logger.info(`Message ${messageId} supprimé par utilisateur ${userId}`);
            return true;
        } catch (error) {
            logger.error('Erreur suppression message:', error);
            throw error;
        }
    }

    /**
     * Modifier un message
     * @param {number} messageId - ID du message
     * @param {string} newText - Nouveau contenu
     * @param {number} userId - ID de l'utilisateur (pour vérifier les permissions)
     * @returns {Object} Message modifié
     */
    static async editMessage(messageId, newText, userId) {
        try {
            const message = await Message.findByPk(messageId);
            if (!message) {
                throw new Error('Message non trouvé');
            }

            // Vérifier que l'utilisateur est l'expéditeur du message
            if (message.sender_id !== userId) {
                throw new Error('Permission refusée: vous ne pouvez modifier que vos propres messages');
            }

            await message.update({
                text: newText,
                is_edited: true
            });

            logger.info(`Message ${messageId} modifié par utilisateur ${userId}`);
            return message;
        } catch (error) {
            logger.error('Erreur modification message:', error);
            throw error;
        }
    }

    /**
     * Récupérer un message par son ID
     * @param {number} messageId - ID du message
     * @returns {Object} Message trouvé
     */
    static async getMessageById(messageId) {
        try {
            const message = await Message.findByPk(messageId);
            if (!message) {
                throw new Error('Message non trouvé');
            }
            return message;
        } catch (error) {
            logger.error('Erreur récupération message:', error);
            throw error;
        }
    }
}

module.exports = MessageService;
