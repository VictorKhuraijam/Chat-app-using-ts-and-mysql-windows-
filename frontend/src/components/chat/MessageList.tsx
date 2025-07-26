import React, { useEffect, useRef, useState } from 'react';
import type { Message } from '../../types';
import { Trash2, MoreVertical, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatTime } from '../../utils/formatters';



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
  const [showOptionsFor, setShowOptionsFor] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  console.log("Messages :", messages)
  console.log("Messages Ids",messages.map((m) => m.id))


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOptionsFor(null);
      }
    };

    if (showOptionsFor !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showOptionsFor]);

  const handleDeleteClick = (messageId: number) => {
    onDeleteMessage(messageId);
    setShowOptionsFor(null);
  };

  const canDeleteMessage = (message: Message) => {
    return user?.id === message.sender_id;
  };


  const isTemporaryMessage = (message: Message) => {
    return message.id < 0; // Temporary messages have negative IDs
  };

  console.log("Debug message dates:", messages.map(m => ({
      id: m.id,
      created_at: m.created_at,
      type: typeof m.created_at,
      formatted: formatTime(m.created_at)
    })));

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
           const isTemp = isTemporaryMessage(message);
          const key = message.id ?? `fallback-${index}`;

          console.log("Message created_at:", message.created_at, typeof message.created_at);
          return (
            <div
              key={key}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className="relative max-w-xs lg:max-w-md">
                <div
                  className={`px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm">{message.content}</p>


                      {/* Message metadata */}
                      <div className={`flex items-center justify-between mt-1 text-xs ${isOwnMessage ? 'text-primary-50' : "text-gray-500"}`}>
                        <span>{formatTime(message.created_at)}</span>
                        <div className="flex items-center space-x-2">
                            {/* Sending indicator for temporary messages */}
                          {isTemp && isOwnMessage && (
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1 animate-pulse" />
                              <span className="text-xs">Sending...</span>
                            </div>
                          )}

                          {/* Read/Unread indicator for own messages */}
                         {isOwnMessage && !isTemp && (
                            <div className="flex items-center">
                              {message.is_read ? (
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                                  <span className="text-xs">Read</span>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                                  <span className="text-xs">Sent</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Unread indicator for received messages */}
                          {!isOwnMessage && !message.is_read && (
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                              <span className="text-xs font-semibold">New</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Three dots button inside message bubble */}
                    {canDeleteMessage(message) && (
                      <div className="relative" ref={dropdownRef}>
                        <button
                          onClick={() => setShowOptionsFor(showOptions ? null : message.id)}
                          className={`p-1 rounded-full transition-colors ${
                            isOwnMessage
                              ? 'text-primary-200 hover:text-white hover:bg-primary-700'
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          }`}
                          title="Message options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {/* Options dropdown */}
                        {showOptions && (
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
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
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
