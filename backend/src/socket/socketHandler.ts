import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.model';
import { MessageModel } from '../models/Message.model';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  username?: string;
}

export const handleSocketConnection = (io: Server) => {
  // Socket authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await UserModel.findById(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.username = user.username;

      // Update user online status
      await UserModel.updateOnlineStatus(user.id, true);

      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.username} connected`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Handle joining a conversation room
    socket.on('join_conversation', (otherUserId: number) => {
      const roomId = [socket.userId, otherUserId].sort().join('_');
      socket.join(roomId);
      console.log(`User ${socket.username} joined conversation ${roomId}`);
    });

    // Handle leaving a conversation room
    socket.on('leave_conversation', (otherUserId: number) => {
      const roomId = [socket.userId, otherUserId].sort().join('_');
      socket.leave(roomId);
      console.log(`User ${socket.username} left conversation ${roomId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data: {
      receiver_id: number;
      content: string;
      message_type?: 'text' | 'image' | 'file';
    }) => {
      try {
        // Create message in database
        const message = await MessageModel.create({
          sender_id: socket.userId!,
          receiver_id: data.receiver_id,
          content: data.content,
          message_type: data.message_type || 'text'
        });

        // Send to conversation room
        const roomId = [socket.userId, data.receiver_id].sort().join('_');
        io.to(roomId).emit('new_message', message);

        // Send to receiver's personal room for notifications
        io.to(`user_${data.receiver_id}`).emit('message_notification', {
          message,
          sender: {
            id: socket.userId,
            username: socket.username
          }
        });

        // Confirm message sent
        socket.emit('message_sent', { messageId: message.id });
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { receiver_id: number }) => {
      const roomId = [socket.userId, data.receiver_id].sort().join('_');
      socket.to(roomId).emit('user_typing', {
        userId: socket.userId,
        username: socket.username,
        typing: true
      });
    });

    socket.on('typing_stop', (data: { receiver_id: number }) => {
      const roomId = [socket.userId, data.receiver_id].sort().join('_');
      socket.to(roomId).emit('user_typing', {
        userId: socket.userId,
        username: socket.username,
        typing: false
      });
    });

    // Handle message read status
    socket.on('mark_message_read', async (messageId: number) => {
      try {
        await MessageModel.markAsRead(messageId);
        socket.emit('message_read_confirmed', { messageId });
      } catch (error) {
        console.error('Mark message read error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.username} disconnected`);

      if (socket.userId) {
        // Update user offline status
        await UserModel.updateOnlineStatus(socket.userId, false);

        // Notify other users about offline status
        socket.broadcast.emit('user_offline', {
          userId: socket.userId,
          username: socket.username
        });
      }
    });
  });
};
