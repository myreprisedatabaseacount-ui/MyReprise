// Import direct des modèles
const { MessageReactions } = require('../models/MessageReactions');
const { Message } = require('../models/Message');
const { User } = require('../models/User');
const { Conversation } = require('../models/Conversation');
const logger = require('../utils/logger');

/**
 * Service pour gérer les réactions aux messages
 */
class ReactionService {
    
    /**
     * Toggle une réaction sur un message
     * @param {number} messageId - ID du message
     * @param {number} userId - ID de l'utilisateur
     * @param {string} reactionType - Type de réaction
     * @returns {Object} Résultat de l'opération
     */
    static async toggleReaction(messageId, userId, reactionType) {
        try {
            // Vérifier que le message existe
            const message = await Message.findByPk(messageId);
            if (!message) {
                throw new Error('Message non trouvé');
            }

            // Vérifier que l'utilisateur existe
            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            // Vérifier que le type de réaction est valide
            const validReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry', 'thumbs_up', 'thumbs_down'];
            if (!validReactions.includes(reactionType)) {
                throw new Error('Type de réaction invalide');
            }

            // Chercher une réaction existante
            const existingReaction = await MessageReactions.findOne({
                where: {
                    message_id: messageId,
                    user_id: userId,
                    reaction_type: reactionType
                }
            });

            if (existingReaction) {
                // Supprimer la réaction existante
                await existingReaction.destroy();
                logger.info(`Réaction ${reactionType} supprimée par utilisateur ${userId} sur message ${messageId}`);
                return {
                    action: 'removed',
                    reactionType,
                    count: await this.getReactionCount(messageId, reactionType)
                };
            } else {
                // Créer une nouvelle réaction
                await MessageReactions.create({
                    message_id: messageId,
                    user_id: userId,
                    reaction_type: reactionType
                });
                logger.info(`Réaction ${reactionType} ajoutée par utilisateur ${userId} sur message ${messageId}`);
                return {
                    action: 'added',
                    reactionType,
                    count: await this.getReactionCount(messageId, reactionType)
                };
            }
        } catch (error) {
            logger.error('Erreur toggle réaction:', error);
            throw error;
        }
    }

    /**
     * Obtenir le nombre de réactions d'un type spécifique pour un message
     * @param {number} messageId - ID du message
     * @param {string} reactionType - Type de réaction
     * @returns {number} Nombre de réactions
     */
    static async getReactionCount(messageId, reactionType) {
        try {
            const count = await MessageReactions.count({
                where: {
                    message_id: messageId,
                    reaction_type: reactionType
                }
            });
            return count;
        } catch (error) {
            logger.error('Erreur comptage réactions:', error);
            throw error;
        }
    }

    /**
     * Obtenir toutes les réactions d'un message avec le statut de l'utilisateur
     * @param {number} messageId - ID du message
     * @param {number} userId - ID de l'utilisateur actuel
     * @returns {Array} Liste des réactions avec compteurs et statut utilisateur
     */
    static async getMessageReactionsWithUserStatus(messageId, userId) {
        try {
            // Obtenir toutes les réactions du message
            const reactions = await MessageReactions.findAll({
                where: { message_id: messageId },
                include: [{
                    model: User,
                    as: 'User',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }]
            });

            // Grouper par type de réaction
            const reactionGroups = {};
            reactions.forEach(reaction => {
                const type = reaction.reaction_type;
                if (!reactionGroups[type]) {
                    reactionGroups[type] = {
                        type,
                        count: 0,
                        users: [],
                        userReacted: false
                    };
                }
                reactionGroups[type].count++;
                reactionGroups[type].users.push({
                    id: reaction.User.id,
                    firstName: reaction.User.firstName,
                    lastName: reaction.User.lastName,
                    email: reaction.User.email
                });
                
                // Vérifier si l'utilisateur actuel a réagi
                if (reaction.user_id === userId) {
                    reactionGroups[type].userReacted = true;
                }
            });

            return Object.values(reactionGroups);
        } catch (error) {
            logger.error('Erreur récupération réactions:', error);
            throw error;
        }
    }

    /**
     * Obtenir toutes les réactions d'un message (version simplifiée)
     * @param {number} messageId - ID du message
     * @returns {Array} Liste des réactions avec compteurs
     */
    static async getMessageReactions(messageId) {
        try {
            const reactions = await MessageReactions.findAll({
                where: { message_id: messageId },
                attributes: ['reaction_type'],
                group: ['reaction_type'],
                raw: true
            });

            // Compter les réactions par type
            const reactionCounts = {};
            reactions.forEach(reaction => {
                const type = reaction.reaction_type;
                reactionCounts[type] = (reactionCounts[type] || 0) + 1;
            });

            return Object.entries(reactionCounts).map(([type, count]) => ({
                type,
                count
            }));
        } catch (error) {
            logger.error('Erreur récupération réactions simples:', error);
            throw error;
        }
    }

    /**
     * Supprimer toutes les réactions d'un message
     * @param {number} messageId - ID du message
     * @returns {boolean} Succès
     */
    static async deleteMessageReactions(messageId) {
        try {
            await MessageReactions.destroy({
                where: { message_id: messageId }
            });
            logger.info(`Toutes les réactions du message ${messageId} supprimées`);
            return true;
        } catch (error) {
            logger.error('Erreur suppression réactions:', error);
            throw error;
        }
    }
}

module.exports = ReactionService;
