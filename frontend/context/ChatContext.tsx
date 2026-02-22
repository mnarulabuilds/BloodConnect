import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

    useEffect(() => {
        if (token) {
            const newSocket = io(SOCKET_URL, {
                auth: { token }
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [token]);

    const joinChat = useCallback((chatId: string) => {
        if (socket) {
            socket.emit('join_chat', chatId);
        }
    }, [socket]);

    const sendMessage = useCallback((chatId: string, text: string) => {
        if (socket && user) {
            const messageData = {
                chatId,
                senderId: user.id,
                text,
                createdAt: new Date()
            };
            socket.emit('send_message', messageData);
        }
    }, [socket, user]);

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
