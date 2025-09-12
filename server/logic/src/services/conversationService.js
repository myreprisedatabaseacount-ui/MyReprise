const logger = require('../utils/logger');

// Fonction pour obtenir les modèles de manière dynamique
const getModels = () => {
    const { Conversation } = require('../models/Conversation');
    const { ConversationParticipants } = require('../models/ConversationParticipants');
    const { User } = require('../models/User');
    return { Conversation, ConversationParticipants, User };
};

/**
 * Service pour gérer les conversations
 */
class ConversationService {
    
    /**
     * Créer une nouvelle conversation
     * @param {string} type - Type de conversation ('chat' ou 'negotiation')
     * @param {Array} participantIds - IDs des participants
     * @returns {Object} Conversation créée
     */
    static async createConversation(type = 'chat', participantIds = []) {
        try {
            const { Conversation, ConversationParticipants } = getModels();
            const conversation = await Conversation.create({
                type: type
            });

            // Ajouter les participants
            for (const userId of participantIds) {
                await ConversationParticipants.create({
                    conversation_id: conversation.id,
                    user_id: userId,
                    role: 'membre'
                });
            }

            logger.info(`Conversation créée: ${conversation.id}`);
            return conversation;
        } catch (error) {
            logger.error('Erreur création conversation:', error);
            throw error;
        }
    }

    /**
     * Rejoindre une conversation existante
     * @param {number} conversationId - ID de la conversation
     * @param {number} userId - ID de l'utilisateur
     * @returns {Object} Participation créée
     */
    static async joinConversation(conversationId, userId) {
        try {
            const { Conversation, ConversationParticipants, User } = getModels();
            // Vérifier que la conversation existe
            const conversation = await Conversation.findByPk(conversationId);
            if (!conversation) {
                throw new Error('Conversation non trouvée');
            }

            // Vérifier que l'utilisateur existe
            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            // Vérifier si l'utilisateur est déjà participant
            const existingParticipation = await ConversationParticipants.findOne({
                where: {
                    conversation_id: conversationId,
                    user_id: userId
                }
            });

            if (existingParticipation) {
                // Si l'utilisateur avait quitté, le réactiver
                if (existingParticipation.left_at) {
                    await existingParticipation.update({
                        left_at: null,
                        blocked_conversation: false
                    });
                    logger.info(`Utilisateur ${userId} a rejoint la conversation ${conversationId}`);
                    return existingParticipation;
                } else {
                    logger.info(`Utilisateur ${userId} est déjà dans la conversation ${conversationId}`);
                    return existingParticipation;
                }
            }

            // Créer une nouvelle participation
            const participation = await ConversationParticipants.create({
                conversation_id: conversationId,
                user_id: userId,
                role: 'membre'
            });

            logger.info(`Utilisateur ${userId} a rejoint la conversation ${conversationId}`);
            return participation;
        } catch (error) {
            logger.error('Erreur join conversation:', error);
            throw error;
        }
    }

    /**
     * Quitter une conversation
     * @param {number} conversationId - ID de la conversation
     * @param {number} userId - ID de l'utilisateur
     * @returns {boolean} Succès
     */
    static async leaveConversation(conversationId, userId) {
        try {
            const { ConversationParticipants } = getModels();
            const participation = await ConversationParticipants.findOne({
                where: {
                    conversation_id: conversationId,
                    user_id: userId
                }
            });

            if (participation && !participation.left_at) {
                await participation.update({
                    left_at: new Date()
                });
                logger.info(`Utilisateur ${userId} a quitté la conversation ${conversationId}`);
                return true;
            }

            return false;
        } catch (error) {
            logger.error('Erreur leave conversation:', error);
            throw error;
        }
    }

    /**
     * Vérifier si un utilisateur peut accéder à une conversation
     * @param {number} conversationId - ID de la conversation
     * @param {number} userId - ID de l'utilisateur
     * @returns {boolean} Accès autorisé
     */
    static async canAccessConversation(conversationId, userId) {
        try {
            const { ConversationParticipants } = getModels();
            const participation = await ConversationParticipants.findOne({
                where: {
                    conversation_id: conversationId,
                    user_id: userId,
                    blocked_conversation: false
                }
            });

            return participation && !participation.left_at;
        } catch (error) {
            logger.error('Erreur vérification accès conversation:', error);
            return false;
        }
    }

    /**
     * Obtenir les participants d'une conversation
     * @param {number} conversationId - ID de la conversation
     * @returns {Array} Liste des participants
     */
    static async getConversationParticipants(conversationId) {
        try {
            const { ConversationParticipants, User } = getModels();
            const participants = await ConversationParticipants.findAll({
                where: {
                    conversation_id: conversationId,
                    left_at: null
                },
                include: [{
                    model: User,
                    as: 'User',
                    attributes: ['id', 'email', 'primaryIdentifier']
                }]
            });

            return participants;
        } catch (error) {
            logger.error('Erreur récupération participants:', error);
            throw error;
        }
    }
}

module.exports = ConversationService;
