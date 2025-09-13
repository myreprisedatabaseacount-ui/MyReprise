const express = require('express');
const router = express.Router();
const ReactionController = require('../controllers/reactionController');
const { authenticateToken } = require('../middleware/auth');

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Toggle une réaction sur un message
router.post('/toggle', ReactionController.toggleReaction);

// Obtenir les réactions d'un message
router.get('/message/:messageId', ReactionController.getMessageReactions);

// Supprimer toutes les réactions d'un message
router.delete('/message/:messageId', ReactionController.deleteMessageReactions);

module.exports = router;
