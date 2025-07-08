import React, { useState, useEffect, useCallback } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { UserList } from './UserList';
import type { User, Message } from '../../types';
import { messageService } from '../../services/messages';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const ChatRoom: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();

  // Handle incoming messages
  const handleNewMessage = useCallback((message: Message) => {
    if (!message || typeof message !== 'object' || !message.id) {
    console.warn('Received invalid message over socket:', message);
    return;
  }

    setMessages(prev => {

        if (!message.id) {
    console.warn('Skipping message with no ID:', message);
    return prev;
    }

      // Check if message already exists to prevent duplicates
      const messageExists = prev.some(msg => msg.id === message.id);
      if (messageExists) return prev;

      // Only add message if it's part of current conversation
      if (selectedUser &&
          (message.sender_id === selectedUser.id || message.receiver_id === selectedUser.id)) {
        return [...prev, message];
      }

      return prev;
    });
  }, [selectedUser]);

  // Socket event listeners
  useEffect(() => {
    if (socket) {
      socket.on('new_message', handleNewMessage);
      socket.on('message_sent', handleNewMessage);

      // Handle connection events
      socket.on('connect', () => {
        console.log('Socket connected');
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
        toast.error('Connection error. Please refresh the page.');
      });

      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('message_sent', handleNewMessage);
        socket.off('connect');
        socket.off('disconnect');
        socket.off('error');
      };
    }
  }, [socket, handleNewMessage]);

  // Load conversation when user changes
  useEffect(() => {
    if (selectedUser) {
      loadConversation(selectedUser.id);
    } else {
      setMessages([]);
    }
  }, [selectedUser]);

  const loadConversation = async (userId: number) => {
    setLoading(true);
    try {
      const messages = await messageService.getConversation(userId);
      setMessages(messages);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedUser || !user) return;

    const tempId:number = parseInt(`temp-${Date.now()}`)
    // Optimistically add message to UI
    const tempMessage: Message = {
      id: tempId, // Temporary ID
      sender_id: user.id,
      receiver_id: selectedUser.id,
      content,
      message_type: 'text',
      is_read: false,
      created_at: new Date(),
      sender_username: user.username,
      receiver_username: selectedUser.username,
      // @ts-ignore: add tempId manually (extend type later if needed)
    //   tempId,
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      const { data: message } = await messageService.sendMessage({
        receiver_id: selectedUser.id,
        content,
        message_type: 'text',
      });
      console.log("Real Message :", message)

      // Update with real message from server
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempMessage.id ? message : msg
        )
      );

      // Emit to socket for real-time delivery
      //this block duplicates msg
    //   if (socket) {
    //     socket.emit('send_message', {
    //       receiver_id: selectedUser.id,
    //       content,
    //       message_type: 'text',
    //     });
    //   }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');

      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>
        <div className="overflow-y-auto h-full">
          <UserList
            onSelectUser={setSelectedUser}
            selectedUserId={selectedUser?.id}
          />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedUser.username}
              </h3>
            </div>

            {/* Messages */}
            <MessageList messages={messages} loading={loading} />

            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              receiverId={selectedUser.id}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a user from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
