'use client';

import React, { useState } from 'react';
import ChatPanel from '@/components/ChatPanel/chatPanel';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Main content */}
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Interface de Chat Moderne
          </h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Découvrez notre interface de chat avec panneau latéral minimisable, 
            système de réactions émojis et design responsive. Cliquez sur l'icône 
            de chat pour commencer une conversation !
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                💬
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Chat en temps réel</h3>
              <p className="text-gray-600 text-sm">Conversations fluides avec interface moderne</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                😍
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Réactions émojis</h3>
              <p className="text-gray-600 text-sm">Réagissez aux messages avec des émojis</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                📱
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Design responsive</h3>
              <p className="text-gray-600 text-sm">Optimisé pour tous les écrans</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <ChatPanel 
        isOpen={isChatOpen} 
        onToggle={() => setIsChatOpen(!isChatOpen)} 
      />
    </div>
  );
}

export default App;