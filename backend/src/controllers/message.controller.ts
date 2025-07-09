import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { MessageModel } from '../models/Message.model';
import { UserModel } from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const sendMessageValidation = [
  body('receiver_id').isInt().withMessage('Valid receiver ID required'),
  body('content').notEmpty().withMessage('Message content required'),
  body('message_type').optional().isIn(['text', 'image', 'file']).withMessage('Invalid message type'),
];

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { receiver_id, content, message_type } = req.body;
    const sender_id = req.user!.id;

    // Check if receiver exists
    const receiver = await UserModel.findById(receiver_id);
    if (!receiver) {
      res.status(404).json({ error: 'Receiver not found' });
      return;
    }

    // Create message
    const message = await MessageModel.create({
      sender_id,
      receiver_id,
      content,
      message_type: message_type || 'text'
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const otherUserId = parseInt(userId);
    if (isNaN(otherUserId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }
    console.log('[getConversation Controller] sender:', req.user!.id, 'receiver:', otherUserId);


    const messages = await MessageModel.getConversation(req.user!.id, otherUserId, limit);

    res.json({
      messages,
      count: messages.length
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRecentConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversations = await MessageModel.getRecentConversations(req.user!.id);

    res.json({
      conversations
    });
  } catch (error) {
    console.error('Get recent conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markMessageAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;

    await MessageModel.markAsRead(parseInt(messageId));

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await MessageModel.getUnreadCount(req.user!.id);

    res.json({ unread_count: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteMessageById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;
    const userId = req.user!.id;

    const messageIdNum = parseInt(messageId);
    if (isNaN(messageIdNum)) {
      res.status(400).json({ error: 'Invalid message ID' });
      return;
    }

    // Check if message exists and user is authorized to delete it
    const message = await MessageModel.findById(messageIdNum);
    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    // Only sender can delete their own messages
    if (message.sender_id !== userId) {
      res.status(403).json({ error: 'Not authorized to delete this message' });
      return;
    }

    await MessageModel.deleteById(messageIdNum);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// NEW: Delete entire conversation
export const deleteConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!.id;

    const otherUserId = parseInt(userId);
    if (isNaN(otherUserId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    // Check if other user exists
    const otherUser = await UserModel.findById(otherUserId);
    if (!otherUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Delete all messages between the two users
    const deletedCount = await MessageModel.deleteConversation(currentUserId, otherUserId);

    res.json({
      message: 'Conversation deleted successfully',
      deleted_messages: deletedCount
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// NEW: Delete all messages sent by current user (optional - for complete cleanup)
export const deleteAllUserMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const deletedCount = await MessageModel.deleteAllUserMessages(userId);

    res.json({
      message: 'All messages deleted successfully',
      deleted_messages: deletedCount
    });
  } catch (error) {
    console.error('Delete all user messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
