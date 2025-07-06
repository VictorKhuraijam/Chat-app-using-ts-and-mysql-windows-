import React, { useEffect, useRef } from 'react';
import type { Message } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatTime } from '../../utils/formatters';

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, loading }) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

   return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          No messages yet. Start a conversation!
        </div>
      ) : (
        messages.map((message) => {
          const isOwnMessage = message.sender_id === user?.id;
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isOwnMessage
                    ? 'bg-[#eff6ff] text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  isOwnMessage ? 'text-primary-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
