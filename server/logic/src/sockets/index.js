const { authenticateSocket } = require('../middleware/socketAuth');
const ConversationService = require('../services/conversationService');
const MessageService = require('../services/messageService');
const ReactionService = require('../services/reactionService');
// ContactsService supprimé - maintenant géré par ConversationController
const logger = require('../utils/logger');

// Variable globale pour stocker l'instance Socket.IO
let globalIO = null;

const onlineUsers = new Map();

const initializeSockets = (io) => {
    // Stocker l'instance Socket.IO globalement
    globalIO = io;
    
    // Middleware d'authentification pour tous les sockets
    io.use(authenticateSocket);

    // Envoyer périodiquement la liste des utilisateurs en ligne à tous les utilisateurs connectés
    // pour maintenir la synchronisation (toutes les 30 secondes)
    setInterval(() => {
        if (onlineUsers.size > 0) {
            io.emit('online_users', Object.fromEntries(onlineUsers));
            console.log('📡 Synchronisation périodique des utilisateurs en ligne:', Object.fromEntries(onlineUsers));
        }
    }, 30000);

    io.on('connection', (socket) => {
        const userId = socket.user.userId;
        const userEmail = socket.user.email;

        onlineUsers.set(userId, {
            userId: userId,
            socketId: socket.id,
            connectedAt: new Date()
        });

        // Envoyer la liste des utilisateurs en ligne au nouvel utilisateur
        socket.emit('online_users', Object.fromEntries(onlineUsers));

        // Informer TOUS les utilisateurs connectés de la nouvelle liste (y compris le nouvel utilisateur)
        io.emit('online_users', Object.fromEntries(onlineUsers));

        console.log('online_users', Object.fromEntries(onlineUsers));

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

        socket.on('delete_message', async (data) => {
            try {
                const { messageId, conversationId } = data;

                if (!messageId || !conversationId) {
                    socket.emit('error', { message: 'ID de message et de conversation requis' });
                    return;
                }

                // Récupérer le message pour vérifier qu'il existe et appartient à l'utilisateur
                const message = await MessageService.getMessageById(messageId);
                if (!message) {
                    socket.emit('error', { message: 'Message non trouvé' });
                    return;
                }

                // Vérifier que l'utilisateur est bien l'expéditeur du message
                if (message.sender_id !== userId) {
                    socket.emit('error', { message: 'Vous ne pouvez supprimer que vos propres messages' });
                    return;
                }

                // Vérifier que l'utilisateur peut accéder à cette conversation
                const canAccess = await ConversationService.canAccessConversation(conversationId, userId);
                if (!canAccess) {
                    socket.emit('error', { message: 'Accès refusé à cette conversation' });
                    return;
                }

                // Supprimer le message via le service
                const success = await MessageService.deleteMessage(messageId, userId);
                
                if (success) {
                    // Informer tous les participants de la conversation que le message a été supprimé
                    io.to(`conversation_${conversationId}`).emit('message_deleted', {
                        messageId,
                        conversationId,
                        deletedBy: userId,
                        deletedAt: new Date(),
                        user: {
                            id: userId,
                            firstName: socket.user.firstName,
                            lastName: socket.user.lastName,
                            email: userEmail,
                            primaryIdentifier: socket.user.primaryIdentifier
                        }
                    });

                    logger.info(`🗑️ Message ${messageId} supprimé par ${userEmail} dans la conversation ${conversationId}`);
                } else {
                    socket.emit('delete_error', { 
                        messageId: messageId,
                        conversationId: conversationId,
                        error: 'Erreur lors de la suppression du message' 
                    });
                }

            } catch (error) {
                logger.error('Erreur delete_message:', error);
                socket.emit('delete_error', { 
                    messageId: messageId,
                    conversationId: conversationId,
                    error: 'Erreur lors de la suppression du message' 
                });
            }
        });

        socket.on('edit_message', async (data) => {
            try {
                const { messageId, text, conversationId } = data;

                logger.info(`✏️ Demande d'édition de message ${messageId} par ${userId}`);

                // Validation des données
                if (!messageId || !text || !conversationId) {
                    socket.emit('edit_error', { 
                        message: 'Données manquantes', 
                        messageId,
                        conversationId 
                    });
                    return;
                }

                // Validation du texte
                if (text.trim().length === 0) {
                    socket.emit('edit_error', { 
                        message: 'Le message ne peut pas être vide', 
                        messageId,
                        conversationId 
                    });
                    return;
                }

                // Récupérer le message
                const message = await MessageService.getMessageById(messageId);
                if (!message) {
                    socket.emit('edit_error', { 
                        message: 'Message non trouvé', 
                        messageId,
                        conversationId 
                    });
                    return;
                }

                // Vérifier que l'utilisateur est l'expéditeur du message
                if (message.sender_id !== userId) {
                    socket.emit('edit_error', { 
                        message: 'Vous ne pouvez éditer que vos propres messages', 
                        messageId,
                        conversationId 
                    });
                    return;
                }

                // Vérifier l'accès à la conversation
                const canAccess = await ConversationService.canAccessConversation(conversationId, userId);
                if (!canAccess) {
                    socket.emit('edit_error', { 
                        message: 'Accès refusé à cette conversation', 
                        messageId,
                        conversationId 
                    });
                    return;
                }

                // Éditer le message
                await MessageService.editMessage(messageId, text.trim(), userId);

                // Diffuser l'édition à tous les participants
                globalIO.to(`conversation_${conversationId}`).emit('message_edited', {
                    conversationId,
                    messageId,
                    text: text.trim(),
                    editedBy: userId
                });

                logger.info(`✅ Message ${messageId} édité par ${userEmail}`);

            } catch (error) {
                logger.error('Erreur edit_message:', error);
                socket.emit('edit_error', { 
                    message: 'Erreur lors de l\'édition du message',
                    messageId: data?.messageId,
                    conversationId: data?.conversationId 
                });
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

        // Événement pour synchroniser les utilisateurs en ligne
        socket.on('sync_online_users', () => {
            socket.emit('online_users', Object.fromEntries(onlineUsers));
            logger.info(`🔄 Synchronisation des utilisateurs en ligne demandée par ${userEmail}`);
        });

        // Événement pour gérer l'indicateur de frappe (typing)
        socket.on('typing_start', (data) => {
            const { conversationId } = data;
            if (conversationId) {
                // Informer tous les autres utilisateurs de la conversation que cet utilisateur tape
                socket.to(`conversation_${conversationId}`).emit('user_typing', {
                    conversationId,
                    userId: userId,
                    userName: userEmail,
                    isTyping: true
                });
                logger.info(`⌨️ ${userEmail} commence à taper dans la conversation ${conversationId}`);
            }
        });

        socket.on('typing_stop', (data) => {
            const { conversationId } = data;
            if (conversationId) {
                // Informer tous les autres utilisateurs de la conversation que cet utilisateur a arrêté de taper
                socket.to(`conversation_${conversationId}`).emit('user_typing', {
                    conversationId,
                    userId: userId,
                    userName: userEmail,
                    isTyping: false
                });
                logger.info(`⌨️ ${userEmail} a arrêté de taper dans la conversation ${conversationId}`);
            }
        });

        socket.on('disconnect', (reason) => {
            logger.info(`🔌 Utilisateur déconnecté: ${userEmail} (ID: ${userId}) - Raison: ${reason}`);
            
            // Retirer l'utilisateur de la liste des utilisateurs en ligne
            onlineUsers.delete(userId);
            
            // Informer TOUS les utilisateurs connectés de la liste mise à jour
            io.emit('online_users', Object.fromEntries(onlineUsers));
            
            logger.info(`👥 Utilisateur ${userEmail} retiré de la liste des utilisateurs en ligne`);
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
