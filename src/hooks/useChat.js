import { useState, useEffect, useRef } from 'react';
import { generateMessage, getGreeting, getIdleChat, saveChatMessage } from '../services/petChatService';

export function useChat(petState) {
  const [chatBubble, setChatBubble] = useState(null);
  const [showChatLog, setShowChatLog] = useState(false);
  const chatTimerRef = useRef(null);

  // Pet chat: random message every 2-5 minutes
  useEffect(() => {
    function scheduleChatMessage() {
      const delay = 120000 + Math.random() * 180000;
      chatTimerRef.current = setTimeout(() => {
        const msg = getIdleChat(petState);
        if (msg) {
          setChatBubble(msg);
          saveChatMessage(msg);
        }
        scheduleChatMessage();
      }, delay);
    }
    scheduleChatMessage();
    return () => {
      if (chatTimerRef.current) clearTimeout(chatTimerRef.current);
    };
  }, [petState.species, petState.happiness]);

  // Chat greeting on mount
  useEffect(() => {
    const hour = new Date().getHours();
    let timeOfDayStr = 'morning';
    if (hour >= 12 && hour < 18) timeOfDayStr = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDayStr = 'evening';
    else if (hour >= 22 || hour < 6) timeOfDayStr = 'night';
    const greeting = getGreeting(petState, timeOfDayStr);
    if (greeting) {
      setTimeout(() => {
        setChatBubble(greeting);
        saveChatMessage(greeting);
      }, 2000);
    }
  }, []);

  const sendChatMessage = (type) => {
    const chatMsg = generateMessage(petState, type);
    if (chatMsg) {
      setChatBubble(chatMsg);
      saveChatMessage(chatMsg);
    }
  };

  return {
    chatBubble,
    setChatBubble,
    showChatLog,
    setShowChatLog,
    sendChatMessage,
  };
}
