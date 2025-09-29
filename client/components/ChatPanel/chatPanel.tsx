'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Smile, Users, Search, Check, CheckCheck, Trash2, Edit3, Reply, Phone } from 'lucide-react';
import { useCurrentUser } from '@/services/hooks/useCurrentUser';
import { useSocket } from '@/services/hooks/useSocket';
import { useMarkConversationAsReadMutation, useGetConversationMessagesQuery } from '@/services/api/ConversationsApi';
import ContactsList from './ContactsList';
import UserSearch from './UserSearch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import OrderNegotiationCard from '@/components/orders/OrderNegotiationCard';

interface Reaction {
  type: string;
  count: number;
  users: Array<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  userReacted: boolean;
}

interface Message {
  id: number;
  text: string;
  audioUrl?: string;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    primaryIdentifier: string;
  };
  replyToMessage?: {
    id: number;
    text: string;
    sender: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      primaryIdentifier: string;
    };
  };
  offerId?: number;
  createdAt: string;
  isEdited: boolean;
  isDeleted?: boolean;
  reactions: Reaction[];
  readBy?: {
    userId: number;
    readAt: string;
  }[];
  isRead?: boolean;
}

interface NegotiationProduct {
  offerId: number;
  title: string;
  price: number;
  productCondition: string;
  userId: number;
  images: string[];
}

interface NegotiationOrder {
  id: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  balanceAmount: number;
  balancePayerId: number | null;
  createdAt: string;
}

interface NegotiationData {
  order: NegotiationOrder;
  products: NegotiationProduct[];
}

interface Contact {
  conversationId: number;
  friendId: number;
  friendName: string;
  friendImage: string | null;
  friendEmail: string;
  friendPhone: string;
  lastMessage: {
    text: string;
    type: 'text' | 'audio' | 'other';
    senderId: number | null;
    senderName: string | null;
    timestamp: string;
  };
  unreadCount: number;
  conversationType: 'chat' | 'negotiation';
  lastActivity: string;
  negotiation?: NegotiationData;
}

interface ChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedUserId?: number | null;
  orderId?: number | null;
}

