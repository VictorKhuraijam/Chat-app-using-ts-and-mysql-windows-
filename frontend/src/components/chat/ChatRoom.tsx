import React, { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { UserList } from './UserList';
import type { User, Message } from '../../types';
import { messageService } from '../../services/messages';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export const ChatRoom: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (socket) {
      socket.on('new_message', (message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      return () => {
        socket.off('new_message');
      };
    }
  }, [socket]);

  useEffect(() => {
    if (selectedUser) {
      loadConversation(selectedUser.id);
    }
  }, [selectedUser]);

  const loadConversation = async (userId: number) => {
    setLoading(true);
    try {
      const messages = await messageService.getConversation(userId);
      setMessages(messages);
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedUser) return;

    try {
      await messageService.sendMessage({
        receiver_id: selectedUser.id,
        content,
        message_type: 'text',
      });
    } catch (error) {
      console.error('Error sending message:', error);
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
