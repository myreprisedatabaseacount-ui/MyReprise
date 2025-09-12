const express = require('express');
const { authenticateToken } = require('../middleware/authEnhanced');
const ConversationController = require('../controllers/conversationController');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/conversations
 * Récupérer la liste des conversations de l'utilisateur connecté
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        await ConversationController.getConversations(req, res);
    } catch (error) {
        logger.error('Erreur dans la route GET /api/conversations:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }
});

/**
 * GET /api/conversations/:conversationId
 * Récupérer les informations d'une conversation spécifique
 */
router.get('/:conversationId', authenticateToken, async (req, res) => {
    try {
        await ConversationController.getConversationInfo(req, res);
    } catch (error) {
        logger.error('Erreur dans la route GET /api/conversations/:conversationId:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }
});

/**
 * POST /api/conversations/:friendId
 * Créer ou récupérer une conversation avec un utilisateur
 */
router.post('/:friendId', authenticateToken, async (req, res) => {
    try {
        await ConversationController.createOrGetConversation(req, res);
    } catch (error) {
        logger.error('Erreur dans la route POST /api/conversations/:friendId:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }
});

/**
 * PUT /api/conversations/:conversationId/read
 * Marquer tous les messages d'une conversation comme lus
 */
router.put('/:conversationId/read', authenticateToken, async (req, res) => {
    try {
        await ConversationController.markConversationAsRead(req, res);
    } catch (error) {
        logger.error('Erreur dans la route PUT /api/conversations/:conversationId/read:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }
});

module.exports = router;
