const { authenticateSocket } = require('../middleware/socketAuth');
const ConversationService = require('../services/conversationService');
const MessageService = require('../services/messageService');
const ReactionService = require('../services/reactionService');
// ContactsService supprimé - maintenant géré par ConversationController
const logger = require('../utils/logger');

// Variable globale pour stocker l'instance Socket.IO
let globalIO = null;


const initializeSockets = (io) => {
    // Stocker l'instance Socket.IO globalement
    globalIO = io;
    
    // Middleware d'authentification pour tous les sockets
    io.use(authenticateSocket);

    io.on('connection', (socket) => {
        const userId = socket.user.userId;
        const userEmail = socket.user.email;
        
        logger.info(`🔌 Utilisateur connecté: ${userEmail} (ID: ${userId})`);

        // Stocker l'ID utilisateur dans le socket pour faciliter l'accès
        socket.userId = userId;

        // Rejoindre la room utilisateur pour les notifications personnalisées
        socket.join(`user_${userId}`);

        socket.on('join_conversation', async (data) => {
            try {
                const { conversationId } = data;

                if (!conversationId) {
                    socket.emit('error', { message: 'ID de conversation requis' });
                    return;
                }

                // Vérifier que l'utilisateur peut accéder à cette conversation
                const canAccess = await ConversationService.canAccessConversation(conversationId, userId);
                if (!canAccess) {
                    socket.emit('error', { message: 'Accès refusé à cette conversation' });
                    return;
                }

                // Rejoindre la conversation (ajouter à la room Socket.IO)
                socket.join(`conversation_${conversationId}`);

                // S'assurer que l'utilisateur est bien participant dans la DB
                await ConversationService.joinConversation(conversationId, userId);

                // Obtenir les participants pour informer les autres
                const participants = await ConversationService.getConversationParticipants(conversationId);

                // Informer l'utilisateur qu'il a rejoint
                socket.emit('conversation_joined', {
                    conversationId,
                    message: 'Vous avez rejoint la conversation',
                    participants: participants.map(p => ({
                        id: p.User.id,
                        email: p.User.email,
                        primaryIdentifier: p.User.primaryIdentifier,
                        role: p.role
                    }))
                });

                // Informer les autres participants
                socket.to(`conversation_${conversationId}`).emit('user_joined', {
                    conversationId,
                    user: {
                        id: userId,
                        email: userEmail,
                        primaryIdentifier: socket.user.primaryIdentifier
                    },
                    message: `${userEmail} a rejoint la conversation`
                });

                logger.info(`👥 Utilisateur ${userEmail} a rejoint la conversation ${conversationId}`);

            } catch (error) {
                logger.error('Erreur join_conversation:', error);
                socket.emit('error', { message: 'Erreur lors de la connexion à la conversation' });
            }
        });

        socket.on('send_message', async (data) => {
            try {
                const { conversationId, text, audioUrl, replyToMessageId, offerId } = data;

                if (!conversationId) {
                    socket.emit('error', { message: 'ID de conversation requis' });
                    return;
                }

                if (!text && !audioUrl) {
                    socket.emit('error', { message: 'Contenu du message requis (texte ou audio)' });
                    return;
                }

                // Vérifier que l'utilisateur peut accéder à cette conversation
                const canAccess = await ConversationService.canAccessConversation(conversationId, userId);
                if (!canAccess) {
                    socket.emit('error', { message: 'Accès refusé à cette conversation' });
                    return;
                }

                // Sauvegarder le message en base de données
                const message = await MessageService.sendMessage(
                    conversationId,
                    userId,
                    text,
                    audioUrl,
                    replyToMessageId,
                    offerId
                );

                // Récupérer les informations complètes du message avec l'expéditeur
                const { Message } = require('../models/Message');
                const { User } = require('../models/User');
                const fullMessage = await Message.findByPk(message.id, {
                    include: [
                        {
                            model: User,
                            as: 'Sender',
                            attributes: ['id', 'firstName', 'lastName', 'email', 'primaryIdentifier']
                        },
                        {
                            model: Message,
                            as: 'ReplyToMessage',
                            attributes: ['id', 'text', 'sender_id'],
                            include: [{
                                model: User,
                                as: 'Sender',
                                attributes: ['id', 'firstName', 'lastName', 'email', 'primaryIdentifier']
                            }]
                        }
                    ]
                });

                if (fullMessage) {
                    // Envoyer le message à tous les participants de la conversation
                    io.to(`conversation_${conversationId}`).emit('new_message', {
                        conversationId,
                        message: {
                            id: fullMessage.id,
                            text: fullMessage.text,
                            audioUrl: fullMessage.audio_url,
                            sender: {
                                id: fullMessage.Sender.id,
                                firstName: fullMessage.Sender.firstName,
                                lastName: fullMessage.Sender.lastName,
                                email: fullMessage.Sender.email,
                                primaryIdentifier: fullMessage.Sender.primaryIdentifier
                            },
                            replyToMessage: fullMessage.ReplyToMessage ? {
                                id: fullMessage.ReplyToMessage.id,
                                text: fullMessage.ReplyToMessage.text,
                                sender: {
                                    id: fullMessage.ReplyToMessage.Sender.id,
                                    firstName: fullMessage.ReplyToMessage.Sender.firstName,
                                    lastName: fullMessage.ReplyToMessage.Sender.lastName,
                                    email: fullMessage.ReplyToMessage.Sender.email,
                                    primaryIdentifier: fullMessage.ReplyToMessage.Sender.primaryIdentifier
                                }
                            } : null,
                            offerId: fullMessage.offer_id,
                            createdAt: fullMessage.created_at,
                            isEdited: fullMessage.is_edited
                        }
                    });

                    logger.info(`💬 Message envoyé par ${userEmail} dans conversation ${conversationId}`);
                }

                // Mettre à jour la liste des conversations pour tous les participants
                await broadcastConversationsUpdate(conversationId);

            } catch (error) {
                logger.error('Erreur send_message:', error);
                socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
            }
        });

        socket.on('mark_message_read', async (data) => {
            try {
                const { messageId } = data;

                if (!messageId) {
                    socket.emit('error', { message: 'ID de message requis' });
                    return;
                }

                // Récupérer le message pour obtenir l'ID de conversation
                const message = await MessageService.getMessageById(messageId);
                if (!message) {
                    socket.emit('error', { message: 'Message non trouvé' });
                    return;
                }

                await MessageService.markMessageAsRead(messageId, userId);

                // Informer les autres participants de la conversation que le message a été lu
                socket.to(`conversation_${message.conversation_id}`).emit('message_read', {
                    messageId,
                    userId,
                    conversationId: message.conversation_id,
                    readAt: new Date()
                });

                logger.info(`👁️ Message ${messageId} marqué comme lu par ${userEmail} dans la conversation ${message.conversation_id}`);

            } catch (error) {
                logger.error('Erreur mark_message_read:', error);
                socket.emit('error', { message: 'Erreur lors du marquage du message' });
            }
        });

        socket.on('toggle_reaction', async (data) => {
            try {
                const { messageId, reactionType } = data;

                if (!messageId || !reactionType) {
                    socket.emit('error', { message: 'ID de message et type de réaction requis' });
                    return;
                }

                // Récupérer le message pour obtenir l'ID de conversation
                const message = await MessageService.getMessageById(messageId);
                if (!message) {
                    socket.emit('error', { message: 'Message non trouvé' });
                    return;
                }

                // Vérifier que l'utilisateur peut accéder à cette conversation
                const canAccess = await ConversationService.canAccessConversation(message.conversation_id, userId);
                if (!canAccess) {
                    socket.emit('error', { message: 'Accès refusé à cette conversation' });
                    return;
                }

                // Toggle la réaction via le service
                const result = await ReactionService.toggleReaction(messageId, userId, reactionType);
                
                // Récupérer toutes les réactions du message
                const reactions = await ReactionService.getMessageReactionsWithUserStatus(messageId, userId);

                // Informer tous les participants de la conversation
                io.to(`conversation_${message.conversation_id}`).emit('reaction_updated', {
                    messageId,
                    userId,
                    conversationId: message.conversation_id,
                    action: result.action,
                    reactionType: result.reactionType,
                    count: result.count,
                    reactions: reactions,
                    user: {
                        id: userId,
                        firstName: socket.user.firstName,
                        lastName: socket.user.lastName,
                        email: userEmail,
                        primaryIdentifier: socket.user.primaryIdentifier
                    }
                });

                logger.info(`😀 Réaction ${reactionType} ${result.action} par ${userEmail} sur message ${messageId} dans conversation ${message.conversation_id}`);

            } catch (error) {
                logger.error('Erreur toggle_reaction:', error);
                socket.emit('error', { message: 'Erreur lors de la gestion de la réaction' });
            }
        });

        socket.on('leave_conversation', async (data) => {
            try {
                const { conversationId } = data;

                if (!conversationId) {
                    socket.emit('error', { message: 'ID de conversation requis' });
                    return;
                }

                // Quitter la room Socket.IO
                socket.leave(`conversation_${conversationId}`);

                // Marquer comme quitté dans la base de données
                await ConversationService.leaveConversation(conversationId, userId);

                // Informer l'utilisateur
                socket.emit('conversation_left', {
                    conversationId,
                    message: 'Vous avez quitté la conversation'
                });

                // Informer les autres participants
                socket.to(`conversation_${conversationId}`).emit('user_left', {
                    conversationId,
                    user: {
                        id: userId,
                        email: userEmail,
                        primaryIdentifier: socket.user.primaryIdentifier
                    },
                    message: `${userEmail} a quitté la conversation`
                });

                logger.info(`👋 Utilisateur ${userEmail} a quitté la conversation ${conversationId}`);

            } catch (error) {
                logger.error('Erreur leave_conversation:', error);
                socket.emit('error', { message: 'Erreur lors de la sortie de la conversation' });
            }
        });

        socket.on('disconnect', (reason) => {
            logger.info(`🔌 Utilisateur déconnecté: ${userEmail} (ID: ${userId}) - Raison: ${reason}`);
        });

        socket.on('error', (error) => {
            logger.error(`❌ Erreur socket pour utilisateur ${userEmail}:`, error);
        });
    });

    logger.info('✅ Sockets initialisés avec succès');
};

/**
 * Diffuser la mise à jour de la liste des conversations à tous les participants
 * @param {number} conversationId - ID de la conversation
 */
const broadcastConversationsUpdate = async (conversationId) => {
    try {
        if (!globalIO) {
            logger.warn('Instance Socket.IO non disponible pour le broadcast');
            return;
        }

        // Récupérer les participants de la conversation
        const participants = await ConversationService.getConversationParticipants(conversationId);
        
        // Pour chaque participant, envoyer la mise à jour
        for (const participant of participants) {
            const userId = participant.User.id;
            
            // Envoyer la mise à jour à l'utilisateur
            globalIO.to(`user_${userId}`).emit('conversations:update', {
                conversationId: conversationId,
                timestamp: new Date(),
                message: 'Nouveau message reçu'
            });
        }
        
        logger.info(`📋 Liste des conversations mise à jour pour la conversation ${conversationId}`);
    } catch (error) {
        logger.error('Erreur lors de la mise à jour des conversations:', error);
    }
};

module.exports = { initializeSockets, broadcastConversationsUpdate };
