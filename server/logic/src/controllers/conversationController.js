const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Import des modèles directement
const { User } = require('../models/User');
const { Conversation } = require('../models/Conversation');
const { ConversationParticipants } = require('../models/ConversationParticipants');
const { Message } = require('../models/Message');
const { MessageReads } = require('../models/MessageReads');
const { MessageReactions } = require('../models/MessageReactions');
const { getNegotiationSummary } = require('./repriseOrderController');

// Import de la fonction de broadcast socket
const { broadcastConversationsUpdate } = require('../sockets');
const ConversationService = require('../services/conversationService');

/**
 * Contrôleur pour gérer les conversations
 */
class ConversationController {
    
    static async getConversations(req, res) {
        try {
            // Sécurité: s'assurer que l'utilisateur est authentifié
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "Authentification requise",
                    code: "UNAUTHORIZED"
                });
            }
            
            logger.info(`Récupération des conversations pour l'utilisateur ${userId}`);
            
            // Vérifier que l'utilisateur existe
            const user = await User.findByPk(userId);
            if (!user) {
                logger.warn(`Utilisateur ${userId} non trouvé`);
                return res.status(404).json({
                    success: false,
                    error: 'Utilisateur non trouvé',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Récupérer toutes les conversations où l'utilisateur est participant
            const conversations = await Conversation.findAll({
                include: [
                    {
                        model: ConversationParticipants,
                        as: 'Participants',
                        where: {
                            user_id: userId,
                            left_at: null // Seulement les conversations actives
                        },
                        required: true // INNER JOIN pour s'assurer que l'utilisateur est participant
                    }
                ]
            });

            logger.info(`Trouvé ${conversations.length} conversations pour l'utilisateur ${userId}`);

            // Si aucune conversation, retourner une liste vide
            if (!conversations || conversations.length === 0) {
                logger.info(`Aucune conversation trouvée pour l'utilisateur ${userId}`);
                return res.status(200).json({
                    success: true,
                    data: {
                        conversations: [],
                        totalCount: 0,
                        hasConversations: false
                    },
                    message: 'Aucune conversation trouvée. Commencez une nouvelle conversation avec vos amis.'
                });
            }

            const conversationsList = [];

            for (const conversation of conversations) {
                try {
                    // Récupérer tous les participants de cette conversation
                    const allParticipants = await ConversationParticipants.findAll({
                        where: {
                            conversation_id: conversation.id,
                            left_at: null // Seulement les participants actifs
                        },
                        include: [
                            {
                                model: User,
                                as: 'User',
                                attributes: ['id', 'firstName', 'lastName', 'profileImage', 'email', 'phone']
                            }
                        ]
                    });

                    // Récupérer l'autre participant (pas l'utilisateur connecté)
                    const otherParticipant = allParticipants.find(
                        p => p.user_id !== userId
                    );

                    if (!otherParticipant || !otherParticipant.User) {
                        logger.warn(`Participant manquant pour la conversation ${conversation.id}`);
                        continue;
                    }

                    const friend = otherParticipant.User;

                    // Récupérer le dernier message de la conversation
                    const lastMessage = await Message.findOne({
                        where: {
                            conversation_id: conversation.id,
                            is_deleted: false
                        },
                        order: [['created_at', 'DESC']],
                        include: [
                            {
                                model: User,
                                as: 'Sender',
                                attributes: ['id', 'firstName', 'lastName']
                            }
                        ]
                    });

                    // Compter les messages non lus
                    const unreadMessages = await Message.findAll({
                        where: {
                            conversation_id: conversation.id,
                            sender_id: { [Op.ne]: userId }, // Messages des autres
                            is_deleted: false
                        },
                        include: [
                            {
                                model: MessageReads,
                                as: 'Reads',
                                where: {
                                    user_id: userId
                                },
                                required: false // LEFT JOIN pour inclure les messages non lus
                            }
                        ]
                    });

                    // Compter les messages sans lecture
                    const unreadCount = unreadMessages.filter(msg => !msg.Reads || msg.Reads.length === 0).length;

                    // Formater le dernier message
                    let lastMessageText = 'Aucun message';
                    let lastMessageType = 'text';
                    
                    if (lastMessage) {
                        if (lastMessage.text) {
                            lastMessageText = lastMessage.text;
                            lastMessageType = 'text';
                        } else if (lastMessage.audio_url) {
                            lastMessageText = 'Message vocal';
                            lastMessageType = 'audio';
                        } else {
                            lastMessageText = 'Message';
                            lastMessageType = 'other';
                        }
                    }

                    const item = {
                        conversationId: conversation.id,
                        friendId: friend.id,
                        friendName: `${friend.firstName} ${friend.lastName}`,
                        friendImage: friend.profileImage || null,
                        friendEmail: friend.email,
                        friendPhone: friend.phone,
                        lastMessage: {
                            text: lastMessageText,
                            type: lastMessageType,
                            senderId: lastMessage?.Sender?.id || null,
                            senderName: lastMessage?.Sender ? 
                                `${lastMessage.Sender.firstName} ${lastMessage.Sender.lastName}` : 
                                null,
                            timestamp: lastMessage?.created_at || conversation.created_at
                        },
                        unreadCount: unreadCount,
                        conversationType: conversation.type,
                        lastActivity: lastMessage?.created_at || conversation.updated_at
                    };

                    // Si négociation: retourner les détails de la commande et les 2 produits (snapshots)
                    if (conversation.type === 'negotiation') {
                        try {
                            const resolvedOrderId = conversation.order_id || null;
                            if (resolvedOrderId) {
                                item.negotiation = await getNegotiationSummary(resolvedOrderId);
                            }
                        } catch (negErr) {
                            logger.warn(`Impossible de charger les détails de négociation pour conv ${conversation.id}: ${negErr.message}`);
                        }
                    }

                    conversationsList.push(item);

                } catch (conversationError) {
                    logger.error(`Erreur lors du traitement de la conversation ${conversation.id}:`, conversationError);
                    // Continuer avec les autres conversations
                    continue;
                }
            }

            // Trier par dernière activité (plus récent en premier)
            conversationsList.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

            logger.info(`Liste des conversations récupérée pour l'utilisateur ${userId}: ${conversationsList.length} conversations`);

            // Déterminer le message de réponse selon le nombre de conversations
            let message = 'Liste des conversations récupérée avec succès';
            if (conversationsList.length === 0) {
                message = 'Aucune conversation trouvée. Commencez une nouvelle conversation avec vos amis.';
            } else if (conversationsList.length === 1) {
                message = '1 conversation trouvée';
            } else {
                message = `${conversationsList.length} conversations trouvées`;
            }

            res.status(200).json({
                success: true,
                data: {
                    conversations: conversationsList,
                    totalCount: conversationsList.length,
                    hasConversations: conversationsList.length > 0
                },
                message: message
            });

        } catch (error) {
            logger.error('Erreur lors de la récupération des conversations:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des conversations',
                code: 'CONVERSATIONS_FETCH_ERROR',
                data: {
                    conversations: [],
                    totalCount: 0,
                    hasConversations: false
                }
            });
        }
    }

    static async createOrGetConversation(req, res) {
        try {
            // Sécurité: s'assurer que l'utilisateur est authentifié
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "Authentification requise",
                    code: "UNAUTHORIZED"
                });
            }

            const friendId = parseInt(req.params.friendId);
            const { type = 'chat' } = req.body;
            
            if (isNaN(friendId) || friendId <= 0 || friendId === undefined || friendId === null) {
                return res.status(400).json({
                    success: false,
                    error: 'ID d\'ami invalide',
                    code: 'INVALID_FRIEND_ID'
                });
            }
            
            if (userId === friendId) {
                return res.status(400).json({
                    success: false,
                    error: 'Impossible de créer une conversation avec soi-même',
                    code: 'SELF_CONVERSATION_ERROR'
                });
            }

            logger.info(`Création/récupération de conversation entre utilisateurs ${userId} et ${friendId}`);

            // Vérifier que l'ami existe
            const friend = await User.findByPk(friendId);
            if (!friend) {
                logger.warn(`Utilisateur ami ${friendId} non trouvé`);
                return res.status(404).json({
                    success: false,
                    error: 'Utilisateur ami non trouvé',
                    code: 'FRIEND_NOT_FOUND'
                });
            }

            // Vérifier que l'utilisateur actuel existe
            const currentUser = await User.findByPk(userId);
            if (!currentUser) {
                logger.warn(`Utilisateur actuel ${userId} non trouvé`);
                return res.status(404).json({
                    success: false,
                    error: 'Utilisateur actuel non trouvé',
                    code: 'CURRENT_USER_NOT_FOUND'
                });
            }

            // Rechercher une conversation existante entre ces deux utilisateurs (approche robuste)
            // Étape 1: trouver toutes les conversations actives du userId
            const myConvRows = await ConversationParticipants.findAll({
                where: { user_id: userId, left_at: null },
                attributes: ['conversation_id'],
                raw: true
            });
            const myConvIds = myConvRows.map(r => r.conversation_id);

            let existingConversation = null;
            if (myConvIds.length > 0) {
                // Étape 2: vérifier si friendId participe à une des mêmes conversations actives
                const friendRow = await ConversationParticipants.findOne({
                    where: {
                        user_id: friendId,
                        left_at: null,
                        conversation_id: { [Op.in]: myConvIds }
                    },
                    raw: true
                });

                if (friendRow) {
                    // Charger la conversation trouvée
                    existingConversation = await Conversation.findByPk(friendRow.conversation_id);
                }
            }

            if (existingConversation) {
                logger.info(`Conversation existante trouvée: ${existingConversation.id}`);
                return res.status(200).json({
                    success: true,
                    data: {
                        conversation: {
                            id: existingConversation.id,
                            type: existingConversation.type,
                            createdAt: existingConversation.created_at
                        }
                    },
                    message: 'Conversation existante récupérée avec succès'
                });
            }

            // Créer une nouvelle conversation
            let conversation;
            try {
                conversation = await Conversation.create({
                    type: type
                });
                logger.info(`Conversation ${conversation.id} créée avec succès`);
            } catch (createError) {
                logger.error('Erreur lors de la création de la conversation:', createError);
                return res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la création de la conversation',
                    code: 'CONVERSATION_CREATE_FAILED'
                });
            }

            // Ajouter les deux participants (éviter doublons si la création est réessayée)
            try {
                // Vérifier ceux qui manquent puis créer seulement les manquants
                const existingParts = await ConversationParticipants.findAll({
                    where: { conversation_id: conversation.id, user_id: { [Op.in]: [userId, friendId] } },
                    attributes: ['user_id'],
                    raw: true
                });
                const existingUserIds = new Set(existingParts.map(p => p.user_id));
                const toCreate = [];
                if (!existingUserIds.has(userId)) {
                    toCreate.push({ conversation_id: conversation.id, user_id: userId, role: 'membre' });
                }
                if (!existingUserIds.has(friendId)) {
                    toCreate.push({ conversation_id: conversation.id, user_id: friendId, role: 'membre' });
                }
                if (toCreate.length > 0) {
                    await ConversationParticipants.bulkCreate(toCreate);
                }
                logger.info(`Participants ajoutés/confirmés pour la conversation ${conversation.id}`);
            } catch (participantError) {
                logger.error('Erreur lors de l\'ajout des participants:', participantError);
                // Essayer de supprimer la conversation créée en cas d'échec des participants
                try {
                    await conversation.destroy();
                    logger.info(`Conversation ${conversation.id} supprimée suite à l'échec des participants`);
                } catch (cleanupError) {
                    logger.error('Erreur lors du nettoyage de la conversation:', cleanupError);
                }
                
                return res.status(500).json({
                    success: false,
                    error: 'Erreur lors de l\'ajout des participants à la conversation',
                    code: 'PARTICIPANTS_ADD_FAILED'
                });
            }

            logger.info(`Nouvelle conversation créée entre utilisateurs ${userId} et ${friendId}`);

            // Diffuser la mise à jour en temps réel
            try {
                await broadcastConversationsUpdate(conversation.id);
            } catch (broadcastError) {
                logger.error('Erreur lors du broadcast de la nouvelle conversation:', broadcastError);
                // Ne pas faire échouer la création de conversation pour une erreur de broadcast
            }

            res.status(201).json({
                success: true,
                data: {
                    conversation: {
                        id: conversation.id,
                        type: conversation.type,
                        createdAt: conversation.created_at
                    }
                },
                message: 'Conversation créée avec succès'
            });

        } catch (error) {
            logger.error('Erreur lors de la création/récupération de conversation:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la création/récupération de conversation',
                code: 'CONVERSATION_CREATE_ERROR'
            });
        }
    }

    static async markConversationAsRead(req, res) {
        try {
            // Sécurité: s'assurer que l'utilisateur est authentifié
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "Authentification requise",
                    code: "UNAUTHORIZED"
                });
            }
            const conversationId = parseInt(req.params.conversationId);
            
            if (isNaN(conversationId)) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de conversation invalide',
                    code: 'INVALID_CONVERSATION_ID'
                });
            }
            
            logger.info(`Marquage des messages comme lus pour l'utilisateur ${userId} dans la conversation ${conversationId}`);
            
            // Récupérer tous les messages non lus de la conversation
            const unreadMessages = await Message.findAll({
                where: {
                    conversation_id: conversationId,
                    sender_id: { [Op.ne]: userId }, // Messages des autres
                    is_deleted: false
                },
                include: [
                    {
                        model: MessageReads,
                        as: 'Reads',
                        where: {
                            user_id: userId
                        },
                        required: false
                    }
                ],
                having: {
                    '$Reads.id$': null
                }
            });

            // Marquer chaque message comme lu
            const readPromises = unreadMessages.map(message => 
                MessageReads.create({
                    message_id: message.id,
                    user_id: userId,
                    read_at: new Date()
                })
            );

            await Promise.all(readPromises);

            logger.info(`${unreadMessages.length} messages marqués comme lus pour l'utilisateur ${userId} dans la conversation ${conversationId}`);

            res.status(200).json({
                success: true,
                data: {
                    unreadCount: unreadMessages.length
                },
                message: `${unreadMessages.length} messages marqués comme lus`
            });

        } catch (error) {
            logger.error('Erreur lors du marquage des messages comme lus:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors du marquage des messages comme lus',
                code: 'MARK_READ_ERROR'
            });
        }
    }

    static async getConversationInfo(req, res) {
        try {
            // Sécurité: s'assurer que l'utilisateur est authentifié
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "Authentification requise",
                    code: "UNAUTHORIZED"
                });
            }
            const conversationId = parseInt(req.params.conversationId);
            
            if (isNaN(conversationId)) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de conversation invalide',
                    code: 'INVALID_CONVERSATION_ID'
                });
            }
            
            logger.info(`Récupération des informations de la conversation ${conversationId} pour l'utilisateur ${userId}`);
            
            const conversation = await Conversation.findOne({
                where: { id: conversationId },
                include: [
                    {
                        model: ConversationParticipants,
                        as: 'Participants',
                        where: {
                            user_id: userId,
                            left_at: null
                        },
                        include: [
                            {
                                model: User,
                                as: 'User',
                                attributes: ['id', 'firstName', 'lastName', 'profileImage', 'email', 'phone']
                            }
                        ]
                    }
                ]
            });

            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    error: 'Conversation non trouvée',
                    code: 'CONVERSATION_NOT_FOUND'
                });
            }

            // Récupérer l'autre participant
            const otherParticipant = conversation.Participants.find(p => p.user_id !== userId);
            if (!otherParticipant) {
                return res.status(404).json({
                    success: false,
                    error: 'Participant non trouvé',
                    code: 'PARTICIPANT_NOT_FOUND'
                });
            }

            const friend = otherParticipant.User;

            // Si négociation, attacher les détails order + snapshots
            let negotiation = null;
            if (conversation.type === 'negotiation') {
                try {
                    const resolvedOrderId = conversation.order_id || null;
                    if (resolvedOrderId) {
                        negotiation = await getNegotiationSummary(resolvedOrderId);
                    }
                } catch (err) {
                    logger.warn(`Impossible de charger negotiation pour conv ${conversation.id}: ${err.message}`);
                }
            }

            res.status(200).json({
                success: true,
                data: {
                    conversation: {
                        id: conversation.id,
                        type: conversation.type,
                        orderId: conversation.order_id || null,
                        friend: {
                            id: friend.id,
                            name: `${friend.firstName} ${friend.lastName}`,
                            image: friend.profileImage,
                            email: friend.email,
                            phone: friend.phone
                        },
                        negotiation,
                        createdAt: conversation.created_at
                    }
                },
                message: 'Informations de la conversation récupérées avec succès'
            });

        } catch (error) {
            logger.error('Erreur lors de la récupération des informations de la conversation:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des informations de la conversation',
                code: 'CONVERSATION_INFO_FETCH_ERROR'
            });
        }
    }

    static async getConversationMessages(req, res) {
        try {
            // Sécurité: s'assurer que l'utilisateur est authentifié
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "Authentification requise",
                    code: "UNAUTHORIZED"
                });
            }
            const conversationId = parseInt(req.params.conversationId);
            const { limit = 50, offset = 0 } = req.query;
            
            if (isNaN(conversationId)) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de conversation invalide',
                    code: 'INVALID_CONVERSATION_ID'
                });
            }
            
            logger.info(`Récupération des messages de la conversation ${conversationId} pour l'utilisateur ${userId}`);
            
            // Vérifier que l'utilisateur peut accéder à cette conversation
            const canAccess = await ConversationService.canAccessConversation(conversationId, userId);
            if (!canAccess) {
                return res.status(403).json({
                    success: false,
                    error: 'Accès refusé à cette conversation',
                    code: 'CONVERSATION_ACCESS_DENIED'
                });
            }

            // Récupérer tous les messages (y compris les messages supprimés)
            const messages = await Message.findAll({
                where: {
                    conversation_id: conversationId
                },
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
                    },
                    {
                        model: MessageReads,
                        as: 'Reads',
                        attributes: ['user_id', 'read_at'],
                        include: [{
                            model: User,
                            as: 'User',
                            attributes: ['id', 'firstName', 'lastName']
                        }]
                    },
                    {
                        model: MessageReactions,
                        as: 'Reactions',
                        attributes: ['reaction_type', 'user_id', 'created_at'],
                        include: [{
                            model: User,
                            as: 'User',
                            attributes: ['id', 'firstName', 'lastName', 'email']
                        }]
                    }
                ],
                order: [['created_at', 'ASC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            // Formater les messages pour le frontend
            const formattedMessages = messages.map(message => ({
                id: message.id,
                text: message.is_deleted ? 'Ce message a été supprimé' : message.text,
                audioUrl: message.audio_url,
                sender: {
                    id: message.Sender.id,
                    firstName: message.Sender.firstName,
                    lastName: message.Sender.lastName,
                    email: message.Sender.email,
                    primaryIdentifier: message.Sender.primaryIdentifier
                },
                replyToMessage: message.ReplyToMessage ? {
                    id: message.ReplyToMessage.id,
                    text: message.ReplyToMessage.text,
                    sender: {
                        id: message.ReplyToMessage.Sender.id,
                        firstName: message.ReplyToMessage.Sender.firstName,
                        lastName: message.ReplyToMessage.Sender.lastName,
                        email: message.ReplyToMessage.Sender.email,
                        primaryIdentifier: message.ReplyToMessage.Sender.primaryIdentifier
                    }
                } : null,
                offerId: message.offer_id,
                createdAt: message.created_at,
                isEdited: message.is_edited,
                isDeleted: message.is_deleted,
                readBy: message.Reads ? message.Reads.map(read => ({
                    userId: read.user_id,
                    readAt: read.read_at
                })) : [],
                reactions: message.Reactions ? (() => {
                    // Agréger les réactions par type
                    const reactionMap = new Map();
                    
                    message.Reactions.forEach(reaction => {
                        const key = reaction.reaction_type;
                        if (!reactionMap.has(key)) {
                            reactionMap.set(key, {
                                type: reaction.reaction_type,
                                count: 0,
                                users: [],
                                userReacted: false
                            });
                        }
                        
                        const reactionData = reactionMap.get(key);
                        reactionData.count++;
                        reactionData.users.push({
                            id: reaction.User.id,
                            firstName: reaction.User.firstName,
                            lastName: reaction.User.lastName,
                            email: reaction.User.email
                        });
                        
                        // Vérifier si l'utilisateur actuel a réagi
                        if (reaction.user_id === userId) {
                            reactionData.userReacted = true;
                        }
                    });
                    
                    return Array.from(reactionMap.values());
                })() : []
            }));

            res.status(200).json({
                success: true,
                data: {
                    messages: formattedMessages,
                    totalCount: formattedMessages.length,
                    conversationId: conversationId
                },
                message: `${formattedMessages.length} messages récupérés avec succès`
            });

        } catch (error) {
            logger.error('Erreur lors de la récupération des messages:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des messages',
                code: 'MESSAGES_FETCH_ERROR'
            });
        }
    }
}

module.exports = ConversationController;
