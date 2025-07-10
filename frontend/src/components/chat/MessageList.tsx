import React, { useEffect, useRef, useState } from 'react';
import type { Message } from '../../types';
import { Trash2, MoreVertical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatTime } from '../../utils/formatters';
import { Button } from '../ui/Button';

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  onDeleteMessage: (messageId: number) => void
}

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    loading,
    onDeleteMessage
 }) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showOptionsFor, setShowOptionsFor] = useState<number | null>(null)

  console.log("Messages :", messages)
  console.log("Messages Ids",messages.map((m) => m.id))

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDeleteClick = (messageId: number) => {
    onDeleteMessage(messageId);
    setShowOptionsFor(null);
  };

  const canDeleteMessage = (message: Message) => {
    return user?.id === message.sender_id;
  };

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
        <div className="flex-1 flex items-center justify-center h-full text-gray-500">
          No messages yet. Start a conversation!
        </div>
      ) : (
        messages.map((message, index) => {
          const isOwnMessage = message.sender_id === user?.id;
          const showOptions = showOptionsFor === message.id;
          const key = message.id ?? (message as any).tempId ?? `fallback-${index}`;
          return (
            <div
              key={key}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className="group relative max-w-xs lg:max-w-md">
                <div
                className={` px-4 py-2 rounded-lg relative ${
                  isOwnMessage
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                 {/* Message metadata */}
                <div className={`flex items-center justify-between mt-1 text-xs text-gray-900 ${isOwnMessage ? 'text-primary-50' : "text-gray-500"}`}>
                  <span>{formatTime(message.created_at)}</span>
                  {message.is_read && user && (
                    <span className="ml-2">Read</span>
                  )}
                </div>
                 {/* Options button for sender's messages */}
                {canDeleteMessage(message) && (
                  <div className="absolute -top-2 -right-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowOptionsFor(showOptions ? null : message.id)}
                      className={`p-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                        user
                          ? 'bg-primary-50 hover:bg-primary-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>

                    {/* Options dropdown */}
                    {showOptions && (
                      <div className="absolute right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          onClick={() => handleDeleteClick(message.id)}
                          className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
