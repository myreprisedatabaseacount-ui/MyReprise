const ReactionService = require('../services/reactionService');
const ConversationService = require('../services/conversationService');
const logger = require('../utils/logger');
const { Message } = require('../models/Message');

/**
 * Contrôleur pour gérer les réactions aux messages
 */
class ReactionController {
    
    /**
     * Toggle une réaction sur un message
     * @param {Object} req - Requête Express
     * @param {Object} res - Réponse Express
     */
    static async toggleReaction(req, res) {
        try {
            const userId = req.user.userId;
            const { messageId, reactionType } = req.body;
            
            if (!messageId || !reactionType) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de message et type de réaction requis',
                    code: 'MISSING_PARAMETERS'
                });
            }

            // Vérifier que l'utilisateur peut accéder au message
            const message = await Message.findByPk(messageId);
            if (!message) {
                return res.status(404).json({
                    success: false,
                    error: 'Message non trouvé',
                    code: 'MESSAGE_NOT_FOUND'
                });
            }

            const canAccess = await ConversationService.canAccessConversation(message.conversation_id, userId);
            if (!canAccess) {
                return res.status(403).json({
                    success: false,
                    error: 'Accès refusé à ce message',
                    code: 'ACCESS_DENIED'
                });
            }

            // Toggle la réaction
            const result = await ReactionService.toggleReaction(messageId, userId, reactionType);
            
            // Récupérer toutes les réactions du message
            const reactions = await ReactionService.getMessageReactionsWithUserStatus(messageId, userId);

            logger.info(`Réaction ${reactionType} ${result.action} par utilisateur ${userId} sur message ${messageId}`);

            res.status(200).json({
                success: true,
                data: {
                    messageId,
                    reactionType,
                    action: result.action,
                    count: result.count,
                    reactions: reactions
                },
                message: `Réaction ${reactionType} ${result.action === 'added' ? 'ajoutée' : 'supprimée'}`
            });

        } catch (error) {
            logger.error('Erreur toggle réaction:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la gestion de la réaction',
                code: 'REACTION_ERROR'
            });
        }
    }

    /**
     * Obtenir les réactions d'un message
     * @param {Object} req - Requête Express
     * @param {Object} res - Réponse Express
     */
    static async getMessageReactions(req, res) {
        try {
            const userId = req.user.userId;
            const { messageId } = req.params;
            
            if (!messageId) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de message requis',
                    code: 'MISSING_MESSAGE_ID'
                });
            }

            // Vérifier que l'utilisateur peut accéder au message
            const message = await Message.findByPk(messageId);
            if (!message) {
                return res.status(404).json({
                    success: false,
                    error: 'Message non trouvé',
                    code: 'MESSAGE_NOT_FOUND'
                });
            }

            const canAccess = await ConversationService.canAccessConversation(message.conversation_id, userId);
            if (!canAccess) {
                return res.status(403).json({
                    success: false,
                    error: 'Accès refusé à ce message',
                    code: 'ACCESS_DENIED'
                });
            }

            // Récupérer les réactions
            const reactions = await ReactionService.getMessageReactionsWithUserStatus(messageId, userId);

            res.status(200).json({
                success: true,
                data: {
                    messageId,
                    reactions: reactions
                }
            });

        } catch (error) {
            logger.error('Erreur récupération réactions:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des réactions',
                code: 'REACTIONS_FETCH_ERROR'
            });
        }
    }

    /**
     * Supprimer toutes les réactions d'un message
     * @param {Object} req - Requête Express
     * @param {Object} res - Réponse Express
     */
    static async deleteMessageReactions(req, res) {
        try {
            const userId = req.user.userId;
            const { messageId } = req.params;
            
            if (!messageId) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de message requis',
                    code: 'MISSING_MESSAGE_ID'
                });
            }

            // Vérifier que l'utilisateur peut accéder au message
            const message = await Message.findByPk(messageId);
            if (!message) {
                return res.status(404).json({
                    success: false,
                    error: 'Message non trouvé',
                    code: 'MESSAGE_NOT_FOUND'
                });
            }

            const canAccess = await ConversationService.canAccessConversation(message.conversation_id, userId);
            if (!canAccess) {
                return res.status(403).json({
                    success: false,
                    error: 'Accès refusé à ce message',
                    code: 'ACCESS_DENIED'
                });
            }

            // Supprimer les réactions
            await ReactionService.deleteMessageReactions(messageId);

            logger.info(`Toutes les réactions du message ${messageId} supprimées par utilisateur ${userId}`);

            res.status(200).json({
                success: true,
                message: 'Toutes les réactions supprimées'
            });

        } catch (error) {
            logger.error('Erreur suppression réactions:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la suppression des réactions',
                code: 'REACTIONS_DELETE_ERROR'
            });
        }
    }
}

module.exports = ReactionController;
