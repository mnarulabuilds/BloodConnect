import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

interface ChatContextType {
  socket: Socket | null;
  joinChat: (chatId: string) => void;
  sendMessage: (chatId: string, text: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const activeChatRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      if (activeChatRef.current) {
        newSocket.emit('join_chat', activeChatRef.current);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const joinChat = useCallback(
    (chatId: string) => {
      activeChatRef.current = chatId;
      if (socket?.connected) {
        socket.emit('join_chat', chatId);
      }
    },
    [socket]
  );

  const sendMessage = useCallback(
    (chatId: string, text: string) => {
      if (socket?.connected && user) {
        socket.emit('send_message', { chatId, text, createdAt: new Date() });
      }
    },
    [socket, user]
  );

  return (
    <ChatContext.Provider value={{ socket, joinChat, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
