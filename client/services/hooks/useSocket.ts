'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useCurrentUser } from './useCurrentUser';
import { useDispatch } from 'react-redux';
import { conversationsApi } from '../api/ConversationsApi';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_DOMAIN || 'http://localhost:3001';

// Singleton pour gérer l'instance socket globale
class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private onlineUsers: Map<number, any> = new Map();
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  connect(user: any) {
    if (this.socket && this.socket.connected) {
      console.log('🔌 Socket déjà connecté, réutilisation');
      return this.socket;
    }

    console.log('🔌 Création d\'une nouvelle connexion socket');
    this.socket = io(SERVER_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: false,
    });

    this.setupEventListeners(user);
    return this.socket;
  }

  private setupEventListeners(user: any) {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Socket connecté:', this.socket?.id);
      this.emit('connect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket déconnecté:', reason);
      this.emit('disconnect', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion socket:', error);
      this.emit('connect_error', error);
    });

    this.socket.on('online_users', (data: any) => {
      console.log('🟢 Utilisateur connecté:', data);
      
      // Si data est un objet avec des utilisateurs (comme {7: {...}, 8: {...}})
      if (typeof data === 'object' && !data.userId) {
        // Vider la Map et la remplir avec les nouveaux utilisateurs
        this.onlineUsers.clear();
        Object.values(data).forEach((user: any) => {
          if (user && user.userId) {
            this.onlineUsers.set(user.userId, {
              userId: user.userId,
              socketId: user.socketId,
              connectedAt: user.connectedAt
            });
          }
        });
      } else if (data.userId) {
        // Si data est un seul utilisateur
        this.onlineUsers.set(data.userId, {
          userId: data.userId,
          socketId: data.socketId,
          connectedAt: data.connectedAt
        });
      }
      
      this.emit('online_users', data);
    });

    // Événements de conversation
    this.socket.on('conversations:update', (data) => {
      console.log('📋 Mise à jour des conversations reçue:', data);
      this.emit('conversations:update', data);
    });

    this.socket.on('contacts:update', (data) => {
      console.log('📋 Mise à jour des contacts reçue (compatibilité):', data);
      this.emit('contacts:update', data);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Erreur socket:', error);
      this.emit('error', error);
    });
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    // Écouter aussi sur le socket si il existe
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      if (callback) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      } else {
        callbacks.length = 0;
      }
    }

    // Retirer aussi du socket si il existe
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  private emit(event: string, ...args: any[]) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => callback(...args));
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Déconnexion du socket');
      this.socket.disconnect();
      this.socket = null;
    }
    this.onlineUsers.clear();
    this.listeners.clear();
  }

  getSocket() {
    return this.socket;
  }

  getOnlineUsers() {
    return this.onlineUsers;
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { currentUser, isAuthenticated } = useCurrentUser();
  const dispatch = useDispatch();
  const [onlineUsers, setOnlineUsers] = useState<Map<number, any>>(new Map());
  const socketManager = useRef(SocketManager.getInstance());

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      // Déconnecter le socket si l'utilisateur n'est pas authentifié
      console.log('🔌 Déconnexion du socket - utilisateur non authentifié');
      socketManager.current.disconnect();
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers(new Map());
      return;
    }

    // Se connecter via le socket manager
    const connectedSocket = socketManager.current.connect(currentUser);
    setSocket(connectedSocket);
    setIsConnected(socketManager.current.isConnected());
    
    // Synchroniser l'état local avec la Map du SocketManager
    const syncOnlineUsers = () => {
      const managerOnlineUsers = socketManager.current.getOnlineUsers();
      console.log('🔄 Synchronisation des utilisateurs en ligne:', managerOnlineUsers);
      setOnlineUsers(new Map(managerOnlineUsers));
    };
    
    // Synchronisation initiale avec un délai pour s'assurer que les utilisateurs sont chargés
    setTimeout(() => {
      syncOnlineUsers();
    }, 1000);

    // Gestion des événements via le socket manager
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
    };

    const handleDisconnect = (reason: string) => {
      setIsConnected(false);
      console.log('🔌 Socket déconnecté:', reason);
    };

    const handleConnectError = (error: any) => {
      console.error('❌ Erreur de connexion socket:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    };

    const handleConversationsUpdate = (data: any) => {
      console.log('📋 Mise à jour des conversations reçue:', data);
      dispatch(conversationsApi.util.invalidateTags(['Conversations']));
    };

    const handleContactsUpdate = (data: any) => {
      console.log('📋 Mise à jour des contacts reçue (compatibilité):', data);
      dispatch(conversationsApi.util.invalidateTags(['Conversations']));
    };

    const handleUserOnline = (data: any) => {
      console.log('🟢 Événement utilisateur en ligne reçu:', data);
      // Synchroniser avec la Map du SocketManager
      syncOnlineUsers();
    };

    // Enregistrer les listeners
    socketManager.current.on('connect', handleConnect);
    socketManager.current.on('disconnect', handleDisconnect);
    socketManager.current.on('connect_error', handleConnectError);
    socketManager.current.on('conversations:update', handleConversationsUpdate);
    socketManager.current.on('contacts:update', handleContactsUpdate);
    socketManager.current.on('online_users', handleUserOnline);

    // Cleanup à la déconnexion
    return () => {
      // Nettoyer les listeners
      socketManager.current.off('connect', handleConnect);
      socketManager.current.off('disconnect', handleDisconnect);
      socketManager.current.off('connect_error', handleConnectError);
      socketManager.current.off('conversations:update', handleConversationsUpdate);
      socketManager.current.off('contacts:update', handleContactsUpdate);
      socketManager.current.off('online_users', handleUserOnline);
    };
  }, [isAuthenticated, currentUser, dispatch]);

  // Fonctions pour émettre des événements
  const joinConversation = (conversationId: number) => {
    if (socket && isConnected) {
      socket.emit('join_conversation', { conversationId });
    }
  };

  const leaveConversation = (conversationId: number) => {
    if (socket && isConnected) {
      socket.emit('leave_conversation', { conversationId });
    }
  };

  const sendMessage = (data: {conversationId: number; text?: string; audioUrl?: string; replyToMessageId?: number; offerId?: number;}) => {
    if (socket && isConnected) {
      socket.emit('send_message', data);
    }
  };

  const markMessageAsRead = (messageId: number) => {
    if (socket && isConnected) {
      socket.emit('mark_message_read', { messageId });
    }
  };

  const sendReaction = (data: {
    messageId: number;
    reactionType: string;
    conversationId: number;
  }) => {
    if (socket && isConnected) {
      socket.emit('toggle_reaction', data);
      console.log('😀 Émission de la réaction via socket:', data);
    }
  };

  const deleteMessage = (data: {
    messageId: number;
    conversationId: number;
  }) => {
    if (socket && isConnected) {
      socket.emit('delete_message', data);
      console.log('🗑️ Émission de la suppression de message via socket:', data);
    }
  };

  const editMessage = (data: {
    messageId: number;
    text: string;
    conversationId: number;
  }) => {
    if (socket && isConnected) {
      socket.emit('edit_message', data);
      console.log('✏️ Émission de l\'édition de message via socket:', data);
    }
  };

  // Fonction pour écouter un événement spécifique
  const on = (event: string, callback: (...args: any[]) => void) => {
    socketManager.current.on(event, callback);
  };

  // Fonction pour arrêter d'écouter un événement
  const off = (event: string, callback?: (...args: any[]) => void) => {
    socketManager.current.off(event, callback);
  };

  // Fonction pour demander la synchronisation des utilisateurs en ligne
  const syncOnlineUsers = () => {
    if (socket && isConnected) {
      socket.emit('sync_online_users');
      console.log('🔄 Demande de synchronisation des utilisateurs en ligne envoyée');
    }
  };

  // Fonctions pour gérer l'indicateur de frappe
  const startTyping = (conversationId: number) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { conversationId });
      console.log('⌨️ Début de frappe envoyé pour la conversation:', conversationId);
    }
  };

  const stopTyping = (conversationId: number) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { conversationId });
      console.log('⌨️ Arrêt de frappe envoyé pour la conversation:', conversationId);
    }
  };

  return {
    socket,
    isConnected,
    connectionError,
    onlineUsers,
    joinConversation,
    leaveConversation,
    sendMessage,
    markMessageAsRead,
    sendReaction,
    deleteMessage,
    editMessage,
    on,
    off,
    syncOnlineUsers,
    startTyping,
    stopTyping,
  };
};

