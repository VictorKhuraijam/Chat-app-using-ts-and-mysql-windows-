import React, { useState, useEffect, useCallback } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { UserList } from './UserList';
import type { User, Message } from '../../types';
import { messageService } from '../../services/messages';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';

export const ChatRoom: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { socket, joinConversationWithUser, leaveConversationWithUser } = useSocket();
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

          // IMPORTANT: Don't add the message if current user is the sender
        // The sender already has the optimistic message, wait for message_sent event instead
        if (message.sender_id === user?.id) {
          console.log('Ignoring new_message for own sent message, waiting for message_sent');
          return prev;
        }
        return [...prev, message];
      }

      return prev;
    });
  }, [selectedUser, user]);

  // Handle message sent confirmation (for optimistic updates)
  const handleMessageSent = useCallback((data: { messageId: number, message: Message }) => {
    console.log('Message sent confirmation:', data);
    setMessages(prev => {
      // Find and replace temporary message with real message
      const tempIndex = prev.findIndex(msg =>
        msg.content === data.message.content &&
        msg.sender_id === data.message.sender_id &&
        msg.receiver_id === data.message.receiver_id &&
        typeof msg.id === 'number' && msg.id < 0 // temp IDs are negative
      );

      if (tempIndex !== -1) {
        const newMessages = [...prev];
        newMessages[tempIndex] = {
          ...data.message,
          created_at: new Date(data.message.created_at) // Ensure proper date object
        };
        console.log('Replaced temporary message with real message:', data.message.id);
        return newMessages;
      }

      // If no temp message found, check if real message already exists
      const messageExists = prev.some(msg => msg.id === data.message.id);
      if (!messageExists) {
        console.log('Adding confirmed message:', data.message.id);
        return [...prev, data.message];
      }

      return prev;
    });
  }, []);

  // Handle message deletion from socket
  const handleMessageDeleted = useCallback((data: { messageId: number; deletedBy: number }) => {
    console.log('Message deleted via socket:', data);
    setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
  }, []);

  // Handle conversation deletion from socket
  const handleConversationDeleted = useCallback((data: { userId1: number; userId2: number }) => {
    if (selectedUser && user &&
        ((data.userId1 === user.id && data.userId2 === selectedUser.id) ||
         (data.userId1 === selectedUser.id && data.userId2 === user.id))) {
      setMessages([]);
      toast.success('Conversation deleted');
    }
  }, [selectedUser, user]);

  // Socket event listeners
  useEffect(() => {
    if (socket) {
      socket.on('new_message', handleNewMessage);
      socket.on('message_sent', handleMessageSent);
      socket.on('message_deleted', handleMessageDeleted);
      socket.on('conversation_deleted', handleConversationDeleted);

       // Handle delete events
      // socket.on('message_deleted', (data: {messageId: number}) => {
      //   setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      // });

      // socket.on('conversation_deleted', (data: { userId1: number; userId2: number }) => {
      //   if (selectedUser &&
      //       ((data.userId1 === user?.id && data.userId2 === selectedUser.id) ||
      //        (data.userId1 === selectedUser.id && data.userId2 === user?.id))) {
      //     setMessages([]);
      //     toast.success('Conversation deleted');
      //   }
      // });

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
        socket.off('message_sent', handleMessageSent);
        socket.off('message_deleted', handleMessageDeleted);
        socket.off('conversation_deleted', handleConversationDeleted);
        socket.off('connect');
        socket.off('disconnect');
        socket.off('error');
      };
    }
  }, [socket, handleNewMessage, handleMessageSent, handleMessageDeleted, handleConversationDeleted]);

  // Load conversation when user changes
  useEffect(() => {
    if (selectedUser) {
      loadConversation(selectedUser.id);
      joinConversationWithUser(selectedUser.id)
    } else {
      setMessages([]);

    }

     // Cleanup: leave conversation when switching users
    return () => {
      if (selectedUser) {
        leaveConversationWithUser(selectedUser.id);
      }
    };
  }, [selectedUser, joinConversationWithUser, leaveConversationWithUser]);

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
    if (!selectedUser || !user || !socket) return;

    //Create a temporary message with a negative Id for optimistic UI
    const tempId = -Date.now() //Negative to distinguish from real IDS

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

    };

    setMessages(prev => [...prev, tempMessage]);

    // Send via socket only - this handles database saving AND real-time delivery
    // socket.emit('send_message', {
    //   receiver_id: selectedUser.id,
    //   content,
    //   message_type: 'text',
    // });

    try {
      // const { data: message } = await messageService.sendMessage({
      //   receiver_id: selectedUser.id,
      //   content,
      //   message_type: 'text',
      // });
      // console.log("Real Message :", message)

      // Update with real message from server
      // setMessages(prev =>
      //   prev.map(msg =>
      //     msg.id === tempMessage.id ? message : msg
      //   )
      // );
      // The socket 'message_sent' event will handle replacing the temp message
      // with the real message, so we don't need to do it here

      // Emit to socket for real-time delivery
      //this block duplicates msg

        socket.emit('send_message', {
          receiver_id: selectedUser.id,
          content,
          message_type: 'text',
        });

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');

      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  };

   const handleDeleteMessage = async (messageId: number) => {
    try {
      await messageService.deleteMessage(messageId);

      // Remove message from UI
      setMessages(prev => prev.filter(msg => msg.id !== messageId));

      // Emit socket event for real-time update
      if (socket) {
        socket.emit('delete_message', { messageId, conversationId: selectedUser?.id });
      }

      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');

      // Reload conversation to restore message if delete failed
      if (selectedUser) {
        loadConversation(selectedUser.id);
      }
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedUser) return;

    try {
      await messageService.deleteConversation(selectedUser.id);

      // Clear messages from UI
      setMessages([]);

      // Emit socket event for real-time update
      if (socket) {
        socket.emit('delete_conversation', {
          userId1: user?.id,
          userId2: selectedUser.id
        });
      }
       // Note: Real-time update for other users will be handled by the socket event from the server after successful deletion

      toast.success('Conversation deleted');
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
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
            <div className="flex justify-between p-4 border-b border-gray-200 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedUser.username}
              </h3>

                {/* Delete Conversation Button */}
              {messages.length > 0 && (
                <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Conversation
              </Button>
              )}
            </div>

            {/* Messages */}
            <MessageList
                messages={messages}
                loading={loading}
                onDeleteMessage={handleDeleteMessage}
              />

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

       {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConversation}
        title="Delete Conversation"
        message={`Are you sure you want to delete this entire conversation with ${selectedUser?.username}? This action cannot be undone.`}
        confirmText="Delete Conversation"
        cancelText="Cancel"

      />
    </div>
  );
};