const REACTION_TYPES = [
  { type: 'like', emoji: '👍', label: 'J\'aime' },
  { type: 'thumbs_down', emoji: '👎', label: 'Pouce vers le bas' },
  { type: 'love', emoji: '❤️', label: 'J\'adore' },
  { type: 'laugh', emoji: '😂', label: 'Rire' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Triste' },
  { type: 'angry', emoji: '😡', label: 'En colère' },
];

export default function ChatPanel({ isOpen, onToggle, selectedUserId = null, orderId = null }: ChatPanelProps) {
  const { currentUser } = useCurrentUser();
  const { socket, isConnected, onlineUsers, joinConversation, leaveConversation, sendMessage: socketSendMessage, sendReaction, deleteMessage, editMessage, on, off, syncOnlineUsers, startTyping, stopTyping } = useSocket();
  const [markConversationAsRead] = useMarkConversationAsReadMutation();

  // État pour la gestion des contacts et conversations
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);

  // Récupérer les messages de la conversation sélectionnée
  const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages, error: messagesError } = useGetConversationMessagesQuery(
    { conversationId: currentConversationId! },
    { skip: !currentConversationId }
  );
  const [showContactsList, setShowContactsList] = useState(true);
  const [showUserSearch, setShowUserSearch] = useState(false);

  // État pour les messages (maintenant basé sur la conversation sélectionnée)
  const [messages, setMessages] = useState<Message[]>([]);
  const [deletedMessages, setDeletedMessages] = useState<Set<number>>(new Set()); // Messages supprimés par d'autres utilisateurs
  const [newMessage, setNewMessage] = useState('');
  const [showReactionMenu, setShowReactionMenu] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<number, { userId: number; userName: string; isTyping: boolean; timestamp: number }>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reactionMenuRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const readMessages = useRef<Set<number>>(new Set());
  const pendingReactions = useRef<Set<string>>(new Set()); // Pour éviter les réactions en double
  const pendingDeletions = useRef<Set<number>>(new Set()); // Pour éviter les suppressions en double
  const typingTimeout = useRef<NodeJS.Timeout | null>(null); // Timeout pour arrêter le typing
  const isTyping = useRef<boolean>(false); // État local pour éviter les envois multiples

  // Mettre à jour les messages quand les données changent
  useEffect(() => {
    if (messagesData?.messages && currentConversationId) {
      const formattedMessages = messagesData.messages.map((msg: any) => ({
        ...msg,
        reactions: msg.reactions || [], // Utiliser les réactions du serveur ou initialiser vides
        readBy: msg.readBy || [] // S'assurer que readBy est défini
      }));
      setMessages(formattedMessages);
    }
    if (currentConversationId) {
      refetchMessages();
    }
  }, [messagesData, currentConversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Ouvrir (ou créer si besoin) une conversation avec userId lorsqu'il est fourni
  useEffect(() => {
    const ensureConversationWithUser = async () => {
      console.log('ensureConversationWithUser', selectedUserId);
    };
    ensureConversationWithUser();
  }, [selectedUserId]);


  // Cleanup du timeout de typing au démontage du composant
  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, []);

  // Marquer automatiquement les messages comme lus quand ils deviennent visibles
  useEffect(() => {
    if (!currentConversationId || !isConnected || !socket) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = parseInt(entry.target.getAttribute('data-message-id') || '0');
            const senderId = parseInt(entry.target.getAttribute('data-sender-id') || '0');

            // Marquer comme lu seulement si ce n'est pas notre propre message
            if (messageId && senderId !== currentUser?.id) {
              markMessageAsRead(messageId);
            }
          }
        });
      },
      {
        threshold: 0.3, // Message considéré comme visible quand 30% est visible
        rootMargin: '0px 0px -100px 0px' // Délai avant de considérer comme visible
      }
    );

    // Observer tous les messages visibles
    messageRefs.current.forEach((element) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [messages, currentConversationId, isConnected, socket, currentUser?.id]);

  // Fonction pour marquer un message comme lu
  const markMessageAsRead = (messageId: number) => {
    if (isConnected && socket && !readMessages.current.has(messageId)) {
      readMessages.current.add(messageId);
      socket.emit('mark_message_read', { messageId });
      console.log(`📖 Marquage du message ${messageId} comme lu`);
    }
  };

  // Gestion de la sélection de contact
  const handleContactSelect = async (contact: Contact) => {
    try {
      // Arrêter le typing si en cours
      if (isTyping.current && currentConversationId) {
        stopTyping(currentConversationId);
        isTyping.current = false;
      }
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
        typingTimeout.current = null;
      }

      setSelectedContact(contact);
      setCurrentConversationId(contact.conversationId);
      setShowContactsList(false);
      setShowUserSearch(false);

      // Réinitialiser le cache des messages lus, des réactions et des suppressions en cours
      readMessages.current.clear();
      pendingReactions.current.clear();
      pendingDeletions.current.clear();
      setDeletedMessages(new Set());
      setTypingUsers(new Map()); // Réinitialiser les utilisateurs en train de taper

      // Rejoindre la conversation via socket
      if (isConnected) {
        joinConversation(contact.conversationId);
      }

      // Marquer les messages comme lus
      await markConversationAsRead(contact.conversationId);

      // Marquer automatiquement tous les messages visibles comme lus après un délai
      setTimeout(() => {
        messages.forEach(message => {
          if (message.sender.id !== currentUser?.id) {
            markMessageAsRead(message.id);
          }
        });
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de la sélection du contact:', error);
    }
  };

  // Gestion de la création d'une nouvelle conversation
  const handleConversationCreated = (conversationId: number) => {
    setShowUserSearch(false);
    setShowContactsList(true);
    // TODO: Actualiser la liste des contacts ou naviguer vers la nouvelle conversation
  };

  const isContactOnline = (contact: Contact) => {
    return onlineUsers.has(contact.friendId);
  };

  // Gestion des événements socket
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Écouter les nouveaux messages
    const handleNewMessage = (data: any) => {
      if (data.conversationId === currentConversationId) {
        const newMsg: Message = {
          id: data.message.id,
          text: data.message.text || '',
          audioUrl: data.message.audioUrl,
          sender: data.message.sender,
          replyToMessage: data.message.replyToMessage,
          offerId: data.message.offerId,
          createdAt: data.message.createdAt,
          isEdited: data.message.isEdited,
          reactions: [],
          readBy: data.message.readBy || []
        };
        setMessages(prev => [...prev, newMsg]);
      }
    };

    // Écouter les messages marqués comme lus
    const handleMessageRead = (data: any) => {
      if (data.conversationId === currentConversationId) {
        console.log(`📖 Message ${data.messageId} lu par l'utilisateur ${data.userId}`);

        // Mettre à jour le statut de lecture des messages
        setMessages(prev => prev.map(message => {
          if (message.id === data.messageId) {
            const updatedReadBy = [...(message.readBy || [])];
            const existingRead = updatedReadBy.find(read => read.userId === data.userId);

            if (!existingRead) {
              updatedReadBy.push({
                userId: data.userId,
                readAt: data.readAt || new Date().toISOString()
              });

              console.log(`✅ Statut de lecture mis à jour pour le message ${message.id}`);
            }

            return {
              ...message,
              readBy: updatedReadBy
            };
          }
          return message;
        }));
      }
    };

    // Écouter les mises à jour de réactions
    const handleReactionUpdated = (data: any) => {
      if (data.conversationId === currentConversationId) {
        console.log(`😀 Réaction ${data.reactionType} ${data.action || 'toggled'} sur le message ${data.messageId}`);
        console.log('📊 Nouvelles réactions:', data.reactions);

        // Nettoyer la réaction en cours
        const reactionKey = `${data.messageId}-${data.reactionType}`;
        pendingReactions.current.delete(reactionKey);

        // Mettre à jour les réactions du message
        setMessages(prev => prev.map(message => {
          if (message.id === data.messageId) {
            const updatedMessage = {
              ...message,
              reactions: data.reactions || []
            };
            console.log(`✅ Message ${message.id} mis à jour avec les nouvelles réactions:`, updatedMessage.reactions);

            // Afficher une notification pour les réactions d'autres utilisateurs
            if (data.userId && data.userId !== currentUser?.id) {
              const reactionType = REACTION_TYPES.find(r => r.type === data.reactionType);
              showNotification(`${reactionType?.emoji || '😀'} Réaction ${data.action || 'ajoutée'}`, 'success');
            }

            return updatedMessage;
          }
          return message;
        }));
      }
    };

    // Écouter les erreurs de réaction
    const handleReactionError = (data: any) => {
      console.error('❌ Erreur lors de la réaction:', data);
      showNotification('Erreur lors de l\'envoi de la réaction', 'error');
    };

    // Écouter les suppressions de messages
    const handleMessageDeleted = (data: any) => {
      if (data.conversationId === currentConversationId) {
        console.log(`🗑️ Message ${data.messageId} supprimé par l'utilisateur ${data.deletedBy}`);

        // Nettoyer la suppression en cours si c'est notre message
        if (data.deletedBy === currentUser?.id) {
          pendingDeletions.current.delete(data.messageId);
        }

        // Pour tous les messages (même les nôtres), marquer comme supprimé
        setDeletedMessages(prev => new Set([...prev, data.messageId]));

        // Afficher une notification pour les suppressions d'autres utilisateurs
        if (data.deletedBy !== currentUser?.id) {
          showNotification('Un message a été supprimé', 'success');
        }
      }
    };

    // Écouter les erreurs de suppression
    const handleDeleteError = (data: any) => {
      console.error('❌ Erreur lors de la suppression:', data);

      // Nettoyer les suppressions en cours en cas d'erreur
      if (data.messageId) {
        pendingDeletions.current.delete(data.messageId);
      }

      showNotification('Erreur lors de la suppression du message', 'error');
    };

    // Écouter les mises à jour d'édition de messages
    const handleMessageEdited = (data: any) => {
      if (data.conversationId === currentConversationId) {
        console.log(`✏️ Message ${data.messageId} édité par l'utilisateur ${data.editedBy}`);

        // Mettre à jour le message dans la liste
        setMessages(prev => prev.map(message => {
          if (message.id === data.messageId) {
            return {
              ...message,
              text: data.text,
              isEdited: true
            };
          }
          return message;
        }));

        // Afficher une notification pour les éditions d'autres utilisateurs
        if (data.editedBy !== currentUser?.id) {
          showNotification('Un message a été modifié', 'success');
        }
      }
    };

    // Écouter les erreurs d'édition
    const handleEditError = (data: any) => {
      console.error('❌ Erreur lors de l\'édition:', data);
      showNotification('Erreur lors de la modification du message', 'error');
    };

    // Écouter les événements de typing
    const handleUserTyping = (data: any) => {
      if (data.conversationId === currentConversationId && data.userId !== currentUser?.id) {
        console.log('⌨️ Utilisateur en train de taper:', data);

        setTypingUsers(prev => {
          const newMap = new Map(prev);
          if (data.isTyping) {
            newMap.set(data.userId, {
              userId: data.userId,
              userName: data.userName,
              isTyping: true,
              timestamp: Date.now()
            });
          } else {
            newMap.delete(data.userId);
          }
          return newMap;
        });

        // Auto-supprimer l'indicateur de typing après 3 secondes
        if (data.isTyping) {
          setTimeout(() => {
            setTypingUsers(prev => {
              const newMap = new Map(prev);
              newMap.delete(data.userId);
              return newMap;
            });
          }, 3000);
        }
      }
    };

    on('new_message', handleNewMessage);
    on('message_read', handleMessageRead);
    on('reaction_updated', handleReactionUpdated);
    on('reaction_error', handleReactionError);
    on('message_deleted', handleMessageDeleted);
    on('delete_error', handleDeleteError);
    on('message_edited', handleMessageEdited);
    on('edit_error', handleEditError);
    on('user_typing', handleUserTyping);

    return () => {
      off('new_message', handleNewMessage);
      off('message_read', handleMessageRead);
      off('reaction_updated', handleReactionUpdated);
      off('reaction_error', handleReactionError);
      off('message_deleted', handleMessageDeleted);
      off('delete_error', handleDeleteError);
      off('message_edited', handleMessageEdited);
      off('edit_error', handleEditError);
      off('user_typing', handleUserTyping);
    };
  }, [socket, isConnected, currentConversationId, currentUser, on, off]);

  const handleSendMessage = () => {
    if (newMessage.trim() && currentConversationId && isConnected) {
      // Arrêter le typing avant d'envoyer le message
      if (isTyping.current) {
        stopTyping(currentConversationId);
        isTyping.current = false;
      }

      // Envoyer le message via socket
      socketSendMessage({
        conversationId: currentConversationId,
        text: newMessage.trim(),
        replyToMessageId: replyingToMessage?.id
      });

      // Vider le champ de saisie et annuler la réponse
      setNewMessage('');
      setReplyingToMessage(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Escape' && replyingToMessage) {
      handleCancelReply();
    }
  };

  // Fonction pour gérer le changement de texte avec l'indicateur de typing
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    if (currentConversationId && isConnected) {
      // Démarrer le typing si ce n'est pas déjà fait
      if (!isTyping.current && value.trim().length > 0) {
        startTyping(currentConversationId);
        isTyping.current = true;
      }

      // Réinitialiser le timeout
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }

      // Arrêter le typing après 1 seconde d'inactivité
      typingTimeout.current = setTimeout(() => {
        if (isTyping.current) {
          stopTyping(currentConversationId);
          isTyping.current = false;
        }
      }, 1000);
    }
  };

  const addReaction = (messageId: number, reactionType: string) => {
    if (currentConversationId && isConnected) {
      const reactionKey = `${messageId}-${reactionType}`;

      // Vérifier si la réaction est déjà en cours
      if (pendingReactions.current.has(reactionKey)) {
        console.log(`⚠️ Réaction ${reactionType} déjà en cours pour le message ${messageId}`);
        return;
      }

      // Marquer la réaction comme en cours
      pendingReactions.current.add(reactionKey);

      sendReaction({
        messageId,
        reactionType,
        conversationId: currentConversationId
      });
      console.log(`😀 Réaction ${reactionType} envoyée pour le message ${messageId}`);
      setShowReactionMenu(null);

      // Nettoyer la réaction en cours après un délai
      setTimeout(() => {
        pendingReactions.current.delete(reactionKey);
      }, 2000);
    } else {
      console.error('Impossible d\'envoyer la réaction: conversation non sélectionnée ou socket déconnecté');
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    if (currentConversationId && isConnected) {
      // Vérifier si la suppression est déjà en cours
      if (pendingDeletions.current.has(messageId)) {
        console.log(`⚠️ Suppression déjà en cours pour le message ${messageId}`);
        return;
      }

      // Demander confirmation avant de supprimer
      if (window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
        // Marquer la suppression comme en cours
        pendingDeletions.current.add(messageId);

        deleteMessage({
          messageId,
          conversationId: currentConversationId
        });
        console.log(`🗑️ Suppression du message ${messageId} envoyée`);

        // Nettoyer la suppression en cours après un délai
        setTimeout(() => {
          pendingDeletions.current.delete(messageId);
        }, 3000);
      }
    } else {
      console.error('Impossible de supprimer le message: conversation non sélectionnée ou socket déconnecté');
    }
  };

  const handleEditMessage = (messageId: number) => {
    const message = messages.find(m => m.id === messageId);
    if (message && canEditMessage(message)) {
      setEditingMessageId(messageId);
      setEditingText(message.text);
      console.log(`✏️ Édition du message ${messageId}`);
    }
  };

  const handleSaveEdit = () => {
    if (editingMessageId && editingText.trim() && currentConversationId && isConnected) {
      // Envoyer l'édition via socket
      editMessage({
        messageId: editingMessageId,
        text: editingText.trim(),
        conversationId: currentConversationId
      });

      console.log(`💾 Sauvegarde de l'édition pour le message ${editingMessageId}: ${editingText.trim()}`);

      // Mise à jour optimiste
      setMessages(prev => prev.map(message =>
        message.id === editingMessageId
          ? { ...message, text: editingText.trim(), isEdited: true }
          : message
      ));

      // Réinitialiser l'édition
      setEditingMessageId(null);
      setEditingText('');

      showNotification('Message modifié avec succès', 'success');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleReplyToMessage = (messageId: number) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setReplyingToMessage(message);
      console.log(`↩️ Réponse au message ${messageId}: "${message.text}"`);
    }
  };

  const handleCancelReply = () => {
    setReplyingToMessage(null);
  };

  const scrollToReferencedMessage = (messageId: number) => {
    const messageElement = messageRefs.current.get(messageId);
    if (messageElement) {
      messageElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Mettre en évidence le message pendant 2 secondes
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2000);
    }
  };

  const formatTime = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Fonction pour déterminer le statut de lecture d'un message
  const getMessageReadStatus = (message: Message) => {
    if (!message.readBy || message.readBy.length === 0) {
      return 'sent'; // Message envoyé mais pas encore lu
    }

    // Vérifier si le destinataire a lu le message
    const recipientRead = message.readBy.some(read => read.userId !== currentUser?.id);
    if (recipientRead) {
      return 'read'; // Message lu par le destinataire
    }

    return 'delivered'; // Message livré mais pas encore lu
  };

  // Fonction pour déterminer si un message peut être édité (non lu par le destinataire)
  const canEditMessage = (message: Message) => {
    return message.sender.id === currentUser?.id && getMessageReadStatus(message) !== 'read';
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 bottom-4 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <>
      {/* Styles CSS pour les animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 0.75;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @keyframes highlight-pulse {
          0% {
            background-color: rgba(59, 130, 246, 0.1);
          }
          50% {
            background-color: rgba(59, 130, 246, 0.3);
          }
          100% {
            background-color: rgba(59, 130, 246, 0.1);
          }
        }
        .animate-highlight {
          animation: highlight-pulse 2s ease-in-out;
        }
      `}</style>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${notification.type === 'success'
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
          }`}>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className={`fixed right-0 top-0 h-full bg-white shadow-2xl border-l border-gray-200 transition-all duration-300 ease-in-out z-40 w-80 sm:w-96 `} onClick={() => setShowReactionMenu(null)}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            {selectedContact ? (
              <>
                <div className="relative w-12 h-12">
                  {/* Ami */}
                  <Avatar className="absolute left-0 top-0 w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm">
                    {selectedContact.friendImage ? (
                      <img src={selectedContact.friendImage} alt={selectedContact.friendName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                        {selectedContact.friendName.split(' ').map(word => word.charAt(0)).join('').toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {/* Produit ami si négociation */}
                  {selectedContact.conversationType === 'negotiation' && (() => {
                    const friendProduct = selectedContact.negotiation?.products?.find(p => p.userId === selectedContact.friendId) || null;
                    return friendProduct ? (
                      <Avatar className="absolute right-0 bottom-1 w-7 h-7 rounded-full object-cover border border-white shadow-sm">
                        <img src={friendProduct.images?.[0] || ''} alt={friendProduct.title} className="w-full h-full rounded-full object-cover" />
                      </Avatar>
                    ) : null;
                  })()}
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${isContactOnline(selectedContact) ? 'bg-green-500' : 'bg-gray-500'} rounded-full border-2 border-white`}></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedContact.friendName}</h3>
                  <p className={`text-xs ${isContactOnline(selectedContact) ? 'text-green-600' : 'text-gray-600'}  `}>{isContactOnline(selectedContact) ? 'En ligne' : 'Hors ligne'}</p>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Users className="w-10 h-10 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Conversations</h3>
                  <p className="text-xs text-gray-600">Sélectionnez une conversation</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {selectedContact && (
              <button
                onClick={() => {
                  setShowContactsList(true);
                  setShowUserSearch(false);
                  setSelectedContact(null);
                  setCurrentConversationId(null);
                  setMessages([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Retour à la liste des conversations"
              >
                <Users size={18} className="text-gray-600" />
              </button>
            )}
            {!selectedContact && !showUserSearch && (
              <button
                onClick={() => {
                  setShowUserSearch(true);
                  setShowContactsList(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Rechercher un utilisateur"
              >
                <Search size={18} className="text-gray-600" />
              </button>
            )}
            {showUserSearch && (
              <button
                onClick={() => {
                  setShowUserSearch(false);
                  setShowContactsList(true);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Retour aux conversations"
              >
                <Users size={18} className="text-gray-600" />
              </button>
            )}
            {selectedContact && (
              <button

                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <Phone size={18} className="text-gray-600" />
              </button>
            )}
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <X size={18} className="text-gray-600" />
            </button>
          </div>
        </div>


        {/* Carte de négociation sous l'en-tête */}
        {selectedContact?.conversationType === 'negotiation' && selectedContact?.negotiation?.order?.id && (
          <div className="p-2 border-b border-gray-100">
            <OrderNegotiationCard orderId={selectedContact.negotiation.order.id} />
          </div>
        )}

        {showUserSearch ? (
          /* Recherche d'utilisateurs */
          <div className="p-4 h-[calc(100vh-80px)] overflow-y-auto">
            <UserSearch
              onConversationCreated={handleConversationCreated}
            />
          </div>
        ) : showContactsList ? (
          /* Liste des contacts */
          <ContactsList
            onContactSelect={handleContactSelect}
            selectedContactId={selectedContact?.friendId}
          />
        ) : (
          /* Conversation */
          <>
            {/* Messages */}
            <div className={`relative flex-1 overflow-y-auto p-4 pb-16 space-y-4 ${replyingToMessage ? 'h-[calc(100vh-230px)]' : 'h-[calc(100vh-150px)]'}`}>
              {messagesLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-gray-500">Chargement des messages...</div>
                </div>
              ) : messagesError ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-red-500">Erreur lors du chargement des messages</div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    ref={(el) => {
                      if (el) {
                        messageRefs.current.set(message.id, el);
                      } else {
                        messageRefs.current.delete(message.id);
                      }
                    }}
                    data-message-id={message.id}
                    data-sender-id={message.sender.id}
                    className={`group relative ${message.sender.id === currentUser?.id ? 'flex justify-end' : 'flex justify-start'} ${highlightedMessageId === message.id ? 'animate-highlight rounded-lg ' : ''}`}
                  >
                    <div className="relative max-w-[80%] group">
                      {/* Action buttons pour vos messages - à gauche, visible au hover */}
                      {!message.isDeleted && !deletedMessages.has(message.id) && message.sender.id === currentUser?.id && (
                        <div className="absolute right-0 -top-5 -translate-y-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                          {/* Reaction button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowReactionMenu(showReactionMenu === message.id ? null : message.id);
                            }}
                            className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 shadow-sm"
                            title="Ajouter une réaction"
                          >
                            <Smile size={12} className="text-gray-600" />
                          </button>

                          {/* Reply button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReplyToMessage(message.id);
                            }}
                            className="w-6 h-6 bg-white border border-blue-200 rounded-full flex items-center justify-center hover:bg-blue-50 shadow-sm"
                            title="Répondre au message"
                          >
                            <Reply size={12} className="text-blue-600" />
                          </button>

                          {/* Edit button - seulement pour les messages non lus */}
                          {canEditMessage(message) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditMessage(message.id);
                              }}
                              className="w-6 h-6 bg-white border border-green-200 rounded-full flex items-center justify-center hover:bg-green-50 shadow-sm"
                              title="Éditer le message"
                            >
                              <Edit3 size={12} className="text-green-600" />
                            </button>
                          )}

                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const isPending = pendingDeletions.current.has(message.id);
                              if (!isPending) {
                                handleDeleteMessage(message.id);
                              }
                            }}
                            disabled={pendingDeletions.current.has(message.id)}
                            className="w-6 h-6 bg-white border border-red-200 rounded-full flex items-center justify-center hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            title={pendingDeletions.current.has(message.id) ? 'Suppression en cours...' : 'Supprimer le message'}
                          >
                            <Trash2 size={12} className={`${pendingDeletions.current.has(message.id) ? 'text-red-300' : 'text-red-600'}`} />
                          </button>
                        </div>
                      )}

                      {/* Action buttons pour les messages des autres - à droite, visible au hover */}
                      {!message.isDeleted && !deletedMessages.has(message.id) && message.sender.id !== currentUser?.id && (
                        <div className="absolute left-0 -top-5 -translate-y-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                          {/* Reaction button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowReactionMenu(showReactionMenu === message.id ? null : message.id);
                            }}
                            className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 shadow-sm"
                            title="Ajouter une réaction"
                          >
                            <Smile size={12} className="text-gray-600" />
                          </button>

                          {/* Reply button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReplyToMessage(message.id);
                            }}
                            className="w-6 h-6 bg-white border border-blue-200 rounded-full flex items-center justify-center hover:bg-blue-50 shadow-sm"
                            title="Répondre au message"
                          >
                            <Reply size={12} className="text-blue-600" />
                          </button>
                        </div>
                      )}

                      {/* Message bubble */}
                      <div
                        className={`relative px-4 py-2 rounded-2xl ${message.isDeleted || deletedMessages.has(message.id)
                          ? 'bg-gray-200 text-gray-500 border-2 border-dashed border-gray-300'
                          : message.sender.id === currentUser?.id
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                          } shadow-sm hover:shadow-md transition-all duration-300 ${pendingDeletions.current.has(message.id) ? 'opacity-50' : ''
                          }`}
                      >
                        {/* Message de référence (reply) */}
                        {message.replyToMessage && (
                          <div
                            className={`mb-2 pl-3 border-l-4 ${message.sender.id === currentUser?.id
                              ? 'border-blue-300 bg-blue-500 bg-opacity-20'
                              : 'border-gray-300 bg-gray-200 bg-opacity-50'
                              } rounded-r-lg py-1 cursor-pointer hover:bg-opacity-30 transition-all duration-200`}
                            onClick={(e) => {
                              e.stopPropagation();
                              scrollToReferencedMessage(message.replyToMessage!.id);
                            }}
                            title="Cliquer pour voir le message original"
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <Reply size={12} className={`${message.sender.id === currentUser?.id ? 'text-blue-300' : 'text-gray-500'
                                }`} />
                              <span className={`text-xs font-medium ${message.sender.id === currentUser?.id ? 'text-blue-300' : 'text-gray-500'
                                }`}>
                                {message.replyToMessage.sender.firstName} {message.replyToMessage.sender.lastName}
                              </span>
                            </div>
                            <p className={`text-xs truncate ${message.sender.id === currentUser?.id ? 'text-blue-200' : 'text-gray-600'
                              }`}>
                              {message.replyToMessage.text.length > 50
                                ? `${message.replyToMessage.text.substring(0, 50)}...`
                                : message.replyToMessage.text
                              }
                            </p>
                          </div>
                        )}
                        {pendingDeletions.current.has(message.id) ? (
                          <p className="text-sm leading-relaxed italic">Suppression en cours...</p>
                        ) : message.isDeleted || deletedMessages.has(message.id) ? (
                          <div className="flex items-center space-x-2 opacity-75 animate-fade-in">
                            <p className="text-sm leading-relaxed italic text-gray-500">Ce message a été supprimé</p>
                          </div>
                        ) : editingMessageId === message.id ? (
                          <div className="flex flex-col space-y-2">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={handleEditKeyPress}
                              className="w-full px-2 py-1 text-sm text-gray-900 bg-white border border-blue-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                              rows={1}
                              autoFocus
                            />
                            <div className="flex space-x-2 justify-end">
                              <button
                                onClick={handleSaveEdit}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Sauvegarder
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <p className="text-sm leading-relaxed">{message.text}</p>
                            {message.isEdited && (
                              <span className="text-xs text-gray-400 italic">(édité)</span>
                            )}
                          </div>
                        )}

                      </div>

                      {/* Reactions - seulement pour les messages non supprimés */}
                      {!message.isDeleted && !deletedMessages.has(message.id) && message.reactions && message.reactions.length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-2 ${message.sender.id === currentUser?.id ? 'justify-end' : 'justify-start'
                          }`}>
                          {message.reactions.map((reaction, index) => {
                            const reactionType = REACTION_TYPES.find(r => r.type === reaction.type);
                            const reactionKey = `${message.id}-${reaction.type}`;
                            const isPending = pendingReactions.current.has(reactionKey);

                            return (
                              <button
                                key={index}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isPending) {
                                    addReaction(message.id, reaction.type);
                                  }
                                }}
                                disabled={isPending}
                                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-200 ${isPending
                                  ? 'bg-yellow-100 border border-yellow-300 text-yellow-700 opacity-75'
                                  : reaction.userReacted
                                    ? 'bg-blue-100 border border-blue-300 text-blue-700 hover:bg-blue-200'
                                    : 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200'
                                  } ${isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                title={isPending ? 'Réaction en cours...' : (reactionType?.label || reaction.type)}
                              >
                                <span className={isPending ? 'animate-pulse' : ''}>{reactionType?.emoji || '😀'}</span>
                                <span className="font-medium">{reaction.count}</span>
                                {isPending && <span className="text-xs">...</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Timestamp et statut de lecture */}
                      <div className={`flex items-center gap-1 mt-1 ${message.sender.id === currentUser?.id ? 'justify-end' : 'justify-start'
                        }`}>
                        <p className="text-xs text-gray-500">
                          {formatTime(message.createdAt)}
                        </p>
                        {message.sender.id === currentUser?.id && (
                          <div className="flex items-center">
                            {getMessageReadStatus(message) === 'sent' && (
                              <Check size={12} className="text-gray-400" />
                            )}
                            {getMessageReadStatus(message) === 'delivered' && (
                              <CheckCheck size={12} className="text-gray-400" />
                            )}
                            {getMessageReadStatus(message) === 'read' && (
                              <CheckCheck size={12} className="text-blue-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reaction menu - seulement pour les messages non supprimés */}
                    {!message.isDeleted && !deletedMessages.has(message.id) && showReactionMenu === message.id && (
                      <div
                        ref={reactionMenuRef}
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute z-50 ${message.sender.id === currentUser?.id ? 'right-0' : 'left-0'
                          } -top-14 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex space-x-1`}
                      >
                        {REACTION_TYPES.map((reactionType) => {
                          const reactionKey = `${message.id}-${reactionType.type}`;
                          const isPending = pendingReactions.current.has(reactionKey);

                          return (
                            <button
                              key={reactionType.type}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isPending) {
                                  addReaction(message.id, reactionType.type);
                                }
                              }}
                              disabled={isPending}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all duration-200 ${isPending
                                ? 'bg-yellow-100 cursor-not-allowed opacity-75'
                                : 'hover:bg-gray-100 hover:scale-110'
                                }`}
                              title={isPending ? 'Réaction en cours...' : reactionType.label}
                            >
                              <span className={isPending ? 'animate-pulse' : ''}>{reactionType.emoji}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
              {(!messagesLoading && !messagesError && currentConversationId && messages.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-gray-500 text-sm select-none">Commencez votre chat</span>
                </div>
              )}
              {/* Indicateur de typing */}
              {typingUsers.size > 0 && (
                <div className="px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm">
                      {selectedContact.friendName}
                      {typingUsers.size === 1 ? ' est en train d\'écrire...' : ' sont en train d\'écrire...'}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 ">
              {/* Message de réponse */}
              {replyingToMessage && (
                <div className="mb-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Reply size={14} className="text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">
                          Répondre à {replyingToMessage.sender.firstName} {replyingToMessage.sender.lastName}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {replyingToMessage.text.length > 100
                          ? `${replyingToMessage.text.substring(0, 100)}...`
                          : replyingToMessage.text
                        }
                      </p>
                    </div>
                    <button
                      onClick={handleCancelReply}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between space-x-2 pb-3">
                <textarea
                  value={newMessage}
                  onChange={handleMessageChange}
                  onKeyDown={handleKeyPress}
                  placeholder={currentConversationId ? "Tapez votre message..." : "Sélectionnez une conversation..."}
                  disabled={!currentConversationId || !isConnected}
                  className="w-full pt-2 px-4 pr-12 bg-white border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  rows={1}
                  style={{ minHeight: '40px', maxHeight: '120px' }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !currentConversationId || !isConnected}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:scale-100"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}