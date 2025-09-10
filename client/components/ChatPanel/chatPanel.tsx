'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minimize2, Send, Smile, MoreHorizontal } from 'lucide-react';

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'friend';
  timestamp: Date;
  reactions: Reaction[];
}

interface ChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const REACTION_EMOJIS = ['👍', '😂', '😍', '👎', '😮', '😢', '🔥', '❤️'];

export default function ChatPanel({ isOpen, onToggle }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Salut ! Comment ça va ?',
      sender: 'friend',
      timestamp: new Date(Date.now() - 300000),
      reactions: [{ emoji: '👍', count: 1, userReacted: false }]
    },
    {
      id: '2',
      text: 'Ça va super bien ! Et toi ?',
      sender: 'me',
      timestamp: new Date(Date.now() - 240000),
      reactions: []
    },
    {
      id: '3',
      text: 'Parfait ! Tu veux qu\'on se voit ce weekend ?',
      sender: 'friend',
      timestamp: new Date(Date.now() - 180000),
      reactions: [
        { emoji: '😍', count: 1, userReacted: true },
        { emoji: '👍', count: 2, userReacted: false }
      ]
    },
    {
      id: '4',
      text: 'Excellente idée ! Je suis libre samedi après-midi 🎉',
      sender: 'me',
      timestamp: new Date(Date.now() - 120000),
      reactions: [{ emoji: '🔥', count: 1, userReacted: false }]
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [showReactionMenu, setShowReactionMenu] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reactionMenuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reactionMenuRef.current && !reactionMenuRef.current.contains(event.target as Node)) {
        setShowReactionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        sender: 'me',
        timestamp: new Date(),
        reactions: []
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(message => {
      if (message.id === messageId) {
        const existingReaction = message.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          if (existingReaction.userReacted) {
            return {
              ...message,
              reactions: message.reactions.map(r =>
                r.emoji === emoji
                  ? { ...r, count: r.count - 1, userReacted: false }
                  : r
              ).filter(r => r.count > 0)
            };
          } else {
            return {
              ...message,
              reactions: message.reactions.map(r =>
                r.emoji === emoji
                  ? { ...r, count: r.count + 1, userReacted: true }
                  : r
              )
            };
          }
        } else {
          return {
            ...message,
            reactions: [...message.reactions, { emoji, count: 1, userReacted: true }]
          };
        }
      }
      return message;
    }));
    setShowReactionMenu(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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
    <div className={`fixed right-0 top-0 h-full bg-white shadow-2xl border-l border-gray-200 transition-all duration-300 ease-in-out z-40 ${
      isMinimized ? 'w-16' : 'w-80 sm:w-96'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        {!isMinimized && (
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt="Sarah"
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Sarah Martin</h3>
              <p className="text-xs text-green-600">En ligne</p>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
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
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-140px)]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`group relative ${
                  message.sender === 'me' ? 'flex justify-end' : 'flex justify-start'
                }`}
                onMouseEnter={() => setShowReactionMenu(null)}
              >
                <div className="relative max-w-[80%]">
                  {/* Message bubble */}
                  <div
                    className={`relative px-4 py-2 rounded-2xl ${
                      message.sender === 'me'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    } shadow-sm hover:shadow-md transition-shadow duration-200`}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      // Show reaction menu on hover after delay
                      setTimeout(() => {
                        if (showReactionMenu !== message.id) {
                          setShowReactionMenu(message.id);
                        }
                      }, 500);
                    }}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    
                    {/* Reaction button */}
                    <button
                      onClick={() => setShowReactionMenu(showReactionMenu === message.id ? null : message.id)}
                      className={`absolute -top-2 ${
                        message.sender === 'me' ? '-left-2' : '-right-2'
                      } w-6 h-6 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-50`}
                    >
                      <Smile size={12} className="text-gray-600" />
                    </button>
                  </div>

                  {/* Reactions */}
                  {message.reactions.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-2 ${
                      message.sender === 'me' ? 'justify-end' : 'justify-start'
                    }`}>
                      {message.reactions.map((reaction, index) => (
                        <button
                          key={index}
                          onClick={() => addReaction(message.id, reaction.emoji)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                            reaction.userReacted
                              ? 'bg-blue-100 border border-blue-300 text-blue-700'
                              : 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <span>{reaction.emoji}</span>
                          <span className="font-medium">{reaction.count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className={`text-xs text-gray-500 mt-1 ${
                    message.sender === 'me' ? 'text-right' : 'text-left'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>

                {/* Reaction menu */}
                {showReactionMenu === message.id && (
                  <div
                    ref={reactionMenuRef}
                    className={`absolute z-50 ${
                      message.sender === 'me' ? 'right-0' : 'left-0'
                    } -top-12 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex space-x-1`}
                  >
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => addReaction(message.id, emoji)}
                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-lg transition-all duration-200 hover:scale-110"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
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
                  placeholder="Tapez votre message..."
                  className="w-full px-4 py-2 pr-12 bg-white border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  rows={1}
                  style={{ minHeight: '40px', maxHeight: '120px' }}
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors">
                  <MoreHorizontal size={16} />
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:scale-100"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}