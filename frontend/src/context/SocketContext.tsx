import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { socketService } from '../services/socket';
import { useAuth } from './AuthContext';
import type { TypingData } from '../types';

  interface SocketContextType {
     socket: Socket | null;
     isConnected: boolean;
     onlineUsers: number[];
     typingUsers: TypingData[];
      // Add methods to emit events
     sendMessage: (message: any) => void;
     joinConversationWithUser: (otherUserId: number) => void;
     leaveConversationWithUser: (otherUserId: number) => void;
     markMessageRead: (messageId: number) => void;
     markConversationRead: (otherUserId: number) => void;
     startTyping: (receiverId: number) => void;
     stopTyping: (receiverId: number) => void;
    }

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
     }
     return context;
 };

 interface SocketProviderProps {
     children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
     const { user, isAuthenticated } = useAuth();
     const [socket, setSocket] = useState<Socket | null>(null);
     const [isConnected, setIsConnected] = useState(false);
     const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
     const [typingUsers, setTypingUsers] = useState<TypingData[]>([]);

     useEffect(() => {
        if (isAuthenticated && user) {
            try {
                const socketConnection = socketService.connect();
                setSocket(socketConnection);

                socketConnection.on('connect', () => {           setIsConnected(true);
                 });

                socketConnection.on('disconnect', () => {           setIsConnected(false);
                });

                socketConnection.on('online_users', (ids: number[]) => {
                    setOnlineUsers(ids)
                })

                socketConnection.on('user_online', (data: { userId: number }) => {
                    setOnlineUsers(prev => [...new Set([...prev, data.userId])]);
                });

                socketConnection.on('user_offline', (data: { userId: number }) => {
                    setOnlineUsers(prev => prev.filter(id => id !== data.userId));
                });

                socketConnection.on('user_typing', (data: TypingData) => {
                    setTypingUsers(prev => {
                        const filtered = prev.filter(user => user.userId !== data.userId);
                        return data.typing ? [...filtered, data] : filtered;
                    });
                });
                return () => {
                    socketService.disconnect();
                    setSocket(null);
                    setIsConnected(false);
                    setOnlineUsers([]);
                    setTypingUsers([]);
                };
            } catch (error) {
                console.error('Socket connection error:', error);
            }
        }
    }, [isAuthenticated, user]);
    console.log("user socket online user :", onlineUsers)

    // Helper functions to emit events
    const sendMessage = (message: any) => {
        if (socket && isConnected) {
            socket.emit('send_message', message);
        }
    };

    // const joinConversation = (conversationId: number) => {
    //     if (socket && isConnected) {
    //         socket.emit('join_conversation', conversationId);
    //     }
    // };

    // const leaveConversation = (conversationId: number) => {
    //     if (socket && isConnected) {
    //         socket.emit('leave_conversation', conversationId);
    //     }
    // };

    const joinConversationWithUser = (otherUserId: number) => {
        if (socket && isConnected) {
            socket.emit('join_conversation', otherUserId);
        }
    };

    const leaveConversationWithUser = (otherUserId: number) => {
        if (socket && isConnected) {
            socket.emit('leave_conversation', otherUserId);
        }
    };

    const markMessageRead = (messageId: number) => {
        if (socket && isConnected) {
            socket.emit('mark_message_read', messageId);
        }
    };

    const markConversationRead = (conversationId: number) => {
        if (socket && isConnected) {
            socket.emit('mark_conversation_read', conversationId);
        }
    };

     const startTyping = (receiverId: number) => {
        if (socket && isConnected) {
            socket.emit('typing_start', { receiver_id: receiverId });
        }
    };

    const stopTyping = (receiverId: number) => {
        if (socket && isConnected) {
            socket.emit('typing_stop', { receiver_id: receiverId });
        }
    };

    console.log("user socket online user :", onlineUsers);



    const value: SocketContextType = {
        socket,
        isConnected,
        onlineUsers,
        typingUsers,
        sendMessage,
        joinConversationWithUser,
        leaveConversationWithUser,
        markMessageRead,
        markConversationRead,
        startTyping,
        stopTyping
    };
    return (
       <SocketContext.Provider value={value}>
        {children}
       </SocketContext.Provider>
    );
};
