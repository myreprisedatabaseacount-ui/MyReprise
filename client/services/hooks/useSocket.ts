'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useCurrentUser } from './useCurrentUser';
import { useDispatch } from 'react-redux';
import { conversationsApi } from '../api/ConversationsApi';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_DOMAIN || 'http://localhost:3001';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { currentUser, isAuthenticated } = useCurrentUser();
  const dispatch = useDispatch();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      // Déconnecter le socket si l'utilisateur n'est pas authentifié
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Créer une nouvelle connexion socket
    const newSocket = io(SERVER_URL, {
      withCredentials: true,
      // Optionnel: passer le token en query parameter si les cookies ne fonctionnent pas
      // query: {
      //   token: localStorage.getItem('token')
      // }
    });

    // Gestion des événements de connexion
    newSocket.on('connect', () => {
      console.log('🔌 Socket connecté:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket déconnecté:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion socket:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Gestion des événements de conversations
    newSocket.on('conversations:update', (data) => {
      console.log('📋 Mise à jour des conversations reçue:', data);
      // Invalider le cache des conversations pour forcer le refetch
      dispatch(conversationsApi.util.invalidateTags(['Conversations']));
    });

    // Garder l'ancien événement pour la compatibilité
    newSocket.on('contacts:update', (data) => {
      console.log('📋 Mise à jour des contacts reçue (compatibilité):', data);
      // Invalider le cache des conversations pour forcer le refetch
      dispatch(conversationsApi.util.invalidateTags(['Conversations']));
    });

    // Gestion des erreurs
    newSocket.on('error', (error) => {
      console.error('❌ Erreur socket:', error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Cleanup à la déconnexion
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
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

  const sendMessage = (data: {
    conversationId: number;
    text?: string;
    audioUrl?: string;
    replyToMessageId?: number;
    offerId?: number;
  }) => {
    if (socket && isConnected) {
      socket.emit('send_message', data);
    }
  };

  const markMessageAsRead = (messageId: number) => {
    if (socket && isConnected) {
      socket.emit('mark_message_read', { messageId });
    }
  };

  // Fonction pour écouter un événement spécifique
  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  // Fonction pour arrêter d'écouter un événement
  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  return {
    socket,
    isConnected,
    connectionError,
    joinConversation,
    leaveConversation,
    sendMessage,
    markMessageAsRead,
    on,
    off,
  };
};
