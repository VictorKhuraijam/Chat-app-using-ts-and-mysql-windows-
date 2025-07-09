import React, { useState, useRef } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  receiverId: number;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  receiverId,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();
  const typingTimeoutRef = useRef<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      handleStopTyping();
    }
  };

  const handleTyping = () => {
    if (!socket || !user) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', {
        receiverId,
        typing: true,
        userId: user.id,
        username: user.username
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (socket && user && isTyping) {
      setIsTyping(false);
      socket.emit('typing', {
        receiverId,
        typing: false,
        userId: user.id,
        username: user.username
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else {
      handleTyping();
    }
  };

  const handleFileUpload = () => {
    // Placeholder for file upload functionality
    console.log('File upload clicked');
  };

  const handleEmojiClick = () => {
    // Placeholder for emoji picker functionality
    console.log('Emoji picker clicked');
  };

  return (
    <div className="border-t bg-white">
      {/* Typing indicator could go here */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-center space-x-2">
          {/* File upload button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleFileUpload}
            disabled={disabled}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Message input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              onFocus={handleTyping}
              onBlur={handleStopTyping}
              placeholder="Type a message..."
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={disabled}
            />

            {/* Emoji button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleEmojiClick}
              disabled={disabled}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          {/* Send button */}
          <Button
            type="submit"
            disabled={!message.trim() || disabled}
            className="px-4 py-2"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
