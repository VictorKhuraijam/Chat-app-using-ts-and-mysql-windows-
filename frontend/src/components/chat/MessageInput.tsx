import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSocket } from '../../context/SocketContext';

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
  const { socket } = useSocket();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleTyping = (typing: boolean) => {
    if (socket) {
      socket.emit('typing', { receiverId, typing });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => handleTyping(true)}
          onBlur={() => handleTyping(false)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={disabled}
        />
        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          className="px-3"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};
