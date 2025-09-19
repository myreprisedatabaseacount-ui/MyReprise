'use client';

import { useState } from 'react';
import ChatPanel from './chatPanel';

export default function ChatPanelWrapper() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <ChatPanel 
      isOpen={isChatOpen} 
      onToggle={() => setIsChatOpen(!isChatOpen)} 
    />
  );
}
