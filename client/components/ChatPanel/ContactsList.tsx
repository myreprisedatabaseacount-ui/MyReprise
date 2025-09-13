'use client';

import React, { useState, useEffect } from 'react';
import { useGetConversationsQuery } from '@/services/api/ConversationsApi';
import { useCurrentUser } from '@/services/hooks/useCurrentUser';
import { useSocket } from '@/services/hooks/useSocket';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface ContactsListProps {
  onContactSelect: (contact: Contact) => void;
  selectedContactId?: number;
}

export default function ContactsList({ onContactSelect, selectedContactId }: ContactsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser } = useCurrentUser();
  const { socket, isConnected, on, off } = useSocket();
  const { data: conversationsData, isLoading, error, refetch } = useGetConversationsQuery({});

  const contacts = conversationsData?.conversations || [];

  // Écouter les mises à jour en temps réel
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Écouter les mises à jour de conversations
    const handleConversationsUpdate = (data: any) => {
      console.log('Mise à jour des conversations reçue:', data);
      refetch(); // Recharger les conversations
    };

    // Écouter les nouveaux messages pour mettre à jour la liste
    const handleNewMessage = (data: any) => {
      console.log('Nouveau message reçu:', data);
      refetch(); // Recharger les conversations pour mettre à jour le dernier message
    };

    on('conversations:update', handleConversationsUpdate);
    on('new_message', handleNewMessage);

    return () => {
      off('conversations:update', handleConversationsUpdate);
      off('new_message', handleNewMessage);
    };
  }, [socket, isConnected, on, off, refetch]);

  // Filtrer les contacts selon la recherche
  const filteredContacts = contacts.filter((contact: Contact) =>
    contact.friendName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 jours
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-gray-600 mb-4">Impossible de charger la liste des contacts</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <MessageCircle className="w-16 h-16 text-gray-300 mb-6" />
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Aucune conversation</h3>
        <p className="text-gray-600 mb-6 max-w-sm">
          Vous n'avez pas encore de conversations. Commencez à discuter avec vos amis !
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>💬 Créez votre première conversation</p>
          <p>👥 Invitez vos amis à rejoindre</p>
          <p>🚀 Découvrez les fonctionnalités du chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header avec recherche */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Liste des contacts */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <Search className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-gray-600">Aucun résultat trouvé</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredContacts.map((contact: Contact) => (
              <div
                key={contact.conversationId}
                onClick={() => onContactSelect(contact)}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50",
                  selectedContactId === contact.friendId && "bg-blue-50 border border-blue-200"
                )}
              >
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage 
                      src={contact.friendImage || undefined} 
                      alt={contact.friendName}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                      {getInitials(contact.friendName)}
                    </AvatarFallback>
                  </Avatar>
                  {contact.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                      {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                    </div>
                  )}
                </div>

                {/* Informations du contact */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {contact.friendName}
                    </h3>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(contact.lastActivity)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-sm truncate",
                      contact.unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-600"
                    )}>
                      {contact.lastMessage.senderId === currentUser?.id && "Vous: "}
                      {contact.lastMessage.type === 'audio' ? '🎤 Message vocal' : contact.lastMessage.text}
                    </p>
                    
                    {contact.conversationType === 'negotiation' && (
                      <Badge variant="secondary" className="text-xs">
                        Négociation
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
