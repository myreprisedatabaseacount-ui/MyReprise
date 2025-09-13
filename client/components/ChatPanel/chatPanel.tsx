'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minimize2, Send, Smile, MoreHorizontal, Users, Search, Check, CheckCheck } from 'lucide-react';
import { useCurrentUser } from '@/services/hooks/useCurrentUser';
import { useSocket } from '@/services/hooks/useSocket';
import { useCreateConversationMutation, useMarkConversationAsReadMutation, useGetConversationMessagesQuery } from '@/services/api/ConversationsApi';
import { useToggleReactionMutation } from '@/services/api/ReactionsApi';
import ContactsList from './ContactsList';
import UserSearch from './UserSearch';

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
  reactions: Reaction[];
  readBy?: {
    userId: number;
    readAt: string;
  }[];
  isRead?: boolean;
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
}

interface ChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const REACTION_TYPES = [
  { type: 'like', emoji: '👍', label: 'J\'aime' },
  { type: 'love', emoji: '❤️', label: 'J\'adore' },
  { type: 'laugh', emoji: '😂', label: 'Rire' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Triste' },
  { type: 'angry', emoji: '😡', label: 'En colère' },
  { type: 'thumbs_up', emoji: '👍', label: 'Pouce vers le haut' },
  { type: 'thumbs_down', emoji: '👎', label: 'Pouce vers le bas' }
];

export default function ChatPanel({ isOpen, onToggle }: ChatPanelProps) {
  const { currentUser } = useCurrentUser();
  const { socket, isConnected, joinConversation, leaveConversation, sendMessage: socketSendMessage, on, off } = useSocket();
  const [createConversation] = useCreateConversationMutation();
  const [markConversationAsRead] = useMarkConversationAsReadMutation();
  const [toggleReaction] = useToggleReactionMutation();
  
  // État pour la gestion des contacts et conversations
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  
  // Récupérer les messages de la conversation sélectionnée
  const { data: messagesData, isLoading: messagesLoading, error: messagesError } = useGetConversationMessagesQuery(
    { conversationId: currentConversationId! },
    { skip: !currentConversationId }
  );
  const [showContactsList, setShowContactsList] = useState(true);
  const [showUserSearch, setShowUserSearch] = useState(false);

  // État pour les messages (maintenant basé sur la conversation sélectionnée)
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showReactionMenu, setShowReactionMenu] = useState<number | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reactionMenuRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const readMessages = useRef<Set<number>>(new Set());

  // Mettre à jour les messages quand les données changent
  useEffect(() => {
    if (messagesData?.messages) {
      const formattedMessages = messagesData.messages.map((msg: any) => ({
        ...msg,
        reactions: msg.reactions || [], // Utiliser les réactions du serveur ou initialiser vides
        readBy: msg.readBy || [] // S'assurer que readBy est défini
      }));
      setMessages(formattedMessages);
    }
  }, [messagesData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      setSelectedContact(contact);
      setCurrentConversationId(contact.conversationId);
      setShowContactsList(false);
      setShowUserSearch(false);
      
      // Réinitialiser le cache des messages lus
      readMessages.current.clear();
      
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
        console.log(`😀 Réaction ${data.reactionType} ${data.action} sur le message ${data.messageId}`);
        
        // Mettre à jour les réactions du message
        setMessages(prev => prev.map(message => {
          if (message.id === data.messageId) {
            return {
              ...message,
              reactions: data.reactions || []
            };
          }
          return message;
        }));
      }
    };

    on('new_message', handleNewMessage);
    on('message_read', handleMessageRead);
    on('reaction_updated', handleReactionUpdated);

    return () => {
      off('new_message', handleNewMessage);
      off('message_read', handleMessageRead);
      off('reaction_updated', handleReactionUpdated);
    };
  }, [socket, isConnected, currentConversationId, currentUser, on, off]);

  const handleSendMessage = () => {
    if (newMessage.trim() && currentConversationId && isConnected) {
      // Envoyer le message via socket
      socketSendMessage({
        conversationId: currentConversationId,
        text: newMessage.trim()
      });
      
      // Vider le champ de saisie
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addReaction = async (messageId: number, reactionType: string) => {
    try {
      await toggleReaction({ messageId, reactionType }).unwrap();
      console.log(`😀 Réaction ${reactionType} envoyée pour le message ${messageId}`);
      setShowReactionMenu(null);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la réaction:', error);
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
    <div className={`fixed right-0 top-0 h-full bg-white shadow-2xl border-l border-gray-200 transition-all duration-300 ease-in-out z-40 ${isMinimized ? 'w-16' : 'w-80 sm:w-96'}`} onClick={() => setShowReactionMenu(null)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        {!isMinimized && (
          <div className="flex items-center space-x-3">
            {selectedContact ? (
              <>
                <div className="relative">
                  <img
                    src={selectedContact.friendImage || "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"}
                    alt={selectedContact.friendName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedContact.friendName}</h3>
                  <p className="text-xs text-green-600">En ligne</p>
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
        )}

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
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <Minimize2 size={18} className="text-gray-600" />
          </button>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-140px)]">
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
                    className={`group relative ${message.sender.id === currentUser?.id ? 'flex justify-end' : 'flex justify-start'}`}
                  >
                    <div className="relative max-w-[80%]">
                      {/* Message bubble */}
                      <div
                        className={`relative px-4 py-2 rounded-2xl ${message.sender.id === currentUser?.id
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                          } shadow-sm hover:shadow-md transition-shadow duration-200`}
                      >
                        <p className="text-sm leading-relaxed">{message.text}</p>

                        {/* Reaction button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowReactionMenu(showReactionMenu === message.id ? null : message.id);
                          }}
                          className={`absolute -top-2 ${message.sender.id === currentUser?.id ? '-left-2' : '-right-2'
                            } w-6 h-6 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-50`}
                        >
                          <Smile size={12} className="text-gray-600" />
                        </button>
                      </div>

                      {/* Reactions */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-2 ${message.sender.id === currentUser?.id ? 'justify-end' : 'justify-start'
                          }`}>
                          {message.reactions.map((reaction, index) => {
                            const reactionType = REACTION_TYPES.find(r => r.type === reaction.type);
                            return (
                              <button
                                key={index}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addReaction(message.id, reaction.type);
                                }}
                                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-200 ${reaction.userReacted
                                  ? 'bg-blue-100 border border-blue-300 text-blue-700'
                                  : 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200'
                                  }`}
                                title={reactionType?.label || reaction.type}
                              >
                                <span>{reactionType?.emoji || '😀'}</span>
                                <span className="font-medium">{reaction.count}</span>
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

                    {/* Reaction menu */}
                    {showReactionMenu === message.id && (
                      <div
                        ref={reactionMenuRef}
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute z-50 ${message.sender.id === currentUser?.id ? 'right-0' : 'left-0'
                          } -top-14 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex space-x-1`}
                      >
                        {REACTION_TYPES.map((reactionType) => (
                          <button
                            key={reactionType.type}
                            onClick={(e) => {
                              e.stopPropagation();
                              addReaction(message.id, reactionType.type);
                            }}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-lg transition-all duration-200 hover:scale-110"
                            title={reactionType.label}
                          >
                            {reactionType.emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={currentConversationId ? "Tapez votre message..." : "Sélectionnez une conversation..."}
                  disabled={!currentConversationId || !isConnected}
                  className="w-full px-4 py-2 pr-12 bg-white border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  rows={1}
                  style={{ minHeight: '40px', maxHeight: '120px' }}
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors">
                  <MoreHorizontal size={16} />
                </button>
              </div>
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
        </>
      )}
    </div>
  );
}