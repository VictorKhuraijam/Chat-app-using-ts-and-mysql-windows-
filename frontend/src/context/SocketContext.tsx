import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { socketService } from '../services/socket';
import { useAuth } from './AuthContext';
import type { Message, TypingData } from '../types';

  interface SocketContextType {
     socket: Socket | null;
     isConnected: boolean;
     onlineUsers: number[];
     typingUsers: TypingData[];
    }

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
     }   return context;
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

                socketConnection.on('user_online', (data: { userId: number }) => {
                    setOnlineUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
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

    const value: SocketContextType = {
        socket,
        isConnected,
        onlineUsers,
        typingUsers,
    };
    return (
       <SocketContext.Provider value={value}>
        {children}
       </SocketContext.Provider>
    );
};
