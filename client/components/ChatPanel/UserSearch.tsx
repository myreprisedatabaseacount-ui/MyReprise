'use client';

import React, { useState } from 'react';
import { useSearchUsersQuery } from '@/services/api/UserApi';
import { useCreateConversationMutation } from '@/services/api/ConversationsApi';
import { useSearchDebounce } from '@/services/hooks/useDebounce';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Loader2, Users, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  profileImage: string | null;
  isVerified: boolean;
  joinedAt: string;
}

interface UserSearchProps {
  onUserSelect?: (user: User) => void;
  onConversationCreated?: (conversationId: number) => void;
  className?: string;
}

export default function UserSearch({ onUserSelect, onConversationCreated, className }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const { searchQuery: debouncedQuery, isSearching: isDebouncing, hasQuery, hasDebouncedQuery } = useSearchDebounce(searchQuery, 500);
  
  const [createConversation, { isLoading: isCreatingConversation }] = useCreateConversationMutation();
  
  // Utiliser la requête de recherche seulement si on a une requête débouncée valide
  const { 
    data: searchData, 
    isLoading: isSearching, 
    error: searchError,
    isFetching 
  } = useSearchUsersQuery(
    { query: debouncedQuery, limit: 10 },
    { 
      skip: !hasDebouncedQuery || debouncedQuery.trim().length < 2 
    }
  );

  const users = searchData?.data?.users || [];
  const hasResults = searchData?.data?.hasResults || false;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUserSelect = async (user: User) => {
    try {
      setSelectedUser(user);
      
      // Créer une conversation avec l'utilisateur sélectionné
      const conversation = await createConversation({
        friendId: user.id,
        type: 'chat'
      }).unwrap();

      // Notifier le parent
      if (onUserSelect) {
        onUserSelect(user);
      }
      
      if (onConversationCreated && conversation.id) {
        onConversationCreated(conversation.id);
      }

      // Réinitialiser la recherche
      setSearchQuery('');
      setSelectedUser(null);

    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Aujourd\'hui';
    if (diffInDays === 1) return 'Hier';
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
    if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaines`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {(isDebouncing || isFetching) && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
        )}
      </div>

      {/* Résultats de recherche */}
      {hasQuery && (
        <div className="mt-4 max-h-80 overflow-y-auto">
          {!hasDebouncedQuery || debouncedQuery.trim().length < 2 ? (
            <div className="flex items-center justify-center p-4 text-gray-500">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">Tapez au moins 2 caractères pour rechercher</span>
            </div>
          ) : isSearching || isFetching ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
              <span className="text-sm text-gray-600">Recherche en cours...</span>
            </div>
          ) : searchError ? (
            <div className="flex items-center justify-center p-4 text-red-500">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">Erreur lors de la recherche</span>
            </div>
          ) : !hasResults ? (
            <div className="flex flex-col items-center justify-center p-6 text-gray-500">
              <Users className="w-8 h-8 mb-2" />
              <span className="text-sm">Aucun utilisateur trouvé</span>
              <span className="text-xs text-gray-400 mt-1">
                Essayez avec un autre nom ou email
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user: User) => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 border",
                    selectedUser?.id === user.id ? "bg-blue-50 border-blue-200" : "border-transparent"
                  )}
                >
                  {/* Avatar */}
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={user.profileImage || undefined} 
                      alt={user.fullName}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Informations utilisateur */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {user.fullName}
                      </h3>
                      {user.isVerified && (
                        <Badge variant="secondary" className="text-xs">
                          ✓ Vérifié
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {user.email && (
                        <span className="truncate">{user.email}</span>
                      )}
                      {user.phone && (
                        <span>{user.phone}</span>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-400 mt-1">
                      Membre depuis {formatJoinDate(user.joinedAt)}
                    </div>
                  </div>

                  {/* Bouton d'action */}
                  <button
                    disabled={isCreatingConversation}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50"
                    title="Créer une conversation"
                  >
                    {isCreatingConversation && selectedUser?.id === user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Message d'aide */}
      {!hasQuery && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Search className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                Rechercher des utilisateurs
              </h4>
              <p className="text-xs text-gray-600">
                Tapez le nom, l'email ou le téléphone d'un utilisateur pour commencer une nouvelle conversation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
